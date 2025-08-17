import type { Variables } from '@/env.d';
import { clerkMiddleware } from '@hono/clerk-auth';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { aliasSchema, originUrlSchema, paginationSchema, querySchema } from '@/lib/validator';
import { requireAuth } from '@/middleware/auth';
import { createShortUrl, deleteShortUrl, getAllShortUrls, searchShortUrl } from '@/repository/actions';

const operations = new Hono<{
  Variables: Variables;
}>()
  .basePath('/ops')
  .use('*', clerkMiddleware())

  .get('/search', requireAuth(), zValidator('query', querySchema), async (c) => {
    const { q, page, size }: { q: string; page: number; size: number } = c.req.valid('query');

    const list = await searchShortUrl(q, page, size);

    return c.json(list);
  })

  .get('/list', requireAuth(), zValidator('query', paginationSchema), async (c) => {
    const { page, size }: { page: number; size: number } = c.req.valid('query');

    const list = await getAllShortUrls(page, size);

    return c.json(list);
  })

  .post('/new', requireAuth(), zValidator('json', originUrlSchema), async (c) => {
    const { originUrl }: { originUrl: string } = c.req.valid('json');

    const list = await createShortUrl(originUrl);

    return c.json(list);
  })

  .delete('/:id', requireAuth(), zValidator('param', aliasSchema), async (c) => {
    const { id }: { id: string } = c.req.valid('param');

    await deleteShortUrl(id);

    c.status(200);
    return c.body(null);
  });

export default operations;
