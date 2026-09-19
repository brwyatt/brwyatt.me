import React from 'react';
import { NavLink } from 'react-router-dom';
import { Terminal } from 'lucide-react';

export const Navbar: React.FC = () => {
  return (
    <header className="site-header">
      <div className="header-inner">
        <NavLink to="/" className="site-title">
          <Terminal size={20} color="var(--accent)" />
          <span>Bryan Wyatt</span>
        </NavLink>
        <nav>
          <ul className="nav-links">
            <li>
              <NavLink
                to="/"
                className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
                end
              >
                Home
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/about"
                className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
              >
                About
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/projects"
                className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
              >
                Projects
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/contact"
                className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
              >
                Contact
              </NavLink>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
};
