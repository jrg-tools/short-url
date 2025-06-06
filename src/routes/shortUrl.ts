import type { Bindings } from '@/env.d';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { getOriginUrlByAlias, increaseHits } from '@/repository/actions';
import { NotFound } from '@/routes/errors';
import { aliasSchema } from '@/utils/validator';

const open = new Hono<{ Bindings: Bindings }>()

  .get('/:id', zValidator('param', aliasSchema), async (c) => {
    const id: string = c.req.param('id');

    const { error, res } = await getOriginUrlByAlias(c, id);
    if (error || !res) {
      return c.json({ message: NotFound }, 400);
    }

    if (c.env.TRACKING_HITS) {
      const { error: err } = await increaseHits(c, res.Alias, res.Hits);
      if (err) {
        return c.json({ message: NotFound }, 400);
      }
    }

    return c.redirect(res.Origin);
  });

export default open;
