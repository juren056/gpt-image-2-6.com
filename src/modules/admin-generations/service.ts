import {
  and,
  count,
  desc,
  eq,
  gte,
  isNull,
  like,
  lte,
  or,
  sql,
  type SQL,
} from 'drizzle-orm';

import { db } from '@/core/db';
import { aiTask, user } from '@/config/db/schema';

type JsonRecord = Record<string, unknown>;

export type AdminGeneration = {
  id: string;
  providerTaskId: string | null;
  userId: string;
  userName: string | null;
  userEmail: string;
  mediaType: string;
  provider: string;
  model: string;
  prompt: string;
  status: string;
  costCredits: number;
  scene: string;
  createdAt: Date;
  updatedAt: Date;
  images: string[];
  videos: string[];
  inputAssets: string[];
  options: JsonRecord;
  errorMessage: string | null;
  errorCategory: string | null;
  errorCode: string | null;
  providerStatus: string | null;
  inferenceTime: number | null;
  seed: number | null;
  safetyStatus: string;
  safetyCategory: string;
  safetySeverity: string;
  safetySource: string;
  safetyConfidence: number;
  safetyReviewStatus: string;
  safetyAction: string;
};

function parseRecord(value: string | null): JsonRecord {
  if (!value) return {};
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? parsed
      : {};
  } catch {
    return {};
  }
}

function safeUrl(value: unknown) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (trimmed.startsWith('/uploads/')) return trimmed;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:'
      ? parsed.toString()
      : null;
  } catch {
    return null;
  }
}

function mediaUrls(value: unknown, keys: string[]) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (typeof item === 'string') return safeUrl(item);
      if (!item || typeof item !== 'object') return null;
      const record = item as JsonRecord;
      for (const key of keys) {
        const url = safeUrl(record[key]);
        if (url) return url;
      }
      return null;
    })
    .filter((url): url is string => Boolean(url));
}

function collectInputAssets(options: JsonRecord) {
  const values = [
    options.image_url,
    options.input_image_url,
    options.mask_url,
    ...(Array.isArray(options.image_urls) ? options.image_urls : []),
    ...(Array.isArray(options.input_image_urls)
      ? options.input_image_urls
      : []),
  ];
  return Array.from(
    new Set(values.map(safeUrl).filter((url): url is string => Boolean(url)))
  );
}

function redact(value: unknown, depth = 0): unknown {
  if (depth > 5) return '[truncated]';
  if (Array.isArray(value)) return value.map((item) => redact(item, depth + 1));
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(
    Object.entries(value as JsonRecord).map(([key, nested]) => [
      key,
      /(secret|token|password|api[_-]?key|authorization|signature)/i.test(key)
        ? '[redacted]'
        : redact(nested, depth + 1),
    ])
  );
}

function extractErrorMessage(value: unknown, depth = 0): string | null {
  if (depth > 5 || value === null || value === undefined) return null;
  if (typeof value === 'string') {
    const message = value.trim();
    return message ? message.slice(0, 4000) : null;
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      const message = extractErrorMessage(item, depth + 1);
      if (message) return message;
    }
    return null;
  }
  if (typeof value !== 'object') return null;

  const record = value as JsonRecord;
  const errorKeys = [
    'errorMessage',
    'error_message',
    'failMsg',
    'failureReason',
    'failure_reason',
    'reason',
    'detail',
    'message',
    'error',
  ];
  for (const key of errorKeys) {
    if (!(key in record)) continue;
    const message = extractErrorMessage(record[key], depth + 1);
    if (message) return message;
  }
  for (const key of ['data', 'response', 'body', 'taskInfo', 'taskResult']) {
    if (!(key in record)) continue;
    const message = extractErrorMessage(record[key], depth + 1);
    if (message) return message;
  }
  return null;
}

function extractErrorCode(...values: JsonRecord[]) {
  for (const value of values) {
    for (const key of [
      'errorCode',
      'error_code',
      'errorType',
      'error_type',
      'code',
    ]) {
      if (typeof value[key] === 'string' && value[key].trim()) {
        return value[key].trim().slice(0, 200);
      }
    }
  }
  return null;
}

export function classifyGenerationFailure(
  status: string,
  message: string | null,
  code: string | null
) {
  if (status !== 'failed' && status !== 'canceled') return null;
  if (status === 'canceled') return 'Canceled';
  const text = `${code || ''} ${message || ''}`.toLowerCase();
  if (
    /output_moderation_unavailable|moderation_unavailable|safety review could not be completed/.test(
      text
    )
  ) {
    return 'Safety review service unavailable';
  }
  if (
    /content[_ -]?policy|content[_ -]?safety|safety[_ -]?(?:checker|filter)|moderation|nsfw|not safe for work|flagged/.test(
      text
    )
  ) {
    return 'Content safety policy violation';
  }
  if (/timeout|timed out|deadline|http 408|http 504/.test(text)) {
    return 'Provider request timed out';
  }
  if (/rate limit|too many requests|http 429/.test(text)) {
    return 'Provider rate limit exceeded';
  }
  if (/unauthorized|authentication|invalid (?:api )?key|http 401/.test(text)) {
    return 'Provider authentication failed';
  }
  if (/forbidden|permission denied|http 403/.test(text)) {
    return 'Provider permission denied';
  }
  if (/not found|http 404/.test(text)) {
    return 'Provider model or endpoint not found';
  }
  if (
    /validation|invalid input|required field|(?:status code|http)[: ]*422/.test(
      text
    )
  ) {
    return 'Input or content validation failed';
  }
  if (
    /http 5\d\d|status code: 5\d\d|service unavailable|provider service/.test(
      text
    )
  ) {
    return 'Provider service failure';
  }
  return 'Unknown provider failure';
}

