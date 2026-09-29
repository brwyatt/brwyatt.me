import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
// @ts-expect-error - index.mjs is ES module JS without TS declarations
import { fetchGitHubData, handler, normalizeRepo } from '../functions/github-sync/index.mjs';

describe('github-sync Lambda function', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  describe('normalizeRepo', () => {
    it('returns null for falsy input', () => {
      expect(normalizeRepo(null)).toBeNull();
      expect(normalizeRepo(undefined)).toBeNull();
    });

    it('correctly maps raw GraphQL repository node', () => {
      const raw = {
        databaseId: 12345,
        name: 'test-repo',
        nameWithOwner: 'brwyatt/test-repo',
        description: 'A test repository',
        url: 'https://github.com/brwyatt/test-repo',
        homepageUrl: 'https://test-repo.example.com',
        primaryLanguage: {
          name: 'TypeScript',
          color: '#3178c6',
        },
        stargazerCount: 42,
        forkCount: 7,
        isFork: false,
        isArchived: false,
        pushedAt: '2026-04-18T12:00:00Z',
        repositoryTopics: {
          nodes: [{ topic: { name: 'react' } }, { topic: { name: 'aws' } }],
        },
      };

      const normalized = normalizeRepo(raw);
      expect(normalized).toEqual({
        id: 12345,
        name: 'test-repo',
        fullName: 'brwyatt/test-repo',
        description: 'A test repository',
        htmlUrl: 'https://github.com/brwyatt/test-repo',
        homepage: 'https://test-repo.example.com',
        language: 'TypeScript',
        languageColor: '#3178c6',
        stargazersCount: 42,
        forksCount: 7,
        isFork: false,
        isArchived: false,
        updatedAt: '2026-04-18T12:00:00Z',
        topics: ['react', 'aws'],
      });
    });

    it('handles nullable and optional fields gracefully', () => {
      const raw = {
        databaseId: null,
        id: 'graphql-id-999',
        name: 'minimal-repo',
        nameWithOwner: 'brwyatt/minimal-repo',
        description: null,
        url: 'https://github.com/brwyatt/minimal-repo',
        homepageUrl: '',
        primaryLanguage: null,
        stargazerCount: null,
        forkCount: null,
        isFork: 0,
        isArchived: 0,
        pushedAt: '2026-04-18T12:00:00Z',
        repositoryTopics: null,
      };

      const normalized = normalizeRepo(raw);
      expect(normalized).toEqual({
        id: 'graphql-id-999',
        name: 'minimal-repo',
        fullName: 'brwyatt/minimal-repo',
        description: null,
        htmlUrl: 'https://github.com/brwyatt/minimal-repo',
        homepage: null,
        language: null,
        languageColor: null,
        stargazersCount: 0,
        forksCount: 0,
        isFork: false,
        isArchived: false,
        updatedAt: '2026-04-18T12:00:00Z',
        topics: [],
      });
    });
  });

  describe('fetchGitHubData', () => {
    it('throws when HTTP status is not ok', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
      } as Response);

      await expect(fetchGitHubData('bad-token', 'brwyatt')).rejects.toThrow(
        /GitHub GraphQL HTTP error: 401 Unauthorized/,
      );
    });

    it('throws when GraphQL errors array is present', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          errors: [{ message: 'Bad credentials' }],
        }),
      } as Response);

      await expect(fetchGitHubData('bad-token', 'brwyatt')).rejects.toThrow(
        /GitHub GraphQL error: Bad credentials/,
      );
    });

    it('throws when user is not found', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: { user: null },
        }),
      } as Response);

      await expect(fetchGitHubData('token', 'unknown-user')).rejects.toThrow(
        /User not found: unknown-user/,
      );
    });

    it('extracts and normalizes pinned repositories', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            user: {
              pinnedItems: {
                nodes: [
                  {
                    databaseId: 1,
                    name: 'pinned-repo',
                    nameWithOwner: 'brwyatt/pinned-repo',
                    url: 'https://github.com/brwyatt/pinned-repo',
                    isFork: false,
                    isArchived: false,
                  },
                ],
              },
            },
          },
        }),
      } as Response);

      const result = await fetchGitHubData('valid-token', 'brwyatt');
      expect(result.pinned).toHaveLength(1);
      expect(result.pinned[0].name).toBe('pinned-repo');
      expect(result.updatedAt).toBeDefined();
    });
  });

  describe('handler', () => {
    it('throws if required environment variables are missing', async () => {
      delete process.env.BUCKET_NAME;
      delete process.env.SSM_PARAM_NAME;

      await expect(handler({})).rejects.toThrow(/BUCKET_NAME environment variable is required/);

      process.env.BUCKET_NAME = 'test-bucket';
      await expect(handler({})).rejects.toThrow(/SSM_PARAM_NAME environment variable is required/);
    });

    it('successfully fetches token, queries GraphQL, and writes to S3', async () => {
      process.env.BUCKET_NAME = 'test-site-assets';
      process.env.SSM_PARAM_NAME = '/brwyatt-me/beta/github-token';
      process.env.GITHUB_USER = 'brwyatt';
      process.env.OBJECT_KEY = 'data/projects.json';

      const mockSSM = {
        send: vi.fn().mockResolvedValue({
          Parameter: { Value: 'test-pat-token' },
        }),
      };

      const mockS3 = {
        send: vi.fn().mockResolvedValue({}),
      };

      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            user: {
              pinnedItems: {
                nodes: [
                  {
                    databaseId: 101,
                    name: 'dffmpeg',
                    nameWithOwner: 'brwyatt/dffmpeg',
                    url: 'https://github.com/brwyatt/dffmpeg',
                    isFork: false,
                    isArchived: false,
                  },
                ],
              },
            },
          },
        }),
      } as Response);

      const response = await handler({}, {}, { ssm: mockSSM, s3: mockS3 });
      expect(response.statusCode).toBe(200);

      expect(mockSSM.send).toHaveBeenCalledTimes(1);
      expect(mockS3.send).toHaveBeenCalledTimes(1);

      const putCall = mockS3.send.mock.calls[0][0];
      expect(putCall.input.Bucket).toBe('test-site-assets');
      expect(putCall.input.Key).toBe('data/projects.json');
      expect(putCall.input.ContentType).toBe('application/json');
      expect(putCall.input.CacheControl).toBe('public, max-age=3600');

      const savedBody = JSON.parse(putCall.input.Body);
      expect(savedBody.pinned[0].name).toBe('dffmpeg');
    });
  });
});
