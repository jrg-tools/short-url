import { Hono } from 'hono';

const monitoring = new Hono()

  .get('/health', (c) => {
    return c.json({ status: 'ok', timestamp: new Date().toISOString() }, 200);
  });

export default monitoring;
