import { createHmac, timingSafeEqual } from 'node:crypto';
import { createFileRoute } from '@tanstack/react-router';

import { getAuth } from '@/core/auth';
import { AUTH_SECRET_PLACEHOLDER, envConfigs } from '@/config';
import { getAllConfigs } from '@/modules/config/service';
import {
  claimAnonymousImage,
  prepareAnonymousImage,
  queryAnonymousImage,
  submitAnonymousImage,
  validateAnonymousImageInput,
} from '@/modules/images/service';
import { getUuid } from '@/lib/hash';
import { ANONYMOUS_IMAGE_GENERATION_ENABLED } from '@/lib/product-policy';
import {
  enforceMinIntervalRateLimit,
  releaseDailyBudgetReservation,
  releaseRateLimitReservation,
  reserveDailyDistributedBudget,
  reserveMinIntervalRateLimit,
  type DailyBudgetReservation,
  type RateLimitReservation,
} from '@/lib/rate-limit';
import { respData, respErr } from '@/lib/resp';
import { verifyTurnstileToken } from '@/lib/turnstile';

const VISITOR_COOKIE = 'image-studio_visitor';
const DEVICE_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;
const IP_WINDOW_MS = 24 * 60 * 60 * 1000;
const TOKEN_TTL_MS = 30 * 60 * 1000;
const ABUSE_WINDOW_MS = 3_000;
const DEFAULT_HOURLY_BUDGET = 5;
const DEFAULT_DAILY_BUDGET = 25;
const TURNSTILE_ACTION = 'anonymous_generation';

type TrialTokenPayload = {
  taskId: string;
  expiresAt: number;
  statusUrl?: string;
  responseUrl?: string;
};

function signingSecret() {
  const secret = envConfigs.auth_secret;
  if (!secret || secret === AUTH_SECRET_PLACEHOLDER) {
    throw new Error('Anonymous trial is not configured');
  }
  return secret;
}

function signTask(payload: TrialTokenPayload) {
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = createHmac('sha256', signingSecret())
    .update(encoded)
    .digest('base64url');
  return `${encoded}.${signature}`;
}

function readTask(token: string): TrialTokenPayload | null {
  const [encoded, signature] = token.split('.');
  if (!encoded || !signature) return null;
  const expected = createHmac('sha256', signingSecret())
    .update(encoded)
    .digest('base64url');
  const left = Buffer.from(signature);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !timingSafeEqual(left, right))
    return null;
  try {
    const payload = JSON.parse(
      Buffer.from(encoded, 'base64url').toString('utf8')
    ) as TrialTokenPayload;
    if (!payload.taskId || payload.expiresAt < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

function cookieValue(request: Request) {
  const match = request.headers
    .get('cookie')
    ?.match(new RegExp(`(?:^|;\\s*)${VISITOR_COOKIE}=([^;]+)`));
  return match?.[1] || '';
}

function isDefiniteSubmissionFailure(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  // Fal did not accept these requests, so no paid provider task exists. A
  // timeout, connection failure, 5xx, or malformed success response remains
  // uncertain and intentionally keeps the reservation to prevent retries.
  return /Fal submission failed \((400|401|403|404|409|422|429)\)/.test(
    message
  );
}

function dailyBudgetWindow() {
  const now = new Date();
  const tomorrowUtc = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + 1
  );
  return {
    day: now.toISOString().slice(0, 10),
    ttlMs: Math.max(60_000, tomorrowUtc - now.getTime()),
  };
}

function hourlyBudgetWindow() {
  const now = new Date();
  const nextHourUtc = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
    now.getUTCHours() + 1
  );
  return {
    hour: now.toISOString().slice(0, 13),
    ttlMs: Math.max(60_000, nextHourUtc - now.getTime()),
  };
}

