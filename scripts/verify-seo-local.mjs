const base = process.argv[2] || 'http://127.0.0.1:4321';

function decode(value) {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function one(html, pattern) {
  const match = html.match(pattern);
  return match ? decode(match[1].trim()) : '';
}

function all(html, pattern) {
  return [...html.matchAll(pattern)].map((match) => decode(match[1].trim()));
}

const sitemapResponse = await fetch(base + '/sitemap.xml');
if (!sitemapResponse.ok)
  throw new Error('Sitemap returned ' + sitemapResponse.status);
const sitemap = await sitemapResponse.text();
const productionUrls = all(sitemap, /<loc>([^<]+)<\/loc>/g);
const paths = [
  ...new Set(productionUrls.map((value) => new URL(value).pathname)),
];
const records = [];

for (const path of paths) {
  const response = await fetch(base + path, { redirect: 'manual' });
  const html = await response.text();
  records.push({
    path,
    status: response.status,
    title: one(html, /<title[^>]*>([\s\S]*?)<\/title>/i),
    description:
      one(
        html,
        /<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["'][^>]*>/i
      ) ||
      one(
        html,
        /<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["'][^>]*>/i
      ),
    canonical: one(
      html,
      /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["'][^>]*>/i
    ),
    robots: one(
      html,
      /<meta[^>]+name=["']robots["'][^>]+content=["']([^"']*)["'][^>]*>/i
    ),
    h1s: all(html, /<h1\b[^>]*>([\s\S]*?)<\/h1>/gi).map((value) =>
      value
        .replace(/<[^>]+>/g, '')
        .replace(/\s+/g, ' ')
        .trim()
    ),
    hrefs: all(html, /<a\b[^>]+href=["']([^"']+)["'][^>]*>/gi),
  });
}

const indexable = records.filter(
  (record) => !record.robots.includes('noindex')
);
const duplicateValues = (key) => {
  const groups = new Map();
  for (const record of indexable) {
    const value = record[key];
    if (!value) continue;
    const current = groups.get(value) || [];
    current.push(record.path);
    groups.set(value, current);
  }
  return [...groups.entries()].filter((entry) => entry[1].length > 1);
};

const sitemapPathSet = new Set(paths);
const inbound = new Map(paths.map((path) => [path, 0]));
let promptQueryLinks = 0;
for (const record of records) {
  for (const href of record.hrefs) {
    if (href.includes('?prompt=')) promptQueryLinks += 1;
    try {
      const target = new URL(href, base);
      if (target.origin !== new URL(base).origin) continue;
      let targetPath = target.pathname.replace(/\/$/, '') || '/';
      if (sitemapPathSet.has(targetPath) && targetPath !== record.path) {
        inbound.set(targetPath, (inbound.get(targetPath) || 0) + 1);
      }
    } catch {}
  }
}

const failures = records.filter((record) => record.status !== 200);
const missingTitles = records.filter((record) => !record.title);
const missingDescriptions = records.filter((record) => !record.description);
const badH1 = records.filter((record) => record.h1s.length !== 1);
const badCanonical = records.filter((record) => {
  if (!record.canonical) return true;
  const canonicalPath =
    new URL(record.canonical).pathname.replace(/\/$/, '') || '/';
  const expectedPath = record.path.replace(/\/$/, '') || '/';
  return canonicalPath !== expectedPath;
});
const orphans = records
  .filter(
    (record) => record.path !== '/' && (inbound.get(record.path) || 0) === 0
  )
  .map((record) => record.path);

const zhModelResponse = await fetch(base + '/zh/flux-2-pro');
const zhModelHtml = await zhModelResponse.text();
const zhModelRobots = one(
  zhModelHtml,
  /<meta[^>]+name=["']robots["'][^>]+content=["']([^"']*)["'][^>]*>/i
);
const zhModelCanonical = one(
  zhModelHtml,
  /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["'][^>]*>/i
);

const report = {
  sitemapUrls: paths.length,
  indexablePages: indexable.length,
  failures,
  missingTitles: missingTitles.map((record) => record.path),
  missingDescriptions: missingDescriptions.map((record) => record.path),
  duplicateTitles: duplicateValues('title'),
  duplicateDescriptions: duplicateValues('description'),
  badH1: badH1.map((record) => ({
    path: record.path,
    count: record.h1s.length,
  })),
  badCanonical: badCanonical.map((record) => record.path),
  orphans,
  promptQueryLinks,
  englishOnlyZhFallback: {
    robots: zhModelRobots,
    canonical: zhModelCanonical,
  },
};

console.log(JSON.stringify(report, null, 2));

const failed =
  failures.length ||
  missingTitles.length ||
  missingDescriptions.length ||
  duplicateValues('title').length ||
  duplicateValues('description').length ||
  badH1.length ||
  badCanonical.length ||
  orphans.length ||
  // Prompt links are intentional workflow handoffs; canonical metadata is
  // checked above. Their presence alone does not create an SEO failure.
  !zhModelRobots.includes('noindex') ||
  new URL(zhModelCanonical).pathname !== '/flux-2-pro';

if (failed) process.exitCode = 1;
