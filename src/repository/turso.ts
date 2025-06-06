import type { LibSQLDatabase } from 'drizzle-orm/libsql';
import type { Context } from 'hono';
import type { Bindings } from '@/env.d';
import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';

export function db(c: Context<{ Bindings: Bindings }>): LibSQLDatabase {
  return drizzle(
    createClient({
      url: c.env.DATABASE_URL!,
      // Embedded replicas are facing some issues due to https://x.jrg.tools/BioXOB
      // url: c.env.DATABASE_URL_REPLICA!,
      // syncUrl: c.env.DATABASE_URL!,
      // syncInterval: 60000,
      authToken: c.env.DATABASE_TOKEN,
    }),
  );
}
