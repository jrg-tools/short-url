import type { SQL } from 'drizzle-orm';
import type { Context } from 'hono';
import type { Bindings } from '@/env.d';
import type { ShortUrl, ThinShortUrl } from '@/models/shortUrl.d';
import { desc, eq, like, or, sql } from 'drizzle-orm';
import { generateAlias } from '@/lib/crypto';
import { DatabaseError } from '@/lib/errors/types';
import { shortUrl } from '@/models/shortUrl';
import { db } from '@/repository/turso';

export async function getOriginUrlByAlias(ctx: Context<{ Bindings: Bindings }>, alias: string): Promise<ShortUrl> {
  try {
    return await db(ctx)
      .select()
      .from(shortUrl)
      .where(eq(shortUrl.Alias, alias))
      .then(rows => rows[0]);
  }
  catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed to get origin URL by alias';
    throw DatabaseError.queryFailed(msg);
  }
}

export async function createShortUrl(ctx: Context<{ Bindings: Bindings }>, origin: string): Promise<ThinShortUrl> {
  const alias = generateAlias(origin, ctx.env.PRIVATE_KEY!);
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

export async function deleteShortUrl(ctx: Context<{ Bindings: Bindings }>, alias: string): Promise<void> {
  try {
    await db(ctx)
      .delete(shortUrl)
      .where(eq(shortUrl.Alias, alias));
  }
  catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed to delete short URL';
    throw DatabaseError.queryFailed(msg);
  }
}

export async function searchShortUrl(ctx: Context<{ Bindings: Bindings }>, query: string, page: number = 1, size: number = 10): Promise<{ list: ShortUrl[]; count: number }> {
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
    const msg = e instanceof Error ? e.message : 'Failed to search short URLs';
    throw DatabaseError.queryFailed(msg);
  }
}

export async function increaseHits(ctx: Context<{ Bindings: Bindings }>, alias: string, hits: number): Promise<void> {
  try {
    await db(ctx)
      .update(shortUrl)
      .set({ Hits: hits + 1 })
      .where(eq(shortUrl.Alias, alias));
  }
  catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed to increase hits';
    throw DatabaseError.queryFailed(msg);
  }
}

export async function getAllShortUrls(ctx: Context<{ Bindings: Bindings }>, page: number, size: number): Promise<{ list: ShortUrl[]; count: number }> {
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
    const msg = e instanceof Error ? e.message : 'Failed to get all short URLs';
    throw DatabaseError.queryFailed(msg);
  }
}
