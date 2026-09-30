import React from 'react';
import { Cpu, Globe, Award, Box, Gamepad2, Cat } from 'lucide-react';
import { ABOUT_HIGHLIGHTS, AboutHighlight } from '../data/aboutHighlights';
import { InfoCard } from '../components/InfoCard';

const ICON_MAP: Record<AboutHighlight['icon'], React.ReactNode> = {
  cpu: <Cpu size={24} color="var(--accent)" />,
  globe: <Globe size={24} color="var(--accent)" />,
  award: <Award size={24} color="var(--accent)" />,
  box: <Box size={24} color="var(--accent)" />,
  gamepad: <Gamepad2 size={24} color="var(--accent)" />,
  cat: <Cat size={24} color="var(--accent)" />,
};

export const About: React.FC = () => {
  return (
    <div>
      <section className="hero">
        <h1>About Me</h1>
        <p>Systems Development Engineer, Linux Platform Enthusiast, & Full-Time Cat Staff.</p>
      </section>

      <div>
        <h2 className="section-title">Background & Philosophy</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
          I am a Systems Development Engineer focused on infrastructure automation, Linux platform
          engineering, and distributed computing. I design systems with an emphasis on reliability,
          observability, and declarative management, guided by curiosity and a drive to reduce
          cognitive load.
        </p>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
          When I step away from the terminal, I spend my time designing 3D-printed functional parts,
          diving into virtual reality narratives and rhythm games, occasionally venturing back out
          onto Washington's hiking trails, or just hanging out with my cat, Kaylee.
        </p>

        <div className="card-grid" style={{ marginTop: '2rem' }}>
          {ABOUT_HIGHLIGHTS.map((highlight) => (
            <InfoCard
              key={highlight.id}
              title={highlight.title}
              description={highlight.description}
              icon={ICON_MAP[highlight.icon]}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
