import { eq, desc } from 'drizzle-orm';
import { approvedGrants, submissions, type ApprovedGrant, type NewApprovedGrant } from '../schema';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = any;

export async function createApprovedGrant(db: Db, input: NewApprovedGrant): Promise<ApprovedGrant> {
  const [row] = await db.insert(approvedGrants).values(input).returning();
  return row;
}

export async function getApprovedGrantById(db: Db, id: string): Promise<ApprovedGrant | undefined> {
  const [row] = await db.select().from(approvedGrants).where(eq(approvedGrants.id, id)).limit(1);
  return row;
}

export async function listExecutedGrants(db: Db, opts: { limit?: number; offset?: number } = {}): Promise<ApprovedGrant[]> {
  return db
    .select()
    .from(approvedGrants)
    .where(eq(approvedGrants.payoutStatus, 'executed'))
    .orderBy(desc(approvedGrants.displayNumber))
    .limit(opts.limit ?? 100)
    .offset(opts.offset ?? 0);
}

export async function setProposalPubkey(db: Db, id: string, pubkey: string): Promise<void> {
  await db
    .update(approvedGrants)
    .set({ squadsProposalPubkey: pubkey, payoutStatus: 'proposed' })
    .where(eq(approvedGrants.id, id));
}

export async function markExecuted(db: Db, id: string, txSignature: string): Promise<ApprovedGrant | undefined> {
  const [row] = await db
    .update(approvedGrants)
    .set({ payoutStatus: 'executed', payoutTxSignature: txSignature, paidAt: new Date() })
    .where(eq(approvedGrants.id, id))
    .returning();
  return row;
}

export interface PosterView {
  id: string;
  displayNumber: number;
  bountyNumber: number | null;
  applicantHandle: string;
  walletShort: string;
  tweetQuote: string;  // For sample, derive from notes or use tweetUrl
  payoutMarlbro: number;
  payoutSol: number;
  paidAt: string;
}

export async function listExecutedAsPosters(db: Db, opts: { limit?: number; offset?: number } = {}): Promise<PosterView[]> {
  const rows = await db
    .select({
      grant: approvedGrants,
      submission: submissions,
    })
    .from(approvedGrants)
    .innerJoin(submissions, eq(approvedGrants.submissionId, submissions.id))
    .where(eq(approvedGrants.payoutStatus, 'executed'))
    .orderBy(desc(approvedGrants.displayNumber))
    .limit(opts.limit ?? 100)
    .offset(opts.offset ?? 0);

  return rows.map((r: { grant: ApprovedGrant; submission: typeof submissions.$inferSelect }) => ({
    id: r.grant.id,
    displayNumber: r.grant.displayNumber,
    bountyNumber: null, // bountyId mapped to bounty.number is a separate query; v1 leaves null
    applicantHandle: r.submission.applicantTwitterHandle,
    walletShort: shortenWallet(r.submission.applicantWalletAddress),
    tweetQuote: r.submission.notes ?? `Filing ${r.submission.publicUid.slice(0, 8)}`,
    payoutMarlbro: Number(r.grant.payoutMarlbro),
    payoutSol: Number(r.grant.payoutSol),
    paidAt: (r.grant.paidAt ?? r.grant.approvedAt).toISOString().slice(0, 10),
  }));
}

function shortenWallet(addr: string): string {
  if (addr.length < 12) return addr;
  return `${addr.slice(0, 4)}···${addr.slice(-4)}`;
}

export async function getPosterViewById(db: Db, id: string): Promise<PosterView | undefined> {
  const list = await db
    .select({ grant: approvedGrants, submission: submissions })
    .from(approvedGrants)
    .innerJoin(submissions, eq(approvedGrants.submissionId, submissions.id))
    .where(eq(approvedGrants.id, id))
    .limit(1);
  if (list.length === 0) return undefined;
  const r = list[0]!;
  return {
    id: r.grant.id,
    displayNumber: r.grant.displayNumber,
    bountyNumber: null,
    applicantHandle: r.submission.applicantTwitterHandle,
    walletShort: shortenWallet(r.submission.applicantWalletAddress),
    tweetQuote: r.submission.notes ?? `Filing ${r.submission.publicUid.slice(0, 8)}`,
    payoutMarlbro: Number(r.grant.payoutMarlbro),
    payoutSol: Number(r.grant.payoutSol),
    paidAt: (r.grant.paidAt ?? r.grant.approvedAt).toISOString().slice(0, 10),
  };
}
