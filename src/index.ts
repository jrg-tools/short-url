import type { Bindings } from '@/env.d';
import monitoring from '@/routes/monitoring';
import operations from '@/routes/operations';
import open from '@/routes/shortUrl';
import { Hono } from 'hono';

const app = new Hono<{ Bindings: Bindings }>();

app.route('/', operations);
app.route('/', monitoring);
app.route('/', open);

export default app;
