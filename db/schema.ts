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
