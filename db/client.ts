import { drizzle as drizzlePg } from 'drizzle-orm/postgres-js';
import { drizzle as drizzlePglite } from 'drizzle-orm/pglite';
import { PGlite } from '@electric-sql/pglite';
import postgres from 'postgres';
import * as schema from './schema';
import { runMigrationsOn } from './migrate';

type DrizzleDb =
  | ReturnType<typeof drizzlePg<typeof schema>>
  | ReturnType<typeof drizzlePglite<typeof schema>>;

let cachedDb: DrizzleDb | null = null;

export async function getDb(): Promise<DrizzleDb> {
  if (cachedDb) return cachedDb;
  const url = process.env.DATABASE_URL;
  if (url) {
    const sql = postgres(url, { max: 5 });
    cachedDb = drizzlePg(sql, { schema });
  } else {
    const pglite = new PGlite();
    const db = drizzlePglite(pglite, { schema });
    await runMigrationsOn(db);
    cachedDb = db;
  }
  return cachedDb;
}

export async function createTestClient(): Promise<ReturnType<typeof drizzlePglite<typeof schema>>> {
  const pglite = new PGlite();
  const db = drizzlePglite(pglite, { schema });
  await runMigrationsOn(db);
  return db;
}
