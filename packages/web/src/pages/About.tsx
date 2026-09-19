import React from 'react';
import { Cpu, Globe, Award } from 'lucide-react';

export const About: React.FC = () => {
  return (
    <div>
      <section className="hero">
        <h1>About Me</h1>
        <p>Systems Development Engineer & Linux Enthusiast</p>
      </section>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
        <div>
          <h2 className="section-title">Background & Philosophy</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            I am a Systems Development Engineer focused on infrastructure automation, Linux platform
            engineering, and distributed computing. I design systems with an emphasis on reliability,
            observability, and declarative management.
          </p>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            Outside of large-scale cloud services, I maintain a hyper-converged homelab environment
            that serves as a real-world testbed for Ceph storage clustering, Proxmox virtualization,
            high-throughput network fabrics, and secure identity management.
          </p>

          <div className="card-grid" style={{ marginTop: '2rem' }}>
            <div className="card">
              <Cpu size={24} color="var(--accent)" style={{ marginBottom: '0.5rem' }} />
              <h3 className="card-title">Core Competencies</h3>
              <p className="card-description">
                Linux Internals, Distributed Architecture, Ansible, AWS CDK, Python, TypeScript,
                Proxmox VE, Ceph, Containerization, and Observability.
              </p>
            </div>

            <div className="card">
              <Globe size={24} color="var(--accent)" style={{ marginBottom: '0.5rem' }} />
              <h3 className="card-title">Homelab Architecture</h3>
              <p className="card-description">
                Dual redundant 10Gb aggregation routing, 6-node Proxmox cluster, NVMe Ceph pools,
                and centralized FreeIPA directory services.
              </p>
            </div>

            <div className="card">
              <Award size={24} color="var(--accent)" style={{ marginBottom: '0.5rem' }} />
              <h3 className="card-title">Open Source</h3>
              <p className="card-description">
                Author and contributor to open source tooling across Python, systems automation, and
                infrastructure management on GitHub.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
