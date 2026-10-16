import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';

// Nitro 3's standalone prerender build does not retain the Vite SSR service.
// Reuse that service after the complete Worker build instead: this renders the
// same app, router and locale middleware without a live Worker or user cookies.
const origin = process.env.VITE_APP_URL || 'https://nanobanana21pro.com';
const canonicalOrigin = origin.replace(/\/$/, '');
const publicDir = resolve(process.env.NITRO_OUTPUT_DIR || '.output', 'public');
const paths = JSON.parse(
  await readFile('src/config/public-prerender-paths.json', 'utf8')
);
const app = (
  await import(
    pathToFileURL(
      resolve(
        process.env.NITRO_BUILD_DIR || 'node_modules/.nitro',
        'vite/services/ssr/index.js'
      )
    ).href
  )
).default;
const agentDocuments = [
  '/llms.txt',
  '/llms-full.txt',
  '/index.md',
  '/product.md',
  '/pricing.md',
  '/faq.md',
  '/evaluation-method.md',
  '/prompts.md',
];

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
  for (const path of agentDocuments) {
    await render(path, path.endsWith('.md') ? 'md' : 'txt');
  }
  // HTML is public; private and API routes have no files and fall through to the Worker.
  await writeFile(
    resolve(publicDir, '_headers'),
    '/assets/*\n  Cache-Control: public, max-age=31536000, immutable\n' +
      '/*.html\n  Cache-Control: public, max-age=0, must-revalidate\n  X-Content-Type-Options: nosniff\n' +
      '/sitemap.xml\n  Cache-Control: public, max-age=0, must-revalidate\n  Content-Type: application/xml; charset=utf-8\n' +
      '/robots.txt\n  Cache-Control: public, max-age=3600, must-revalidate\n  Content-Type: text/plain; charset=utf-8\n' +
      `/llms.txt\n  Cache-Control: public, max-age=3600, must-revalidate\n  Content-Type: text/plain; charset=utf-8\n  X-Content-Type-Options: nosniff\n  Link: <${canonicalOrigin}/llms.txt>; rel="canonical", <${canonicalOrigin}/llms.txt>; rel="describedby"\n` +
      `/llms-full.txt\n  Cache-Control: public, max-age=3600, must-revalidate\n  Content-Type: text/plain; charset=utf-8\n  X-Content-Type-Options: nosniff\n  Link: <${canonicalOrigin}/llms-full.txt>; rel="canonical", <${canonicalOrigin}/llms.txt>; rel="describedby"\n` +
      '/*.md\n  Cache-Control: public, max-age=3600, must-revalidate\n  Content-Type: text/markdown; charset=utf-8\n  X-Content-Type-Options: nosniff\n' +
      `/index.md\n  Link: <${canonicalOrigin}/>; rel="canonical", <${canonicalOrigin}/llms.txt>; rel="describedby"\n` +
      `/product.md\n  Link: <${canonicalOrigin}/>; rel="canonical", <${canonicalOrigin}/llms.txt>; rel="describedby"\n` +
      `/pricing.md\n  Link: <${canonicalOrigin}/pricing>; rel="canonical", <${canonicalOrigin}/llms.txt>; rel="describedby"\n` +
      `/faq.md\n  Link: <${canonicalOrigin}/>; rel="canonical", <${canonicalOrigin}/llms.txt>; rel="describedby"\n` +
      `/evaluation-method.md\n  Link: <${canonicalOrigin}/evaluation-method>; rel="canonical", <${canonicalOrigin}/llms.txt>; rel="describedby"\n` +
      `/prompts.md\n  Link: <${canonicalOrigin}/prompts>; rel="canonical", <${canonicalOrigin}/llms.txt>; rel="describedby"\n`
  );
  console.log(
    `Static output complete: ${completed} public pages, sitemap, robots and ${agentDocuments.length} agent documents.`
  );
  process.exit(0);
} catch (error) {
  console.error(error);
  process.exit(1);
}
