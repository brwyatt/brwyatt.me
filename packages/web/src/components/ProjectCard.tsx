import React from 'react';
import { GithubRepo } from '../services/github.types';
import { ExternalLink, Star, GitFork, Code } from 'lucide-react';

interface ProjectCardProps {
  project: GithubRepo;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ project }) => {
  return (
    <div className="card" data-testid="project-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <h3 className="card-title">
          <a href={project.htmlUrl} target="_blank" rel="noopener noreferrer">
            {project.name}
          </a>
        </h3>
        <a
          href={project.htmlUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`View ${project.name} on GitHub`}
          style={{ color: 'var(--text-muted)' }}
        >
          <ExternalLink size={16} />
        </a>
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
