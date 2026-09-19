import React from 'react';
import { Link } from 'react-router-dom';
import { Server, Terminal, Shield, ArrowRight } from 'lucide-react';
import { SITE_CONFIG } from '../data/site';
import { FOCUS_AREAS, FocusArea } from '../data/focusAreas';
import { InfoCard } from '../components/InfoCard';

const ICON_MAP: Record<FocusArea['icon'], React.ReactNode> = {
  server: <Server size={28} color="var(--accent)" />,
  terminal: <Terminal size={28} color="var(--accent)" />,
  shield: <Shield size={28} color="var(--accent)" />,
};

export const Home: React.FC = () => {
  return (
    <div>
      <section className="hero">
        <h1>{SITE_CONFIG.name}</h1>
        <p>{SITE_CONFIG.tagline}</p>
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
          {FOCUS_AREAS.map((area) => (
            <InfoCard
              key={area.id}
              title={area.title}
              description={area.description}
              icon={ICON_MAP[area.icon]}
            />
          ))}
        </div>
      </section>
    </div>
  );
};
