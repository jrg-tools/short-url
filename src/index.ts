import type { Bindings, Variables } from '@/env.d';
import { Hono } from 'hono';
import { createErrorHandler } from '@/middleware/error';
import dashboard from '@/routes/dashboard';
import monitoring from '@/routes/monitoring';
import operations from '@/routes/operations';
import open from '@/routes/shortUrl';
import { posthogAnalytics } from './middleware/tracking';

const app = new Hono<{
  Bindings: Bindings;
  Variables: Variables;
}>();

app.onError(createErrorHandler());

app.use('*', posthogAnalytics({
  excludePaths: ['/health', '/ops', '/dashboard'],
  captureIP: false, // GDPR compliance
  getUserId: (c) => {
    const userId = c.get('userId');
    if (!userId)
      return undefined;
    return userId;
  },
}));

app.route('/', operations);
app.route('/', dashboard);
app.route('/', monitoring);
app.route('/', open);

export default app;
