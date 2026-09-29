export interface RawGithubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  homepage?: string | null;
  language?: string | null;
  stargazers_count: number;
  forks_count: number;
  fork: boolean;
  archived: boolean;
  updated_at: string;
  topics?: string[];
}

export interface GithubRepo {
  id: number | string;
  name: string;
  fullName: string;
  description: string | null;
  htmlUrl: string;
  homepage: string | null;
  language: string | null;
  stargazersCount: number;
  forksCount: number;
  isFork: boolean;
  isArchived: boolean;
  updatedAt: string;
  topics: string[];
  isPinned?: boolean;
  isFeatured?: boolean;
  frecencyScore?: number;
}

export interface ManualProject {
  id?: number | string;
  name: string;
  fullName?: string;
  description?: string;
  htmlUrl?: string;
  homepage?: string;
  language?: string;
  topics?: string[];
  isPinned?: boolean;
  isFeatured?: boolean;
}

export interface ProjectsState {
  projects: GithubRepo[];
  isLoading: boolean;
  error: string | null;
  isCached: boolean;
  lastUpdated: number | null;
}
