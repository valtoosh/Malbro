// components/ui/Input.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from './Input';

describe('Input', () => {
  it('renders an input element', () => {
    render(<Input aria-label="wallet" />);
    expect(screen.getByLabelText('wallet')).toBeInTheDocument();
  });

  it('uses mono font by default', () => {
    render(<Input aria-label="x" />);
    expect(screen.getByLabelText('x').className).toMatch(/font-mono/);
  });

  it('uses sans font when variant="prose"', () => {
    render(<Input aria-label="x" variant="prose" />);
    expect(screen.getByLabelText('x').className).toMatch(/font-sans/);
  });

  it('accepts user typing', async () => {
    const user = userEvent.setup();
    render(<Input aria-label="x" />);
    const input = screen.getByLabelText('x');
    await user.type(input, 'hello');
    expect(input).toHaveValue('hello');
  });

  it('respects disabled prop', () => {
    render(<Input aria-label="x" disabled />);
    expect(screen.getByLabelText('x')).toBeDisabled();
  });
});
