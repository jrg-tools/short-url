import admin from '@/routes/admin';

import open from '@/routes/shortUrl';
import { Hono } from 'hono';

const app = new Hono();
app.route('/', admin);
app.route('/', open);

export default app;
