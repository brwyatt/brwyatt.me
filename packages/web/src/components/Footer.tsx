import React from 'react';
import { Mail } from 'lucide-react';
import { SITE_CONFIG, SOCIAL_LINKS } from '../data/site';
import { BlueskyIcon, GithubIcon, LinkedinIcon } from './SocialIcons';

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  const getSocialIcon = (name: string) => {
    switch (name.toLowerCase()) {
      case 'github':
        return <GithubIcon size={18} />;
      case 'linkedin':
        return <LinkedinIcon size={18} />;
      case 'bluesky':
        return <BlueskyIcon size={18} />;
      default:
        return null;
    }
  };

  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div>
          &copy; {currentYear} {SITE_CONFIG.name}. All rights reserved.
        </div>
        <ul className="footer-links">
          {SOCIAL_LINKS.filter((s) =>
            ['github', 'linkedin', 'bluesky'].includes(s.name.toLowerCase()),
          ).map((link) => (
            <li key={link.name}>
              <a href={link.url} target="_blank" rel="noopener noreferrer" aria-label={link.label}>
                {getSocialIcon(link.name)}
              </a>
            </li>
          ))}
          <li>
            <a href={`mailto:${SITE_CONFIG.email}`} aria-label={`Email ${SITE_CONFIG.name}`}>
              <Mail size={18} />
            </a>
          </li>
        </ul>
      </div>
    </footer>
  );
};
