import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BountyCard } from './BountyCard';
import type { Bounty } from '@marlbro/shared/sampleData';

const bounty: Bounty = {
  id: 'b1',
  number: 42,
  title: 'Sample Bounty',
  brief: 'A sample brief description',
  payoutMarlbro: 250000,
  payoutSol: 1.5,
  maxClaims: 3,
  claimsUsed: 1,
  status: 'live',
  deadline: '2026-06-30',
  locationConstraint: 'Eiffel Tower',
};

describe('BountyCard', () => {
  it('shows grant number', () => {
    render(<BountyCard bounty={bounty} />);
    expect(screen.getByText(/№\s*42/)).toBeInTheDocument();
  });

  it('shows title', () => {
    render(<BountyCard bounty={bounty} />);
    expect(screen.getByText('Sample Bounty')).toBeInTheDocument();
  });

  it('shows payout in marlbro and sol', () => {
    render(<BountyCard bounty={bounty} />);
    expect(screen.getByText(/250,000/)).toBeInTheDocument();
    expect(screen.getByText(/1\.5/)).toBeInTheDocument();
  });

  it('shows claims left when capped', () => {
    render(<BountyCard bounty={bounty} />);
    expect(screen.getByText(/2 LEFT/i)).toBeInTheDocument();
  });

  it('shows UNLIMITED when maxClaims is null', () => {
    render(<BountyCard bounty={{ ...bounty, maxClaims: null, claimsUsed: 100 }} />);
    expect(screen.getByText(/UNLIMITED/i)).toBeInTheDocument();
  });

  it('shows EXHAUSTED when claimsUsed >= maxClaims', () => {
    render(<BountyCard bounty={{ ...bounty, claimsUsed: 3 }} />);
    expect(screen.getByText(/EXHAUSTED/i)).toBeInTheDocument();
  });

  it('shows deadline when present', () => {
    render(<BountyCard bounty={bounty} />);
    expect(screen.getByText(/2026-06-30/)).toBeInTheDocument();
  });

  it('shows location tag when present', () => {
    render(<BountyCard bounty={bounty} />);
    expect(screen.getByText('Eiffel Tower')).toBeInTheDocument();
  });

  it('links to /bounties/[number]', () => {
    render(<BountyCard bounty={bounty} />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/bounties/42');
  });
});
