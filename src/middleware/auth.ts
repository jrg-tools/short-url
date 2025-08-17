import type { MiddlewareHandler } from 'hono';
import type { Variables } from '@/env.d';
import { getAuth } from '@hono/clerk-auth';
import { env } from '@/lib/env';
import { AuthenticationError } from '@/lib/errors/types';

export function requireAuth(): MiddlewareHandler<{
  Variables: Variables;
}> {
  return async (c, next) => {
    const auth = getAuth(c);
    const userId = auth?.userId;

    const { CLERK_ACCOUNTS_URL } = env;

    if (!userId) {
      return c.redirect(`${CLERK_ACCOUNTS_URL}/sign-in?redirect_url=${encodeURIComponent(c.req.url)}`);
    }

    c.set('userId', userId);
    const clerkClient = c.get('clerk');

    try {
      const user = await clerkClient.users.getUser(userId);

      if (user?.privateMetadata?.role !== 'admin') {
        throw AuthenticationError.unauthorized();
      }

      await next();
    }
    catch {
      throw AuthenticationError.unauthorized();
    }
  };
}
