const MAX_REFERENCE_BYTES = 20 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

function isBlockedHostname(hostname: string) {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, '');
  return (
    host === 'localhost' ||
    host.endsWith('.local') ||
    host === '0.0.0.0' ||
    host === '::1' ||
    host.startsWith('127.') ||
    host.startsWith('10.') ||
    host.startsWith('192.168.') ||
    host.startsWith('169.254.') ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(host) ||
    host.startsWith('fc') ||
    host.startsWith('fd') ||
    host.startsWith('fe80:')
  );
}

export function validateRemoteImageUrl(value: string) {
  const url = new URL(value);
  if (url.protocol !== 'https:' || isBlockedHostname(url.hostname)) {
    throw new Error('Reference images must use a public HTTPS URL');
  }
  if (url.username || url.password) {
    throw new Error('Reference image URL credentials are not allowed');
  }
  return url;
}

export async function downloadRemoteImage(value: string) {
  let url = validateRemoteImageUrl(value);
  for (let redirect = 0; redirect <= 2; redirect += 1) {
    const response = await fetch(url, {
      redirect: 'manual',
      signal: AbortSignal.timeout(15_000),
    });
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location');
      if (!location || redirect === 2)
        throw new Error('Invalid image redirect');
      url = validateRemoteImageUrl(new URL(location, url).toString());
      continue;
    }
    if (!response.ok)
      throw new Error(`Reference image returned ${response.status}`);
    const contentType = (response.headers.get('content-type') || '').split(
      ';'
    )[0];
    if (!ALLOWED_IMAGE_TYPES.has(contentType)) {
      throw new Error('Reference file must be JPEG, PNG, or WebP');
    }
    const declaredSize = Number(response.headers.get('content-length') || 0);
    if (declaredSize > MAX_REFERENCE_BYTES)
      throw new Error('Reference image exceeds 20 MB');
    const bytes = new Uint8Array(await response.arrayBuffer());
    if (bytes.byteLength > MAX_REFERENCE_BYTES)
      throw new Error('Reference image exceeds 20 MB');
    return {
      bytes,
      contentType,
      filename: `reference.${contentType.split('/')[1]}`,
    };
  }
  throw new Error('Unable to download reference image');
}
