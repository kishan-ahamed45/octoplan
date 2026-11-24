import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const rawDatabaseUrl = (process.env.DATABASE_URL || '').trim();

export const isDatabaseConfigured = Boolean(
  rawDatabaseUrl &&
    !rawDatabaseUrl.includes('your-') &&
    !rawDatabaseUrl.includes('placeholder')
);

const globalForDb = globalThis as unknown as {
  __octoplanSql?: ReturnType<typeof postgres>;
  __octoplanDb?: PostgresJsDatabase<typeof schema>;
};

function createDb(): PostgresJsDatabase<typeof schema> | null {
  if (!isDatabaseConfigured) return null;

  if (!globalForDb.__octoplanSql) {
    globalForDb.__octoplanSql = postgres(rawDatabaseUrl, {
      prepare: false,
    });
  }

  if (!globalForDb.__octoplanDb) {
    globalForDb.__octoplanDb = drizzle(globalForDb.__octoplanSql, { schema });
  }

  return globalForDb.__octoplanDb;
}

export const pgDb = createDb();
export * from './schema';
