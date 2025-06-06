import type { SQL } from 'drizzle-orm';
import type { Context } from 'hono';
import type { Bindings } from '@/env.d';
import type { ShortUrl, ThinShortUrl } from '@/models/shortUrl.d';
import { eq, like, or } from 'drizzle-orm';
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

export async function searchShortUrl(ctx: Context<{ Bindings: Bindings }>, query: string, page: number = 1, size: number = 10): Promise<{ error: unknown; list: ShortUrl[] }> {
  let res: ShortUrl[] = [];

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
  }
  catch (e) {
    return {
      error: e,
      list: [],
    };
  }

  return {
    error: null,
    list: res,
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

export async function getAllShortUrls(ctx: Context<{ Bindings: Bindings }>, page: number, size: number): Promise<{ error: unknown; list: ShortUrl[] }> {
  let res: ShortUrl[] = [];
  try {
    res = await db(ctx)
      .select()
      .from(shortUrl)
      .orderBy(shortUrl.Origin)
      .limit(size)
      .offset((page - 1) * size);
  }
  catch (e) {
    return {
      error: e,
      list: [],
    };
  }

  return {
    error: null,
    list: res,
  };
}
