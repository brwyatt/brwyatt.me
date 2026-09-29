import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
// @ts-expect-error - index.mjs has no type declarations
// prettier-ignore
import { calculateFrecencyScore, DEFAULT_SCORING_CONFIG, fetchGitHubData, getScoringConfig, handler, normalizeRepo } from '../functions/github-sync/index.mjs';

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

    it('correctly maps raw GraphQL repository node with commit count', () => {
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
        defaultBranchRef: {
          target: {
            history: {
              totalCount: 15,
            },
          },
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
        recentCommitCount: 15,
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
        defaultBranchRef: null,
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
        recentCommitCount: 0,
      });
    });
  });

  describe('calculateFrecencyScore and getScoringConfig', () => {
    it('returns default scoring configuration when environment variables are unset', () => {
      const config = getScoringConfig();
      expect(config.halfLifeDays).toBe(DEFAULT_SCORING_CONFIG.halfLifeDays);
      expect(config.minScoreThreshold).toBe(DEFAULT_SCORING_CONFIG.minScoreThreshold);
      expect(config.maxActiveRepos).toBe(DEFAULT_SCORING_CONFIG.maxActiveRepos);
    });

    it('parses environment variable overrides', () => {
      process.env.SCORING_HALF_LIFE_DAYS = '45';
      process.env.SCORING_MIN_THRESHOLD = '15.5';
      process.env.SCORING_MAX_ACTIVE_REPOS = '1';
      process.env.SCORING_WEIGHT_STARS = '3.0';

      const config = getScoringConfig();
      expect(config.halfLifeDays).toBe(45);
      expect(config.minScoreThreshold).toBe(15.5);
      expect(config.maxActiveRepos).toBe(1);
      expect(config.weightStars).toBe(3.0);
    });

    it('returns 0 score if repo updatedAt is older than maxPushedAgeDays', () => {
      const now = new Date('2026-04-01T00:00:00Z');
      const oldRepo = {
        updatedAt: '2025-12-01T00:00:00Z', // > 120 days ago
        recentCommitCount: 50,
        stargazersCount: 100,
        forksCount: 10,
      };

      const score = calculateFrecencyScore(oldRepo, now);
      expect(score).toBe(0);
    });

    it('calculates recency decay and activity accurately', () => {
      const now = new Date('2026-04-30T00:00:00Z');
      // Pushed 30 days ago => recency = 0.5^(30/30) = 0.5
      const repo = {
        updatedAt: '2026-03-31T00:00:00Z',
        recentCommitCount: 10, // 10 * 1.5 = 15
        stargazersCount: 5, // 5 * 2.0 = 10
        forksCount: 1, // 1 * 1.0 = 1
      };

      const score = calculateFrecencyScore(repo, now);
      // (15 + 10 + 1) * 0.5 = 13
      expect(score).toBeCloseTo(13, 2);
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

    it('orders pinned repos first, and appends qualifying frecent repos up to limit', async () => {
      const recentDate = new Date().toISOString();
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
                    pushedAt: recentDate,
                    stargazerCount: 10,
                    forkCount: 2,
                    isFork: false,
                    isArchived: false,
                  },
                ],
              },
              repositories: {
                nodes: [
                  // Candidate 1: Already pinned (should be deduped out)
                  {
                    databaseId: 1,
                    name: 'pinned-repo',
                    nameWithOwner: 'brwyatt/pinned-repo',
                    url: 'https://github.com/brwyatt/pinned-repo',
                    pushedAt: recentDate,
                    isFork: false,
                    isArchived: false,
                  },
                  // Candidate 2: High popularity & activity (should qualify)
                  {
                    databaseId: 2,
                    name: 'popular-active-repo',
                    nameWithOwner: 'brwyatt/popular-active-repo',
                    url: 'https://github.com/brwyatt/popular-active-repo',
                    pushedAt: recentDate,
                    stargazerCount: 20,
                    forkCount: 5,
                    isFork: false,
                    isArchived: false,
                    defaultBranchRef: {
                      target: {
                        history: { totalCount: 12 },
                      },
                    },
                  },
                  // Candidate 3: Fork (should be excluded)
                  {
                    databaseId: 3,
                    name: 'forked-repo',
                    nameWithOwner: 'brwyatt/forked-repo',
                    url: 'https://github.com/brwyatt/forked-repo',
                    pushedAt: recentDate,
                    isFork: true,
                    isArchived: false,
                  },
                  // Candidate 4: Low score (should be excluded by threshold)
                  {
                    databaseId: 4,
                    name: 'low-score-scratchpad',
                    nameWithOwner: 'brwyatt/low-score-scratchpad',
                    url: 'https://github.com/brwyatt/low-score-scratchpad',
                    pushedAt: recentDate,
                    stargazerCount: 0,
                    forkCount: 0,
                    isFork: false,
                    isArchived: false,
                    defaultBranchRef: {
                      target: {
                        history: { totalCount: 1 },
                      },
                    },
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
      expect(result.pinned[0].isPinned).toBe(true);

      // Unified projects list contains pinned first, followed by qualifying candidate
      expect(result.projects).toHaveLength(2);
      expect(result.projects[0].name).toBe('pinned-repo');
      expect(result.projects[0].isPinned).toBe(true);
      expect(result.projects[1].name).toBe('popular-active-repo');
      expect(result.projects[1].isPinned).toBe(false);
      expect(result.projects[1].frecencyScore).toBeGreaterThanOrEqual(10);
    });

    it('returns only pinned projects when no candidate repos meet threshold', async () => {
      const recentDate = new Date().toISOString();
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            user: {
              pinnedItems: {
                nodes: [
                  {
                    databaseId: 10,
                    name: 'solo-pinned',
                    nameWithOwner: 'brwyatt/solo-pinned',
                    url: 'https://github.com/brwyatt/solo-pinned',
                    pushedAt: recentDate,
                    isFork: false,
                    isArchived: false,
                  },
                ],
              },
              repositories: {
                nodes: [
                  {
                    databaseId: 20,
                    name: 'inactive-repo',
                    nameWithOwner: 'brwyatt/inactive-repo',
                    url: 'https://github.com/brwyatt/inactive-repo',
                    pushedAt: recentDate,
                    stargazerCount: 0,
                    forkCount: 0,
                    isFork: false,
                    isArchived: false,
                    defaultBranchRef: {
                      target: {
                        history: { totalCount: 1 }, // Score: 1.5 < 10 threshold
                      },
                    },
                  },
                ],
              },
            },
          },
        }),
      } as Response);

      const result = await fetchGitHubData('valid-token', 'brwyatt');
      expect(result.pinned).toHaveLength(1);
      expect(result.projects).toHaveLength(1);
      expect(result.projects[0].name).toBe('solo-pinned');
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
              repositories: {
                nodes: [],
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
      expect(savedBody.projects[0].name).toBe('dffmpeg');
      expect(savedBody.pinned[0].name).toBe('dffmpeg');
    });
  });
});
