import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as targets from 'aws-cdk-lib/aws-route53-targets';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as events from 'aws-cdk-lib/aws-events';
import * as eventTargets from 'aws-cdk-lib/aws-events-targets';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as path from 'path';
import { Construct } from 'constructs';
import { WebsiteConfig } from './types';

export class WebsiteStack extends cdk.Stack {
  public readonly siteBucket: s3.Bucket;
  public readonly distribution: cloudfront.Distribution;
  public readonly githubSyncFunction: lambda.Function;

  constructor(scope: Construct, id: string, config: WebsiteConfig, props?: cdk.StackProps) {
    super(scope, id, props);

    // 1. Private S3 Origin Bucket (Encrypted, Block Public Access)
    this.siteBucket = new s3.Bucket(this, 'SiteBucket', {
      bucketName: config.bucketName,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      removalPolicy: config.stage === 'prod' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: config.stage !== 'prod',
    });

    // 2. Route 53 Hosted Zone lookup
    const zone = route53.HostedZone.fromHostedZoneAttributes(this, 'HostedZone', {
      hostedZoneId: config.hostedZone.hostedZoneId,
      zoneName: config.hostedZone.zoneName,
    });

    // 3. Explicit ACM Certificate (CloudFront requires us-east-1)
    const domainNames = [config.domainName, ...(config.aliases || [])];
    const certificate = new acm.Certificate(this, 'SiteCertificate', {
      domainName: config.domainName,
      subjectAlternativeNames: config.aliases,
      validation: acm.CertificateValidation.fromDns(zone),
    });

    // 4. Security Headers Response Policy
    const responseHeadersPolicy = new cloudfront.ResponseHeadersPolicy(
      this,
      'SecurityHeadersPolicy',
      {
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
      },
    );

    // 5. CloudFront Distribution with Origin Access Control (OAC)
    this.distribution = new cloudfront.Distribution(this, 'SiteDistribution', {
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(this.siteBucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD,
        cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD,
        responseHeadersPolicy,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
      },
      domainNames,
      certificate,
      defaultRootObject: 'index.html',
      errorResponses: [403, 404].map((httpStatus) => ({
        httpStatus,
        responseHttpStatus: 200,
        responsePagePath: '/index.html',
        ttl: cdk.Duration.seconds(10),
      })),
      minimumProtocolVersion: cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,
    });

    // Allow CloudFront distributions in this account to read public assets via OAC
    this.siteBucket.addToResourcePolicy(
      new cdk.aws_iam.PolicyStatement({
        actions: ['s3:GetObject'],
        resources: [this.siteBucket.arnForObjects('*')],
        principals: [new cdk.aws_iam.ServicePrincipal('cloudfront.amazonaws.com')],
        conditions: {
          StringEquals: {
            'AWS:SourceAccount': this.account,
          },
        },
      }),
    );

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

    // 7. GitHub Projects Sync Lambda Function
    const ssmParamName = `/brwyatt-me/${config.stage}/github-token`;
    const ssmParamArn = `arn:aws:ssm:${this.region}:${this.account}:parameter${ssmParamName}`;

    this.githubSyncFunction = new lambda.Function(this, 'GitHubSyncFunction', {
      functionName: `brwyatt-me-${config.stage}-github-sync`,
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../functions/github-sync')),
      architecture: lambda.Architecture.ARM_64,
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
      environment: {
        BUCKET_NAME: this.siteBucket.bucketName,
        SSM_PARAM_NAME: ssmParamName,
        GITHUB_USER: 'brwyatt',
        OBJECT_KEY: 'data/projects.json',
      },
    });

    // Grant Lambda permission to write projects.json to S3 bucket
    this.siteBucket.grantPut(this.githubSyncFunction, 'data/projects.json');

    // Grant Lambda permission to read the GitHub token from SSM Parameter Store
    this.githubSyncFunction.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['ssm:GetParameter'],
        resources: [ssmParamArn],
      }),
    );

    // Grant Lambda permission to decrypt with KMS (default aws/ssm key)
    this.githubSyncFunction.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['kms:Decrypt'],
        resources: ['*'],
        conditions: {
          StringEquals: {
            'kms:CallerAccount': this.account,
          },
        },
      }),
    );

    // 8. EventBridge Schedule Rule (every 6 hours)
    new events.Rule(this, 'GitHubSyncScheduleRule', {
      ruleName: `brwyatt-me-${config.stage}-github-sync-schedule`,
      schedule: events.Schedule.rate(cdk.Duration.hours(6)),
      targets: [new eventTargets.LambdaFunction(this.githubSyncFunction)],
    });

    // Outputs
    new cdk.CfnOutput(this, 'DistributionDomainName', {
      value: this.distribution.distributionDomainName,
    });
    new cdk.CfnOutput(this, 'SiteBucketName', {
      value: this.siteBucket.bucketName,
    });
    new cdk.CfnOutput(this, 'GitHubSyncFunctionName', {
      value: this.githubSyncFunction.functionName,
    });
  }
}
