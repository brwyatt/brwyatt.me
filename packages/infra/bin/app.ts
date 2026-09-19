import * as cdk from 'aws-cdk-lib';
import { PortfolioStack } from '../lib/portfolio-stack';
import { RedirectStack } from '../lib/redirect-stack';
import { PortfolioConfig, RedirectConfig } from '../lib/types';

const app = new cdk.App();

// Target AWS Account (placeholders can be passed via CDK context or environment)
const awsAccount = process.env.CDK_DEFAULT_ACCOUNT || '177542564244';
const awsRegion = 'us-east-1'; // CloudFront requires certificates in us-east-1

// Staging (Beta) Stack
const betaConfig: PortfolioConfig = {
  stage: 'beta',
  domainName: 'beta.brwyatt.me',
  aliases: ['www.beta.brwyatt.me'],
  hostedZoneId: 'Z3MELYL57MW6HJ', // brwyatt.me Route 53 zone
  account: awsAccount,
};

new PortfolioStack(app, 'BrwyattMe-Beta', betaConfig, {
  env: { account: betaConfig.account, region: awsRegion },
  description: 'Staging (Beta) stack for brwyatt.me',
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

// Legacy Domain Redirector Stack (.net and .com -> https://brwyatt.me)
const redirectConfig: RedirectConfig = {
  targetDomain: 'https://brwyatt.me',
  account: awsAccount,
  domains: [
    {
      domainName: 'brwyatt.net',
      hostedZoneId: 'Z22I3V5KI0TD1U',
    },
    {
      domainName: 'brwyatt.com',
      hostedZoneId: 'ZDRNDVJ8GECH8',
    },
  ],
};

new RedirectStack(app, 'BrwyattLegacyRedirectStack', {
  config: redirectConfig,
  originBucket: prodStack.siteBucket,
  env: { account: redirectConfig.account, region: awsRegion },
  description: 'Redirects brwyatt.net and brwyatt.com to https://brwyatt.me',
});

app.synth();
