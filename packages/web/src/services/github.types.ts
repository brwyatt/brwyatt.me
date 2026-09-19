export interface GithubRepo {
  id: number;
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
}

export interface ProjectsState {
  projects: GithubRepo[];
  isLoading: boolean;
  error: string | null;
  isCached: boolean;
  lastUpdated: number | null;
}
