import type { Variables } from '@/env.d';
import { Hono } from 'hono';
import { createErrorHandler } from '@/middleware/error';
import dashboard from '@/routes/dashboard';
import monitoring from '@/routes/monitoring';
import operations from '@/routes/operations';
import open from '@/routes/shortUrl';

const app = new Hono<{
  Variables: Variables;
}>();

app.onError(createErrorHandler());

app.route('/', operations);
app.route('/', dashboard);
app.route('/', monitoring);
app.route('/', open);

export default {
  port: 3000,
  hostname: '0.0.0.0',
  fetch: app.fetch,
};
