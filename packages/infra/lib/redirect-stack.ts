import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as targets from 'aws-cdk-lib/aws-route53-targets';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import { Construct } from 'constructs';
import { RedirectConfig } from './types';

export class RedirectStack extends cdk.Stack {
  constructor(scope: Construct, id: string, config: RedirectConfig, props?: cdk.StackProps) {
    super(scope, id, props);

    // 1. S3 Bucket configured with Website Redirection
    const redirectBucket = new s3.Bucket(this, 'RedirectBucket', {
      bucketName: 'brwyatt-legacy-redirector',
      websiteRedirect: {
        hostName: config.targetDomain.replace(/^https?:\/\//, ''),
        protocol: s3.RedirectProtocol.HTTPS,
      },
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      enforceSSL: true,
    });

    for (const domain of config.domains) {
      const zone = route53.HostedZone.fromHostedZoneAttributes(this, `Zone-${domain.domainName}`, {
        hostedZoneId: domain.hostedZoneId,
        zoneName: domain.domainName,
      });

      const domainNames = [domain.domainName, `www.${domain.domainName}`];

      // Explicit ACM Certificate for this redirect domain
      const cert = new acm.Certificate(this, `Cert-${domain.domainName}`, {
        domainName: domain.domainName,
        subjectAlternativeNames: [`www.${domain.domainName}`],
        validation: acm.CertificateValidation.fromDns(zone),
      });

      // CloudFront distribution for the redirect domain
      const dist = new cloudfront.Distribution(this, `Dist-${domain.domainName}`, {
        defaultBehavior: {
          origin: new origins.HttpOrigin(redirectBucket.bucketWebsiteDomainName, {
            protocolPolicy: cloudfront.OriginProtocolPolicy.HTTP_ONLY,
          }),
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
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
    }
  }
}
