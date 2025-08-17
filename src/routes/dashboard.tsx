import { clerkMiddleware } from '@hono/clerk-auth';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { jsxRenderer } from 'hono/jsx-renderer';
import { Footer } from '@/components/footer';
import { Header } from '@/components/header';
import { Layout } from '@/components/layout';
import { env } from '@/lib/env';
import { listSchema, originUrlSchema } from '@/lib/validator';
import { requireAuth } from '@/middleware/auth';
import { createShortUrl, getAllShortUrls, searchShortUrl } from '@/repository/actions';

const TITLE = 'X - Short URL';

const dashboard = new Hono()
  .basePath('/dashboard')
  .use('*', clerkMiddleware())
  .use((c, next) => {
    const { CLERK_PUBLISHABLE_KEY, CLERK_ACCOUNTS_URL } = env;

    if (!c.req.header('hx-request')) {
      return jsxRenderer(({ children }) => (
        <Layout
          CLERK_PUBLISHABLE_KEY={CLERK_PUBLISHABLE_KEY}
          CLERK_ACCOUNTS_URL={CLERK_ACCOUNTS_URL}
          title={TITLE}
        >
          <Header name={TITLE} />
          <main class="w-full max-w-3xl p-6">
            {children}
          </main>
          <Footer />
          <div id="toast" class="fixed bottom-4 right-4 z-50 hidden px-4 py-2 bg-zinc-100 dark:bg-white/10 text-black dark:text-white text-sm font-bold rounded shadow transition-opacity duration-500">
            📋 Copied to clipboard!
          </div>
        </Layout>
      ))(c, next);
    }
    return next();
  })

  .get('/', requireAuth(), async (c) => {
    return c.render(
      <div class="mt-24 space-y-10">
        <form
          class="flex items-center gap-4 bg-zinc-100 dark:bg-zinc-900/70 backdrop-blur-md rounded-xl p-4 dark:shadow"
          hx-post="/dashboard/new"
          hx-trigger="submit"
          hx-target="#short-url-result"
          hx-swap="innerHTML"
          hx-indicator="#short-url-loading"
          hx-on-htmx-before-request="document.querySelector('#short-url-result').innerHTML = ''"
        >
          <input
            type="url"
            name="originUrl"
            placeholder="https://example.com/your-long-url"
            class="flex-1 bg-transparent text-black placeholder-zinc-600 dark:text-white dark:placeholder-zinc-400 focus:outline-none text-sm text-base"
            required
          />
          <input type="hidden" name="theme" id="theme-input" value="light" />
          <button
            type="submit"
            class="bg-zinc-200 dark:bg-zinc-950 text-black dark:text-white font-semibold px-4 py-1.5 rounded hover:bg-yellow-500 hover:text-black transition text-base cursor-pointer"
            onclick="
      const isDark = document.documentElement.classList.contains('dark') ||
                     window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.getElementById('theme-input').value = isDark ? 'dark' : 'light';
    "
          >
            ✂️ Shorten
          </button>
        </form>

        <div class="relative aspect-square text-center h-[200px] mx-auto my-4">
          <div
            id="short-url-loading"
            class="htmx-indicator absolute inset-0"
          >
            <div class=" animate-pulse rounded-xl flex flex-col items-center justify-center gap-4 z-10">
              <div class="bg-zinc-200 dark:bg-zinc-800 rounded aspect-square w-[160px]"></div>
              <div class="h-4 dark:bg-zinc-800 bg-zinc-200 rounded w-50"></div>
            </div>
          </div>

          <div id="short-url-result" class="z-0 relative"></div>
          <div id="short-url-error" class="z-0 relative text-red-500 hidden">❌ Failed to create short URL.</div>
        </div>

        <form
          class="flex gap-2 dark:bg-zinc-900/70 bg-zinc-100 backdrop-blur-md rounded-xl p-4 dark:shadow"
          hx-get="/dashboard/list"
          hx-target="#url-list-result"
          hx-trigger="submit"
          hx-params="*"
        >
          <input
            type="search"
            name="q"
            placeholder="Search..."
            class="flex-1 bg-transparent text-black dark:text-white placeholder-zinc-600 dark:placeholder-zinc-400 focus:outline-none text-sm text-base"
          />
          <button
            type="submit"
            class="bg-zinc-200 dark:bg-zinc-950 dark:text-white text-black font-semibold px-4 py-1.5 rounded hover:bg-yellow-500 hover:text-black transition text-base cursor-pointer"
          >
            🔍 Search
          </button>
        </form>

        <div id="url-list-result" hx-trigger="load" hx-swap="innerHTML"></div>
        <div class="text-red-500 hidden" id="url-list-error">❌ Failed to load data.</div>
      </div>,
    );
  })

  .post('/new', requireAuth(), zValidator('form', originUrlSchema), async (c) => {
    const { originUrl, theme } = c.req.valid('form');
    const res = await createShortUrl(originUrl);
    const { DOMAIN } = env;

    const shortUrl = `https://${DOMAIN}/${res?.Alias}`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(shortUrl)}&size=160x160&bgcolor=${theme === 'dark' ? '0A0A0B' : 'FAFAFA'}&color=${theme === 'dark' ? '3f3f46' : 'd4d4d8'}`;

    return c.html(
      <button class="inline-block text-base cursor-pointer" onclick={`copyToClipboard('${shortUrl}')`}>
        <div class="flex flex-col items-center gap-2">
          <img src={qrUrl} alt="QR Code" class="mx-auto aspect-square w-[160px]" />
          <div class="text-yellow-400 font-semibold hover:text-yellow-400 transition">
            <span class="text-gray-600 dark:text-gray-300">
              {DOMAIN}
              /
            </span>
            <span class="font-bold text-lg">{res?.Alias}</span>
          </div>
        </div>
      </button>,
    );
  })

  .get('/list', requireAuth(), zValidator('query', listSchema), async (c) => {
    const { DOMAIN } = env;
    const { q, page, size }: { q: string; page: number; size: number } = c.req.valid('query');

    const { list, count } = !q ? await getAllShortUrls(page, size) : await searchShortUrl(q, page, size);

    const totalPages = Math.max(1, Math.ceil(count / size));

    return c.html(
      <div class="rounded-lg bg-zinc-100 dark:bg-zinc-900/70 backdrop-blur-sm dark:shadow">
        {list.length === 0
          ? (
              <div class="p-4 text-gray-400 text-center">No results found.</div>
            )
          : (
              <>
                {list.map((item: any) => (
                  <div class="flex justify-between items-center px-4 py-3 dark:hover:bg-zinc-900  hover:bg-zinc-200/30 transition w-full" id={`item-${item.Alias}`}>
                    <button
                      class="flex flex-col min-w-0 w-full text-left cursor-pointer"
                      onclick={`copyToClipboard('https://${DOMAIN}/${item.Alias}')`}
                    >
                      <div class="text-yellow-400 font-semibold text-sm">
                        <span class="text-zinc-700 dark:text-gray-300">
                          {DOMAIN}
                          /
                        </span>
                        <span class="font-bold text-lg">{item.Alias}</span>
                      </div>
                      <div class="text-gray-500 text-xs truncate whitespace-nowrap overflow-hidden w-full">{item.Origin}</div>
                      <div class="text-xs text-gray-500">
                        Hits:
                        {' '}
                        {item.Hits}
                      </div>
                    </button>
                    <div class="flex gap-4">
                      <a
                        class="text-sm px-4 py-4 bg-zinc-200 dark:bg-zinc-950 text-white rounded hover:bg-white hover:text-black transition text-base cursor-pointer"
                        href={`/${item.Alias}`}
                        target="_blank"
                      >
                        🔗
                      </a>
                      <button
                        class="text-sm px-2 py-1 bg-red-600 dark:bg-rose-800 text-white rounded hover:bg-red-700 dark:hover:bg-rose-900 transition text-base cursor-pointer"
                        hx-delete={`/ops/${item.Alias}`}
                        hx-confirm={`Are you sure you want to delete ${item.Alias}?`}
                        hx-target={`#item-${item.Alias}`}
                        hx-swap="delete"
                      >
                        ☠️
                      </button>
                    </div>
                  </div>
                ))}

                <div class="flex justify-between items-center px-4 py-3 text-sm text-gray-400 bg-zinc-100 dark:bg-zinc-900">
                  <button
                    hx-get={`/dashboard/list?q=${q}&page=${page - 1}`}
                    hx-target="#url-list-result"
                    hx-swap="innerHTML"
                    class={`px-3 py-1 rounded text-base cursor-pointer ${page <= 1 ? 'transparent cursor-not-allowed' : 'bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-950 dark:hover:bg-white/80 hover:text-black transition'}`}
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
                    hx-target="#url-list-result"
                    hx-swap="innerHTML"
                    class={`px-3 py-1 rounded text-base cursor-pointer ${page >= totalPages ? 'transparent cursor-not-allowed' : 'bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-950 dark:hover:bg-white/80 hover:text-black transition'}`}
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
