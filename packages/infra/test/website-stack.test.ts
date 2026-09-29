import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { describe, it } from 'vitest';
import { WebsiteStack } from '../lib/website-stack';
import { WebsiteConfig } from '../lib/types';
import { HOSTED_ZONES } from '../lib/config';

describe('WebsiteStack', () => {
  const app = new cdk.App();
  const config: WebsiteConfig = {
    stage: 'beta',
    domainName: 'beta.brwyatt.me',
    bucketName: 'brwyatt-me-beta-site-assets',
    aliases: ['www.beta.brwyatt.me'],
    hostedZone: HOSTED_ZONES.me,
  };

  const stack = new WebsiteStack(app, 'TestWebsiteStack', config, {
    env: { account: '123456789012', region: 'us-east-1' },
  });
  const template = Template.fromStack(stack);

  it('provisions an encrypted S3 bucket with public access blocked', () => {
    template.hasResourceProperties('AWS::S3::Bucket', {
      BucketEncryption: {
        ServerSideEncryptionConfiguration: [
          {
            ServerSideEncryptionByDefault: {
              SSEAlgorithm: 'AES256',
            },
          },
        ],
      },
      PublicAccessBlockConfiguration: {
        BlockPublicAcls: true,
        BlockPublicPolicy: true,
        IgnorePublicAcls: true,
        RestrictPublicBuckets: true,
      },
    });
  });

  it('provisions a CloudFront distribution with TLS 1.2 and redirect to https', () => {
    template.hasResourceProperties('AWS::CloudFront::Distribution', {
      DistributionConfig: Match.objectLike({
        DefaultRootObject: 'index.html',
        ViewerCertificate: Match.objectLike({
          MinimumProtocolVersion: 'TLSv1.2_2021',
          SslSupportMethod: 'sni-only',
        }),
        DefaultCacheBehavior: Match.objectLike({
          ViewerProtocolPolicy: 'redirect-to-https',
        }),
      }),
    });
  });

  it('creates Route 53 A and AAAA alias records', () => {
    template.hasResourceProperties('AWS::Route53::RecordSet', {
      Type: 'A',
      Name: 'beta.brwyatt.me.',
    });
    template.hasResourceProperties('AWS::Route53::RecordSet', {
      Type: 'AAAA',
      Name: 'beta.brwyatt.me.',
    });
  });

  it('provisions the GitHub sync Lambda function on ARM64 Node 24', () => {
    template.hasResourceProperties('AWS::Lambda::Function', {
      FunctionName: 'brwyatt-me-beta-github-sync',
      Runtime: 'nodejs24.x',
      Architectures: ['arm64'],
      Timeout: 30,
      MemorySize: 256,
      Environment: {
        Variables: Match.objectLike({
          SSM_PARAM_NAME: '/brwyatt-me/beta/github-token',
          GITHUB_USER: 'brwyatt',
          OBJECT_KEY: 'data/projects.json',
        }),
      },
    });
  });

  it('schedules the GitHub sync Lambda function every 6 hours via EventBridge', () => {
    template.hasResourceProperties('AWS::Events::Rule', {
      Name: 'brwyatt-me-beta-github-sync-schedule',
      ScheduleExpression: 'rate(6 hours)',
      State: 'ENABLED',
    });
  });
});
