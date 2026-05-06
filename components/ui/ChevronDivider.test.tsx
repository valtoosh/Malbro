// components/ui/ChevronDivider.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ChevronDivider } from './ChevronDivider';

describe('ChevronDivider', () => {
  it('renders an svg', () => {
    render(<ChevronDivider data-testid="chevron" />);
    expect(screen.getByTestId('chevron').tagName.toLowerCase()).toBe('svg');
  });

  it('uses ink fill by default', () => {
    render(<ChevronDivider data-testid="x" />);
    const svg = screen.getByTestId('x');
    const cls = (svg.getAttribute('class') ?? '');
    expect(cls).toMatch(/fill-ink/);
  });

  it('uses marlbro fill when variant="red"', () => {
    render(<ChevronDivider variant="red" data-testid="x" />);
    const svg = screen.getByTestId('x');
    const cls = (svg.getAttribute('class') ?? '');
    expect(cls).toMatch(/fill-marlbro/);
  });

  it('renders with explicit aria-hidden', () => {
    render(<ChevronDivider data-testid="x" />);
    expect(screen.getByTestId('x')).toHaveAttribute('aria-hidden', 'true');
  });
});
