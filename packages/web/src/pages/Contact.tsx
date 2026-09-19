import React from 'react';
import { Mail, Key, Globe, Github, Linkedin, Gamepad2 } from 'lucide-react';
import { SITE_CONFIG, SOCIAL_LINKS } from '../data/site';
import { InfoCard } from '../components/InfoCard';
import { BlueskyIcon } from '../components/Footer';

export const Contact: React.FC = () => {
  const getSocialIcon = (name: string) => {
    switch (name.toLowerCase()) {
      case 'github':
        return <Github size={24} color="var(--accent)" />;
      case 'linkedin':
        return <Linkedin size={24} color="var(--accent)" />;
      case 'bluesky':
        return <BlueskyIcon size={24} />;
      case 'steam':
        return <Gamepad2 size={24} color="var(--accent)" />;
      default:
        return <Globe size={24} color="var(--accent)" />;
    }
  };
  return (
    <div>
      <section className="hero">
        <h1>Get in Touch</h1>
        <p>Feel free to reach out for collaboration, technical discussions, or inquiries.</p>
      </section>

      <div className="card-grid">
        {/* Email Card */}
        <InfoCard
          title="Email"
          description="For direct inquiries or communication."
          icon={<Mail size={24} color="var(--accent)" />}
          link={{ href: `mailto:${SITE_CONFIG.email}`, label: SITE_CONFIG.email }}
        />

        {/* Social / Platform Cards */}
        {SOCIAL_LINKS.map((item) => (
          <InfoCard
            key={item.name}
            title={item.name}
            description={`Connect via ${item.name}.`}
            icon={getSocialIcon(item.name)}
            link={{ href: item.url, label: item.url.replace(/^https?:\/\//, ''), isExternal: true }}
          />
        ))}

        {/* GPG / WKD Key Card */}
        <InfoCard
          title="OpenPGP / WKD Key"
          description="My public GPG key is published for cryptographic verification and is discoverable via OpenPGP Web Key Directory (WKD)."
          icon={<Key size={24} color="var(--accent)" />}
        >
          <div
            style={{
              marginTop: '0.75rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
            }}
          >
            <a href={SITE_CONFIG.gpg.wkdPath} target="_blank" rel="noopener noreferrer">
              Direct Key Download (WKD)
            </a>
            <a href={SITE_CONFIG.gpg.keybaseUrl} target="_blank" rel="noopener noreferrer">
              View Key on Keybase
            </a>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
              Fingerprint:
              <br />
              <code style={{ fontSize: '0.75rem', color: 'var(--accent)' }}>
                {SITE_CONFIG.gpg.fingerprint}
              </code>
            </div>
          </div>
        </InfoCard>
      </div>
    </div>
  );
};
