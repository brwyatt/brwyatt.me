import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ProjectCard } from '../ProjectCard';
import { GithubRepo } from '../../services/github.types';

describe('ProjectCard', () => {
  const sampleProject: GithubRepo = {
    id: 1,
    name: 'dffmpeg',
    fullName: 'brwyatt/dffmpeg',
    description: 'Distributed FFmpeg video transcoding',
    htmlUrl: 'https://github.com/brwyatt/dffmpeg',
    homepage: null,
    language: 'Python',
    stargazersCount: 15,
    forksCount: 3,
    isFork: false,
    isArchived: false,
    updatedAt: '2026-01-01T00:00:00Z',
    topics: ['ffmpeg', 'distributed'],
  };

  it('renders project title, description, and language', () => {
    render(<ProjectCard project={sampleProject} />);

    expect(screen.getByText('dffmpeg')).toBeInTheDocument();
    expect(screen.getByText('Distributed FFmpeg video transcoding')).toBeInTheDocument();
    expect(screen.getByText('Python')).toBeInTheDocument();
  });

  it('renders topics as tags', () => {
    render(<ProjectCard project={sampleProject} />);

    expect(screen.getByText('ffmpeg')).toBeInTheDocument();
    expect(screen.getByText('distributed')).toBeInTheDocument();
  });
});
