import { aliasSchema, originUrlSchema, querySchema } from '@/utils/validator';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';

const admin = new Hono()

  .get('/search', zValidator('query', querySchema), async (c) => {
    const query = c.req.query('q');
    return c.json({ listOfAliasMatching: query });
  })

  .post('/', zValidator('json', originUrlSchema), async (c) => {
    const body = await c.req.json();

    return c.json({ createShortUrlFor: body });
  })

  .delete('/:id', zValidator('param', aliasSchema), async (c) => {
    const id = c.req.param('id');
    return c.json({ deleteAlias: id });
  });

export default admin;
