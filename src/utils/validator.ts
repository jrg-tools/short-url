import type { Context } from 'hono';
import { getAuth } from '@hono/clerk-auth';
import { decodeJwt } from 'jose';
import { z } from 'zod';
import { Unauthorized } from '@/routes/errors';

export const aliasSchema = z.object({
  id: z.string().length(6),
});

export const querySchema = z.object({
  q: z.string(),
  page: z.coerce.number().min(1).default(1),
  size: z.coerce.number().min(1).max(100).default(10),
});

export const originUrlSchema = z.object({
  originUrl: z.string().url(),
});

export const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  size: z.coerce.number().min(1).max(100).default(10),
});

export const listSchema = z.object({
  q: z.string().optional().default(''),
  page: z.coerce.number().min(1).default(1),
  size: z.coerce.number().min(1).max(100).default(10),
});

export async function requireAdmin(c: Context, skipExpired: boolean = false): Promise<boolean | Response> {
  const auth = getAuth(c);
  let userId = auth?.userId;

  if (skipExpired && !userId) {
    const cookie = c.req.header('Cookie');
    const sessionToken = cookie?.split(';')
      .map(v => v.trim())
      .find(v => v.startsWith('__session='))
      ?.split('=')[1];

    if (sessionToken) {
      try {
        const payload = decodeJwt(sessionToken);

        const now = Math.floor(Date.now() / 1000);
        const expiredSince = now - (payload.exp ?? 0);

        // Allow if token expired less than 7 day ago
        const day = 86400 * 7;
        if (expiredSince <= day && payload.sub) {
          userId = payload.sub as string;
        }
        else {
          return c.json({ message: Unauthorized }, 403);
        }
      }
      catch {
        return c.redirect(`${c.env.CLERK_ACCOUNTS_URL}/sign-in?redirect_url=${encodeURIComponent(c.req.url)}`);
      }
    }
  }

  if (!userId) {
    return c.redirect(`${c.env.CLERK_ACCOUNTS_URL}/sign-in?redirect_url=${encodeURIComponent(c.req.url)}`);
  }

  const clerkClient = c.get('clerk');

  try {
    const user = await clerkClient.users.getUser(userId);

    return user?.privateMetadata?.role === 'admin' ? true : c.json({ message: Unauthorized }, 403);
  }
  catch {
    return c.json({ message: Unauthorized }, 403);
  }
}
