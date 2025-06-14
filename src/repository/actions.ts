import type { SQL } from 'drizzle-orm';
import type { Context } from 'hono';
import type { Bindings } from '@/env.d';
import type { ShortUrl, ThinShortUrl } from '@/models/shortUrl.d';
import { desc, eq, like, or, sql } from 'drizzle-orm';
import { shortUrl } from '@/models/shortUrl';
import { db } from '@/repository/turso';
import { AlreadyExists } from '@/routes/errors';
import { generateAlias } from '@/utils/crypto';

export async function getOriginUrlByAlias(ctx: Context<{ Bindings: Bindings }>, alias: string): Promise<{ error: unknown; res: ShortUrl | null }> {
  let res: ShortUrl[] = [];
  try {
    res = await db(ctx)
      .select()
      .from(shortUrl)
      .where(eq(shortUrl.Alias, alias));
  }
  catch (e) {
    return {
      error: e,
      res: null,
    };
  }

  return {
    error: null,
    res: res[0],
  };
}

export async function createShortUrl(ctx: Context<{ Bindings: Bindings }>, origin: string): Promise<{ error: unknown; res: ThinShortUrl | null }> {
  const alias = generateAlias(origin, ctx.env.PRIVATE_KEY!);
  let res: ShortUrl[] = [];
  try {
    res = await db(ctx)
      .insert(shortUrl)
      .values({ Origin: origin, Alias: alias })
      .onConflictDoNothing()
      .returning();
  }
  catch (e) {
    return {
      error: e,
      res: null,
    };
  }

  if (res.length === 0) {
    return {
      error: AlreadyExists,
      res: {
        Alias: alias,
        Origin: origin,
      } as ThinShortUrl,
    };
  }

  return {
    error: null,
    res: {
      Alias: res[0].Alias,
      Origin: res[0].Origin,
    } as ThinShortUrl,
  };
}

export async function deleteShortUrl(ctx: Context<{ Bindings: Bindings }>, alias: string): Promise<{ error: unknown }> {
  try {
    await db(ctx)
      .delete(shortUrl)
      .where(eq(shortUrl.Alias, alias));
  }
  catch (e) {
    return {
      error: e,
    };
  }

  return {
    error: null,
  };
}

export async function searchShortUrl(ctx: Context<{ Bindings: Bindings }>, query: string, page: number = 1, size: number = 10): Promise<{ error: unknown; list: ShortUrl[]; count: number }> {
  let res: ShortUrl[] = [];
  let count: number = 0;

  const filters: SQL[] = [];
  filters.push(like(shortUrl.Origin, `%${query.toLowerCase()}%`)); // if query is a substring of origin
  filters.push(like(shortUrl.Alias, `%${query}%`)); // if query is a substring of alias

  try {
    res = await db(ctx)
      .select()
      .from(shortUrl)
      .where(or(...filters))
      .limit(size)
      .offset((page - 1) * size);

    const resCount: { count: number }[] = await db(ctx)
      .select({ count: sql<number>`count(*)` })
      .from(shortUrl)
      .where(or(...filters));

    count = resCount[0].count;
  }
  catch (e) {
    return {
      error: e,
      list: [],
      count,
    };
  }

  return {
    error: null,
    list: res,
    count,
  };
}

export async function increaseHits(ctx: Context<{ Bindings: Bindings }>, alias: string, hits: number): Promise<{ error: unknown }> {
  try {
    await db(ctx)
      .update(shortUrl)
      .set({ Hits: hits + 1 })
      .where(eq(shortUrl.Alias, alias));
  }
  catch (e) {
    return {
      error: e,
    };
  }
  return {
    error: null,
  };
}

export async function getAllShortUrls(ctx: Context<{ Bindings: Bindings }>, page: number, size: number): Promise<{ error: unknown; list: ShortUrl[]; count: number }> {
  let res: ShortUrl[] = [];
  let count: number = 0;

  try {
    res = await db(ctx)
      .select()
      .from(shortUrl)
      .orderBy(desc(shortUrl.CreatedAt))
      .limit(size)
      .offset((page - 1) * size);

    const resCount: { count: number }[] = await db(ctx)
      .select({ count: sql<number>`count(*)` })
      .from(shortUrl);

    count = resCount[0].count;
  }
  catch (e) {
    return {
      error: e,
      list: [],
      count,
    };
  }

  return {
    error: null,
    list: res,
    count,
  };
}
