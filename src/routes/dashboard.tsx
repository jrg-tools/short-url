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
      <html lang="en" class="bg-zinc-950 text-white" style={{ fontFamily: '\'Inter Variable\', sans-serif' }}>
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
          <title>URL Shortener Dashboard</title>
          <link rel="icon" href="https://jorgechato.com/favicon.ico" />
          <script src="https://unpkg.com/htmx.org@2.0.4"></script>
          <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
          <style>
            {`
              @font-face {
                font-family: 'Inter Variable';
                font-style: normal;
                font-display: auto;
                font-weight: 100 900;
                src: url(https://cdn.jsdelivr.net/fontsource/fonts/inter:vf@latest/latin-wght-normal.woff2) format('woff2-variations');
              }
            `}
          </style>
        </head>
        <body class="min-h-screen flex flex-col justify-between items-center">
          <main class="w-full max-w-3xl p-6">
            <div class="mx-auto flex flex-col items-center gap-4 rounded-2xl p-8">
              <img src="https://jorgechato.com/logo.webp" class="w-24 aspect-square" />
              <h1 class="text-xl font-semibold tracking-tight">X - URL Shortener</h1>
            </div>

            <div class="mt-12 space-y-10">
              <form
                class="flex items-center gap-4 bg-zinc-900/70 backdrop-blur-md rounded-xl p-4 shadow"
                hx-post="/dashboard/new"
                hx-trigger="submit"
                hx-target="#short-url-result"
                hx-swap="innerHTML"
              >
                <input
                  type="url"
                  name="originUrl"
                  placeholder="https://example.com/your-long-url"
                  class="flex-1 bg-transparent text-white placeholder-zinc-400 focus:outline-none text-sm text-base"
                  required
                />
                <button
                  type="submit"
                  class="bg-zinc-950 text-white font-semibold px-4 py-1.5 rounded hover:bg-yellow-500 hover:text-black transition text-base cursor-pointer"
                >
                  Shorten
                </button>
              </form>

              <div id="short-url-result" class="aspect-square text-center h-[200px] mx-auto my-4"></div>

              <form
                class="flex gap-2 bg-zinc-900/70 backdrop-blur-md rounded-xl p-4 shadow"
                hx-get="/dashboard/list"
                hx-target="#url-list"
                hx-trigger="submit"
                hx-params="*"
              >
                <input
                  type="search"
                  name="q"
                  placeholder="Search..."
                  class="flex-1 bg-transparent text-white placeholder-zinc-400 focus:outline-none text-sm text-base"
                />
                <button
                  type="submit"
                  class="bg-zinc-950 text-white font-semibold px-4 py-1.5 rounded hover:bg-yellow-500 hover:text-black transition text-base cursor-pointer"
                >
                  Search
                </button>
              </form>

              <div id="url-list" hx-get="/dashboard/list" hx-trigger="load" hx-swap="innerHTML"></div>
            </div>
          </main>

          <footer class="bg-zinc-900/30 w-full text-sm text-gray-400 mt-10">
            <div class="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 px-6 py-10 text-center md:text-left">
              <div>
                <h4 class="text-white font-semibold mb-2 tracking-tight">FOLLOW MY WORK AT</h4>
                <ul class="space-y-1">
                  <li><a class="hover:text-white transition" href="https://github.com/jorgechato" target="_blank">GitHub</a></li>
                  <li><a class="hover:text-white transition" href="https://www.linkedin.com/in/jorgechato" target="_blank">LinkedIn</a></li>
                  <li><a class="hover:text-white transition" href="https://x.com/jorgechato" target="_blank">X</a></li>
                </ul>
              </div>
              <div>
                <h4 class="text-white font-semibold mb-2 tracking-tight">SITE MAP</h4>
                <ul class="space-y-1">
                  <li><a class="hover:text-white transition" href="/">Home</a></li>
                  <li><a class="hover:text-white transition" href="https://accounts.jrg.tools/user">Account</a></li>
                </ul>
              </div>
            </div>
            <script>
              {`
    function copyToClipboard(text) {
      navigator.clipboard.writeText(text);
    }
  `}
            </script>
          </footer>
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
      return c.html(<div class="text-red-500">❌ Failed to create short URL.</div>);
    }

    const shortUrl = `https://${c.env.DOMAIN}/${res?.Alias}`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(shortUrl)}&size=160x160&bgcolor=0A0A0B&color=3f3f46`;

    return c.html(
      <button class="inline-block text-base cursor-pointer" onclick={`copyToClipboard('${shortUrl}')`}>
        <div class="flex flex-col items-center gap-2">
          <img src={qrUrl} alt="QR Code" class="mx-auto aspect-square w-[160px]" />
          <div class="text-yellow-400 font-semibold hover:text-yellow-400 transition">
            <span class="text-gray-300">
              {c.env.DOMAIN}
              /
            </span>
            <span class="font-bold text-lg">{res?.Alias}</span>
          </div>
        </div>
      </button>,
    );
  })

  .get('/list', zValidator('query', listSchema), async (c) => {
    const check = await requireAdmin(c);
    if (check !== true)
      return check;

    const { q, page, size }: { q?: string | undefined; page: number; size: number } = c.req.valid('query');
    const { error, list, count } = !q ? await getAllShortUrls(c, page, size) : await searchShortUrl(c, q, page, size);

    if (error) {
      return c.html(<div class="text-red-500">❌ Failed to load data.</div>);
    }

    const totalPages = Math.max(1, Math.ceil(count / size));

    return c.html(
      <div class="rounded-lg bg-zinc-900/70 backdrop-blur-sm shadow">
        {list.length === 0
          ? (
              <div class="p-4 text-gray-400 text-center">No results found.</div>
            )
          : (
              <>
                {list.map((item: any) => (
                  <div class="flex justify-between items-center px-4 py-3 hover:bg-zinc-900 transition">
                    <div class="flex flex-col min-w-0">
                      <a class="text-yellow-400 font-semibold text-sm" href={`/${item.Alias}`} target="_blank">
                        <span class="text-gray-300">
                          {c.env.DOMAIN}
                          /
                        </span>
                        <span class="ml-1 font-bold text-lg">{item.Alias}</span>
                      </a>
                      <div class="text-gray-500 text-xs truncate whitespace-nowrap overflow-hidden">{item.Origin}</div>
                      <div class="text-xs text-gray-500">
                        Hits:
                        {item.Hits}
                      </div>
                    </div>
                    <div>
                      <button
                        class="text-sm px-2 py-1 bg-zinc-950 text-white rounded hover:bg-white hover:text-black transition text-base cursor-pointer"
                        onclick={`copyToClipboard('https://${c.env.DOMAIN}/${item.Alias}')`}
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                ))}

                <div class="flex justify-between items-center px-4 py-3 text-sm text-gray-400 bg-zinc-900">
                  <button
                    hx-get={`/dashboard/list?q=${q}&page=${page - 1}`}
                    hx-target="#url-list"
                    hx-swap="innerHTML"
                    class={`px-3 py-1 rounded text-base cursor-pointer ${page <= 1 ? 'transparent cursor-not-allowed' : 'bg-zinc-950 hover:bg-white/80 hover:text-black transition'}`}
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
                    class={`px-3 py-1 rounded text-base cursor-pointer ${page >= totalPages ? 'transparent cursor-not-allowed' : 'bg-zinc-950 hover:bg-white/80 hover:text-black transition'}`}
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
