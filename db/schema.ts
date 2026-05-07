import {
  pgTable, uuid, text, integer, numeric, timestamp, boolean, jsonb, pgEnum, serial,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const adminRole = pgEnum('admin_role', ['reviewer', 'approver', 'superadmin']);
export const bountyStatus = pgEnum('bounty_status', ['draft', 'live', 'paused', 'exhausted', 'expired']);

export const admins = pgTable('admins', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  displayName: text('display_name').notNull(),
  role: adminRole('role').notNull().default('reviewer'),
  totpSecretEnc: text('totp_secret_enc'),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const auditLog = pgTable('audit_log', {
  id: uuid('id').primaryKey().defaultRandom(),
  adminId: uuid('admin_id').references(() => admins.id),
  action: text('action').notNull(),
  targetType: text('target_type'),
  targetId: text('target_id'),
  payload: jsonb('payload'),
  ipHash: text('ip_hash'),
  at: timestamp('at', { withTimezone: true }).notNull().defaultNow(),
});

export const config = pgTable('config', {
  key: text('key').primaryKey(),
  value: jsonb('value').notNull(),
  updatedBy: uuid('updated_by').references(() => admins.id),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const bounties = pgTable('bounties', {
  id: uuid('id').primaryKey().defaultRandom(),
  number: serial('number').notNull(),
  title: text('title').notNull(),
  brief: text('brief').notNull(),
  payoutMarlbro: numeric('payout_marlbro', { precision: 30, scale: 6 }).notNull().default('0'),
  payoutSol: numeric('payout_sol', { precision: 30, scale: 9 }).notNull().default('0'),
  maxClaims: integer('max_claims'),
  claimsUsed: integer('claims_used').notNull().default(0),
  deadline: timestamp('deadline', { withTimezone: true }),
  status: bountyStatus('status').notNull().default('draft'),
  locationConstraint: text('location_constraint'),
  posterImageUrl: text('poster_image_url'),
  createdBy: uuid('created_by').references(() => admins.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export type Admin = typeof admins.$inferSelect;
export type NewAdmin = typeof admins.$inferInsert;
export type Bounty = typeof bounties.$inferSelect;
export type NewBounty = typeof bounties.$inferInsert;
export type AuditLogEntry = typeof auditLog.$inferSelect;
export type ConfigEntry = typeof config.$inferSelect;

export { sql };

export const lane = pgEnum('lane', ['bounty', 'open']);
export const submissionStatus = pgEnum('submission_status', [
  'pending',
  'verifying',
  'review_ready',
  'approved',
  'rejected',
  'expired',
  'flagged',
]);

export const twitterAccounts = pgTable('twitter_accounts', {
  twitterId: text('twitter_id').primaryKey(),
  handle: text('handle').notNull(),
  email: text('email'),
  accessTokenEnc: text('access_token_enc'),
  refreshTokenEnc: text('refresh_token_enc'),
  firstSeenAt: timestamp('first_seen_at', { withTimezone: true }).notNull().defaultNow(),
  lastUsedAt: timestamp('last_used_at', { withTimezone: true }).notNull().defaultNow(),
});

export const submissions = pgTable('submissions', {
  id: uuid('id').primaryKey().defaultRandom(),
  publicUid: text('public_uid').notNull().unique(),
  lane: lane('lane').notNull(),
  bountyId: uuid('bounty_id').references(() => bounties.id),
  applicantTwitterHandle: text('applicant_twitter_handle').notNull(),
  applicantTwitterId: text('applicant_twitter_id').notNull(),
  applicantWalletAddress: text('applicant_wallet_address').notNull(),
  tweetUrl: text('tweet_url').notNull(),
  tweetId: text('tweet_id').notNull(),
  tweetVerifiedAt: timestamp('tweet_verified_at', { withTimezone: true }),
  tweetVerificationPayload: jsonb('tweet_verification_payload'),
  receiptImageR2Key: text('receipt_image_r2_key').notNull(),
  receiptHash: text('receipt_hash').notNull(),
  ipHash: text('ip_hash'),
  notes: text('notes'),
  status: submissionStatus('status').notNull().default('pending'),
  rejectionReason: text('rejection_reason'),
  reviewedBy: uuid('reviewed_by').references(() => admins.id),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const receiptsSeen = pgTable('receipts_seen', {
  receiptHash: text('receipt_hash').primaryKey(),
  firstSubmissionId: uuid('first_submission_id').references(() => submissions.id),
  firstSeenAt: timestamp('first_seen_at', { withTimezone: true }).notNull().defaultNow(),
});

export const rateLimitEventKind = pgEnum('rate_limit_kind', ['submission', 'approval']);

export const rateLimitEvents = pgTable('rate_limit_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  key: text('key').notNull(),
  kind: rateLimitEventKind('kind').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const bountyClaimsLock = pgTable('bounty_claims_lock', {
  id: uuid('id').primaryKey().defaultRandom(),
  bountyId: uuid('bounty_id').notNull().references(() => bounties.id),
  submissionId: uuid('submission_id').notNull().references(() => submissions.id).unique(),
  lockedUntil: timestamp('locked_until', { withTimezone: true }).notNull(),
});

export type Submission = typeof submissions.$inferSelect;
export type NewSubmission = typeof submissions.$inferInsert;
export type TwitterAccount = typeof twitterAccounts.$inferSelect;
export type NewTwitterAccount = typeof twitterAccounts.$inferInsert;
