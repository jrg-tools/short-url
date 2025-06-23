import type { LibSQLDatabase } from 'drizzle-orm/libsql';
import type { Context } from 'hono';
import type { Bindings } from '@/env.d';
import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { env } from 'hono/adapter';

// Cache database connections
const dbCache = new Map<string, LibSQLDatabase>();

export function db(c: Context<{ Bindings: Bindings }>): LibSQLDatabase {
  const { DATABASE_URL, DATABASE_TOKEN } = env(c);

  // Use URL as cache key
  const cacheKey = DATABASE_URL!;

  if (dbCache.has(cacheKey)) {
    return dbCache.get(cacheKey)!;
  }

  const database = drizzle(
    createClient({
      url: DATABASE_URL!,
      authToken: DATABASE_TOKEN,
      // Add connection optimizations
    }),
  );

  dbCache.set(cacheKey, database);
  return database;
}
