import type { Bindings } from '@/env.d';
import { clerkMiddleware } from '@hono/clerk-auth';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { aliasSchema } from '@/lib/validator';
import { createFeatureFlagMiddleware } from '@/middleware/featureflag';
import { getOriginUrlByAlias, increaseHits } from '@/repository/actions';

const open = new Hono<{ Bindings: Bindings }>()
  .use('*', clerkMiddleware())
  // .use('*', createFeatureFlagMiddleware())

  .get('/:id', zValidator('param', aliasSchema), async (c) => {
    const id: string = c.req.param('id');

    const res = await getOriginUrlByAlias(c, id);

    // const tracking_hits = await c.var.getFeatureFlag('shorturl_track_hits', {
    // defaultValue: false,
    // });
    // if (tracking_hits) {
    // await increaseHits(c, res.Alias, res.Hits);
    // }

    return c.redirect(res.Origin);
  });

export default open;
