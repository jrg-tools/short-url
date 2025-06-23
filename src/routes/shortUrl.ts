import type { Bindings, Variables } from '@/env.d';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { aliasSchema } from '@/lib/validator';
import { getOriginUrlByAlias } from '@/repository/actions';

const open = new Hono<{
  Bindings: Bindings;
  Variables: Variables;
}>()
  .get('/:id', zValidator('param', aliasSchema), async (c) => {
    const { id } = c.req.param();
    const res = await getOriginUrlByAlias(c, id);
    return c.redirect(res.Origin);
  });

export default open;
