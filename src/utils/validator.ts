import type { Context } from 'hono';
import { getAuth } from '@hono/clerk-auth';
import { z } from 'zod';
import { Unauthorized } from '@/routes/errors';

export const aliasSchema = z.object({
  id: z.string().length(6),
});

export const querySchema = z.object({
  q: z.string(),
  page: z.string().min(1).default('1'),
  size: z.string().min(1).max(100).default('10'),
});

export const originUrlSchema = z.object({
  originUrl: z.string().url(),
});

export const paginationSchema = z.object({
  page: z.string().min(1).default('1'),
  size: z.string().min(1).max(100).default('10'),
});

export const listSchema = z.object({
  q: z.string().optional(),
  page: z.string().min(1).default('1'),
  size: z.string().min(1).max(100).default('10'),
});

export async function requireAdmin(c: Context): Promise<boolean | Response> {
  const auth = getAuth(c);

  if (!auth?.userId) {
    return c.redirect(`${c.env.CLERK_ACCOUNTS_URL}/sign-in?redirect_url=${encodeURIComponent(c.req.url)}`);
  }

  const clerkClient = c.get('clerk');

  try {
    const user = await clerkClient.users.getUser(auth.userId);

    return user?.privateMetadata?.role === 'admin' ? true : c.json({ message: Unauthorized }, 403);
  }
  catch {
    return c.json({ message: Unauthorized }, 403);
  }
}
