import { md5 } from './hash';

type MinIntervalOptions = {
  intervalMs: number;
  keyPrefix?: string;
  extraKey?: string;
  /**
   * Cost-bearing public endpoints must fail closed when the shared Redis
   * store is unavailable. In-memory locks are process-local and can be
   * bypassed by serverless cold starts or requests landing on another node.
   */
  requireDistributedStore?: boolean;
  /**
   * Existing application endpoints use the cookie-bound default. Public auth
   * endpoints must not include a caller-controlled cookie in their key.
   */
  keyBy?: 'ip-cookie' | 'ip' | 'extra';
};

type Store = Map<string, { expiresAt: number; owner: string }>;

type RedisResult = {
  result?: unknown;
  error?: string;
};

declare global {
  var __minIntervalRateLimitStore: Store | undefined;
}

function getClientIpFromRequest(request: Request): string {
  const cloudflareIp = request.headers.get('cf-connecting-ip');
  if (cloudflareIp) return cloudflareIp.trim();
  const xff = request.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0]?.trim() || '';
  return request.headers.get('x-real-ip') || '';
}

function getStore(): Store {
  if (!globalThis.__minIntervalRateLimitStore) {
    globalThis.__minIntervalRateLimitStore = new Map();
  }
  return globalThis.__minIntervalRateLimitStore;
}

function buildKey(request: Request, opts: MinIntervalOptions): string {
  const url = new URL(request.url);
  const ip = getClientIpFromRequest(request);
  const cookie = request.headers.get('cookie') || '';
  const cookieHash = cookie ? md5(cookie) : 'no-cookie';
  const prefix = opts.keyPrefix || 'min-interval';
  const extra = opts.extraKey ? `|${opts.extraKey}` : '';
  if (opts.keyBy === 'extra') {
    return `${prefix}|${request.method}|${url.pathname}|${opts.extraKey || 'missing'}`;
  }
  if (opts.keyBy === 'ip') {
    return `${prefix}|${request.method}|${url.pathname}|${ip || 'unknown'}${extra}`;
  }
  return `${prefix}|${request.method}|${url.pathname}|${ip}|${cookieHash}${extra}`;
}

function rateLimitResponse(intervalMs: number): Response {
  const retryAfterSeconds = Math.max(1, Math.ceil(intervalMs / 1000));
  return Response.json(
    {
      error: 'too_many_requests',
      message: `Please retry after ${retryAfterSeconds}s.`,
    },
    {
      status: 429,
      headers: {
        'cache-control': 'no-store',
        'retry-after': String(retryAfterSeconds),
      },
    }
  );
}

function distributedStoreUnavailableResponse(): Response {
  return Response.json(
    {
      error: 'rate_limit_unavailable',
      message:
        'Free generation is temporarily unavailable. Sign in to use starter credits.',
    },
    {
      status: 503,
      headers: {
        'cache-control': 'no-store',
        'retry-after': '60',
      },
    }
  );
}

async function acquireRedisLock(
  key: string,
  intervalMs: number,
  owner = 'rate-limit'
): Promise<boolean | null> {
  // Upstash's direct dashboard uses UPSTASH_REDIS_*, while its Vercel
  // Marketplace integration injects the equivalent KV_REST_API_* names.
  const url = (
    process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL
  )?.replace(/\/$/, '');
  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  if (!url || !token) return null;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${token}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify([
        'SET',
        `rate-limit:${md5(key)}`,
        owner,
        'PX',
        intervalMs,
        'NX',
      ]),
      signal: AbortSignal.timeout(2_000),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const body = (await response.json()) as RedisResult;
    if (body.error) throw new Error(body.error);
    return body.result === 'OK';
  } catch (error) {
    // Keep the endpoint available if Redis has a transient outage. The local
    // fallback still protects a single instance while monitoring surfaces the
    // provider failure through server logs/Sentry.
    console.error('[rate-limit] Upstash request failed; using local fallback', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return null;
  }
}

function acquireLocalLock(
  key: string,
  intervalMs: number,
  owner = 'rate-limit'
): boolean {
  const now = Date.now();
  const store = getStore();
  const last = store.get(key);
  if (last && last.expiresAt > now) return false;
  store.set(key, { expiresAt: now + intervalMs, owner });

  // Bound memory usage in long-running local/dev processes.
  if (store.size > 10_000) {
    for (const [entryKey, entry] of store) {
      if (entry.expiresAt <= now) store.delete(entryKey);
    }
  }
  return true;
}

export type RateLimitReservation = {
  key: string;
  owner: string;
  distributed: boolean;
};

export type DailyBudgetReservation = {
  counterKey: string;
  ownerKey: string;
  owner: string;
};

function redisConfig() {
  const url = (
    process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL
  )?.replace(/\/$/, '');
  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  return url && token ? { url, token } : null;
}

function budgetResponse(
  retryAfterSeconds: number,
  windowLabel = 'today'
): Response {
  return Response.json(
    {
      error: 'free_generation_budget_exhausted',
      message:
        'The free generation budget is full for ' +
        windowLabel +
        '. Sign in to use credits.',
    },
    {
      status: 429,
      headers: {
        'cache-control': 'no-store',
        'retry-after': String(Math.max(1, retryAfterSeconds)),
      },
    }
  );
}

