import { describe, it, expect } from 'vitest';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { handler } = require('../functions/redirect.js');

describe('redirect CloudFront function', () => {
  it('passes through /.well-known/ requests', () => {
    const request = { uri: '/.well-known/mta-sts.txt', headers: {} };
    const event = { request };
    const result = handler(event);
    expect(result).toBe(request);
  });

  it('passes through /robots.txt', () => {
    const request = { uri: '/robots.txt', headers: {} };
    const event = { request };
    const result = handler(event);
    expect(result).toBe(request);
  });

  it('passes through /keybase.txt', () => {
    const request = { uri: '/keybase.txt', headers: {} };
    const event = { request };
    const result = handler(event);
    expect(result).toBe(request);
  });

  it('redirects root to target domain with 301 and cache header', () => {
    const request = { uri: '/', headers: {} };
    const event = { request };
    const result = handler(event);
    expect(result).toEqual({
      statusCode: 301,
      statusDescription: 'Moved Permanently',
      headers: {
        location: { value: '__TARGET_DOMAIN__/' },
        'cache-control': { value: 'public, max-age=86400' },
      },
    });
  });

  it('redirects paths preserving URI', () => {
    const request = { uri: '/some/deep/path?query=1', headers: {} };
    const event = { request };
    const result = handler(event);
    expect(result).toEqual({
      statusCode: 301,
      statusDescription: 'Moved Permanently',
      headers: {
        location: { value: '__TARGET_DOMAIN__/some/deep/path?query=1' },
        'cache-control': { value: 'public, max-age=86400' },
      },
    });
  });
});
