import React from 'react';
import { Cpu, Globe, Award } from 'lucide-react';
import { ABOUT_HIGHLIGHTS, AboutHighlight } from '../data/aboutHighlights';
import { InfoCard } from '../components/InfoCard';

const ICON_MAP: Record<AboutHighlight['icon'], React.ReactNode> = {
  cpu: <Cpu size={24} color="var(--accent)" />,
  globe: <Globe size={24} color="var(--accent)" />,
  award: <Award size={24} color="var(--accent)" />,
};

export const About: React.FC = () => {
  return (
    <div>
      <section className="hero">
        <h1>About Me</h1>
        <p>Systems Development Engineer & Linux Platform Enthusiast</p>
      </section>

      <div>
        <h2 className="section-title">Background & Philosophy</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
          I am a Systems Development Engineer focused on infrastructure automation, Linux platform
          engineering, and distributed computing. I design systems with an emphasis on reliability,
          observability, and declarative management.
        </p>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
          Outside of cloud services, I maintain a hyper-converged homelab environment that serves as
          a real-world testbed for Ceph storage clustering, Proxmox virtualization, high-throughput
          network fabrics, and secure identity management.
        </p>

        <div className="card-grid" style={{ marginTop: '2rem' }}>
          {ABOUT_HIGHLIGHTS.map((highlight) => (
            <InfoCard
              key={highlight.id}
              title={highlight.title}
              description={highlight.description}
              icon={ICON_MAP[highlight.icon]}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
