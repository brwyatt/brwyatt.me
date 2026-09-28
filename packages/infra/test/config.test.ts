import { describe, expect, it } from 'vitest';
import { ACTIVE_STAGES, getStageConfig, HOSTED_ZONES, validateStageConfig } from '../lib/config';
import { StageConfig } from '../lib/types';

describe('StageConfig and Domain Validation', () => {
  it('validates active stage configurations without errors', () => {
    for (const stage of ACTIVE_STAGES) {
      expect(() => getStageConfig(stage)).not.toThrow();
    }
  });

  it('throws an error if a domain collides between WebsiteStack and RedirectStack', () => {
    const invalidConfig: StageConfig = {
      stage: 'beta',
      domainName: 'beta.brwyatt.me',
      bucketName: 'brwyatt-me-beta-site-assets',
      hostedZone: HOSTED_ZONES.me,
      env: { account: '123456789012', region: 'us-east-1' },
      redirectTarget: 'https://beta.brwyatt.me',
      redirectDomains: [
        {
          domainName: 'beta.brwyatt.me', // Collision with website domainName
          hostedZone: HOSTED_ZONES.me,
        },
      ],
    };

    expect(() => validateStageConfig(invalidConfig)).toThrowError(
      /Domain collision detected for stage 'beta': 'beta\.brwyatt\.me' is configured in both WebsiteStack and RedirectStack/,
    );
  });

  it('throws an error if a website alias collides with a redirect domain', () => {
    const invalidConfig: StageConfig = {
      stage: 'prod',
      domainName: 'brwyatt.me',
      aliases: ['www.brwyatt.me'],
      bucketName: 'brwyatt-me-prod-site-assets',
      hostedZone: HOSTED_ZONES.me,
      env: { account: '123456789012', region: 'us-east-1' },
      redirectTarget: 'https://brwyatt.me',
      redirectDomains: [
        {
          domainName: 'www.brwyatt.me', // Collision with alias
          hostedZone: HOSTED_ZONES.me,
        },
      ],
    };

    expect(() => validateStageConfig(invalidConfig)).toThrowError(
      /Domain collision detected for stage 'prod': 'www\.brwyatt\.me' is configured in both WebsiteStack and RedirectStack/,
    );
  });

  it('throws an error if there are duplicate domains in WebsiteConfig', () => {
    const invalidConfig: StageConfig = {
      stage: 'beta',
      domainName: 'beta.brwyatt.me',
      aliases: ['beta.brwyatt.me'],
      bucketName: 'brwyatt-me-beta-site-assets',
      hostedZone: HOSTED_ZONES.me,
      env: { account: '123456789012', region: 'us-east-1' },
      redirectTarget: 'https://beta.brwyatt.me',
      redirectDomains: [],
    };

    expect(() => validateStageConfig(invalidConfig)).toThrowError(
      /Duplicate domain in WebsiteConfig for stage 'beta': beta\.brwyatt\.me/,
    );
  });

  it('throws an error if there are duplicate domains in RedirectConfig', () => {
    const invalidConfig: StageConfig = {
      stage: 'beta',
      domainName: 'beta.brwyatt.me',
      bucketName: 'brwyatt-me-beta-site-assets',
      hostedZone: HOSTED_ZONES.me,
      env: { account: '123456789012', region: 'us-east-1' },
      redirectTarget: 'https://beta.brwyatt.me',
      redirectDomains: [
        {
          domainName: 'brwyatt.net',
          hostedZone: HOSTED_ZONES.net,
          additionalDomains: ['brwyatt.net'],
        },
      ],
    };

    expect(() => validateStageConfig(invalidConfig)).toThrowError(
      /Duplicate domain in RedirectConfig for stage 'beta': brwyatt\.net/,
    );
  });
});
