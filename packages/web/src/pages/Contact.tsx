import React from 'react';
import { Mail, Github, Linkedin, Key } from 'lucide-react';

export const Contact: React.FC = () => {
  return (
    <div>
      <section className="hero">
        <h1>Get in Touch</h1>
        <p>Feel free to reach out for collaboration, technical discussions, or inquiries.</p>
      </section>

      <div className="card-grid">
        <div className="card">
          <Mail size={24} color="var(--accent)" style={{ marginBottom: '0.5rem' }} />
          <h3 className="card-title">Email</h3>
          <p className="card-description">
            For direct inquiries or communication.
          </p>
          <a href="mailto:contact@brwyatt.me">contact@brwyatt.me</a>
        </div>

        <div className="card">
          <Github size={24} color="var(--accent)" style={{ marginBottom: '0.5rem' }} />
          <h3 className="card-title">GitHub</h3>
          <p className="card-description">
            Check out open source projects and code repositories.
          </p>
          <a href="https://github.com/brwyatt" target="_blank" rel="noopener noreferrer">
            github.com/brwyatt
          </a>
        </div>

        <div className="card">
          <Linkedin size={24} color="var(--accent)" style={{ marginBottom: '0.5rem' }} />
          <h3 className="card-title">LinkedIn</h3>
          <p className="card-description">
            Professional background and networking.
          </p>
          <a href="https://linkedin.com/in/brwyatt" target="_blank" rel="noopener noreferrer">
            linkedin.com/in/brwyatt
          </a>
        </div>

        <div className="card">
          <Key size={24} color="var(--accent)" style={{ marginBottom: '0.5rem' }} />
          <h3 className="card-title">Public Key / PGP</h3>
          <p className="card-description">
            Cryptographic verification and secure communications.
          </p>
          <a href="https://keybase.io/brwyatt" target="_blank" rel="noopener noreferrer">
            keybase.io/brwyatt
          </a>
        </div>
      </div>
    </div>
  );
};
