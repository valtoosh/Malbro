// components/ui/Tag.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Tag } from './Tag';

describe('Tag', () => {
  it('renders children in uppercase mono', () => {
    render(<Tag>new account</Tag>);
    const tag = screen.getByText(/new account/i);
    expect(tag.className).toMatch(/font-mono/);
    expect(tag.className).toMatch(/uppercase/);
  });

  it('uses paper bg with ink border by default', () => {
    render(<Tag>x</Tag>);
    const tag = screen.getByText('x');
    expect(tag.className).toMatch(/bg-paper/);
    expect(tag.className).toMatch(/border-ink/);
  });

  it('uses red theme when variant="alert"', () => {
    render(<Tag variant="alert">x</Tag>);
    const tag = screen.getByText('x');
    expect(tag.className).toMatch(/bg-marlbro/);
    expect(tag.className).toMatch(/text-paper/);
  });
});