function configuredBudget(
  settingValue: string | undefined,
  envValue: string | undefined,
  fallback: number
) {
  const parsed = Number.parseInt(settingValue || envValue || '', 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

function clientIp(request: Request) {
  return (
    request.headers.get('cf-connecting-ip')?.trim() ||
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip')?.trim() ||
    ''
  );
}

async function releaseAll(reservations: RateLimitReservation[]) {
  await Promise.all(
    reservations.map((reservation) => releaseRateLimitReservation(reservation))
  );
}

async function releaseAllBudgets(
  reservations: Array<DailyBudgetReservation | null>
) {
  await Promise.all(reservations.map(releaseDailyBudgetReservation));
}

export async function POST({ request }: { request: Request }) {
  try {
    const body = await request.json().catch(() => ({}));
    if (body.claim === true) {
      const session = await getAuth().api.getSession({
        headers: request.headers,
      });
      if (!session?.user) return respErr('Sign in to save this generation');
      const payload = readTask(
        typeof body.token === 'string' ? body.token : ''
      );
      if (!payload) return respErr('This free generation has expired');
      return respData(
        await claimAnonymousImage({
          userId: session.user.id,
          providerTaskId: payload.taskId,
          prompt: typeof body.prompt === 'string' ? body.prompt : '',
          statusUrl: payload.statusUrl,
          responseUrl: payload.responseUrl,
        })
      );
    }
    if (!ANONYMOUS_IMAGE_GENERATION_ENABLED) {
      return respErr('Sign in to generate images');
    }
    const session = await getAuth().api.getSession({
      headers: request.headers,
    });
    if (session?.user) {
      return respErr(
        'Signed-in users must use the credit-protected generation endpoint'
      );
    }
    // Confirm the result token can be issued before reserving quota or sending
    // a paid provider request.
    signingSecret();
    const prompt = typeof body.prompt === 'string' ? body.prompt : '';
    const options =
      body.options && typeof body.options === 'object'
        ? body.options
        : undefined;
    validateAnonymousImageInput({ prompt, options });

    const abuseLimited = await enforceMinIntervalRateLimit(request, {
      intervalMs: ABUSE_WINDOW_MS,
      keyPrefix: 'anonymous-image-request',
      keyBy: 'ip',
    });
    if (abuseLimited) return abuseLimited;

    const configs = await getAllConfigs();
    if (configs.anonymous_trial_enabled === 'false') {
      return respErr('Free generation is temporarily unavailable');
    }
    if (configs.turnstile_enabled === 'true') {
      if (!configs.turnstile_secret_key) {
        return respErr('Free generation verification is not configured');
      }
      const verified = await verifyTurnstileToken({
        token:
          typeof body.turnstileToken === 'string' ? body.turnstileToken : '',
        secretKey: configs.turnstile_secret_key,
        remoteIp: clientIp(request),
        expectedAction: TURNSTILE_ACTION,
      });
      if (!verified) {
        return respErr('Complete the security check and try again');
      }
    }

    // Resolve provider configuration before consuming the long-lived quota.
    // No provider request is made by this preparation step.
    const prepared = await prepareAnonymousImage({ prompt, options });

    const visitorId = cookieValue(request) || getUuid();
    const owner = getUuid();
    const reservations: RateLimitReservation[] = [];
    const device = await reserveMinIntervalRateLimit(request, {
      intervalMs: DEVICE_WINDOW_MS,
      keyPrefix: 'anonymous-image-device',
      keyBy: 'extra',
      extraKey: visitorId,
      requireDistributedStore: true,
      owner,
    });
    if (device.response) return device.response;
    if (device.reservation) reservations.push(device.reservation);

    const ip = await reserveMinIntervalRateLimit(request, {
      intervalMs: IP_WINDOW_MS,
      keyPrefix: 'anonymous-image-ip',
      keyBy: 'ip',
      requireDistributedStore: true,
      owner,
    });
    if (ip.response) {
      await releaseAll(reservations);
      return ip.response;
    }
    if (ip.reservation) reservations.push(ip.reservation);

    const budgetReservations: Array<DailyBudgetReservation | null> = [];
    const hourWindow = hourlyBudgetWindow();
    const hourlyBudget = await reserveDailyDistributedBudget({
      key: 'anonymous-image-hour|' + hourWindow.hour,
      owner,
      limit: configuredBudget(
        configs.anonymous_hourly_generation_budget,
        process.env.ANONYMOUS_HOURLY_GENERATION_BUDGET,
        DEFAULT_HOURLY_BUDGET
      ),
      ttlMs: hourWindow.ttlMs,
      windowLabel: 'this hour',
    });
    if (hourlyBudget.response) {
      await releaseAll(reservations);
      return hourlyBudget.response;
    }
    budgetReservations.push(hourlyBudget.reservation);

    const dayWindow = dailyBudgetWindow();
    const dailyBudget = await reserveDailyDistributedBudget({
      key: 'anonymous-image-day|' + dayWindow.day,
      owner,
      limit: configuredBudget(
        configs.anonymous_daily_generation_budget,
        process.env.ANONYMOUS_DAILY_GENERATION_BUDGET,
        DEFAULT_DAILY_BUDGET
      ),
      ttlMs: dayWindow.ttlMs,
      windowLabel: 'today',
    });
    if (dailyBudget.response) {
      await Promise.all([
        releaseAll(reservations),
        releaseAllBudgets(budgetReservations),
      ]);
      return dailyBudget.response;
    }
    budgetReservations.push(dailyBudget.reservation);

    let result: Awaited<ReturnType<typeof submitAnonymousImage>>;
    try {
      result = await submitAnonymousImage(prepared);
    } catch (error) {
      if (isDefiniteSubmissionFailure(error)) {
        await Promise.all([
          releaseAll(reservations),
          releaseAllBudgets(budgetReservations),
        ]);
      }
      throw error;
    }
    const token = signTask({
      taskId: result.taskId,
      expiresAt: Date.now() + TOKEN_TTL_MS,
      statusUrl: result.statusUrl,
      responseUrl: result.responseUrl,
    });
    const response = respData({ id: result.taskId, token });
    response.headers.append(
      'set-cookie',
      `${VISITOR_COOKIE}=${visitorId}; Path=/; Max-Age=31536000; HttpOnly; SameSite=Lax; Secure`
    );
    return response;
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Free generation failed';
    return respErr(message);
  }
}

async function GET({ request }: { request: Request }) {
  const session = await getAuth().api.getSession({ headers: request.headers });
  if (!session?.user) return respErr('Sign in to view this generation');

  const limited = await enforceMinIntervalRateLimit(request, {
    intervalMs: 900,
    keyPrefix: 'anonymous-image-poll',
  });
  if (limited) return limited;

  try {
    const token = new URL(request.url).searchParams.get('token') || '';
    const payload = readTask(token);
    if (!payload) return respErr('This preview link has expired');
    return respData(
      await queryAnonymousImage(payload.taskId, {
        statusUrl: payload.statusUrl,
        responseUrl: payload.responseUrl,
      })
    );
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Failed to check generation';
    return respErr(message);
  }
}

export const Route = createFileRoute('/api/images/anonymous')({
  server: { handlers: { GET, POST } },
});
