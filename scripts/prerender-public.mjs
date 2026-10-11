import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';

// Nitro 3's standalone prerender build does not retain the Vite SSR service.
// Reuse that service after the complete Worker build instead: this renders the
// same app, router and locale middleware without a live Worker or user cookies.
const origin = process.env.VITE_APP_URL || 'https://nanobanana21pro.com';
const publicDir = resolve('.output/public');
const paths = JSON.parse(
  await readFile('src/config/public-prerender-paths.json', 'utf8')
);
const app = (
  await import(
    pathToFileURL(resolve('node_modules/.nitro/vite/services/ssr/index.js'))
      .href
  )
).default;

if (!Array.isArray(paths) || new Set(paths).size !== paths.length) {
  throw new Error('Public prerender paths must be a unique array.');
}
for (const path of paths) {
  if (
    !/^\/[a-z0-9/-]*$/.test(path) ||
    path.includes('..') ||
    /\/(settings|admin|sign-in|sign-up)(\/|$)/.test(path) ||
    /\/api\//.test(path)
  ) {
    throw new Error(`Unsafe or private prerender path: ${path}`);
  }
}

async function render(path, extension) {
  const response = await app.fetch(
    new Request(new URL(path, origin), {
      headers: { Accept: extension === 'html' ? 'text/html' : '*/*' },
    })
  );
  const text = await response.text();
  if (response.status !== 200) {
    throw new Error(`Prerender ${path}: HTTP ${response.status}`);
  }
  if (
    extension === 'html' &&
    (!/<title>[^<]+<\/title>/.test(text) ||
      !/<h1\b/.test(text) ||
      !/rel="canonical"/.test(text))
  ) {
    throw new Error(`Prerender ${path}: missing page content or SEO metadata`);
  }
  if (response.headers.has('set-cookie')) {
    throw new Error(`Prerender ${path}: attempted to set a user cookie`);
  }
  const file = resolve(
    publicDir,
    extension === 'html'
      ? `${path === '/' ? 'index' : path.slice(1)}.html`
      : path.slice(1)
  );
  if (!file.startsWith(publicDir + sep))
    throw new Error('Output escaped public directory');
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, text, 'utf8');
}

try {
  let completed = 0;
  for (const path of paths) {
    await render(path, 'html');
    completed++;
    if (completed % 100 === 0)
      console.log(`Static pages: ${completed}/${paths.length}`);
  }
  await render('/sitemap.xml', 'xml');
  await render('/robots.txt', 'txt');
  // HTML is public; private and API routes have no files and fall through to the Worker.
  await writeFile(
    resolve(publicDir, '_headers'),
    '/assets/*\n  Cache-Control: public, max-age=31536000, immutable\n' +
      '/*.html\n  Cache-Control: public, max-age=0, must-revalidate\n  X-Content-Type-Options: nosniff\n'
  );
  console.log(
    `Static output complete: ${completed} public pages, sitemap and robots.`
  );
  process.exit(0);
} catch (error) {
  console.error(error);
  process.exit(1);
}
