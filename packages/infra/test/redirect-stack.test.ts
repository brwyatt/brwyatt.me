import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { describe, it, expect } from 'vitest';
import { RedirectStack } from '../lib/redirect-stack';
import { RedirectConfig } from '../lib/types';

describe('RedirectStack', () => {
  const app = new cdk.App();
  const config: RedirectConfig = {
    targetDomain: 'https://brwyatt.me',
    account: '123456789012',
    domains: [
      { domainName: 'brwyatt.net', hostedZoneId: 'Z22I3V5KI0TD1U' },
      { domainName: 'brwyatt.com', hostedZoneId: 'ZDRNDVJ8GECH8' },
    ],
  };

  const stack = new RedirectStack(app, 'TestRedirectStack', config, {
    env: { account: '123456789012', region: 'us-east-1' },
  });
  const template = Template.fromStack(stack);

  it('provisions a CloudFront function for selective redirection', () => {
    template.hasResourceProperties('AWS::CloudFront::Function', {
      FunctionCode: Match.stringLikeRegexp('uri\\.startsWith'),
    });
  });

  it('creates Route 53 alias records for redirect domains including mta-sts', () => {
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
