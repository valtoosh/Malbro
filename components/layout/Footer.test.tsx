// components/layout/Footer.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Footer } from './Footer';

describe('Footer', () => {
  it('shows schedule reference', () => {
    render(<Footer />);
    expect(screen.getByText(/Schedule R-7/i)).toBeInTheDocument();
  });

  it('shows the not-financial-advice disclaimer', () => {
    render(<Footer />);
    expect(screen.getByText(/NOT FINANCIAL ADVICE/i)).toBeInTheDocument();
  });

  it('uses ink background and paper text', () => {
    render(<Footer data-testid="footer" />);
    const footer = screen.getByTestId('footer');
    expect(footer.className).toMatch(/bg-ink/);
    expect(footer.className).toMatch(/text-paper/);
  });
});
