// components/ui/LinkPrimitive.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LinkPrimitive } from './LinkPrimitive';

describe('LinkPrimitive', () => {
  it('renders an anchor with the href', () => {
    render(<LinkPrimitive href="/x">click</LinkPrimitive>);
    expect(screen.getByRole('link', { name: 'click' })).toHaveAttribute('href', '/x');
  });

  it('treats absolute http(s) links as external', () => {
    render(<LinkPrimitive href="https://example.com">x</LinkPrimitive>);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('does not set target on internal links', () => {
    render(<LinkPrimitive href="/x">x</LinkPrimitive>);
    expect(screen.getByRole('link')).not.toHaveAttribute('target');
  });

  it('applies underline + marlbro hover classes', () => {
    render(<LinkPrimitive href="/x">x</LinkPrimitive>);
    const cls = screen.getByRole('link').className;
    expect(cls).toMatch(/underline/);
    expect(cls).toMatch(/hover:text-marlbro/);
  });
});
