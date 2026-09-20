import * as cdk from 'aws-cdk-lib';
import { PortfolioStack } from '../lib/portfolio-stack';
import { RedirectStack } from '../lib/redirect-stack';
import { PortfolioConfig, RedirectConfig } from '../lib/types';

const app = new cdk.App();

// Target AWS Account (placeholders can be passed via CDK context or environment)
const awsAccount = process.env.CDK_DEFAULT_ACCOUNT || '177542564244';
const awsRegion = 'us-east-1'; // CloudFront requires certificates in us-east-1

// Beta Stack
const betaConfig: PortfolioConfig = {
  stage: 'beta',
  domainName: 'beta.brwyatt.me',
  aliases: ['www.beta.brwyatt.me'],
  hostedZoneId: 'Z3MELYL57MW6HJ', // brwyatt.me Route 53 zone
  account: awsAccount,
};

const betaStack = new PortfolioStack(app, 'BrwyattMe-Beta', betaConfig, {
  env: { account: betaConfig.account, region: awsRegion },
  description: 'Beta stack for brwyatt.me',
});

// Beta Domain Redirector Stack (.net and .com -> https://beta.brwyatt.me)
const betaRedirectConfig: RedirectConfig = {
  targetDomain: 'https://beta.brwyatt.me',
  account: awsAccount,
  domains: [
    {
      domainName: 'beta.brwyatt.net',
      hostedZoneId: 'Z22I3V5KI0TD1U',
      hostedZoneName: 'brwyatt.net',
      additionalDomains: ['www.beta.brwyatt.net', 'mta-sts.beta.brwyatt.net'],
    },
    {
      domainName: 'beta.brwyatt.com',
      hostedZoneId: 'ZDRNDVJ8GECH8',
      hostedZoneName: 'brwyatt.com',
      additionalDomains: ['www.beta.brwyatt.com'],
    },
  ],
};

new RedirectStack(app, 'BrwyattMe-Beta-Redirects', {
  config: betaRedirectConfig,
  originBucket: betaStack.siteBucket,
  env: { account: betaRedirectConfig.account, region: awsRegion },
  description: 'Redirects beta.brwyatt.net and beta.brwyatt.com to https://beta.brwyatt.me',
});

// Production Stack
const prodConfig: PortfolioConfig = {
  stage: 'prod',
  domainName: 'brwyatt.me',
  aliases: ['www.brwyatt.me'],
  hostedZoneId: 'Z3MELYL57MW6HJ', // brwyatt.me Route 53 zone
  account: awsAccount,
};

const prodStack = new PortfolioStack(app, 'BrwyattMe-Prod', prodConfig, {
  env: { account: prodConfig.account, region: awsRegion },
  description: 'Production portfolio stack for brwyatt.me',
});

// Production Legacy Domain Redirector Stack (.net and .com -> https://brwyatt.me)
const prodRedirectConfig: RedirectConfig = {
  targetDomain: 'https://brwyatt.me',
  account: awsAccount,
  domains: [
    {
      domainName: 'brwyatt.net',
      hostedZoneId: 'Z22I3V5KI0TD1U',
      hostedZoneName: 'brwyatt.net',
      additionalDomains: ['www.brwyatt.net', 'mta-sts.brwyatt.net'],
    },
    {
      domainName: 'brwyatt.com',
      hostedZoneId: 'ZDRNDVJ8GECH8',
      hostedZoneName: 'brwyatt.com',
      additionalDomains: ['www.brwyatt.com'],
    },
  ],
};

new RedirectStack(app, 'BrwyattMe-Prod-Redirects', {
  config: prodRedirectConfig,
  originBucket: prodStack.siteBucket,
  env: { account: prodRedirectConfig.account, region: awsRegion },
  description: 'Redirects brwyatt.net and brwyatt.com to https://brwyatt.me',
});

app.synth();
