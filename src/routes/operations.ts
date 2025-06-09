import type { Bindings } from '@/env.d';
import { clerkMiddleware } from '@hono/clerk-auth';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { createShortUrl, deleteShortUrl, getAllShortUrls, getOriginUrlByAlias, searchShortUrl } from '@/repository/actions';
import { AlreadyExists, InternalServerError, NotFound } from '@/routes/errors';
import { aliasSchema, originUrlSchema, paginationSchema, querySchema, requireAdmin } from '@/utils/validator';

const operations = new Hono<{ Bindings: Bindings }>()
  .basePath('/ops')
  .use('*', clerkMiddleware())

  .get('/search', zValidator('query', querySchema), async (c) => {
    const check = await requireAdmin(c);
    if (check !== true)
      return check;

    const { q, page, size }: { q: string; page: number; size: number } = c.req.valid('query');

    const { error, list } = await searchShortUrl(c, q, page, size);
    if (error) {
      return c.json({ message: NotFound }, 400);
    }

    return c.json(list);
  })

  .get('/list', zValidator('query', paginationSchema), async (c) => {
    const check = await requireAdmin(c);
    if (check !== true)
      return check;

    const { page, size }: { page: number; size: number } = c.req.valid('query');

    const { error, list } = await getAllShortUrls(c, page, size);
    if (error) {
      return c.json({ message: NotFound }, 400);
    }

    return c.json(list);
  })

  .post('/new', zValidator('json', originUrlSchema), async (c) => {
    const check = await requireAdmin(c);
    if (check !== true)
      return check;

    const { originUrl }: { originUrl: string } = c.req.valid('json');

    const { error, res } = await createShortUrl(c, originUrl);
    if (error) {
      if (error === AlreadyExists && res) {
        const { error: e, res: r } = await getOriginUrlByAlias(c, res.Alias);
        if (e || !r) {
          return c.json({ message: NotFound }, 400);
        }
        return c.json({
          Alias: r.Alias,
          OriginUrl: r.Origin,
        });
      }
      return c.json({ message: InternalServerError }, 500);
    }

    return c.json(res);
  })

  .delete('/:id', zValidator('param', aliasSchema), async (c) => {
    const check = await requireAdmin(c, true);
    if (check !== true)
      return check;

    const { id }: { id: string } = c.req.valid('param');

    const { error } = await deleteShortUrl(c, id);
    if (error) {
      return c.json({ message: NotFound }, 400);
    }

    c.status(200);
    return c.body(null);
  });

export default operations;
