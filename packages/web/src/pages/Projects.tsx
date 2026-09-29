import React, { useState, useEffect } from 'react';
import { fetchGithubProjects } from '../services/github';
import { GithubRepo } from '../services/github.types';
import { ProjectCard } from '../components/ProjectCard';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { RefreshCw, AlertCircle } from 'lucide-react';

export const Projects: React.FC = () => {
  const [projects, setProjects] = useState<GithubRepo[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isCached, setIsCached] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    const result = await fetchGithubProjects('brwyatt');
    setProjects(result.projects);
    setIsCached(result.isCached);
    setError(result.error);
    setIsLoading(false);
  };

  useEffect(() => {
    let ignore = false;
    fetchGithubProjects('brwyatt').then((result) => {
      if (!ignore) {
        setProjects(result.projects);
        setIsCached(result.isCached);
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
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div>
            <h1>Projects & Open Source</h1>
            <p>
              Featured systems tools, automation libraries, and open source projects from GitHub.
            </p>
          </div>
          <button
            onClick={loadData}
            className="btn"
            disabled={isLoading}
            style={{ marginTop: '0.5rem' }}
          >
            <RefreshCw size={16} className={isLoading ? 'spin' : ''} />
            {isLoading ? 'Updating...' : 'Refresh'}
          </button>
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

      {isCached && !error && (
        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
          Displaying cached repositories from client storage.
        </div>
      )}

      {isLoading ? (
        <LoadingSpinner message="Fetching repositories from GitHub..." />
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
