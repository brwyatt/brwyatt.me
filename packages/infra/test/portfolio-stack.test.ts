import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { describe, it } from 'vitest';
import { PortfolioStack } from '../lib/portfolio-stack';
import { PortfolioConfig } from '../lib/types';

describe('PortfolioStack', () => {
  const app = new cdk.App();
  const config: PortfolioConfig = {
    stage: 'beta',
    domainName: 'beta.brwyatt.me',
    aliases: ['www.beta.brwyatt.me'],
    hostedZoneId: 'Z3MELYL57MW6HJ',
    account: '123456789012',
  };

  const stack = new PortfolioStack(app, 'TestPortfolioStack', config, {
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
});
