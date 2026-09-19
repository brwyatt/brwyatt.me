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
      'Building resilient orchestration tooling, automated media processing pipelines (dffmpeg), and declarative infrastructure.',
    icon: 'server',
  },
  {
    id: 'linux-cloud',
    title: 'Linux & Cloud Architecture',
    description:
      'Deep expertise in Linux kernel tuning, high-performance networking, AWS serverless services, and modern Infrastructure-as-Code with AWS CDK.',
    icon: 'terminal',
  },
  {
    id: 'homelab',
    title: 'High-Availability Homelab',
    description:
      'Hyper-converged 6-node Proxmox VE cluster, multi-gigabit Ceph storage fabrics, FreeIPA identity federation, and automated operations.',
    icon: 'shield',
  },
];
