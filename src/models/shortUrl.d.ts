import type { shortUrl } from '@/models/shortUrl';

export type ShortUrl = typeof shortUrl.$inferSelect;
export type NewShortUrl = typeof shortUrl.$inferInsert;

export interface ThinShortUrl {
  Alias: typeof ShortUrl.Alias;
  Origin: typeof ShortUrl.Origin;
}
