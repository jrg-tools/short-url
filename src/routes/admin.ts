import type { Bindings } from '@/env.d';
import { createShortUrl, deleteShortUrl, getOriginUrlByAlias, searchShortUrl } from '@/repository/actions';
import { AlreadyExists, InternalServerError, NotFound } from '@/routes/errors';
import { aliasSchema, originUrlSchema, querySchema } from '@/utils/validator';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';

const admin = new Hono<{ Bindings: Bindings }>()

  .get('/search', zValidator('query', querySchema), async (c) => {
    const query: string = c.req.query('q')!;

    const { error, list } = await searchShortUrl(c, query);
    if (error) {
      return c.json({ message: NotFound }, 400);
    }

    return c.json(list);
  })

  .post('/', zValidator('json', originUrlSchema), async (c) => {
    const body = await c.req.json();

    const { error, res } = await createShortUrl(c, body.originUrl);
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
    const id: string = c.req.param('id');

    const { error } = await deleteShortUrl(c, id);
    if (error) {
      return c.json({ message: NotFound }, 400);
    }

    return c.status(204);
  });

export default admin;
