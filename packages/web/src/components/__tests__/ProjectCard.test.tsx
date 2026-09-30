import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ProjectCard } from '../ProjectCard';
import { GithubRepo } from '../../services/github.types';

const mockProject: GithubRepo = {
  id: 1,
  name: 'test-repo',
  fullName: 'brwyatt/test-repo',
  description: 'A test repository',
  htmlUrl: 'https://github.com/brwyatt/test-repo',
  homepage: null,
  language: 'TypeScript',
  stargazersCount: 42,
  forksCount: 5,
  isFork: false,
  isArchived: false,
  updatedAt: '2026-03-01T00:00:00Z',
  topics: ['react', 'testing'],
};

describe('ProjectCard', () => {
  it('renders project details correctly', () => {
    render(<ProjectCard project={mockProject} />);

    expect(screen.getByText('test-repo')).toBeInTheDocument();
    expect(screen.getByText('A test repository')).toBeInTheDocument();
    expect(screen.getByText('TypeScript')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('react')).toBeInTheDocument();
    expect(screen.getByText('testing')).toBeInTheDocument();
  });

  it('renders fallback when description is missing', () => {
    const projectWithoutDesc = { ...mockProject, description: null };
    render(<ProjectCard project={projectWithoutDesc} />);

    expect(screen.getByText('No description provided.')).toBeInTheDocument();
  });

  it('renders live website link when distinct homepage is present', () => {
    const projectWithHomepage: GithubRepo = {
      ...mockProject,
      name: 'brwyatt.me',
      homepage: 'https://brwyatt.me',
    };
    render(<ProjectCard project={projectWithHomepage} />);

    const liveSiteLink = screen.getByRole('link', { name: /visit brwyatt\.me live website/i });
    expect(liveSiteLink).toBeInTheDocument();
    expect(liveSiteLink).toHaveAttribute('href', 'https://brwyatt.me');
  });

  it('does not render duplicate globe when homepage matches htmlUrl', () => {
    const nonGithubProject: GithubRepo = {
      ...mockProject,
      name: 'Functional 3D Prints & Models',
      htmlUrl: 'https://makerworld.com/en/@brwyatt',
      homepage: 'https://makerworld.com/en/@brwyatt',
    };
    render(<ProjectCard project={nonGithubProject} />);

    expect(screen.queryByRole('link', { name: /live website/i })).not.toBeInTheDocument();
    const externalLink = screen.getByRole('link', { name: /view functional 3d prints & models/i });
    expect(externalLink).toBeInTheDocument();
    expect(externalLink).toHaveAttribute('href', 'https://makerworld.com/en/@brwyatt');
  });

  it('renders pinned badge when isPinned is true', () => {
    const pinnedProject: GithubRepo = {
      ...mockProject,
      isPinned: true,
    };
    render(<ProjectCard project={pinnedProject} />);

    expect(screen.getByText('Pinned')).toBeInTheDocument();
  });
});
