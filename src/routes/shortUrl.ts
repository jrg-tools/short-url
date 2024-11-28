import { aliasSchema } from '@/utils/validator';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';

const open = new Hono()

  .get('/:id', zValidator('param', aliasSchema), async (c) => {
    const id = c.req.param('id');
    return c.json({ redirectTo: id });
  });

export default open;
