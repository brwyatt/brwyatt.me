export type Stage = 'beta' | 'gamma' | 'prod';

export interface PortfolioConfig {
  stage: Stage;
  domainName: string;
  aliases?: string[];
  hostedZoneId: string;
  account: string;
}

export interface RedirectDomain {
  domainName: string;
  hostedZoneId: string;
}

export interface RedirectConfig {
  targetDomain: string; // e.g. "https://brwyatt.me"
  domains: RedirectDomain[];
  account: string;
}
