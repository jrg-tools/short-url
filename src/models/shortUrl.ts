import { sql } from 'drizzle-orm';
import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const shortUrl = sqliteTable(
  'ShortUrls',
  {
    Alias: text('Alias')
      .primaryKey()
      .notNull(),
    Origin: text('Origin')
      .notNull(),
    Hits: integer('Hits')
      .notNull()
      .default(0),
    CreatedAt: integer('CreatedAt')
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    UpdatedAt: integer('UpdatedAt')
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`)
      .$onUpdateFn(() => sql`CURRENT_TIMESTAMP`),
  },
  (table) => {
    return {
      OriginIdx: index('IdxOrigin').on(table.Origin),
    };
  },
);

export type ShortUrl = typeof shortUrl.$inferSelect;
export type NewShortUrl = typeof shortUrl.$inferInsert;
