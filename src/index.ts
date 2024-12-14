import type { Bindings } from '@/env.d';
import admin from '@/routes/admin';
import monitoring from '@/routes/monitoring';
import open from '@/routes/shortUrl';
import { Hono } from 'hono';

const app = new Hono<{ Bindings: Bindings }>();

app.route('/', admin);
app.route('/', monitoring);
app.route('/', open);

export default app;
