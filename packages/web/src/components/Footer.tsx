import React from 'react';
import { Github, Linkedin, Mail } from 'lucide-react';
import { SITE_CONFIG, SOCIAL_LINKS } from '../data/site';

export const BlueskyIcon: React.FC<{ size?: number }> = ({ size = 18 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 568 501"
    fill="currentColor"
    aria-hidden="true"
    style={{ display: 'inline-block', verticalAlign: 'middle' }}
  >
    <path d="M123.121 33.664C188.241 82.552 258.281 181.68 284 234.873c25.719-53.192 95.759-152.32 160.879-201.21C491.866-1.611 568-28.906 568 57.947c0 17.346-9.945 145.713-15.778 166.555-20.275 72.453-94.155 90.933-159.875 79.748C507.222 323.8 536.444 388.56 473.333 453.32c-119.259 122.37-170.889-30.82-189.333-86.42-18.444 55.6-70.074 208.79-189.333 86.42-63.111-64.76-33.889-129.52 80.987-149.07-65.72 11.185-139.6-7.295-159.875-79.748C9.945 203.659 0 75.291 0 57.946 0-28.906 76.135-1.612 123.121 33.664Z" />
  </svg>
);

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  const getSocialIcon = (name: string) => {
    switch (name.toLowerCase()) {
      case 'github':
        return <Github size={18} />;
      case 'linkedin':
        return <Linkedin size={18} />;
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
