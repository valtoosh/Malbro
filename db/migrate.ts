import path from 'path';
import { migrate as migratePg } from 'drizzle-orm/postgres-js/migrator';
import { migrate as migratePglite } from 'drizzle-orm/pglite/migrator';
import { drizzle as drizzlePg } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

const MIGRATIONS_FOLDER = path.join(process.cwd(), 'db', 'migrations');

export async function runMigrationsOn(db: unknown): Promise<void> {
  await migratePglite(db as Parameters<typeof migratePglite>[0], { migrationsFolder: MIGRATIONS_FOLDER });
}

async function cli(): Promise<void> {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('DATABASE_URL is required for db:migrate');
    process.exit(1);
  }
  const sql = postgres(url, { max: 1 });
  const db = drizzlePg(sql);
  await migratePg(db, { migrationsFolder: MIGRATIONS_FOLDER });
  await sql.end();
  console.log('Migrations applied.');
}

if (typeof require !== 'undefined' && require.main === module) {
  cli().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
