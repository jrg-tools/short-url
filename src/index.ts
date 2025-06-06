import type { Bindings } from '@/env.d';
import { Hono } from 'hono';
import monitoring from '@/routes/monitoring';
import operations from '@/routes/operations';
import open from '@/routes/shortUrl';
import dashboard from './routes/dashboard';

const app = new Hono<{ Bindings: Bindings }>();

app.route('/', operations);
app.route('/', dashboard);
app.route('/', monitoring);
app.route('/', open);

export default app;
