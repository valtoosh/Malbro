// components/ui/Button.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './Button';

describe('Button', () => {
  it('renders children', () => {
    render(<Button>Apply for grant</Button>);
    expect(screen.getByRole('button', { name: 'Apply for grant' })).toBeInTheDocument();
  });

  it('applies primary variant classes by default', () => {
    render(<Button>x</Button>);
    const btn = screen.getByRole('button');
    expect(btn.className).toMatch(/bg-marlbro/);
    expect(btn.className).toMatch(/text-paper/);
    expect(btn.className).toMatch(/border-4/);
  });

  it('applies ghost variant classes when variant="ghost"', () => {
    render(<Button variant="ghost">x</Button>);
    const btn = screen.getByRole('button');
    expect(btn.className).toMatch(/bg-paper/);
    expect(btn.className).toMatch(/text-ink/);
  });

  it('calls onClick when clicked', async () => {
    const user = userEvent.setup();
    let clicked = false;
    render(<Button onClick={() => (clicked = true)}>x</Button>);
    await user.click(screen.getByRole('button'));
    expect(clicked).toBe(true);
  });

  it('respects disabled prop', () => {
    render(<Button disabled>x</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('forwards type prop', () => {
    render(<Button type="submit">x</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');
  });
});
