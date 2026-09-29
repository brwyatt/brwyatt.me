import React from 'react';
import { SITE_CONFIG, SOCIAL_LINKS } from '../data/site';
import { SocialIcon } from './SocialIcons';

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

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
                <SocialIcon name={link.name} size={18} />
              </a>
            </li>
          ))}
          <li>
            <a href={`mailto:${SITE_CONFIG.email}`} aria-label={`Email ${SITE_CONFIG.name}`}>
              <SocialIcon name="mail" size={18} />
            </a>
          </li>
        </ul>
      </div>
    </footer>
  );
};
