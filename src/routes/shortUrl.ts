import type { Variables } from '@/env.d';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { cache } from 'hono/cache';
import { aliasSchema } from '@/lib/validator';
import { getOriginUrlByAlias } from '@/repository/actions';

const open = new Hono<{
  Variables: Variables;
}>()
  .get('/:id', zValidator('param', aliasSchema), cache({
    cacheName: 'short-url',
    cacheControl: 'max-age=7776000',
  }), async (c) => {
    const { id } = c.req.valid('param');
    const res = await getOriginUrlByAlias(id);
    return c.redirect(res.Origin, 301);
  });

export default open;
