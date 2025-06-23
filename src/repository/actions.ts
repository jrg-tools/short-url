import type { SQL } from 'drizzle-orm';
import type { Context } from 'hono';
import type { ShortUrl, ThinShortUrl } from '@/models/shortUrl.d';
import { desc, eq, like, or, sql } from 'drizzle-orm';
import { env } from 'hono/adapter';
import { generateAlias } from '@/lib/crypto';
import { DatabaseError } from '@/lib/errors/types';
import { shortUrl } from '@/models/shortUrl';
import { db } from '@/repository/turso';

export async function getOriginUrlByAlias(ctx: Context, alias: string): Promise<ThinShortUrl> {
  try {
    return await db(ctx)
      .select({
        Alias: shortUrl.Alias,
        Origin: shortUrl.Origin,
      })
      .from(shortUrl)
      .where(eq(shortUrl.Alias, alias))
      .limit(1)
      .then(rows => rows[0]);
  }
  catch (e) {
    throw DatabaseError.fromError(e);
  }
}

export async function createShortUrl(ctx: Context, origin: string): Promise<ThinShortUrl> {
  const { PRIVATE_KEY } = env(ctx);
  const alias = generateAlias(origin, PRIVATE_KEY!);
  return await db(ctx).transaction(async (tx) => {
    // First, check if a short URL already exists for this origin
    const existing = await tx
      .select()
      .from(shortUrl)
      .where(eq(shortUrl.Origin, origin))
      .limit(1)
      .then(rows => rows[0]);

    if (existing) {
      // Return the existing short URL
      return existing as ThinShortUrl;
    }

    // If no existing URL found, create a new one
    const res: ShortUrl = await tx
      .insert(shortUrl)
      .values({ Origin: origin, Alias: alias })
      .returning()
      .then(rows => rows[0]);

    if (!res) {
      throw DatabaseError.queryFailed('Failed to create short URL');
    }

    return res as ThinShortUrl;
  });
}

export async function deleteShortUrl(ctx: Context, alias: string): Promise<void> {
  try {
    await db(ctx)
      .delete(shortUrl)
      .where(eq(shortUrl.Alias, alias));
  }
  catch (e) {
    throw DatabaseError.fromError(e);
  }
}

export async function searchShortUrl(ctx: Context, query: string, page: number = 1, size: number = 10): Promise<{ list: ShortUrl[]; count: number }> {
  const filters: SQL[] = [];
  filters.push(like(shortUrl.Origin, `%${query.toLowerCase()}%`)); // if query is a substring of origin
  filters.push(like(shortUrl.Alias, `%${query}%`)); // if query is a substring of alias

  try {
    return await db(ctx).transaction(async (tx) => {
      const res: ShortUrl[] = await tx
        .select()
        .from(shortUrl)
        .where(or(...filters))
        .limit(size)
        .offset((page - 1) * size);

      const resCount: { count: number } = await tx
        .select({ count: sql<number>`count(*)` })
        .from(shortUrl)
        .where(or(...filters))
        .then(rows => rows[0]);

      return {
        list: res,
        count: resCount.count,
      };
    });
  }
  catch (e) {
    throw DatabaseError.fromError(e);
  }
}

export async function increaseHits(ctx: Context, alias: string, hits: number): Promise<void> {
  try {
    await db(ctx)
      .update(shortUrl)
      .set({ Hits: hits + 1 })
      .where(eq(shortUrl.Alias, alias));
  }
  catch (e) {
    throw DatabaseError.fromError(e);
  }
}

export async function getAllShortUrls(ctx: Context, page: number, size: number): Promise<{ list: ShortUrl[]; count: number }> {
  try {
    return await db(ctx).transaction(async (tx) => {
      const res: ShortUrl[] = await tx
        .select()
        .from(shortUrl)
        .orderBy(desc(shortUrl.CreatedAt))
        .limit(size)
        .offset((page - 1) * size);

      const resCount: { count: number } = await tx
        .select({ count: sql<number>`count(*)` })
        .from(shortUrl)
        .then(rows => rows[0]);

      return {
        list: res,
        count: resCount.count,
      };
    });
  }
  catch (e) {
    throw DatabaseError.fromError(e);
  }
}
