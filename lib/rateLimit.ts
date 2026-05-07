import { and, eq, gt, sql } from 'drizzle-orm';
import { rateLimitEvents } from '@/db/schema';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = any;

export interface RateCheckResult {
  ok: boolean;
  errorCode?: string;
  retryAfter?: Date;
}

const DEFAULTS = {
  walletCooldownDays: 7,
  twitterCooldownDays: 7,
  ipPerDay: 5,
};

export async function checkRateLimits(
  db: Db,
  input: { wallet: string; twitterId: string; ipHash: string },
): Promise<RateCheckResult> {
  const now = new Date();
  const walletWindow = new Date(now.getTime() - DEFAULTS.walletCooldownDays * 24 * 3600 * 1000);
  const twitterWindow = new Date(now.getTime() - DEFAULTS.twitterCooldownDays * 24 * 3600 * 1000);
  const ipWindow = new Date(now.getTime() - 24 * 3600 * 1000);

  const walletCount = await db
    .select({ n: sql<number>`count(*)` })
    .from(rateLimitEvents)
    .where(
      and(
        eq(rateLimitEvents.key, `wallet:${input.wallet}`),
        eq(rateLimitEvents.kind, 'submission'),
        gt(rateLimitEvents.createdAt, walletWindow),
      ),
    );
  if ((walletCount[0]?.n ?? 0) > 0) {
    return {
      ok: false,
      errorCode: 'WALLET_COOLDOWN',
      retryAfter: new Date(walletWindow.getTime() + DEFAULTS.walletCooldownDays * 24 * 3600 * 1000),
    };
  }

  const twitterCount = await db
    .select({ n: sql<number>`count(*)` })
    .from(rateLimitEvents)
    .where(
      and(
        eq(rateLimitEvents.key, `twitter:${input.twitterId}`),
        eq(rateLimitEvents.kind, 'submission'),
        gt(rateLimitEvents.createdAt, twitterWindow),
      ),
    );
  if ((twitterCount[0]?.n ?? 0) > 0) {
    return {
      ok: false,
      errorCode: 'TWITTER_COOLDOWN',
      retryAfter: new Date(twitterWindow.getTime() + DEFAULTS.twitterCooldownDays * 24 * 3600 * 1000),
    };
  }

  const ipCount = await db
    .select({ n: sql<number>`count(*)` })
    .from(rateLimitEvents)
    .where(
      and(
        eq(rateLimitEvents.key, `ip:${input.ipHash}`),
        eq(rateLimitEvents.kind, 'submission'),
        gt(rateLimitEvents.createdAt, ipWindow),
      ),
    );
  if ((ipCount[0]?.n ?? 0) >= DEFAULTS.ipPerDay) {
    return {
      ok: false,
      errorCode: 'IP_RATE_LIMITED',
      retryAfter: new Date(ipWindow.getTime() + 24 * 3600 * 1000),
    };
  }

  return { ok: true };
}

export async function recordIntake(
  db: Db,
  input: { wallet: string; twitterId: string; ipHash: string },
): Promise<void> {
  await db.insert(rateLimitEvents).values([
    { key: `wallet:${input.wallet}`, kind: 'submission' },
    { key: `twitter:${input.twitterId}`, kind: 'submission' },
    { key: `ip:${input.ipHash}`, kind: 'submission' },
  ]);
}
