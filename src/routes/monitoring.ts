import type { Bindings } from '@/env.d';
import { Hono } from 'hono';

const monitoring = new Hono<{ Bindings: Bindings }>()

  .get('/health', async (c) => {
    return c.json({ status: 'ok' });
  });

export default monitoring;
