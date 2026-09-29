import { ManualProject } from '../services/github.types';

/**
 * Curated manual projects list.
 *
 * Can include external websites, closed-source or non-GitHub projects,
 * or GitHub projects where custom metadata (such as a preferred live site URL,
 * custom description, or custom topics) should override the GitHub metadata.
 *
 * When a project matches an existing GitHub repo (by name, fullName, or htmlUrl),
 * the deduplication logic merges the records, preferring manual fields (like homepage / live URL)
 * while preserving GitHub dynamic metrics (stars, forks, pushed date).
 */
export const MANUAL_PROJECTS: ManualProject[] = [
  {
    name: 'brwyatt.me (This site!)',
    fullName: 'brwyatt/brwyatt.me',
    description:
      'Personal website and related infrastructure resources',
    homepage: 'https://brwyatt.me',
    isFeatured: true,
  },
];
