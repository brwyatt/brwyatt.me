import React from 'react';
import { GithubRepo } from '../services/github.types';
import { ExternalLink, Star, GitFork, Code, Globe, Pin } from 'lucide-react';

interface ProjectCardProps {
  project: GithubRepo;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ project }) => {
  const isGithub = project.htmlUrl?.includes('github.com');
  const hasDistinctHomepage = Boolean(
    project.homepage &&
    project.htmlUrl &&
    project.homepage.replace(/\/+$/, '') !== project.htmlUrl.replace(/\/+$/, ''),
  );

  return (
    <div className="card" data-testid="project-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
            <h3 className="card-title" style={{ margin: 0 }}>
              <a href={project.htmlUrl} target="_blank" rel="noopener noreferrer">
                {project.name}
              </a>
            </h3>
            {project.isPinned && (
              <span
                className="tag"
                style={{
                  backgroundColor: 'rgba(99, 102, 241, 0.15)',
                  color: 'var(--accent)',
                  borderColor: 'var(--accent)',
                  fontSize: '0.75rem',
                  padding: '0.1rem 0.4rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.2rem',
                }}
                title="Pinned Project"
              >
                <Pin size={12} /> Pinned
              </span>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
          {hasDistinctHomepage && (
            <a
              href={project.homepage!}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Visit ${project.name} live website`}
              title="Live site"
              style={{ color: 'var(--accent)', display: 'inline-flex', alignItems: 'center' }}
            >
              <Globe size={16} />
            </a>
          )}
          <a
            href={project.htmlUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={isGithub ? `View ${project.name} on GitHub` : `View ${project.name}`}
            title={isGithub ? 'GitHub repository' : 'External link'}
            style={{ color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center' }}
          >
            <ExternalLink size={16} />
          </a>
        </div>
      </div>

      <p className="card-description">{project.description || 'No description provided.'}</p>

      {project.topics && project.topics.length > 0 && (
        <div className="tag-list">
          {project.topics.map((topic) => (
            <span key={topic} className="tag">
              {topic}
            </span>
          ))}
        </div>
      )}

      <div className="card-footer">
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
          <Code size={14} />
          {project.language || 'Plain Text'}
        </span>

        <div style={{ display: 'flex', gap: '0.8rem' }}>
          {project.stargazersCount > 0 && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
              <Star size={14} /> {project.stargazersCount}
            </span>
          )}
          {project.forksCount > 0 && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
              <GitFork size={14} /> {project.forksCount}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
