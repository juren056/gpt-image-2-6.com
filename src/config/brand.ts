// Stable for this identity; changes only when the brand artwork changes.
export const BRAND_ASSET_VERSION = 'pixel-peel-transparent-2';

export function brandAssetUrl(path: string) {
  return `${path}?v=${BRAND_ASSET_VERSION}`;
}

export const DEFAULT_APP_LOGO = brandAssetUrl('/logo.svg');
