const isProduction = process.env.VERCEL_ENV === 'production';

function fail(message: string): never {
  throw new Error(`[production-config] ${message}`);
}

function parseOrigin(name: string, value: string | undefined) {
  if (!value) fail(`${name} is required for a production deployment.`);
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    fail(`${name} must be an absolute URL.`);
  }
  if (url.username || url.password)
    fail(`${name} must not include credentials.`);
  if (url.protocol !== 'https:') fail(`${name} must use HTTPS.`);
  return url.origin;
}

if (!isProduction) {
  console.log('[production-config] Skipped outside a Vercel production build.');
} else {
  const appOrigin = parseOrigin('VITE_APP_URL', process.env.VITE_APP_URL);
  const authOrigin = parseOrigin(
    'AUTH_URL',
    process.env.AUTH_URL || process.env.VITE_APP_URL
  );
  if (appOrigin !== authOrigin) fail('AUTH_URL and VITE_APP_URL must match.');

  if (!process.env.DATABASE_URL) fail('DATABASE_URL is required.');
  if (
    !process.env.DATABASE_PROVIDER ||
    process.env.DATABASE_PROVIDER === 'sqlite'
  ) {
    fail('DATABASE_PROVIDER must name the production database provider.');
  }
  if (
    !process.env.AUTH_SECRET ||
    process.env.AUTH_SECRET === 'image-studio-dev-secret-change-in-production'
  ) {
    fail(
      'AUTH_SECRET must be configured and must not use the dev placeholder.'
    );
  }
  const hasRedis = Boolean(
    (process.env.UPSTASH_REDIS_REST_URL &&
      process.env.UPSTASH_REDIS_REST_TOKEN) ||
    (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN)
  );
  if (!hasRedis)
    fail('A complete Upstash/KV REST credential pair is required.');

  console.log('[production-config] Required production settings are present.');
}
