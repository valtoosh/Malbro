import { describe, it, expect } from 'vitest';
import { SAMPLE_BOUNTIES, SAMPLE_POSTERS, getBountyByNumber, getPosterById } from './sampleData';

describe('sampleData', () => {
  it('exposes a non-empty list of bounties', () => {
    expect(SAMPLE_BOUNTIES.length).toBeGreaterThanOrEqual(4);
  });

  it('exposes a non-empty list of wall posters', () => {
    expect(SAMPLE_POSTERS.length).toBeGreaterThanOrEqual(5);
  });

  it('every bounty has a unique number', () => {
    const numbers = SAMPLE_BOUNTIES.map((b) => b.number);
    expect(new Set(numbers).size).toBe(numbers.length);
  });

  it('every poster has a unique displayNumber', () => {
    const ns = SAMPLE_POSTERS.map((p) => p.displayNumber);
    expect(new Set(ns).size).toBe(ns.length);
  });

  it('getBountyByNumber returns the matching bounty', () => {
    const first = SAMPLE_BOUNTIES[0]!;
    expect(getBountyByNumber(first.number)).toEqual(first);
  });

  it('getBountyByNumber returns undefined for unknown number', () => {
    expect(getBountyByNumber(99999)).toBeUndefined();
  });

  it('getPosterById returns the matching poster', () => {
    const p = SAMPLE_POSTERS[0]!;
    expect(getPosterById(p.id)).toEqual(p);
  });
});
