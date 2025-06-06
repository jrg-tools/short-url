import type { Bindings } from '@/env.d';
import { clerkMiddleware } from '@hono/clerk-auth';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { getAllShortUrls, searchShortUrl } from '@/repository/actions';
import { listSchema, requireAdmin } from '@/utils/validator';

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
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>URL Shortener Dashboard</title>
          <script src="https://unpkg.com/htmx.org@2.0.4"></script>
          <script src="https://unpkg.com/hyperscript.org@0.9.14"></script>
          <script src="https://unpkg.com/clipboard-copy"></script>
          <script>
            {`
              function copyToClipboard(text) {
                clipboardCopy(text);
                alert('Copied to clipboard!');
              }
            `}
          </script>
          <script src="https://cdn.tailwindcss.com"></script>
        </head>
        <body class="bg-gray-100 min-h-screen p-6 font-sans">
          <div class="max-w-4xl mx-auto">
            <h1 class="text-4xl font-bold text-center mb-6">📉 URL Shortener Dashboard</h1>

            <form
              class="bg-white p-6 rounded-lg shadow mb-6 flex gap-4"
              hx-post="/ops/new"
              hx-trigger="submit"
              hx-target="#short-url-result"
              hx-swap="innerHTML"
            >
              <input
                type="url"
                name="original"
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

            <input
              type="search"
              name="q"
              placeholder="Search short URLs..."
              class="w-full border px-4 py-2 rounded mb-4"
              hx-get="/dashboard/list"
              hx-target="#url-list"
              hx-trigger="input changed delay:300ms"
              hx-params="*"
            />

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

  // Render the list
  .get('/list', zValidator('query', listSchema), async (c) => {
    const check = await requireAdmin(c);
    if (check !== true)
      return check;

    const query: string | undefined = c.req.query('q');
    const page: number = +c.req.query('page')! || 1;
    const size: number = +c.req.query('size')! || 10;

    const { error, list } = !query ? await getAllShortUrls(c, page, size) : await searchShortUrl(c, query, page, size);

    if (error) {
      return c.html(<div class="text-red-600">Failed to fetch results</div>);
    }

    const totalPages = Math.max(1, Math.ceil(list.length / size));

    return c.html(
      <div class="bg-white shadow rounded-lg divide-y">
        {list.length === 0 ? (
          <div class="p-4 text-gray-500">No results</div>
        ) : (
          <>
            {list.map((item: any) => (
              <div class="flex items-center justify-between px-4 py-3 hover:bg-gray-50">
                <div>
                  <div class="font-mono text-blue-600">{item.Alias}</div>
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
                hx-get={`/dashboard/list?q=${query}&page=${page - 1}&size=${size}`}
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
                hx-get={`/dashboard/list?q=${query}&page=${page + 1}&size=${size}`}
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
