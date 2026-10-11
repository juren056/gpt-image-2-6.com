import { createFileRoute } from '@tanstack/react-router';

import { getImageBucket, MEDIA_KEY_PATTERN } from '@/core/storage/r2-binding';

export async function serveUploadedImage(key: string, method = 'GET') {
  if (!MEDIA_KEY_PATTERN.test(key))
    return new Response('Not found', { status: 404 });
  const bucket = getImageBucket();
  if (!bucket)
    return new Response('Image storage unavailable', { status: 503 });
  const object = await bucket.get(`uploads/${key}`);
  if (!object) return new Response('Not found', { status: 404 });
  const contentType = object.httpMetadata?.contentType;
  if (
    !contentType ||
    !['image/jpeg', 'image/png', 'image/webp'].includes(contentType)
  ) {
    return new Response('Not found', { status: 404 });
  }
  return new Response(method === 'HEAD' ? null : object.body, {
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': 'inline',
      'Cache-Control': 'private, max-age=3600',
      ETag: object.httpEtag,
      'X-Content-Type-Options': 'nosniff',
      'X-Robots-Tag': 'noindex, nofollow, noarchive',
      'Referrer-Policy': 'no-referrer',
    },
  });
}

export const Route = createFileRoute('/api/storage/media/$key')({
  server: {
    handlers: {
      GET: ({ params }) => serveUploadedImage(params.key),
      HEAD: ({ params }) => serveUploadedImage(params.key, 'HEAD'),
    },
  },
});
