import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { describe, it } from 'vitest';
import { RedirectStack } from '../lib/redirect-stack';
import { RedirectConfig } from '../lib/types';
import { HOSTED_ZONES } from '../lib/config';

describe('RedirectStack', () => {
  const app = new cdk.App();
  const testStack = new cdk.Stack(app, 'TestOriginStack', {
    env: { account: '123456789012', region: 'us-east-1' },
  });
  const testBucket = new s3.Bucket(testStack, 'SharedBucket');

  const config: RedirectConfig = {
    targetDomain: 'https://brwyatt.me',
    domains: [
      {
        domainName: 'brwyatt.net',
        hostedZone: HOSTED_ZONES.net,
        additionalDomains: ['mta-sts.brwyatt.net'],
      },
      { domainName: 'brwyatt.com', hostedZone: HOSTED_ZONES.com },
    ],
  };

  const stack = new RedirectStack(app, 'TestRedirectStack', {
    config,
    originBucketName: testBucket.bucketName,
    originBucketRegionalDomainName: testBucket.bucketRegionalDomainName,
    env: { account: '123456789012', region: 'us-east-1' },
  });
  const template = Template.fromStack(stack);

  it('provisions a CloudFront KeyValueStore with targetDomain', () => {
    template.hasResourceProperties('AWS::CloudFront::KeyValueStore', {
      ImportSource: {
        SourceType: 'S3',
      },
    });
  });

  it('provisions a CloudFront function associated with the KeyValueStore using JS 2.0', () => {
    template.hasResourceProperties('AWS::CloudFront::Function', {
      FunctionConfig: {
        Runtime: 'cloudfront-js-2.0',
        KeyValueStoreAssociations: Match.arrayWith([
          Match.objectLike({
            KeyValueStoreARN: Match.anyValue(),
          }),
        ]),
      },
    });
  });

  it('provisions exactly one consolidated CloudFront distribution and certificate', () => {
    template.resourceCountIs('AWS::CloudFront::Distribution', 1);
    template.resourceCountIs('AWS::CertificateManager::Certificate', 1);

    template.hasResourceProperties('AWS::CloudFront::Distribution', {
      DistributionConfig: {
        Aliases: Match.arrayWith(['brwyatt.net', 'mta-sts.brwyatt.net', 'brwyatt.com']),
      },
    });
  });

  it('creates Route 53 alias records for redirect domains', () => {
    template.hasResourceProperties('AWS::Route53::RecordSet', {
      Name: 'brwyatt.net.',
      Type: 'A',
    });
    template.hasResourceProperties('AWS::Route53::RecordSet', {
      Name: 'mta-sts.brwyatt.net.',
      Type: 'A',
    });
    template.hasResourceProperties('AWS::Route53::RecordSet', {
      Name: 'brwyatt.com.',
      Type: 'A',
    });
  });
});
