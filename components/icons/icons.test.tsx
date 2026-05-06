// components/icons/icons.test.tsx
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import {
  Chevron,
  CigaretteLit,
  PackOutline,
  XMark,
  SolscanMark,
  CopyMark,
  ExternalLink,
  Info,
  Warning,
  Success,
  Error,
} from './index';

const allIcons = [
  ['Chevron', Chevron],
  ['CigaretteLit', CigaretteLit],
  ['PackOutline', PackOutline],
  ['XMark', XMark],
  ['SolscanMark', SolscanMark],
  ['CopyMark', CopyMark],
  ['ExternalLink', ExternalLink],
  ['Info', Info],
  ['Warning', Warning],
  ['Success', Success],
  ['Error', Error],
] as const;

describe('icon library', () => {
  it.each(allIcons)('renders %s as svg', (_, Icon) => {
    const { container } = render(<Icon />);
    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();
  });

  it.each(allIcons)('%s uses currentColor for fill or stroke', (_, Icon) => {
    const { container } = render(<Icon />);
    const svg = container.querySelector('svg')!;
    expect(svg.outerHTML).toMatch(/currentColor/);
  });

  it.each(allIcons)('%s defaults to aria-hidden when no label given', (_, Icon) => {
    const { container } = render(<Icon />);
    const svg = container.querySelector('svg')!;
    expect(svg.getAttribute('aria-hidden')).toBe('true');
  });

  it.each(allIcons)('%s uses role="img" with aria-label when labeled', (_, Icon) => {
    const { container } = render(<Icon aria-label="test label" />);
    const svg = container.querySelector('svg')!;
    expect(svg.getAttribute('role')).toBe('img');
    expect(svg.getAttribute('aria-label')).toBe('test label');
  });
});