export async function reserveDailyDistributedBudget(opts: {
  key: string;
  owner: string;
  limit: number;
  ttlMs: number;
  windowLabel?: string;
}): Promise<{
  response: Response | null;
  reservation: DailyBudgetReservation | null;
}> {
  const config = redisConfig();
  if (!config) {
    return {
      response: distributedStoreUnavailableResponse(),
      reservation: null,
    };
  }
  const limit = Math.max(0, Math.floor(opts.limit));
  const ttlMs = Math.max(1_000, Math.floor(opts.ttlMs));
  const counterKey = `daily-budget:${md5(opts.key)}`;
  const ownerKey = `${counterKey}:reservation:${md5(opts.owner)}`;
  const script = [
    "if redis.call('exists', KEYS[2]) == 1 then return {1, tonumber(redis.call('get', KEYS[1]) or '0')} end",
    "local current = tonumber(redis.call('get', KEYS[1]) or '0')",
    'if current >= tonumber(ARGV[1]) then return {0, current} end',
    "current = redis.call('incr', KEYS[1])",
    "redis.call('pexpire', KEYS[1], ARGV[2])",
    "redis.call('set', KEYS[2], ARGV[3], 'PX', ARGV[2])",
    'return {1, current}',
  ].join(' ');
  try {
    const response = await fetch(config.url, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${config.token}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify([
        'EVAL',
        script,
        '2',
        counterKey,
        ownerKey,
        String(limit),
        String(ttlMs),
        opts.owner,
      ]),
      signal: AbortSignal.timeout(2_000),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const body = (await response.json()) as RedisResult;
    const result = Array.isArray(body.result) ? body.result : [];
    if (Number(result[0]) !== 1) {
      console.warn('[anonymous-budget] Free generation budget exhausted', {
        window: opts.windowLabel || 'today',
      });
      return {
        response: budgetResponse(
          Math.ceil(ttlMs / 1000),
          opts.windowLabel || 'today'
        ),
        reservation: null,
      };
    }
    return {
      response: null,
      reservation: { counterKey, ownerKey, owner: opts.owner },
    };
  } catch (error) {
    console.error('[anonymous-budget] Redis request failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return {
      response: distributedStoreUnavailableResponse(),
      reservation: null,
    };
  }
}

export async function releaseDailyBudgetReservation(
  reservation: DailyBudgetReservation | null
): Promise<boolean> {
  if (!reservation) return false;
  const config = redisConfig();
  if (!config) return false;
  const script = [
    "if redis.call('get', KEYS[2]) ~= ARGV[1] then return 0 end",
    "redis.call('del', KEYS[2])",
    "local current = tonumber(redis.call('get', KEYS[1]) or '0')",
    "if current > 0 then redis.call('decr', KEYS[1]) end",
    'return 1',
  ].join(' ');
  try {
    const response = await fetch(config.url, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${config.token}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify([
        'EVAL',
        script,
        '2',
        reservation.counterKey,
        reservation.ownerKey,
        reservation.owner,
      ]),
      signal: AbortSignal.timeout(2_000),
    });
    if (!response.ok) return false;
    const body = (await response.json()) as RedisResult;
    return Number(body.result) === 1;
  } catch {
    return false;
  }
}

async function releaseRedisLock(key: string, owner: string): Promise<boolean> {
  const url = (
    process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL
  )?.replace(/\/$/, '');
  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  if (!url || !token) return false;
  const script =
    "if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) else return 0 end";
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${token}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify([
        'EVAL',
        script,
        '1',
        `rate-limit:${md5(key)}`,
        owner,
      ]),
      signal: AbortSignal.timeout(2_000),
    });
    if (!response.ok) return false;
    const body = (await response.json()) as RedisResult;
    return body.result === 1;
  } catch {
    return false;
  }
}

export async function reserveMinIntervalRateLimit(
  request: Request,
  opts: MinIntervalOptions & { owner: string }
): Promise<{
  response: Response | null;
  reservation: RateLimitReservation | null;
}> {
  const intervalMs = Math.max(0, Number(opts.intervalMs) || 0);
  if (!intervalMs) return { response: null, reservation: null };
  const key = buildKey(request, opts);
  const redisAcquired = await acquireRedisLock(key, intervalMs, opts.owner);
  if (redisAcquired === null && opts.requireDistributedStore) {
    return {
      response: distributedStoreUnavailableResponse(),
      reservation: null,
    };
  }
  const distributed = redisAcquired !== null;
  const acquired = distributed
    ? redisAcquired
    : acquireLocalLock(key, intervalMs, opts.owner);
  return acquired
    ? {
        response: null,
        reservation: { key, owner: opts.owner, distributed },
      }
    : { response: rateLimitResponse(intervalMs), reservation: null };
}

export async function releaseRateLimitReservation(
  reservation: RateLimitReservation | null
): Promise<boolean> {
  if (!reservation) return false;
  if (reservation.distributed) {
    return releaseRedisLock(reservation.key, reservation.owner);
  }
  const store = getStore();
  const entry = store.get(reservation.key);
  if (!entry || entry.owner !== reservation.owner) return false;
  return store.delete(reservation.key);
}

export async function enforceMinIntervalRateLimit(
  request: Request,
  opts: MinIntervalOptions
): Promise<Response | null> {
  const { response } = await reserveMinIntervalRateLimit(request, {
    ...opts,
    owner: 'rate-limit',
  });
  return response;
}
