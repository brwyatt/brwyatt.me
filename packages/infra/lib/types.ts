export type Stage = 'beta' | 'gamma' | 'prod';

export interface HostedZoneRef {
  zoneName: string;
  hostedZoneId: string;
}

export interface WebsiteConfig {
  stage: Stage;
  domainName: string;
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
  redirectTarget: string;
  redirectDomains: RedirectDomain[];
}
