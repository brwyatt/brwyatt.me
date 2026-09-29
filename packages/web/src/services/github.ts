import { GithubRepo, ManualProject, RawGithubRepo } from './github.types';
import { MANUAL_PROJECTS } from '../data/manualProjects';

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
    isPinned: true,
    isFeatured: true,
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
    isPinned: true,
    isFeatured: true,
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
    isPinned: true,
    isFeatured: true,
  },
];

/**
 * Deduplicate and merge dynamic GitHub repositories with manually curated project entries.
 *
 * Matching is performed case-insensitively against name, fullName, or normalized htmlUrl.
 * When matched, curated manual fields (such as a preferred live site URL, custom description,
 * custom topics, or featured status) take precedence while preserving GitHub dynamic metrics
 * (stars, forks, pushed date).
 *
 * Unmatched manual projects (e.g. non-GitHub or external sites) are synthesized into GithubRepo objects.
 */
export function mergeProjects(
  githubProjects: GithubRepo[],
  manualProjects: ManualProject[] = MANUAL_PROJECTS,
): GithubRepo[] {
  const manualMap = new Map<string, ManualProject>();
  for (const m of manualProjects) {
    if (m.name) manualMap.set(m.name.toLowerCase(), m);
    if (m.fullName) manualMap.set(m.fullName.toLowerCase(), m);
    if (m.htmlUrl) manualMap.set(m.htmlUrl.toLowerCase().replace(/\/+$/, ''), m);
  }

  const matchedManualNames = new Set<string>();

  const mergedGithub = githubProjects.map((gh) => {
    const keyName = gh.name.toLowerCase();
    const keyFullName = gh.fullName ? gh.fullName.toLowerCase() : '';
    const keyUrl = gh.htmlUrl ? gh.htmlUrl.toLowerCase().replace(/\/+$/, '') : '';

    const manual =
      (keyFullName ? manualMap.get(keyFullName) : undefined) ||
      manualMap.get(keyName) ||
      (keyUrl ? manualMap.get(keyUrl) : undefined);

    if (!manual) {
      return {
        ...gh,
        isFeatured: gh.isFeatured ?? gh.isPinned ?? false,
      };
    }

    matchedManualNames.add(manual.name.toLowerCase());

    const mergedTopics = Array.from(
      new Set([...(gh.topics || []), ...(manual.topics || [])]),
    );

    return {
      ...gh,
      name: manual.name || gh.name,
      fullName: manual.fullName || gh.fullName,
      description: manual.description !== undefined ? manual.description : gh.description,
      htmlUrl: manual.htmlUrl || gh.htmlUrl,
      homepage: manual.homepage !== undefined ? manual.homepage : gh.homepage,
      language: manual.language || gh.language,
      topics: mergedTopics,
      isPinned: manual.isPinned !== undefined ? manual.isPinned : gh.isPinned,
      isFeatured:
        manual.isFeatured !== undefined
          ? manual.isFeatured
          : gh.isFeatured ?? gh.isPinned ?? false,
    };
  });

  const unmatchedManual: GithubRepo[] = manualProjects
    .filter((m) => !matchedManualNames.has(m.name.toLowerCase()))
    .map((m, idx) => ({
      id: m.id ?? `manual-${m.name}-${idx}`,
      name: m.name,
      fullName: m.fullName || m.name,
      description: m.description ?? null,
      htmlUrl: m.htmlUrl || m.homepage || '',
      homepage: m.homepage ?? null,
      language: m.language ?? null,
      stargazersCount: 0,
      forksCount: 0,
      isFork: false,
      isArchived: false,
      updatedAt: new Date().toISOString(),
      topics: m.topics || [],
      isPinned: m.isPinned ?? false,
      isFeatured: m.isFeatured ?? false,
    }));

  return [...mergedGithub, ...unmatchedManual];
}

/**
 * Fetches public repositories for a GitHub user.
 *
 * 1. Checks localStorage cache first.
 * 2. Attempts to fetch `/data/projects.json` (produced by the github-sync Lambda).
 * 3. Falls back to direct GitHub REST API if `/data/projects.json` is unavailable (e.g. local dev).
 * 4. Merges with manually curated projects (`MANUAL_PROJECTS`) with deduplication.
 * 5. Falls back to curated static fallback projects on total network/API error.
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

  // 2. Try fetching from /data/projects.json (generated by github-sync Lambda)
  try {
    const response = await fetch('/data/projects.json');
    if (response.ok) {
      const data = await response.json();
      const rawProjects: GithubRepo[] = Array.isArray(data) ? data : data.projects || [];
      const merged = mergeProjects(rawProjects, MANUAL_PROJECTS);

      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(merged));
        localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
      } catch {
        // Ignore cache write errors
      }

      return {
        projects: merged,
        isCached: false,
        error: null,
      };
    }
  } catch {
    // /data/projects.json may not be available (e.g. local dev server)
  }

  // 3. Fallback: direct GitHub REST API
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

    const merged = mergeProjects(normalized, MANUAL_PROJECTS);

    // Save to cache
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(merged));
      localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
    } catch {
      // Ignore cache write errors
    }

    return {
      projects: merged,
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

    const mergedFallback = mergeProjects(FALLBACK_PROJECTS, MANUAL_PROJECTS);
    return {
      projects: mergedFallback,
      isCached: false,
      error: errorMessage || 'Offline fallback mode.',
    };
  }
}
