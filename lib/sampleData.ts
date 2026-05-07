// lib/sampleData.ts
// Static sample data driving /bounties and /wall pre-database.
// Plan 4 swaps these with DB queries.

export type BountyStatus = 'live' | 'paused' | 'exhausted' | 'expired';

export interface Bounty {
  id: string;
  number: number;
  title: string;
  brief: string;
  payoutMarlbro: number;
  payoutSol: number;
  maxClaims: number | null;
  claimsUsed: number;
  status: BountyStatus;
  deadline: string | null;
  locationConstraint: string | null;
}

export interface PosterGrant {
  id: string;
  displayNumber: number;
  bountyNumber: number | null;
  applicantHandle: string;
  walletShort: string;
  tweetQuote: string;
  payoutMarlbro: number;
  payoutSol: number;
  paidAt: string;
}

export const SAMPLE_BOUNTIES: ReadonlyArray<Bounty> = [
  {
    id: '00000001-0000-0000-0000-000000000001',
    number: 1,
    title: 'Standard Pack Disbursement',
    brief: 'The applicant shall furnish a photographic record of the procurement of one (1) pack of Marlboro Reds and an associated post on X tagging @marlbrotoken.',
    payoutMarlbro: 5000,
    payoutSol: 0,
    maxClaims: null,
    claimsUsed: 412,
    status: 'live',
    deadline: null,
    locationConstraint: null,
  },
  {
    id: '00000001-0000-0000-0000-000000000042',
    number: 42,
    title: 'Trans-Continental Carriage Demonstration',
    brief: 'Photograph the applicant smoking a Marlbro Red at a recognised intercontinental landmark. Foundation reviewers reserve discretionary judgement.',
    payoutMarlbro: 250000,
    payoutSol: 1.5,
    maxClaims: 3,
    claimsUsed: 1,
    status: 'live',
    deadline: '2026-06-30',
    locationConstraint: 'Recognised intercontinental landmark',
  },
  {
    id: '00000001-0000-0000-0000-000000000074',
    number: 74,
    title: 'Vape Renunciation Ceremony',
    brief: 'Documented surrender of one (1) rechargeable nicotine vaporizer to a Foundation-approved disposal vessel, accompanied by ignition of one (1) Marlbro Red.',
    payoutMarlbro: 50000,
    payoutSol: 0.25,
    maxClaims: 25,
    claimsUsed: 11,
    status: 'live',
    deadline: '2026-09-30',
    locationConstraint: null,
  },
  {
    id: '00000001-0000-0000-0000-000000000091',
    number: 91,
    title: 'Generational Bridge Demonstration',
    brief: 'Photograph the applicant in the company of a relative aged 65 or older, both partaking. Subject to verification of familial relation.',
    payoutMarlbro: 75000,
    payoutSol: 0.5,
    maxClaims: 10,
    claimsUsed: 2,
    status: 'live',
    deadline: null,
    locationConstraint: null,
  },
  {
    id: '00000001-0000-0000-0000-000000000113',
    number: 113,
    title: 'Open Road Carriage',
    brief: 'A photograph of the applicant smoking a Marlbro Red at the wheel of a stationary American manufactured automobile of model year 1995 or earlier.',
    payoutMarlbro: 35000,
    payoutSol: 0,
    maxClaims: 50,
    claimsUsed: 18,
    status: 'live',
    deadline: null,
    locationConstraint: 'United States',
  },
  {
    id: '00000001-0000-0000-0000-000000000200',
    number: 200,
    title: 'Sunset Disbursement',
    brief: 'Photograph the act at golden hour. Foundation prefers natural light; supplementary illumination disqualifies.',
    payoutMarlbro: 25000,
    payoutSol: 0,
    maxClaims: null,
    claimsUsed: 47,
    status: 'live',
    deadline: null,
    locationConstraint: null,
  },
];

export const SAMPLE_POSTERS: ReadonlyArray<PosterGrant> = [
  {
    id: 'poster-001',
    displayNumber: 1,
    bountyNumber: 1,
    applicantHandle: 'degenrider',
    walletShort: '5n3X···k7p4',
    tweetQuote: "smoked one for the boys who can't anymore. lit it with the same match my grandfather used.",
    payoutMarlbro: 5000,
    payoutSol: 0,
    paidAt: '2026-04-12',
  },
  {
    id: 'poster-002',
    displayNumber: 2,
    bountyNumber: 42,
    applicantHandle: 'transcontinent',
    walletShort: '9hVa···2NBs',
    tweetQuote: 'eiffel tower at 3am. the marlbro burned slower in the cold.',
    payoutMarlbro: 250000,
    payoutSol: 1.5,
    paidAt: '2026-04-15',
  },
  {
    id: 'poster-003',
    displayNumber: 3,
    bountyNumber: 1,
    applicantHandle: 'last_real_man',
    walletShort: 'B4qP···kC1V',
    tweetQuote: 'first cigarette in 8 years. my hands remembered.',
    payoutMarlbro: 5000,
    payoutSol: 0,
    paidAt: '2026-04-20',
  },
  {
    id: 'poster-004',
    displayNumber: 4,
    bountyNumber: 74,
    applicantHandle: 'vape_quitter_4',
    walletShort: 'D7zQ···8XqA',
    tweetQuote: 'threw the elf bar in the gutter. struck the match. felt american again.',
    payoutMarlbro: 50000,
    payoutSol: 0.25,
    paidAt: '2026-04-22',
  },
  {
    id: 'poster-005',
    displayNumber: 5,
    bountyNumber: 91,
    applicantHandle: 'grandson_of_a_marine',
    walletShort: 'G3rT···Mn7P',
    tweetQuote: "pop hadn't had one in 30 years. doctor said no. doctor wasn't there.",
    payoutMarlbro: 75000,
    payoutSol: 0.5,
    paidAt: '2026-04-26',
  },
  {
    id: 'poster-006',
    displayNumber: 6,
    bountyNumber: 1,
    applicantHandle: 'corner_store_poet',
    walletShort: 'H8vQ···r2kY',
    tweetQuote: "the man behind the counter saw me buy a pack and just nodded. i've been buying gum from him for years.",
    payoutMarlbro: 5000,
    payoutSol: 0,
    paidAt: '2026-04-28',
  },
  {
    id: 'poster-007',
    displayNumber: 7,
    bountyNumber: 113,
    applicantHandle: 'el_camino_88',
    walletShort: 'J2nW···p4CR',
    tweetQuote: 'parked at the overlook. windows down. smoke went where the radio used to.',
    payoutMarlbro: 35000,
    payoutSol: 0,
    paidAt: '2026-05-01',
  },
  {
    id: 'poster-008',
    displayNumber: 8,
    bountyNumber: 200,
    applicantHandle: 'last_light_2026',
    walletShort: 'K9bF···m1ZQ',
    tweetQuote: 'caught the last light off the silo. one for me, one for the dog.',
    payoutMarlbro: 25000,
    payoutSol: 0,
    paidAt: '2026-05-04',
  },
];

export function getBountyByNumber(n: number): Bounty | undefined {
  return SAMPLE_BOUNTIES.find((b) => b.number === n);
}

export function getPosterById(id: string): PosterGrant | undefined {
  return SAMPLE_POSTERS.find((p) => p.id === id);
}
