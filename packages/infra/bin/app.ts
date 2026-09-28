import * as cdk from 'aws-cdk-lib';
import { WebsiteStack } from '../lib/website-stack';
import { RedirectStack } from '../lib/redirect-stack';
import { ACTIVE_STAGES, getStageConfig } from '../lib/config';

const app = new cdk.App();

for (const stage of ACTIVE_STAGES) {
  const config = getStageConfig(stage);
  const capitalized = stage.charAt(0).toUpperCase() + stage.slice(1);
  const stackId = `BrwyattMe-${capitalized}`;

  const websiteStack = new WebsiteStack(app, stackId, config, {
    env: config.env,
    description: `${capitalized} website stack for ${config.domainName}`,
  });

  new RedirectStack(app, `${stackId}-Redirects`, {
    config: {
      targetDomain: config.redirectTarget,
      domains: config.redirectDomains,
    },
    originBucketName: websiteStack.siteBucket.bucketName,
    originBucketRegionalDomainName: websiteStack.siteBucket.bucketRegionalDomainName,
    env: config.env,
    description: `Redirects legacy domains to ${config.redirectTarget}`,
  });
}

app.synth();
