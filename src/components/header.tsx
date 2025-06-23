import type { PropsWithChildren } from 'hono/jsx';

const items: {
  name: string;
  url: string;
  target?: string;
}[] = [
];

export function Header({ name }: PropsWithChildren<{ name: string }>) {
  return (
    <header id="header-nav" class="fixed top-0 w-full px-6 py-4 z-50">
      <div class="max-w-7xl mx-auto flex items-center justify-between gap-16">
        <a
          href="/dashboard"
          class="relative z-10 flex items-center gap-2 flex-row"
        >
          <img src="https://jorgechato.com/logo.webp" loading="lazy" class="w-9" alt="Logo" />
          <h2 class="text-lg font-bold whitespace-nowrap">
            {name}
          </h2>
        </a>

        <nav
          id="header-menu"
          class="w-full flex flex-col items-end gap-2"
        >
          { items.map(item => (
            <a
              key={item.name}
              class="hover:opacity-100 transition-opacity duration-300 cursor-pointer font-semibold"
              href={item.url}
              target={item.target}
            >
              {item.name}
            </a>
          ))}
          <div id="clerk-header" class="w-fit"></div>
        </nav>

      </div>
    </header>
  );
};
