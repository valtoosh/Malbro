// components/ui/Footnote.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Footnote } from './Footnote';

describe('Footnote', () => {
  it('renders a superscript', () => {
    render(<Footnote n={3} />);
    const sup = screen.getByText(/³/, { selector: 'sup, sup *' });
    expect(sup).toBeInTheDocument();
  });

  it('uses superscript characters for 1-9', () => {
    const { container, rerender } = render(<Footnote n={1} />);
    expect(container.textContent).toBe('¹');
    rerender(<Footnote n={9} />);
    expect(container.textContent).toBe('⁹');
  });

  it('falls back to digits with parens for n > 9', () => {
    const { container } = render(<Footnote n={12} />);
    expect(container.textContent).toContain('(12)');
  });

  it('links to the footnote anchor', () => {
    render(<Footnote n={4} />);
    expect(screen.getByRole('link')).toHaveAttribute('href', '#fn-4');
  });
});
