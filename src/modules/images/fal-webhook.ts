import { createHmac, timingSafeEqual } from 'node:crypto';

import { envConfigs } from '@/config';

const TOKEN_CONTEXT = 'fal-image-webhook-v1';

export function createFalWebhookToken(taskId: string): string | null {
  const secret = envConfigs.auth_secret;
  if (!secret) return null;
  return createHmac('sha256', secret)
    .update(`${TOKEN_CONTEXT}:${taskId}`)
    .digest('hex');
}

export function verifyFalWebhookToken(
  taskId: string,
  candidate: string
): boolean {
  const expected = createFalWebhookToken(taskId);
  if (!expected || !candidate || expected.length !== candidate.length) {
    return false;
  }

  return timingSafeEqual(Buffer.from(expected), Buffer.from(candidate));
}

export function buildFalWebhookUrl(
  appUrl: string,
  taskId: string
): string | undefined {
  const token = createFalWebhookToken(taskId);
  if (!token) return undefined;

  try {
    const url = new URL('/api/images/fal-webhook', appUrl);
    if (url.protocol !== 'https:' || url.hostname === 'localhost') {
      return undefined;
    }
    url.searchParams.set('task', taskId);
    url.searchParams.set('token', token);
    return url.toString();
  } catch {
    return undefined;
  }
}
