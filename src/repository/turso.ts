import type { LibSQLDatabase } from 'drizzle-orm/libsql';
import type { Context } from 'hono';
import type { Bindings } from '@/env.d';
import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { env } from 'hono/adapter';

export function db(c: Context<{ Bindings: Bindings }>): LibSQLDatabase {
  const { DATABASE_URL, DATABASE_TOKEN } = env(c);

  return drizzle(
    createClient({
      url: DATABASE_URL!,
      // Embedded replicas are facing some issues due to https://x.jrg.tools/BioXOB
      // url: c.env.DATABASE_URL_REPLICA!,
      // syncUrl: c.env.DATABASE_URL!,
      // syncInterval: 60000,
      authToken: DATABASE_TOKEN,
    }),
  );
}
