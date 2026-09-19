import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as targets from 'aws-cdk-lib/aws-route53-targets';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import { Construct } from 'constructs';
import { PortfolioConfig } from './types';

export class PortfolioStack extends cdk.Stack {
  public readonly siteBucket: s3.Bucket;
  public readonly distribution: cloudfront.Distribution;

  constructor(scope: Construct, id: string, config: PortfolioConfig, props?: cdk.StackProps) {
    super(scope, id, props);

    // 1. Private S3 Origin Bucket (Encrypted, Block Public Access)
    this.siteBucket = new s3.Bucket(this, 'SiteBucket', {
      bucketName: `brwyatt-me-${config.stage}-site-assets`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      removalPolicy: config.stage === 'prod' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: config.stage !== 'prod',
    });

    // 2. Route 53 Hosted Zone lookup
    const zone = route53.HostedZone.fromHostedZoneAttributes(this, 'HostedZone', {
      hostedZoneId: config.hostedZoneId,
      zoneName: config.domainName.includes('.') ? config.domainName.split('.').slice(-2).join('.') : config.domainName,
    });

    // 3. Explicit ACM Certificate (CloudFront requires us-east-1)
    const domainNames = [config.domainName, ...(config.aliases || [])];
    const certificate = new acm.Certificate(this, 'SiteCertificate', {
      domainName: config.domainName,
      subjectAlternativeNames: config.aliases,
      validation: acm.CertificateValidation.fromDns(zone),
    });

    // 4. Security Headers Response Policy
    const responseHeadersPolicy = new cloudfront.ResponseHeadersPolicy(this, 'SecurityHeadersPolicy', {
      responseHeadersPolicyName: `BrwyattMeSecurityHeaders-${config.stage}`,
      securityHeadersBehavior: {
        strictTransportSecurity: {
          accessControlMaxAge: cdk.Duration.days(365),
          includeSubdomains: true,
          preload: true,
          override: true,
        },
        contentTypeOptions: { override: true },
        frameOptions: {
          frameOption: cloudfront.HeadersFrameOption.DENY,
          override: true,
        },
        referrerPolicy: {
          referrerPolicy: cloudfront.HeadersReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN,
          override: true,
        },
      },
    });

    // 5. CloudFront Distribution with Origin Access Control (OAC)
    this.distribution = new cloudfront.Distribution(this, 'SiteDistribution', {
      defaultBehavior: {
        origin: new origins.S3Origin(this.siteBucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD,
        cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD,
        responseHeadersPolicy,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
      },
      domainNames,
      certificate,
      defaultRootObject: 'index.html',
      errorResponses: [
        {
          httpStatus: 403,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
          ttl: cdk.Duration.seconds(10),
        },
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
          ttl: cdk.Duration.seconds(10),
        },
      ],
      minimumProtocolVersion: cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,
    });

    // 6. Route 53 A and AAAA Alias Records
    new route53.ARecord(this, 'SiteAliasRecord', {
      zone,
      recordName: config.domainName,
      target: route53.RecordTarget.fromAlias(new targets.CloudFrontTarget(this.distribution)),
    });

    new route53.AaaaRecord(this, 'SiteAaaaRecord', {
      zone,
      recordName: config.domainName,
      target: route53.RecordTarget.fromAlias(new targets.CloudFrontTarget(this.distribution)),
    });

    // Alias records for optional domain aliases (e.g. www)
    if (config.aliases) {
      for (const alias of config.aliases) {
        new route53.ARecord(this, `Alias-${alias}`, {
          zone,
          recordName: alias,
          target: route53.RecordTarget.fromAlias(new targets.CloudFrontTarget(this.distribution)),
        });

        new route53.AaaaRecord(this, `AaaaAlias-${alias}`, {
          zone,
          recordName: alias,
          target: route53.RecordTarget.fromAlias(new targets.CloudFrontTarget(this.distribution)),
        });
      }
    }

    // Outputs
    new cdk.CfnOutput(this, 'DistributionDomainName', {
      value: this.distribution.distributionDomainName,
    });
    new cdk.CfnOutput(this, 'SiteBucketName', {
      value: this.siteBucket.bucketName,
    });
  }
}
