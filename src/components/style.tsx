export function Style() {
  return (
    <style>
      {`
              @font-face {
                font-family: 'Inter Variable';
                font-style: normal;
                font-display: auto;
                font-weight: 100 900;
                src: url(https://cdn.jsdelivr.net/fontsource/fonts/inter:vf@latest/latin-wght-normal.woff2) format('woff2-variations');
              }

#header-nav {
    animation: blur linear both;
    animation-timeline: scroll();
    animation-range: 0 500px;
}

#header-menu {
    @apply gap-8;
}

::-webkit-scrollbar {
    width: 8px;
}
::-webkit-scrollbar-track {
    background: transparent;
    backdrop-filter: blur(30px);
    border-radius: 5px;
}
::-webkit-scrollbar-thumb {
    background: rgba(var(--color-zinc-400), 0.3);
    backdrop-filter: blur(30px);
    border-radius: 5px;
}
::-webkit-scrollbar-thumb:hover {
    background: rgba(var(--color-zinc-400), 0.5);
}
@keyframes blur {
    to {
        box-shadow:
        0px 5px 50px -5px rgba(var(--color-zinc-400), 0.1),
        0px 0px 0 1px rgba(var(--color-zinc-400), 0.3);
        background: rgba(var(--color-zinc-400), 0.3);
        backdrop-filter: blur(30px);
    }
}
            `}
    </style>
  );
}
