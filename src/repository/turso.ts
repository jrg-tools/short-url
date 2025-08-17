import type { LibSQLDatabase } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { env } from '@/lib/env';

let dbInstance: LibSQLDatabase | null = null;

export function db(): LibSQLDatabase {
  if (dbInstance)
    return dbInstance;

  const {
    DATABASE_URL,
    DATABASE_TOKEN,
    DATABASE_PATH,
    DATABASE_ENCRYPTION_KEY,
  } = env;

  const client = createClient({
    url: DATABASE_PATH,
    authToken: DATABASE_TOKEN,
    syncUrl: DATABASE_URL,
    syncInterval: 60,
    encryptionKey: DATABASE_ENCRYPTION_KEY,
  });

  dbInstance = drizzle(client);
  return dbInstance;
}
