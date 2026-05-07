// db/queries/submissions.ts
import { eq, desc } from 'drizzle-orm';
import { submissions, type Submission, type NewSubmission } from '../schema';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = any;

export async function createSubmission(db: Db, input: NewSubmission): Promise<Submission> {
  const [row] = await db.insert(submissions).values(input).returning();
  return row;
}

export async function getSubmissionByPublicUid(db: Db, uid: string): Promise<Submission | undefined> {
  const [row] = await db.select().from(submissions).where(eq(submissions.publicUid, uid)).limit(1);
  return row;
}

export async function listPendingSubmissions(db: Db, opts: { limit?: number; offset?: number } = {}): Promise<Submission[]> {
  return db
    .select()
    .from(submissions)
    .where(eq(submissions.status, 'review_ready'))
    .orderBy(desc(submissions.createdAt))
    .limit(opts.limit ?? 50)
    .offset(opts.offset ?? 0);
}

export interface ParsedTweet {
  tweetId: string;
  authorHandle: string;
}

const TWEET_URL_RE = /^https?:\/\/(?:www\.)?(?:twitter\.com|x\.com)\/([A-Za-z0-9_]{1,15})\/status\/(\d{5,30})/;

export function parseTweetUrl(url: string): ParsedTweet {
  const m = url.match(TWEET_URL_RE);
  if (!m) throw new Error('Tweet URL must be a valid x.com or twitter.com status link');
  return { authorHandle: m[1]!, tweetId: m[2]! };
}
