import { describe, it, expect, beforeEach, vi } from 'vitest';
import { fetchGithubProjects, mergeProjects, FALLBACK_PROJECTS } from '../github';
import { GithubRepo, ManualProject } from '../github.types';
import { MANUAL_PROJECTS } from '../../data/manualProjects';

describe('mergeProjects', () => {
  it('deduplicates and merges manual overrides into matching GitHub repo', () => {
    const ghProjects: GithubRepo[] = [
      {
        id: 102,
        name: 'brwyatt.me',
        fullName: 'brwyatt/brwyatt.me',
        description: 'Auto-fetched description',
        htmlUrl: 'https://github.com/brwyatt/brwyatt.me',
        homepage: null, // GitHub has no homepage set
        language: 'TypeScript',
        stargazersCount: 42,
        forksCount: 3,
        isFork: false,
        isArchived: false,
        updatedAt: '2026-03-01T00:00:00Z',
        topics: ['aws-cdk', 'react'],
      },
    ];

    const manualProjects: ManualProject[] = [
      {
        name: 'brwyatt.me',
        homepage: 'https://brwyatt.me',
        isPinned: true,
        isFeatured: true,
        topics: ['react', 'vite', 'serverless'],
      },
    ];

    const result = mergeProjects(ghProjects, manualProjects);

    expect(result).toHaveLength(1);
    const item = result[0];
    expect(item.name).toBe('brwyatt.me');
    expect(item.homepage).toBe('https://brwyatt.me');
    expect(item.isPinned).toBe(true);
    expect(item.isFeatured).toBe(true);
    expect(item.stargazersCount).toBe(42);
    expect(item.forksCount).toBe(3);
    expect(item.language).toBe('TypeScript');
    // Topics should be merged and deduplicated
    expect(item.topics).toEqual(
      expect.arrayContaining(['aws-cdk', 'react', 'vite', 'serverless']),
    );
    expect(new Set(item.topics).size).toBe(item.topics.length);
  });

  it('correctly matches by fullName or htmlUrl with case-insensitivity', () => {
    const ghProjects: GithubRepo[] = [
      {
        id: 101,
        name: 'DFfMpEg',
        fullName: 'BrWyAtt/dffmpeg',
        description: 'Distributed transcoding',
        htmlUrl: 'https://github.com/brwyatt/dffmpeg/',
        homepage: null,
        language: 'Python',
        stargazersCount: 15,
        forksCount: 2,
        isFork: false,
        isArchived: false,
        updatedAt: '2026-03-01T00:00:00Z',
        topics: ['ffmpeg'],
      },
    ];

    const manualProjects: ManualProject[] = [
      {
        name: 'dffmpeg',
        fullName: 'brwyatt/dffmpeg',
        htmlUrl: 'https://github.com/brwyatt/dffmpeg',
        isPinned: true,
        isFeatured: true,
      },
    ];

    const result = mergeProjects(ghProjects, manualProjects);
    expect(result).toHaveLength(1);
    expect(result[0].isPinned).toBe(true);
    expect(result[0].isFeatured).toBe(true);
  });

  it('synthesizes entries for unmatched manual projects', () => {
    const ghProjects: GithubRepo[] = [];
    const manualProjects: ManualProject[] = [
      {
        name: 'external-tool',
        description: 'A tool hosted elsewhere',
        homepage: 'https://tool.example.com',
        language: 'Rust',
        isPinned: false,
        isFeatured: true,
      },
    ];

    const result = mergeProjects(ghProjects, manualProjects);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('external-tool');
    expect(result[0].homepage).toBe('https://tool.example.com');
    expect(result[0].language).toBe('Rust');
    expect(result[0].isFeatured).toBe(true);
    expect(result[0].stargazersCount).toBe(0);
  });

  it('correctly enriches brwyatt.me with live URL from default MANUAL_PROJECTS', () => {
    const ghProjects: GithubRepo[] = [
      {
        id: 500,
        name: 'brwyatt.me',
        fullName: 'brwyatt/brwyatt.me',
        description: 'Personal site repo',
        htmlUrl: 'https://github.com/brwyatt/brwyatt.me',
        homepage: null,
        language: 'TypeScript',
        stargazersCount: 7,
        forksCount: 1,
        isFork: false,
        isArchived: false,
        updatedAt: '2026-03-10T00:00:00Z',
        topics: ['react'],
      },
    ];

    const result = mergeProjects(ghProjects, MANUAL_PROJECTS);
    const brwyattMe = result.find((p) => p.name === 'brwyatt.me');
    expect(brwyattMe).toBeDefined();
    expect(brwyattMe?.homepage).toBe('https://brwyatt.me');
    expect(brwyattMe?.isPinned).toBe(true);
    expect(brwyattMe?.isFeatured).toBe(true);
  });
});

