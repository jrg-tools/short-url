import type { FC } from 'hono/jsx';
import { Style } from '@/components/style';

export const Layout: FC = (props) => {
  return (
    <html lang="en" class="bg-zinc-50 text-black dark:bg-zinc-950 dark:text-white">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <title>
          {props.title}
          {' '}
          | Dashboard
        </title>
        <link rel="icon" href="https://jorgechato.com/favicon.ico" />
        <script src="https://unpkg.com/htmx.org@2.0.4"></script>
        <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>

        <script
          async
          crossorigin="anonymous"
          data-clerk-publishable-key={props.CLERK_PUBLISHABLE_KEY}
          src={`${props.CLERK_ACCOUNTS_URL}/npm/@clerk/clerk-js@5/dist/clerk.browser.js`}
          type="text/javascript"
        />
        <Style />
      </head>
      <body class="min-h-screen flex flex-col justify-between items-center">
        {props.children}
      </body>
    </html>
  );
};
