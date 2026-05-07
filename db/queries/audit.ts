// db/queries/audit.ts
import { desc } from 'drizzle-orm';
import { auditLog, type AuditLogEntry } from '../schema';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = any;

export interface RecordAuditInput {
  adminId: string;
  action: string;
  targetType?: string | null;
  targetId?: string | null;
  payload?: unknown;
  ipHash?: string | null;
}

export async function recordAudit(db: Db, input: RecordAuditInput): Promise<void> {
  await db.insert(auditLog).values({
    adminId: input.adminId,
    action: input.action,
    targetType: input.targetType ?? null,
    targetId: input.targetId ?? null,
    payload: input.payload ?? null,
    ipHash: input.ipHash ?? null,
  });
}

export interface ListAuditOptions {
  limit?: number;
  offset?: number;
}

export async function listAudit(
  db: Db,
  opts: ListAuditOptions = {},
): Promise<AuditLogEntry[]> {
  return db
    .select()
    .from(auditLog)
    .orderBy(desc(auditLog.at))
    .limit(opts.limit ?? 50)
    .offset(opts.offset ?? 0);
}
