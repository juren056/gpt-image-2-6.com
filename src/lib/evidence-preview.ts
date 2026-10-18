// Only the immutable recorded-evidence collection has these generated variants.
// Keep the original PNG and existing 640px preview URLs intact.
export function evidencePreviewSrcSet(preview: string): string | undefined {
  if (!/^\/evidence\/2026-10-13\/NB-\d{2}\.webp$/.test(preview))
    return undefined;
  return `${preview.replace(/\.webp$/, '-320.webp')} 320w, ${preview} 640w`;
}

export function homepagePhotoSrcSet(src: string): string | undefined {
  const [path, query] = src.split('?');
  if (
    !/^\/images\/banana21\/(feature-(text|ratios|references)|case-(product|localize|character|social))\.webp$/.test(
      path
    )
  )
    return undefined;
  const suffix = query ? `?${query}` : '';
  return `${path.replace(/\.webp$/, '-384.webp')}${suffix} 384w, ${path.replace(/\.webp$/, '-640.webp')}${suffix} 640w, ${src} 1280w`;
}
