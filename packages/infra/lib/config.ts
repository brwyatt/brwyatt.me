import { HostedZoneRef, Stage, StageConfig } from './types';

export const AWS_DEFAULTS = {
  account: process.env.CDK_DEFAULT_ACCOUNT || '177542564244',
  region: 'us-east-1',
} as const;

export const STAGE_ACCOUNTS: Partial<Record<Stage, string>> = {
  beta: process.env.CDK_BETA_ACCOUNT || AWS_DEFAULTS.account,
  prod: process.env.CDK_PROD_ACCOUNT || AWS_DEFAULTS.account,
};

export const HOSTED_ZONES: Record<'me' | 'net' | 'com', HostedZoneRef> = {
  me: { zoneName: 'brwyatt.me', hostedZoneId: 'Z3MELYL57MW6HJ' },
  net: { zoneName: 'brwyatt.net', hostedZoneId: 'Z22I3V5KI0TD1U' },
  com: { zoneName: 'brwyatt.com', hostedZoneId: 'ZDRNDVJ8GECH8' },
} as const;

export const ACTIVE_STAGES: Stage[] = ['beta', 'prod'];

export function getStageConfig(stage: Stage): StageConfig {
  const prefix = stage === 'prod' ? '' : `${stage}.`;
  const domainName = `${prefix}${HOSTED_ZONES.me.zoneName}`;

  return {
    stage,
    domainName,
    hostedZone: HOSTED_ZONES.me,
    env: {
      account: STAGE_ACCOUNTS[stage] || AWS_DEFAULTS.account,
      region: AWS_DEFAULTS.region,
    },
    redirectTarget: `https://${domainName}`,
    redirectDomains: [
      {
        domainName: `${prefix}${HOSTED_ZONES.net.zoneName}`,
        hostedZone: HOSTED_ZONES.net,
        additionalDomains: [
          `www.${prefix}${HOSTED_ZONES.net.zoneName}`,
          `mta-sts.${prefix}${HOSTED_ZONES.net.zoneName}`,
        ],
      },
      {
        domainName: `${prefix}${HOSTED_ZONES.com.zoneName}`,
        hostedZone: HOSTED_ZONES.com,
        additionalDomains: [`www.${prefix}${HOSTED_ZONES.com.zoneName}`],
      },
    ],
  };
}
