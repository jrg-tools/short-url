import type { Config } from 'drizzle-kit';

export default {
  schema: 'src/models/shortUrl.ts',
  out: 'db/migrations',
  dialect: 'turso',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
    authToken: process.env.DATABASE_TOKEN,
  },
} satisfies Config;
