import { describe, it, expect, beforeEach, vi } from 'vitest';
import { fetchGithubProjects, FALLBACK_PROJECTS } from '../github';

describe('fetchGithubProjects', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('returns fallback projects on network failure', async () => {
    vi.spyOn(global, 'fetch').mockRejectedValueOnce(new Error('Network error'));

    const result = await fetchGithubProjects('brwyatt');
    expect(result.projects).toEqual(FALLBACK_PROJECTS);
    expect(result.isCached).toBe(false);
    expect(result.error).toContain('Network error');
  });

  it('fetches and normalizes repos from GitHub API', async () => {
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

    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => mockApiResponse,
    } as Response);

    const result = await fetchGithubProjects('brwyatt');
    expect(result.projects).toHaveLength(1);
    expect(result.projects[0].name).toBe('test-repo');
    expect(result.isCached).toBe(false);
    expect(result.error).toBeNull();
  });

  it('serves valid cached data if within TTL', async () => {
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

    const fetchSpy = vi.spyOn(global, 'fetch');

    const result = await fetchGithubProjects('brwyatt');
    expect(result.isCached).toBe(true);
    expect(result.projects).toEqual(cachedProjects);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
