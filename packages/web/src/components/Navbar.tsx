import React from 'react';
import { NavLink } from 'react-router-dom';
import { NetworkDAGIcon } from './NetworkDAGIcon';
import { SITE_CONFIG, NAV_LINKS } from '../data/site';

export const Navbar: React.FC = () => {
  return (
    <header className="site-header">
      <div className="header-inner">
        <NavLink to="/" className="site-title">
          <NetworkDAGIcon size={24} />
          <span>{SITE_CONFIG.name}</span>
        </NavLink>
        <nav>
          <ul className="nav-links">
            {NAV_LINKS.map((link) => (
              <li key={link.path}>
                <NavLink
                  to={link.path}
                  className={({ isActive }: { isActive: boolean }) =>
                    isActive ? 'nav-link active' : 'nav-link'
                  }
                  end={link.path === '/'}
                >
                  {link.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
};
