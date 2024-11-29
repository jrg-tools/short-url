import type { Bindings } from '@/env.d';
import { getOriginUrlByAlias } from '@/repository/actions';
import { NotFound } from '@/routes/errors';
import { aliasSchema } from '@/utils/validator';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';

const open = new Hono<{ Bindings: Bindings }>()

  .get('/:id', zValidator('param', aliasSchema), async (c) => {
    const id: string = c.req.param('id');

    const { error, origin } = await getOriginUrlByAlias(c, id);
    if (error || !origin || origin === '') {
      return c.json({ message: NotFound }, 400);
    }

    return c.redirect(origin);
  });

export default open;
