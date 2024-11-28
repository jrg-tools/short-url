import { createClient } from '@libsql/client/web';
import { drizzle } from 'drizzle-orm/libsql';

const turso = createClient({
  url: process.env.DATABASE_URL!,
  authToken: process.env.DATABASE_TOKEN,
});

export const db = drizzle(turso);
