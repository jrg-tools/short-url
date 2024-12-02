import type { Bindings } from '@/env.d';
import type { LibSQLDatabase } from 'drizzle-orm/libsql';
import type { Context } from 'hono';
import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';

export function db(c: Context<{ Bindings: Bindings }>): LibSQLDatabase {
  return drizzle(
    createClient({
      url: c.env.DATABASE_URL!,
      authToken: c.env.DATABASE_TOKEN,
      syncInterval: 120,
      syncUrl: c.env.DATABASE_URL!,
    }),
  );
}
