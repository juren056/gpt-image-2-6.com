// Retain legacy video tools while focusing organic discovery on images.
// Crawlers must still be allowed to read these pages' noindex directives.
export const SEARCH_EXCLUDED_PATHS = new Set([
  '/ai-video-generator',
  '/minimax-h3',
  '/wan-3-0',
  '/seedance-2-5',
  '/seedance-2-5-draft-mode',
]);

export function isSearchExcludedPath(path: string): boolean {
  return SEARCH_EXCLUDED_PATHS.has(path.replace(/\/$/, '') || '/');
}
