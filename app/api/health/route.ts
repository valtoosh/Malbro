// app/api/health/route.ts
import { NextResponse } from 'next/server';
import { getDb } from '@/db/client';
import { sql } from 'drizzle-orm';

export async function GET() {
  try {
    const db = await getDb();
    await db.execute(sql`SELECT 1`);
    return NextResponse.json({ ok: true, db: 'reachable' });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
