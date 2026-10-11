import { createFileRoute } from '@tanstack/react-router';

import { getAuth } from '@/core/auth';
import { UTILITY_MODELS } from '@/config/creative-studio';
import {
  fetchImageForDownload,
  getImageDownloadFilename,
  readBoundedVectorResponse,
  validateEditableVectorSvg,
} from '@/modules/images/download';
import { getOwnedImageDownload } from '@/modules/images/service';
import { enforceMinIntervalRateLimit } from '@/lib/rate-limit';
import { respErr } from '@/lib/resp';

async function GET({
  request,
  params,
}: {
  request: Request;
  params: { id: string };
}) {
  try {
    const auth = getAuth();
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return respErr('Unauthorized', { status: 401 });
    }

    const limited = await enforceMinIntervalRateLimit(request, {
      intervalMs: 750,
      keyPrefix: 'image-download',
      extraKey: session.user.id,
    });
    if (limited) return limited;

    const requestedIndex = new URL(request.url).searchParams.get('index');
    if (
      requestedIndex !== null &&
      (!/^(0|[1-9]\d*)$/.test(requestedIndex) ||
        !Number.isSafeInteger(Number(requestedIndex)))
    ) {
      return respErr('Invalid image index', { status: 400 });
    }
    const image = await getOwnedImageDownload(
      params.id,
      session.user.id,
      requestedIndex === null ? 0 : Number(requestedIndex)
    );
    if (!image) {
      return respErr('Image not found', { status: 404 });
    }

    const upstream = await fetchImageForDownload(image.imageUrl);
    const contentType = upstream.headers.get('content-type') || 'image/png';
    if (image.model === UTILITY_MODELS.vectorize) {
      if (!contentType.toLowerCase().startsWith('image/svg+xml')) {
        return respErr('The vector service did not return SVG', {
          status: 502,
        });
      }
      const markup = validateEditableVectorSvg(
        await readBoundedVectorResponse(upstream)
      );
      const filename = getImageDownloadFilename(params.id, 'image/svg+xml');
      return new Response(markup, {
        headers: {
          'Cache-Control': 'private, no-store',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Content-Type': 'image/svg+xml; charset=utf-8',
          'X-Content-Type-Options': 'nosniff',
        },
      });
    }
    const filename = getImageDownloadFilename(params.id, contentType);
    const contentLength = upstream.headers.get('content-length');
    const headers = new Headers({
      'Cache-Control': 'private, no-store',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Type': contentType,
      'X-Content-Type-Options': 'nosniff',
    });
    if (contentLength) headers.set('Content-Length', contentLength);

    return new Response(upstream.body, {
      status: 200,
      headers,
    });
  } catch (error: unknown) {
    console.error('[image-download] failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      taskId: params.id,
    });
    return respErr('Unable to download this image right now', { status: 502 });
  }
}

export const Route = createFileRoute('/api/images/$id/download')({
  server: { handlers: { GET } },
});
