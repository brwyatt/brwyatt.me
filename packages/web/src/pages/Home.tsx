import React from 'react';
import { Link } from 'react-router-dom';
import { Server, Terminal, Shield, ArrowRight } from 'lucide-react';

export const Home: React.FC = () => {
  return (
    <div>
      <section className="hero">
        <h1>Bryan Wyatt</h1>
        <p>
          Systems Development Engineer specializing in Linux systems, distributed automation, and
          high-reliability infrastructure.
        </p>
        <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem' }}>
          <Link to="/projects" className="btn btn-primary">
            Explore Projects <ArrowRight size={16} />
          </Link>
          <Link to="/about" className="btn">
            About Me
          </Link>
        </div>
      </section>

      <section>
        <h2 className="section-title">Focus Areas</h2>
        <div className="card-grid">
          <div className="card">
            <Server size={28} color="var(--accent)" style={{ marginBottom: '0.75rem' }} />
            <h3 className="card-title">Distributed Systems & Automation</h3>
            <p className="card-description">
              Building resilient orchestration tooling, automated media processing pipelines
              (dffmpeg), and declarative infrastructure.
            </p>
          </div>

          <div className="card">
            <Terminal size={28} color="var(--accent)" style={{ marginBottom: '0.75rem' }} />
            <h3 className="card-title">Linux & Cloud Architecture</h3>
            <p className="card-description">
              Deep expertise in Linux kernel tuning, high-performance networking, AWS serverless
              services, and modern Infrastructure-as-Code with AWS CDK.
            </p>
          </div>

          <div className="card">
            <Shield size={28} color="var(--accent)" style={{ marginBottom: '0.75rem' }} />
            <h3 className="card-title">High-Availability Homelab</h3>
            <p className="card-description">
              Hyper-converged 6-node Proxmox VE cluster, multi-gigabit Ceph storage fabrics, FreeIPA
              identity federation, and automated operations.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
