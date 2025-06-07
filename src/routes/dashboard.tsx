import type { Bindings } from '@/env.d';
import { clerkMiddleware } from '@hono/clerk-auth';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { createShortUrl, getAllShortUrls, searchShortUrl } from '@/repository/actions';
import { listSchema, originUrlSchema, requireAdmin } from '@/utils/validator';
import { AlreadyExists } from './errors';

const dashboard = new Hono<{ Bindings: Bindings }>()
  .basePath('/dashboard')
  .use('*', clerkMiddleware())
  .get('/', async (c) => {
    const check = await requireAdmin(c);
    if (check !== true)
      return check;

    return c.html(
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>URL Shortener Dashboard</title>
          <link rel="icon" type="image/x-icon" href="https://jorgechato.com/favicon.ico" />
          <script src="https://unpkg.com/htmx.org@2.0.4"></script>
          <script src="https://unpkg.com/hyperscript.org@0.9.14"></script>
          <script src="https://cdn.tailwindcss.com"></script>
        </head>
        <body
          class="flex flex-col min-h-screen"
          style="background: radial-gradient(ellipse at top left, #f7f6f3 0%, #f5f3ef 60%, #f7f6f3 100%);"
        >
          <div class="max-w-4xl mx-auto">
            <h1 class="text-4xl font-bold text-center m-6">📉 URL Shortener Dashboard</h1>

            <form
              class="bg-white p-6 rounded-lg shadow mb-6 flex gap-4"
              hx-post="/dashboard/new"
              hx-trigger="submit"
              hx-target="#short-url-result"
              hx-swap="innerHTML"
            >
              <input
                type="url"
                name="originUrl"
                placeholder="Enter a long URL..."
                class="flex-1 border border-gray-300 rounded px-4 py-2"
                required
              />
              <button
                type="submit"
                class="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
              >
                Shorten
              </button>
            </form>

            <div id="short-url-result" class="mb-6"></div>

            <form
              class="bg-white p-4 rounded shadow mb-6 flex gap-2"
              hx-get="/dashboard/list"
              hx-target="#url-list"
              hx-trigger="submit"
              hx-params="*"
            >
              <input
                type="search"
                name="q"
                placeholder="Search short URLs..."
                class="flex-1 border px-4 py-2 rounded"
              />
              <button
                type="submit"
                class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Search
              </button>
            </form>

            <div
              id="url-list"
              hx-get="/dashboard/list"
              hx-trigger="load"
              hx-swap="innerHTML"
            >
            </div>
          </div>
        </body>
      </html>,
    );
  })

  .post('/new', zValidator('form', originUrlSchema), async (c) => {
    const check = await requireAdmin(c);
    if (check !== true)
      return check;

    const { originUrl } = c.req.valid('form');

    const { error, res } = await createShortUrl(c, originUrl);

    if (error && error !== AlreadyExists) {
      return c.html(<div class="text-red-600">Failed to create short URL</div>);
    }

    return c.html(
      <div class="text-green-600">
        Short URL:
        {' '}
        <a href={`${c.env.DOMAIN}/${res?.Alias}`}>
          {c.env.DOMAIN}
          /
          {res?.Alias}
        </a>
      </div>,
    );
  })

  // Render the list
  .get('/list', zValidator('query', listSchema), async (c) => {
    const check = await requireAdmin(c);
    if (check !== true)
      return check;

    const { q, page, size }: { q?: string | undefined; page: number; size: number } = c.req.valid('query');

    const { error, list, count } = !q ? await getAllShortUrls(c, page, size) : await searchShortUrl(c, q, page, size);

    if (error) {
      return c.html(<div class="text-red-600">Failed to fetch results</div>);
    }

    const totalPages = Math.max(1, Math.ceil(count / size));

    return c.html(
      <div class="bg-white shadow rounded-lg divide-y">
        {list.length === 0 ? (
          <div class="p-4 text-gray-500">No results</div>
        ) : (
          <>
            {list.map((item: any) => (
              <div class="flex items-center justify-between px-4 py-3 hover:bg-gray-50">
                <div>
                  <div class="text-blue-600">
                    {c.env.DOMAIN!}
                    /
                    {item.Alias}
                  </div>
                  <div class="text-gray-600 text-sm truncate">{item.Origin}</div>
                  <div class="text-xs text-gray-400">
                    Hits:
                    {item.Hits}
                  </div>
                </div>
                <div class="flex gap-2">
                  <button
                    class="text-sm px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
                    onclick={`copyToClipboard('${item.Alias}')`}
                  >
                    Copy
                  </button>
                </div>
              </div>
            ))}

            {/* Pagination Controls */}
            <div class="flex justify-between items-center px-4 py-3 text-sm text-gray-600 bg-gray-50 border-t">
              <button
                hx-get={`/dashboard/list?q=${q}&page=${page - 1}`}
                hx-target="#url-list"
                hx-swap="innerHTML"
                class={`px-3 py-1 rounded ${page <= 1 ? 'bg-gray-200 cursor-not-allowed' : 'bg-blue-100 hover:bg-blue-200'}`}
                disabled={page <= 1}
              >
                ← Prev
              </button>

              <span>
                Page
                {' '}
                {page}
                {' '}
                of
                {' '}
                {totalPages}
              </span>

              <button
                hx-get={`/dashboard/list?q=${q}&page=${page + 1}`}
                hx-target="#url-list"
                hx-swap="innerHTML"
                class={`px-3 py-1 rounded ${page >= totalPages ? 'bg-gray-200 cursor-not-allowed' : 'bg-blue-100 hover:bg-blue-200'}`}
                disabled={page >= totalPages}
              >
                Next →
              </button>
            </div>
          </>
        )}
      </div>,
    );
  });

export default dashboard;
