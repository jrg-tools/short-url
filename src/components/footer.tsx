import { Scripts } from '@/components/scripts';

export function Footer() {
  return (
    <footer class="bg-zinc-100/40 dark:bg-zinc-900/30 w-full text-sm mt-10">
      <div class="mx-auto w-full max-w-screen-xl p-4 px-6 py-6 lg:py-8">
        <div class="flex flex-row flex-wrap gap-16 sm:gap-8 justify-center">
          <div>
            <h4 class="text-black dark:text-white font-semibold mb-2 tracking-tight">FOLLOW MY WORK AT</h4>
            <ul class="flex flex-col gap-2 font-medium text-zinc-600 dark:text-zinc-400">
              <li><a class="dark:hover:text-white hover:text-black transition" href="https://github.com/jorgechato" target="_blank">GitHub</a></li>
              <li><a class="dark:hover:text-white hover:text-black transition" href="https://www.linkedin.com/in/jorgechato" target="_blank">LinkedIn</a></li>
              <li><a class="dark:hover:text-white hover:text-black transition" href="https://x.com/jorgechato" target="_blank">X</a></li>
            </ul>
          </div>
          <div>
            <h4 class="text-black dark:text-white font-semibold mb-2 tracking-tight">SITE MAP</h4>
            <ul class="flex flex-col gap-2 font-medium text-zinc-600 dark:text-zinc-400">
              <li><a class="dark:hover:text-white hover:text-black transition" href="/">Home</a></li>
              <li><a class="dark:hover:text-white hover:text-black transition" href="https://accounts.jrg.tools/user">Account</a></li>
            </ul>
          </div>
        </div>
        <hr class="my-6 border-zinc-200/60 dark:border-zinc-800/60 sm:mx-auto lg:my-8" />
        <div class="sm:flex sm:items-center sm:justify-between">
          <span class="text-sm text-zinc-300 dark:text-zinc-700 sm:text-center">
            &copy;
            {' '}
            Jorge Chato Astrain
            {' '}
            2024 -&nbsp;
            {new Date().getFullYear()}
&nbsp;
          </span>
        </div>
      </div>
      <Scripts />
    </footer>
  );
};
