import React from 'react';
import { SITE_CONFIG, SOCIAL_LINKS } from '../data/site';
import { InfoCard } from '../components/InfoCard';
import { SocialIcon } from '../components/SocialIcons';

export const Contact: React.FC = () => {
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
          icon={<SocialIcon name="mail" size={24} color="var(--accent)" />}
          link={{ href: `mailto:${SITE_CONFIG.email}`, label: SITE_CONFIG.email }}
        />

        {/* Social / Platform Cards */}
        {SOCIAL_LINKS.map((item) => (
          <InfoCard
            key={item.name}
            title={item.name}
            description={`Connect via ${item.name}.`}
            icon={<SocialIcon name={item.name} size={24} color="var(--accent)" />}
            link={{ href: item.url, label: item.url.replace(/^https?:\/\//, ''), isExternal: true }}
          />
        ))}

        {/* GPG / WKD Key Card */}
        <InfoCard
          title="OpenPGP Key"
          description="My public GPG key (discoverable via WKD)"
          icon={<SocialIcon name="key" size={24} color="var(--accent)" />}
          link={{
            href: SITE_CONFIG.gpg.wkdPath,
            label: SITE_CONFIG.gpg.fingerprint,
            isExternal: false,
          }}
        ></InfoCard>
      </div>
    </div>
  );
};
