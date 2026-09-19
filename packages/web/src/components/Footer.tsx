import React from 'react';
import { Github, Linkedin, Mail } from 'lucide-react';

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div>&copy; {currentYear} Bryan Wyatt. All rights reserved.</div>
        <ul className="footer-links">
          <li>
            <a
              href="https://github.com/brwyatt"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub Profile"
            >
              <Github size={18} />
            </a>
          </li>
          <li>
            <a
              href="https://linkedin.com/in/brwyatt"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn Profile"
            >
              <Linkedin size={18} />
            </a>
          </li>
          <li>
            <a href="mailto:contact@brwyatt.net" aria-label="Email Bryan">
              <Mail size={18} />
            </a>
          </li>
        </ul>
      </div>
    </footer>
  );
};