function normalizeTask(row: {
  task: typeof aiTask.$inferSelect;
  userEmail: string;
  userName: string | null;
}): AdminGeneration {
  const result = parseRecord(row.task.taskResult);
  const info = parseRecord(row.task.taskInfo);
  const options = parseRecord(row.task.options);
  const error = extractErrorMessage(result) ?? extractErrorMessage(info);
  const errorCode = extractErrorCode(result, info);
  const inferenceTime =
    result.inferenceTime ??
    result.inference_time ??
    info.inferenceTime ??
    info.inference_time;
  return {
    id: row.task.id,
    providerTaskId: row.task.taskId,
    userId: row.task.userId,
    userName: row.userName,
    userEmail: row.userEmail,
    mediaType: row.task.mediaType,
    provider: row.task.provider,
    model: row.task.model,
    prompt: row.task.prompt,
    status: row.task.status,
    costCredits: row.task.costCredits,
    scene: row.task.scene,
    createdAt: row.task.createdAt,
    updatedAt: row.task.updatedAt,
    images: mediaUrls(result.images, ['imageUrl', 'url']),
    videos: mediaUrls(result.videos, ['videoUrl', 'url']),
    inputAssets: collectInputAssets(options),
    options: redact(options) as JsonRecord,
    errorMessage: error,
    errorCategory: classifyGenerationFailure(row.task.status, error, errorCode),
    errorCode,
    providerStatus:
      typeof result.status === 'string'
        ? result.status
        : typeof info.status === 'string'
          ? info.status
          : null,
    inferenceTime: typeof inferenceTime === 'number' ? inferenceTime : null,
    seed: typeof result.seed === 'number' ? result.seed : null,
    safetyStatus: row.task.safetyStatus,
    safetyCategory: row.task.safetyCategory,
    safetySeverity: row.task.safetySeverity,
    safetySource: row.task.safetySource,
    safetyConfidence: row.task.safetyConfidence,
    safetyReviewStatus: row.task.safetyReviewStatus,
    safetyAction: row.task.safetyAction,
  };
}

export async function listAdminGenerations(params: {
  page?: number;
  pageSize?: number;
  search?: string;
  mediaType?: string;
  status?: string;
  safetyStatus?: string;
  model?: string;
  from?: Date;
  to?: Date;
}) {
  const page = Math.max(1, params.page || 1);
  const pageSize = Math.min(60, Math.max(1, params.pageSize || 24));
  const conditions: SQL[] = [isNull(aiTask.deletedAt)];

  if (params.mediaType) conditions.push(eq(aiTask.mediaType, params.mediaType));
  if (params.status) conditions.push(eq(aiTask.status, params.status));
  if (params.safetyStatus)
    conditions.push(eq(aiTask.safetyStatus, params.safetyStatus));
  if (params.model) conditions.push(eq(aiTask.model, params.model));
  if (params.from) conditions.push(gte(aiTask.createdAt, params.from));
  if (params.to) conditions.push(lte(aiTask.createdAt, params.to));
  if (params.search) {
    const term = `%${params.search.slice(0, 200)}%`;
    conditions.push(
      or(
        like(aiTask.id, term),
        like(aiTask.taskId, term),
        like(aiTask.prompt, term),
        like(user.email, term),
        like(user.name, term)
      )!
    );
  }
  const where = and(...conditions);

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const todayWhere = and(
    isNull(aiTask.deletedAt),
    gte(aiTask.createdAt, startOfToday)
  );

  const [
    totalRows,
    rows,
    modelRows,
    todayRows,
    successRows,
    failedRows,
    creditRows,
    blockedRows,
  ] = await Promise.all([
    db()
      .select({ value: count() })
      .from(aiTask)
      .innerJoin(user, eq(aiTask.userId, user.id))
      .where(where),
    db()
      .select({ task: aiTask, userEmail: user.email, userName: user.name })
      .from(aiTask)
      .innerJoin(user, eq(aiTask.userId, user.id))
      .where(where)
      .orderBy(desc(aiTask.createdAt))
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    db()
      .select({ model: aiTask.model })
      .from(aiTask)
      .where(isNull(aiTask.deletedAt))
      .groupBy(aiTask.model)
      .orderBy(aiTask.model),
    db().select({ value: count() }).from(aiTask).where(todayWhere),
    db()
      .select({ value: count() })
      .from(aiTask)
      .where(and(todayWhere, eq(aiTask.status, 'success'))),
    db()
      .select({ value: count() })
      .from(aiTask)
      .where(and(todayWhere, eq(aiTask.status, 'failed'))),
    db()
      .select({ value: sql<number>`coalesce(sum(${aiTask.costCredits}), 0)` })
      .from(aiTask)
      .where(todayWhere),
    db()
      .select({ value: count() })
      .from(aiTask)
      .where(and(todayWhere, eq(aiTask.safetyStatus, 'blocked'))),
  ]);

  const today = Number(todayRows[0]?.value || 0);
  const success = Number(successRows[0]?.value || 0);
  return {
    items: rows.map(normalizeTask),
    total: Number(totalRows[0]?.value || 0),
    models: modelRows
      .map((row: { model: string }) => row.model)
      .filter(Boolean),
    summary: {
      today,
      successRate: today > 0 ? Math.round((success / today) * 1000) / 10 : 0,
      failed: Number(failedRows[0]?.value || 0),
      credits: Number(creditRows[0]?.value || 0),
      blocked: Number(blockedRows[0]?.value || 0),
    },
  };
}
