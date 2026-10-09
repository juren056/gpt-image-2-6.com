import { createFileRoute } from '@tanstack/react-router';

import { verifyFalWebhookToken } from '@/modules/images/fal-webhook';
import { completeImageTaskFromFalWebhook } from '@/modules/images/service';

async function POST({ request }: { request: Request }) {
  const url = new URL(request.url);
  const localTaskId = url.searchParams.get('task') || '';
  const token = url.searchParams.get('token') || '';

  if (!verifyFalWebhookToken(localTaskId, token)) {
    return Response.json({ error: 'Invalid callback token' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const providerTaskId =
      typeof body?.request_id === 'string' ? body.request_id : '';
    if (!providerTaskId) {
      return Response.json({ error: 'Missing request id' }, { status: 400 });
    }

    await completeImageTaskFromFalWebhook({
      localTaskId,
      providerTaskId,
      status: body?.status,
      payload: body?.payload,
      error: body?.error,
    });
    return Response.json({ ok: true });
  } catch (error) {
    console.error('[images] Fal webhook failed', {
      taskId: localTaskId,
      message: error instanceof Error ? error.message : 'Unknown error',
    });
    return Response.json(
      { error: 'Callback processing failed' },
      { status: 500 }
    );
  }
}

export const Route = createFileRoute('/api/images/fal-webhook')({
  server: { handlers: { POST } },
});
