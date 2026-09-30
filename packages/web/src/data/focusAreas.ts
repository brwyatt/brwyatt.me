export interface FocusArea {
  id: string;
  title: string;
  description: string;
  icon: 'server' | 'terminal' | 'shield';
}

export const FOCUS_AREAS: FocusArea[] = [
  {
    id: 'distributed-systems',
    title: 'Distributed Systems & Automation',
    description:
      'Building resilient orchestration tooling, automated processing pipelines, and declarative infrastructure to systematically reduce operational cognitive load.',
    icon: 'server',
  },
  {
    id: 'linux-cloud',
    title: 'Linux & Cloud Architecture',
    description:
      'Deep expertise in Linux internals, high-performance networking, and modern Infrastructure-as-Code to support highly available, resilient environments.',
    icon: 'terminal',
  },
  {
    id: 'infrastructure-homelab',
    title: 'Infrastructure & Homelab',
    description:
      'Designing and maintaining hyper-converged virtualization and distributed storage fabrics that serve as a real-world testbed for continuous integration.',
    icon: 'shield',
  },
];
