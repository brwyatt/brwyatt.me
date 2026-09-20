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

    // Import the bucket by attributes within this stack to prevent CDK cross-stack cycle
    const importedBucket = s3.Bucket.fromBucketAttributes(this, 'ImportedOriginBucket', {
      bucketName: originBucket.bucketName,
      bucketRegionalDomainName: originBucket.bucketRegionalDomainName,
    });

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

    // 3. Dedicated Origin Access Control (uniquely named per stack)
    const oac = new cloudfront.S3OriginAccessControl(this, 'RedirectOAC', {
      originAccessControlName: `${id}-RedirectOAC`,
      signing: cloudfront.Signing.SIGV4_ALWAYS,
    });

    const s3Origin = origins.S3BucketOrigin.withOriginAccessControl(importedBucket, {
      originAccessControl: oac,
    });

    for (const domain of config.domains) {
      const cleanDomainId = domain.domainName.replace(/\./g, '-');
      const hostedZoneName = domain.hostedZoneName ?? domain.domainName;

      const zone = route53.HostedZone.fromHostedZoneAttributes(this, `Zone-${cleanDomainId}`, {
        hostedZoneId: domain.hostedZoneId,
        zoneName: hostedZoneName,
      });

      // Include primary domain plus any additional/legacy subdomains
      const allDomainNames = [domain.domainName, ...(domain.additionalDomains ?? [])];

      // Explicit ACM Certificate for this domain and aliases
      const cert = new acm.Certificate(this, `Cert-${cleanDomainId}`, {
        domainName: domain.domainName,
        subjectAlternativeNames:
          domain.additionalDomains && domain.additionalDomains.length > 0
            ? domain.additionalDomains
            : undefined,
        validation: acm.CertificateValidation.fromDns(zone),
      });

      // CloudFront distribution fronting the shared S3 Origin with Selective Redirect Function
      const dist = new cloudfront.Distribution(this, `Dist-${cleanDomainId}`, {
        defaultBehavior: {
          origin: s3Origin,
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
        domainNames: allDomainNames,
        certificate: cert,
        minimumProtocolVersion: cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,
      });

      // A & AAAA alias records for all domains
      for (const name of allDomainNames) {
        const cleanRecordId = name.replace(/\./g, '-');

        new route53.ARecord(this, `ARecord-${cleanRecordId}`, {
          zone,
          recordName: name,
          target: route53.RecordTarget.fromAlias(new targets.CloudFrontTarget(dist)),
        });

        new route53.AaaaRecord(this, `AaaaRecord-${cleanRecordId}`, {
          zone,
          recordName: name,
          target: route53.RecordTarget.fromAlias(new targets.CloudFrontTarget(dist)),
        });
      }
    }
  }
}