describe('fetchGithubProjects', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('successfully fetches and merges from /data/projects.json', async () => {
    const mockJson = {
      updatedAt: '2026-03-29T00:00:00Z',
      projects: [
        {
          id: 102,
          name: 'brwyatt.me',
          fullName: 'brwyatt/brwyatt.me',
          description: 'S3 static JSON description',
          htmlUrl: 'https://github.com/brwyatt/brwyatt.me',
          homepage: null,
          language: 'TypeScript',
          stargazersCount: 8,
          forksCount: 1,
          isFork: false,
          isArchived: false,
          updatedAt: '2026-03-29T00:00:00Z',
          topics: ['react'],
        },
      ],
    };

    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const url = typeof input === 'string' ? input : (input as Request).url;
      if (url.includes('/data/projects.json')) {
        return {
          ok: true,
          json: async () => mockJson,
        } as Response;
      }
      return { ok: false, status: 404 } as Response;
    });

    const result = await fetchGithubProjects('brwyatt');
    expect(result.error).toBeNull();
    expect(result.isCached).toBe(false);
    const brwyattMe = result.projects.find((p) => p.name === 'brwyatt.me');
    expect(brwyattMe).toBeDefined();
    // Live URL overlaid from MANUAL_PROJECTS
    expect(brwyattMe?.homepage).toBe('https://brwyatt.me');
    expect(brwyattMe?.stargazersCount).toBe(8);
  });

  it('falls back to GitHub REST API when /data/projects.json is not found (404)', async () => {
    const mockApiResponse = [
      {
        id: 1,
        name: 'test-repo',
        full_name: 'brwyatt/test-repo',
        description: 'A test repo',
        html_url: 'https://github.com/brwyatt/test-repo',
        homepage: null,
        language: 'TypeScript',
        stargazers_count: 10,
        forks_count: 2,
        fork: false,
        archived: false,
        updated_at: '2026-01-01T00:00:00Z',
        topics: ['test'],
      },
    ];

    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const url = typeof input === 'string' ? input : (input as Request).url;
      if (url.includes('/data/projects.json')) {
        return { ok: false, status: 404 } as Response;
      }
      if (url.includes('api.github.com')) {
        return {
          ok: true,
          json: async () => mockApiResponse,
        } as Response;
      }
      return { ok: false, status: 500 } as Response;
    });

    const result = await fetchGithubProjects('brwyatt');
    expect(result.error).toBeNull();
    const testRepo = result.projects.find((p) => p.name === 'test-repo');
    expect(testRepo).toBeDefined();
    expect(testRepo?.stargazersCount).toBe(10);
  });

  it('serves valid cached data if within TTL without calling fetch', async () => {
    const cachedProjects = [
      {
        id: 99,
        name: 'cached-repo',
        fullName: 'brwyatt/cached-repo',
        description: 'From cache',
        htmlUrl: 'https://github.com/brwyatt/cached-repo',
        homepage: null,
        language: 'Python',
        stargazersCount: 5,
        forksCount: 0,
        isFork: false,
        isArchived: false,
        updatedAt: '2026-01-01T00:00:00Z',
        topics: [],
      },
    ];

    localStorage.setItem('brwyatt_github_repos_v1', JSON.stringify(cachedProjects));
    localStorage.setItem('brwyatt_github_repos_timestamp', Date.now().toString());

    const fetchSpy = vi.spyOn(globalThis, 'fetch');

    const result = await fetchGithubProjects('brwyatt');
    expect(result.isCached).toBe(true);
    expect(result.projects).toEqual(cachedProjects);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('falls back to merged fallback projects on complete network failure', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Complete network failure'));

    const result = await fetchGithubProjects('brwyatt');
    expect(result.isCached).toBe(false);
    expect(result.error).toContain('Complete network failure');
    const brwyattMe = result.projects.find((p) => p.name === 'brwyatt.me');
    expect(brwyattMe).toBeDefined();
    expect(brwyattMe?.homepage).toBe('https://brwyatt.me');
  });
});
