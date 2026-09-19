import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { InfoCard } from '../InfoCard';

describe('InfoCard', () => {
  it('renders title and description', () => {
    render(<InfoCard title="Test Title" description="Test Description" />);

    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test Description')).toBeInTheDocument();
  });

  it('renders link if provided', () => {
    render(
      <InfoCard
        title="Linked Card"
        link={{ href: 'https://example.com', label: 'Visit Site', isExternal: true }}
      />,
    );

    const linkEl = screen.getByRole('link', { name: 'Visit Site' });
    expect(linkEl).toHaveAttribute('href', 'https://example.com');
    expect(linkEl).toHaveAttribute('target', '_blank');
  });
});
