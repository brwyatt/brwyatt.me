import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { Navbar } from '../Navbar';

describe('Navbar', () => {
  it('renders navigation links', () => {
    render(
      <BrowserRouter>
        <Navbar />
      </BrowserRouter>,
    );

    expect(screen.getByText('Bryan Wyatt')).toBeInTheDocument();
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('About')).toBeInTheDocument();
    expect(screen.getByText('Projects')).toBeInTheDocument();
    expect(screen.getByText('Contact')).toBeInTheDocument();
  });
});
