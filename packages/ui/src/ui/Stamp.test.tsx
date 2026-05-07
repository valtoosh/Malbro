// components/ui/Stamp.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Stamp } from './Stamp';

describe('Stamp', () => {
  it('renders the label', () => {
    render(<Stamp label="OFFICIALLY DISBURSED" />);
    expect(screen.getByText('OFFICIALLY DISBURSED')).toBeInTheDocument();
  });

  it('uses stamp-red color and stamp-red border by default', () => {
    render(<Stamp label="PAID" />);
    const stamp = screen.getByText('PAID').parentElement!;
    expect(stamp.className).toMatch(/text-stamp-red/);
    expect(stamp.className).toMatch(/border-stamp-red/);
  });

  it('applies rotation via inline style from rotate prop', () => {
    render(<Stamp label="VOID" rotate={-15} />);
    const stamp = screen.getByText('VOID').parentElement!;
    expect(stamp.style.transform).toContain('rotate(-15deg)');
  });

  it('defaults to -12deg rotation', () => {
    render(<Stamp label="DRAFT" />);
    const stamp = screen.getByText('DRAFT').parentElement!;
    expect(stamp.style.transform).toContain('rotate(-12deg)');
  });

  it('uses ink color when variant="ink"', () => {
    render(<Stamp label="X" variant="ink" />);
    const stamp = screen.getByText('X').parentElement!;
    expect(stamp.className).toMatch(/text-ink/);
    expect(stamp.className).toMatch(/border-ink/);
  });
});
