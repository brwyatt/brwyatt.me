import * as cdk from 'aws-cdk-lib';

export type Stage = 'beta' | 'gamma' | 'prod';

export interface HostedZoneRef {
  zoneName: string;
  hostedZoneId: string;
}

export interface WebsiteConfig {
  stage: Stage;
  domainName: string;
  bucketName: string;
  aliases?: string[];
  hostedZone: HostedZoneRef;
}

export interface RedirectDomain {
  domainName: string;
  hostedZone: HostedZoneRef;
  additionalDomains?: string[];
}

export interface RedirectConfig {
  targetDomain: string;
  domains: RedirectDomain[];
}

export interface StageConfig extends WebsiteConfig {
  env: cdk.Environment;
  redirectTarget: string;
  redirectDomains: RedirectDomain[];
}
