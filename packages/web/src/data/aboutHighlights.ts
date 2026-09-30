export interface AboutHighlight {
  id: string;
  title: string;
  description: string;
  icon: 'cpu' | 'globe' | 'award' | 'box' | 'gamepad' | 'cat';
}

export const ABOUT_HIGHLIGHTS: AboutHighlight[] = [
  {
    id: 'core-competencies',
    title: 'Core Competencies',
    description:
      'Linux Internals, Distributed Architecture, Infrastructure-as-Code (Ansible, AWS CDK), Python, Containerization, and Observability.',
    icon: 'cpu',
  },
  {
    id: 'homelab-architecture',
    title: 'Homelab Architecture',
    description:
      'High-availability compute clusters, distributed NVMe storage fabrics, redundant network gateways, and centralized identity services.',
    icon: 'globe',
  },
  {
    id: 'open-source',
    title: 'Open Source',
    description:
      'Author and contributor to tools spanning Python, systems automation, and declarative infrastructure management.',
    icon: 'award',
  },
  {
    id: '3d-printing',
    title: '3D Printing & Design',
    description:
      'Designing and iterating on custom functional parts—from homelab server chassis sleds and mounting brackets to everyday utility prints.',
    icon: 'box',
  },
  {
    id: 'virtual-reality',
    title: 'Virtual Reality',
    description:
      'Exploring immersive, story-driven narratives and rhythm games, and tinkering with the hardware and play-spaces that drive them.',
    icon: 'gamepad',
  },
  {
    id: 'kaylee',
    title: 'Kaylee',
    description:
      'The resident QA tester, designated desk-warmer, and full-time feline supervisor for all late-night debugging sessions.',
    icon: 'cat',
  },
];
