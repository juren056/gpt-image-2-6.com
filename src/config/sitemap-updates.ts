import {
  PUBLIC_MODEL_PAGES,
  PUBLIC_TOOL_PAGES,
} from '@/config/public-creative';

// Recorded substantive changes, not a build/request timestamp. See
// docs/sitemap-refresh.md for the reviewed source revisions behind these dates.
const contentUpdates = new Map<string, string>([
  ['/prompts/chinese', '2026-10-13'],
  ['/free', '2026-10-13'],
  ['/contact', '2026-10-13'],
  ['/', '2026-10-13'],
  ['/pricing', '2026-10-13'],
  ['/vs-2', '2026-10-13'],
  ['/about', '2026-10-13'],
  ['/privacy-policy', '2026-10-13'],
  ['/models', '2026-10-12'],
  ...PUBLIC_MODEL_PAGES.filter(
    (page) => !page.seoTitle && !['/', '/nano-banana-pro'].includes(page.path)
  ).map((page): [string, string] => [page.path, '2026-10-12']),
  ...PUBLIC_TOOL_PAGES.filter(
    (page) => !page.seoTitle && page.path !== '/image-background-remover'
  ).map((page): [string, string] => [page.path, '2026-10-12']),
]);

export function sitemapLastModified(
  path: string,
  previous?: string
): string | undefined {
  const updated = contentUpdates.get(path || '/');
  if (!updated) return previous;
  // A later editorial/DB date must never be replaced by this historical record.
  return previous && Date.parse(previous) > Date.parse(updated)
    ? previous
    : updated;
}
