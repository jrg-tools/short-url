import type { SQL } from 'drizzle-orm';
import type { ShortUrl, ThinShortUrl } from '@/models/shortUrl.d';
import { desc, eq, like, or, sql } from 'drizzle-orm';
import { generateAlias } from '@/lib/crypto';
import { env } from '@/lib/env';
import { DatabaseError } from '@/lib/errors/types';
import { shortUrl } from '@/models/shortUrl';
import { db } from '@/repository/turso';

export async function getOriginUrlByAlias(alias: string): Promise<ThinShortUrl> {
  try {
    return await db()
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

export async function createShortUrl(origin: string): Promise<ThinShortUrl> {
  const { PRIVATE_KEY } = env;
  const alias = generateAlias(origin, PRIVATE_KEY!);
  return await db().transaction(async (tx) => {
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

export async function deleteShortUrl(alias: string): Promise<void> {
  try {
    await db()
      .delete(shortUrl)
      .where(eq(shortUrl.Alias, alias));
  }
  catch (e) {
    throw DatabaseError.fromError(e);
  }
}

export async function searchShortUrl(query: string, page: number = 1, size: number = 10): Promise<{ list: ShortUrl[]; count: number }> {
  const filters: SQL[] = [];
  filters.push(like(shortUrl.Origin, `%${query.toLowerCase()}%`)); // if query is a substring of origin
  filters.push(like(shortUrl.Alias, `%${query}%`)); // if query is a substring of alias

  try {
    return await db().transaction(async (tx) => {
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
    console.error('Error fetching all short URLs:', e);
    throw DatabaseError.fromError(e);
  }
}

export async function increaseHits(alias: string, hits: number): Promise<void> {
  try {
    await db()
      .update(shortUrl)
      .set({ Hits: hits + 1 })
      .where(eq(shortUrl.Alias, alias));
  }
  catch (e) {
    throw DatabaseError.fromError(e);
  }
}

export async function getAllShortUrls(page: number, size: number): Promise<{ list: ShortUrl[]; count: number }> {
  try {
    return await db().transaction(async (tx) => {
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
    console.error('Error fetching all short URLs:', e);
    throw DatabaseError.fromError(e);
  }
}
