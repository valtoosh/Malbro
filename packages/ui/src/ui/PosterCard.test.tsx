import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PosterCard } from './PosterCard';

const sample = {
  displayNumber: 42,
  paidAt: '2026-05-06',
  tweetQuote: 'a sample quote',
  payoutMarlbro: 5000,
  payoutSol: 0,
  walletShort: '5n3X···k7p4',
  applicantHandle: 'degenrider',
};

describe('PosterCard', () => {
  it('renders the grant number with a # prefix', () => {
    render(<PosterCard {...sample} />);
    expect(screen.getByText(/№\s*42/)).toBeInTheDocument();
  });

  it('renders the date', () => {
    render(<PosterCard {...sample} />);
    expect(screen.getByText('2026-05-06')).toBeInTheDocument();
  });

  it('renders the tweet quote', () => {
    render(<PosterCard {...sample} />);
    expect(screen.getByText('a sample quote', { exact: false })).toBeInTheDocument();
  });

  it('renders the payout in $MARLBRO with comma formatting', () => {
    render(<PosterCard {...sample} payoutMarlbro={250000} />);
    expect(screen.getByText(/250,000/)).toBeInTheDocument();
  });

  it('shows SOL when payoutSol > 0', () => {
    render(<PosterCard {...sample} payoutSol={1.5} />);
    expect(screen.getByText(/1\.5/)).toBeInTheDocument();
    expect(screen.getByText(/SOL/)).toBeInTheDocument();
  });

  it('does not show SOL when payoutSol is 0', () => {
    render(<PosterCard {...sample} payoutSol={0} />);
    expect(screen.queryByText(/SOL/)).toBeNull();
  });

  it('renders the wallet short', () => {
    render(<PosterCard {...sample} />);
    expect(screen.getByText(/5n3X···k7p4/)).toBeInTheDocument();
  });

  it('renders the applicant handle prefixed with @', () => {
    render(<PosterCard {...sample} />);
    expect(screen.getByText('@degenrider')).toBeInTheDocument();
  });

  it('renders the OFFICIALLY DISBURSED stamp', () => {
    render(<PosterCard {...sample} />);
    expect(screen.getByText(/OFFICIALLY DISBURSED/i)).toBeInTheDocument();
  });
});
