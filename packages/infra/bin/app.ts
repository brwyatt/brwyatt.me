import * as cdk from 'aws-cdk-lib';
import { WebsiteStack } from '../lib/website-stack';
import { RedirectStack } from '../lib/redirect-stack';
import { ACTIVE_STAGES, AWS_DEFAULTS, getStageConfig } from '../lib/config';

const app = new cdk.App();
const env = { account: AWS_DEFAULTS.account, region: AWS_DEFAULTS.region };

for (const stage of ACTIVE_STAGES) {
  const config = getStageConfig(stage);
  const capitalized = stage.charAt(0).toUpperCase() + stage.slice(1);
  const stackId = `BrwyattMe-${capitalized}`;

  const websiteStack = new WebsiteStack(app, stackId, config, {
    env,
    description: `${capitalized} website stack for ${config.domainName}`,
  });

  new RedirectStack(app, `${stackId}-Redirects`, {
    config: {
      targetDomain: config.redirectTarget,
      domains: config.redirectDomains,
    },
    originBucket: websiteStack.siteBucket,
    env,
    description: `Redirects legacy domains to ${config.redirectTarget}`,
  });
}

app.synth();
