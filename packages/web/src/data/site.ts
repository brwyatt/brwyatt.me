export interface SocialLink {
  name: string;
  url: string;
  label: string;
}

export interface GpgKeyInfo {
  fingerprint: string;
  wkdPath: string;
  keybaseUrl: string;
}

export interface SiteConfig {
  name: string;
  title: string;
  tagline: string;
  email: string;
  gpg: GpgKeyInfo;
}

export const SITE_CONFIG: SiteConfig = {
  name: 'Bryan Wyatt',
  title: 'Systems Development Engineer',
  tagline:
    'Systems Development Engineer specializing in Linux systems, distributed automation, and high-reliability infrastructure.',
  email: 'brwyatt@brwyatt.net',
  gpg: {
    fingerprint: '7139 4C8E CA4A B1BE B85E  B202 B83E E2D5 5C50 C6B2',
    wkdPath: '/.well-known/openpgpkey/hu/39z93up6pguuos5fb5cyx8yxzp3t9foa',
    keybaseUrl: 'https://keybase.io/brwyatt',
  },
};

export const SOCIAL_LINKS: SocialLink[] = [
  {
    name: 'GitHub',
    url: 'https://github.com/brwyatt',
    label: 'GitHub Profile',
  },
  {
    name: 'LinkedIn',
    url: 'https://linkedin.com/in/brwyatt',
    label: 'LinkedIn Profile',
  },
  {
    name: 'BlueSky',
    url: 'https://bsky.app/profile/brwyatt.net',
    label: 'BlueSky Profile',
  },
  {
    name: 'Steam',
    url: 'https://steamcommunity.com/id/brwyatt',
    label: 'Steam Community Profile',
  },
];

export const NAV_LINKS = [
  { path: '/', label: 'Home' },
  { path: '/about', label: 'About' },
  { path: '/projects', label: 'Projects' },
  { path: '/contact', label: 'Contact' },
];
