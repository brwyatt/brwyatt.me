import React, { useState, useEffect } from 'react';
import { fetchGithubProjects } from '../services/github';
import { GithubRepo } from '../services/github.types';
import { ProjectCard } from '../components/ProjectCard';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { AlertCircle } from 'lucide-react';

export const Projects: React.FC = () => {
  const [projects, setProjects] = useState<GithubRepo[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    fetchGithubProjects().then((result) => {
      if (!ignore) {
        setProjects(result.projects);
        setError(result.error);
        setIsLoading(false);
      }
    });
    return () => {
      ignore = true;
    };
  }, []);

  const sortedProjects = [...projects].sort((a, b) => {
    const aPin = a.isPinned ? 1 : 0;
    const bPin = b.isPinned ? 1 : 0;
    if (aPin !== bPin) return bPin - aPin;
    const aFeat = a.isFeatured ? 1 : 0;
    const bFeat = b.isFeatured ? 1 : 0;
    if (aFeat !== bFeat) return bFeat - aFeat;
    return (b.stargazersCount || 0) - (a.stargazersCount || 0);
  });

  return (
    <div>
      <section className="hero">
        <div>
          <h1>Projects & Open Source</h1>
          <p>Featured systems tools, automation libraries, and open source projects from GitHub.</p>
        </div>
      </section>

      {error && (
        <div
          className="notice-box"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            borderColor: 'var(--warning)',
          }}
        >
          <AlertCircle size={18} color="var(--warning)" />
          <span>{error}</span>
        </div>
      )}

      {isLoading ? (
        <LoadingSpinner message="Loading projects..." />
      ) : (
        <div className="card-grid">
          {sortedProjects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  );
};
