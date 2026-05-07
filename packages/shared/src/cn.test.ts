// lib/cn.test.ts
import { describe, it, expect } from 'vitest';
import { cn } from './cn';

describe('cn helper', () => {
  it('keeps both text-color and text-size utilities (custom tokens)', () => {
    const result = cn('text-paper', 'text-eyebrow');
    expect(result).toContain('text-paper');
    expect(result).toContain('text-eyebrow');
  });

  it('keeps text-color and font-size when interleaved with other classes', () => {
    const result = cn('font-mono', 'text-marlbro', 'uppercase', 'text-body-s');
    expect(result).toContain('text-marlbro');
    expect(result).toContain('text-body-s');
  });

  it('still merges actual conflicts (e.g., bg-X overrides bg-Y)', () => {
    const result = cn('bg-paper', 'bg-marlbro');
    expect(result).not.toContain('bg-paper');
    expect(result).toContain('bg-marlbro');
  });

  it('still merges duplicate text-color (later wins)', () => {
    const result = cn('text-paper', 'text-marlbro');
    expect(result).not.toContain('text-paper');
    expect(result).toContain('text-marlbro');
  });

  it('still merges duplicate font-size (later wins)', () => {
    const result = cn('text-eyebrow', 'text-d1');
    expect(result).not.toContain('text-eyebrow');
    expect(result).toContain('text-d1');
  });

  it('handles undefined / falsy inputs', () => {
    const result = cn('text-paper', undefined, false, null, 'font-mono');
    expect(result).toContain('text-paper');
    expect(result).toContain('font-mono');
  });
});
