export function Scripts() {
  return (
    <>
      <script dangerouslySetInnerHTML={{
        __html: `
    function copyToClipboard(text) {
      navigator.clipboard.writeText(text).then(function () {
        var toast = document.getElementById('toast');
        if (!toast) return;
        toast.classList.remove('hidden');
        toast.classList.add('opacity-100');
        setTimeout(function () {
          toast.classList.add('opacity-0');
        }, 1500);
        setTimeout(function () {
          toast.classList.add('hidden');
          toast.classList.remove('opacity-0');
          toast.classList.remove('opacity-100');
        }, 2000);
      });
    }
  `,
      }}
      />
      <script dangerouslySetInnerHTML={{
        __html: `
              window.addEventListener('load', async function () {
                await Clerk.load();

                // This is the equivalent of getToken({ skipCache: true })
                document.body.addEventListener('htmx:configRequest', async function(evt) {
                    // Get fresh token (equivalent to skipCache: true)
                    const token = await Clerk.session?.getToken({ skipCache: true });

                    if (token) {
                      // Add fresh auth header to every HTMX request
                      evt.detail.headers['Authorization'] = 'Bearer ' + token;
                    }

                    // Also add cache-busting headers
                    evt.detail.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
                    evt.detail.headers['Pragma'] = 'no-cache';
                });
              });
            `,
      }}
      />

      <script dangerouslySetInnerHTML={{
        __html: `
  window.addEventListener('load', async function () {
    await Clerk.load()

    if (Clerk.user) {
      document.getElementById('clerk-header').innerHTML = '<div id="user-button"></div>'

      const userButtonDiv = document.getElementById('user-button')

      Clerk.mountUserButton(userButtonDiv)
    }
  })
            `,
      }}
      />
    </>
  );
}
