export interface AboutHighlight {
  id: string;
  title: string;
  description: string;
  icon: 'cpu' | 'globe' | 'award';
}

export const ABOUT_HIGHLIGHTS: AboutHighlight[] = [
  {
    id: 'core-competencies',
    title: 'Core Competencies',
    description:
      'Linux Internals, Distributed Architecture, Ansible, AWS CDK, Python, TypeScript, Proxmox VE, Ceph, Containerization, and Observability.',
    icon: 'cpu',
  },
  {
    id: 'homelab-architecture',
    title: 'Homelab Architecture',
    description:
      'Dual redundant 10Gb aggregation routing, 6-node Proxmox cluster, NVMe Ceph pools, and centralized FreeIPA directory services.',
    icon: 'globe',
  },
  {
    id: 'open-source',
    title: 'Open Source',
    description:
      'Author and contributor to open source tooling across Python, systems automation, and infrastructure management on GitHub.',
    icon: 'award',
  },
];
