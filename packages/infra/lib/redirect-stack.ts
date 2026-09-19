import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as targets from 'aws-cdk-lib/aws-route53-targets';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import { Construct } from 'constructs';
import { RedirectConfig } from './types';

export interface RedirectStackProps extends cdk.StackProps {
  config: RedirectConfig;
  originBucket: s3.IBucket;
}

export class RedirectStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: RedirectStackProps) {
    super(scope, id, props);
    const { config, originBucket } = props;

    // 1. CloudFront Function: Selective 301 Redirect vs .well-known / keybase.txt Pass-Through
    const redirectFunction = new cloudfront.Function(this, 'SelectiveRedirectFunction', {
      code: cloudfront.FunctionCode.fromInline(`
function handler(event) {
  var request = event.request;
  var uri = request.uri;

  // Pass-through paths required by email, federation, and identity protocols
  if (
    uri.startsWith('/.well-known/') ||
    uri === '/keybase.txt' ||
    uri === '/robots.txt'
  ) {
    return request;
  }

  // All other paths 301 redirect to https://brwyatt.me/
  var redirectUrl = '${config.targetDomain}' + uri;
  return {
    statusCode: 301,
    statusDescription: 'Moved Permanently',
    headers: {
      'location': { value: redirectUrl },
      'cache-control': { value: 'public, max-age=86400' }
    }
  };
}
      `),
    });

    // 2. CORS & Security Response Header Policy for .well-known / WKD
    const wellKnownResponseHeaders = new cloudfront.ResponseHeadersPolicy(
      this,
      'WellKnownHeaders',
      {
        corsBehavior: {
          accessControlAllowOrigins: ['*'],
          accessControlAllowMethods: ['GET', 'HEAD', 'OPTIONS'],
          accessControlAllowHeaders: ['*'],
          accessControlAllowCredentials: false,
          originOverride: true,
        },
        securityHeadersBehavior: {
          contentTypeOptions: { override: true },
        },
      },
    );

    for (const domain of config.domains) {
      const zone = route53.HostedZone.fromHostedZoneAttributes(this, `Zone-${domain.domainName}`, {
        hostedZoneId: domain.hostedZoneId,
        zoneName: domain.domainName,
      });

      // Special subdomains like mta-sts.brwyatt.net
      const domainNames = [
        domain.domainName,
        `www.${domain.domainName}`,
        ...(domain.domainName === 'brwyatt.net' ? ['mta-sts.brwyatt.net'] : []),
      ];

      // Explicit ACM Certificate for this domain and aliases
      const cert = new acm.Certificate(this, `Cert-${domain.domainName}`, {
        domainName: domain.domainName,
        subjectAlternativeNames: domainNames.filter((d) => d !== domain.domainName),
        validation: acm.CertificateValidation.fromDns(zone),
      });

      // CloudFront distribution fronting the shared S3 Origin with Selective Redirect Function
      const dist = new cloudfront.Distribution(this, `Dist-${domain.domainName}`, {
        defaultBehavior: {
          origin: origins.S3BucketOrigin.withOriginAccessControl(originBucket),
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          functionAssociations: [
            {
              function: redirectFunction,
              eventType: cloudfront.FunctionEventType.VIEWER_REQUEST,
            },
          ],
          responseHeadersPolicy: wellKnownResponseHeaders,
          cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        },
        domainNames,
        certificate: cert,
        minimumProtocolVersion: cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,
      });

      // Apex A & AAAA
      new route53.ARecord(this, `ARecord-${domain.domainName}`, {
        zone,
        recordName: domain.domainName,
        target: route53.RecordTarget.fromAlias(new targets.CloudFrontTarget(dist)),
      });

      new route53.AaaaRecord(this, `AaaaRecord-${domain.domainName}`, {
        zone,
        recordName: domain.domainName,
        target: route53.RecordTarget.fromAlias(new targets.CloudFrontTarget(dist)),
      });

      // WWW A & AAAA
      new route53.ARecord(this, `WwwARecord-${domain.domainName}`, {
        zone,
        recordName: `www.${domain.domainName}`,
        target: route53.RecordTarget.fromAlias(new targets.CloudFrontTarget(dist)),
      });

      new route53.AaaaRecord(this, `WwwAaaaRecord-${domain.domainName}`, {
        zone,
        recordName: `www.${domain.domainName}`,
        target: route53.RecordTarget.fromAlias(new targets.CloudFrontTarget(dist)),
      });

      // mta-sts A & AAAA records (for brwyatt.net)
      if (domain.domainName === 'brwyatt.net') {
        new route53.ARecord(this, 'MtaStsARecord', {
          zone,
          recordName: 'mta-sts.brwyatt.net',
          target: route53.RecordTarget.fromAlias(new targets.CloudFrontTarget(dist)),
        });

        new route53.AaaaRecord(this, 'MtaStsAaaaRecord', {
          zone,
          recordName: 'mta-sts.brwyatt.net',
          target: route53.RecordTarget.fromAlias(new targets.CloudFrontTarget(dist)),
        });
      }
    }
  }
}
