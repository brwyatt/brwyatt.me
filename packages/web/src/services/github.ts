import { GithubRepo, RawGithubRepo } from './github.types';

const CACHE_KEY = 'brwyatt_github_repos_v1';
const CACHE_TIMESTAMP_KEY = 'brwyatt_github_repos_timestamp';
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour TTL

/**
 * Curated offline fallback projects used when network is unavailable,
 * rate limit is reached, or running offline in hermetic environments.
 */
export const FALLBACK_PROJECTS: GithubRepo[] = [
  {
    id: 101,
    name: 'dffmpeg',
    fullName: 'brwyatt/dffmpeg',
    description:
      'Centrally-coordinated distributed FFmpeg transcoding job manager and cluster worker nodes.',
    htmlUrl: 'https://github.com/brwyatt/dffmpeg',
    homepage: null,
    language: 'Python',
    stargazersCount: 12,
    forksCount: 2,
    isFork: false,
    isArchived: false,
    updatedAt: new Date().toISOString(),
    topics: ['ffmpeg', 'distributed-systems', 'python', 'homelab', 'video-transcoding'],
  },
  {
    id: 102,
    name: 'brwyatt.me',
    fullName: 'brwyatt/brwyatt.me',
    description:
      'Modern portfolio website and AWS CDK infrastructure for brwyatt.me and brwyatt.net.',
    htmlUrl: 'https://github.com/brwyatt/brwyatt.me',
    homepage: 'https://brwyatt.me',
    language: 'TypeScript',
    stargazersCount: 5,
    forksCount: 0,
    isFork: false,
    isArchived: false,
    updatedAt: new Date().toISOString(),
    topics: ['react', 'vite', 'aws-cdk', 'serverless', 'typescript'],
  },
  {
    id: 103,
    name: 'ansible-config',
    fullName: 'brwyatt/ansible-config',
    description:
      'Declarative infrastructure-as-code configuration and automated orchestration for homelab nodes.',
    htmlUrl: 'https://github.com/brwyatt/ansible-config',
    homepage: null,
    language: 'YAML',
    stargazersCount: 4,
    forksCount: 0,
    isFork: false,
    isArchived: false,
    updatedAt: new Date().toISOString(),
    topics: ['ansible', 'infrastructure-as-code', 'homelab', 'proxmox'],
  },
];

/**
 * Fetches public repositories for a GitHub user with client-side localStorage caching.
 * Guaranteed never to throw; falls back gracefully to cached or curated data.
 */
export async function fetchGithubProjects(username: string = 'brwyatt'): Promise<{
  projects: GithubRepo[];
  isCached: boolean;
  error: string | null;
}> {
  // 1. Check client-side storage cache
  try {
    const cachedData = localStorage.getItem(CACHE_KEY);
    const cachedTimestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);

    if (cachedData && cachedTimestamp) {
      const age = Date.now() - parseInt(cachedTimestamp, 10);
      if (age < CACHE_TTL_MS) {
        return {
          projects: JSON.parse(cachedData),
          isCached: true,
          error: null,
        };
      }
    }
  } catch {
    // localStorage might be unavailable or disabled
  }

  // 2. Fetch directly from GitHub REST API
  try {
    const response = await fetch(
      `https://api.github.com/users/${username}/repos?sort=pushed&per_page=30`,
      {
        headers: {
          Accept: 'application/vnd.github.v3+json',
        },
      },
    );

    if (!response.ok) {
      // Check for rate limiting
      if (response.status === 403) {
        throw new Error('GitHub API rate limit exceeded. Displaying cached/curated projects.');
      }
      throw new Error(`GitHub API returned status ${response.status}`);
    }

    const rawData = (await response.json()) as RawGithubRepo[];

    const normalized: GithubRepo[] = rawData
      .filter((repo: RawGithubRepo) => !repo.fork && !repo.archived)
      .map((repo: RawGithubRepo) => ({
        id: repo.id,
        name: repo.name,
        fullName: repo.full_name,
        description: repo.description,
        htmlUrl: repo.html_url,
        homepage: repo.homepage ?? null,
        language: repo.language ?? null,
        stargazersCount: repo.stargazers_count,
        forksCount: repo.forks_count,
        isFork: repo.fork,
        isArchived: repo.archived,
        updatedAt: repo.updated_at,
        topics: repo.topics || [],
      }));

    // Save to cache
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(normalized));
      localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
    } catch {
      // Ignore cache write errors
    }

    return {
      projects: normalized,
      isCached: false,
      error: null,
    };
  } catch (err: unknown) {
    const errorMessage =
      err instanceof Error ? err.message : 'Error fetching fresh data from GitHub.';

    // Return stale cache if available, or fallback
    try {
      const cachedData = localStorage.getItem(CACHE_KEY);
      if (cachedData) {
        return {
          projects: JSON.parse(cachedData),
          isCached: true,
          error: errorMessage,
        };
      }
    } catch {
      // Fallback
    }

    return {
      projects: FALLBACK_PROJECTS,
      isCached: false,
      error: errorMessage || 'Offline fallback mode.',
    };
  }
}
