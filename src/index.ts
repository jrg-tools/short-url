import type { Bindings, Variables } from '@/env.d';
import { Hono } from 'hono';
import { createErrorHandler } from '@/middleware/error';
import dashboard from '@/routes/dashboard';
import monitoring from '@/routes/monitoring';
import operations from '@/routes/operations';
import open from '@/routes/shortUrl';

const app = new Hono<{
  Bindings: Bindings;
  Variables: Variables;
}>();

app.onError(createErrorHandler());

app.route('/', operations);
app.route('/', dashboard);
app.route('/', monitoring);
app.route('/', open);

export default app;
