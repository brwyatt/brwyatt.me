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
      'The underlying infrastructure, automation, and TypeScript source for this personal website.',
    htmlUrl: 'https://github.com/brwyatt/brwyatt.me',
    homepage: 'https://brwyatt.me',
    language: 'TypeScript',
    isFeatured: true,
  },
  {
    name: 'dffmpeg',
    fullName: 'brwyatt/dffmpeg',
    description:
      'A centrally-coordinated distributed FFmpeg worker job manager utilizing Python and message queues for seamless homelab media transcoding.',
    htmlUrl: 'https://github.com/brwyatt/dffmpeg',
    isFeatured: true,
  },
  {
    name: 'HomeLab Portal',
    fullName: 'brwyatt/homelab-portal',
    description:
      'HomeLab service directory portal for users. With filtering for group membership and network location.',
    htmlUrl: 'https://github.com/brwyatt/homelab-portal',
    homepage: 'https://home.brwyatt.net',
    language: 'Python',
    isFeatured: true,
  },
  {
    name: 'ansible-config',
    fullName: 'brwyatt/ansible-config',
    description:
      'A dynamic Infrastructure-as-Code repository demonstrating flexible, declarative deployment models over static host definitions.',
    htmlUrl: 'https://github.com/brwyatt/ansible-config',
    isFeatured: true,
  },
  {
    name: 'Functional 3D Prints & Models',
    description:
      'Functional designs and utility prints—ranging from server mounting brackets and home automation enclosures to lamps, camera mounts, and everyday fixes.',
    htmlUrl: 'https://makerworld.com/en/@brwyatt',
    homepage: 'https://makerworld.com/en/@brwyatt',
    language: 'CAD / 3D',
    isFeatured: true,
  },
];
