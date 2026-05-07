// components/ui/Card.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Card } from './Card';

describe('Card', () => {
  it('renders children', () => {
    render(<Card>content</Card>);
    expect(screen.getByText('content')).toBeInTheDocument();
  });

  it('applies card border and shadow by default', () => {
    render(
      <Card>
        <span>x</span>
      </Card>,
    );
    const card = screen.getByText('x').parentElement!;
    expect(card.className).toMatch(/border-4/);
    expect(card.className).toMatch(/shadow-md/);
  });

  it('uses poster border when variant="poster"', () => {
    render(
      <Card variant="poster">
        <span>x</span>
      </Card>,
    );
    const card = screen.getByText('x').parentElement!;
    expect(card.className).toMatch(/border-\[6px\]/);
    expect(card.className).toMatch(/shadow-lg/);
  });

  it('forwards arbitrary props (e.g. id)', () => {
    render(
      <Card id="grant-1">
        <span>x</span>
      </Card>,
    );
    const card = screen.getByText('x').parentElement!;
    expect(card).toHaveAttribute('id', 'grant-1');
  });
});
