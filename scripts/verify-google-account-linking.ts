import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { betterAuth } from 'better-auth';
import { memoryAdapter } from 'better-auth/adapters/memory';

import { SITE_ACCOUNT_LINKING } from '../src/lib/auth-policy';

// Provider responses are fixtures in this isolated test only. Production keeps
// Google's real token verification and the unchanged account-linking rules.
const origin = 'http://localhost:3199';
const database: Record<string, any[]> = {
  user: [],
  account: [],
  session: [],
  verification: [],
};
const email = 'linking-test@example.test';
const password = randomBytes(24).toString('hex');
let providerUser = {
  id: 'google-fixture',
  name: 'Test User',
  email,
  emailVerified: true,
};
const auth = betterAuth({
  baseURL: origin,
  secret: randomBytes(32).toString('hex'),
  database: memoryAdapter(database),
  emailAndPassword: { enabled: true },
  account: {
    accountLinking: SITE_ACCOUNT_LINKING,
  },
  socialProviders: {
    google: {
      clientId: 'test-only-client',
      clientSecret: 'test-only-secret',
      getUserInfo: async () => ({ user: providerUser, data: {} }),
    },
  },
  rateLimit: { enabled: false },
  logger: { disabled: true },
});
const cookies = new Map<string, string>();
async function request(
  path: string,
  body?: Record<string, unknown>,
  authenticated = true
) {
  const response = await auth.handler(
    new Request(`${origin}/api/auth${path}`, {
      method: body ? 'POST' : 'GET',
      headers: {
        'Content-Type': 'application/json',
        Origin: origin,
        ...(authenticated
          ? {
              Cookie: [...cookies]
                .map(([key, value]) => `${key}=${value}`)
                .join('; '),
            }
          : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    })
  );
  for (const cookie of response.headers.getSetCookie()) {
    const pair = cookie.split(';')[0];
    const separator = pair.indexOf('=');
    cookies.set(pair.slice(0, separator), pair.slice(separator + 1));
  }
  return response;
}
const originalFetch = globalThis.fetch;
globalThis.fetch = async (input) => {
  assert.equal(
    String(input),
    'https://oauth2.googleapis.com/token',
    'Tests must not make external network requests'
  );
  return Response.json({
    access_token: 'test-fixture-only',
    token_type: 'Bearer',
    expires_in: 3600,
  });
};
async function oauth(endpoint: '/link-social' | '/sign-in/social') {
  const start = await request(endpoint, {
    provider: 'google',
    callbackURL: `${origin}/settings/profile`,
    errorCallbackURL: `${origin}/settings/profile?authError=oauth`,
  });
  assert.equal(start.status, 200);
  const data = await start.json();
  const authorization = new URL(data.url);
  assert.equal(authorization.hostname, 'accounts.google.com');
  assert.equal(
    authorization.searchParams.get('redirect_uri'),
    `${origin}/api/auth/callback/google`
  );
  assert(authorization.searchParams.get('code_challenge'));
  const callback = await request(
    `/callback/google?${new URLSearchParams({ code: 'test-code', state: authorization.searchParams.get('state')! })}`
  );
  assert.equal(callback.status, 302);
  return new URL(callback.headers.get('location')!);
}
try {
  const signup = await request('/sign-up/email', {
    name: 'Test User',
    email,
    password,
  });
  assert.equal(signup.status, 200);
  const originalUserId = database.user[0].id;
  assert.equal(database.user[0].emailVerified, false);
  const anonymous = await request(
    '/link-social',
    { provider: 'google' },
    false
  );
  assert.equal(anonymous.status, 401);
  cookies.clear();
  const implicit = await oauth('/sign-in/social');
  assert.equal(implicit.searchParams.get('error'), 'account_not_linked');
  assert.equal(database.account.length, 1);
  assert.equal(
    (
      await request('/sign-in/email', {
        email,
        password: randomBytes(24).toString('hex'),
      })
    ).status,
    401
  );
  assert.equal(
    (await request('/link-social', { provider: 'google' })).status,
    401
  );
  assert.equal(
    (await request('/sign-in/email', { email, password })).status,
    200
  );
  const explicit = await oauth('/link-social');
  assert.equal(explicit.pathname, '/settings/profile');
  assert.equal(explicit.searchParams.get('error'), null);
  assert.equal(database.user.length, 1);
  const accounts = await (await request('/list-accounts')).json();
  assert(
    accounts.some(
      (account: { providerId: string }) => account.providerId === 'google'
    )
  );
  assert(
    database.account.every((account) => account.userId === originalUserId)
  );
  assert.equal(
    database.user[0].emailVerified,
    false,
    'Linking must not fabricate local email verification'
  );
  const subsequent = await oauth('/sign-in/social');
  assert.equal(subsequent.searchParams.get('error'), null);
  const session = await (await request('/get-session')).json();
  assert.equal(session.user.id, originalUserId);
  providerUser = {
    ...providerUser,
    id: 'different-google',
    email: 'other@example.test',
  };
  const mismatch = await oauth('/link-social');
  assert.equal(mismatch.searchParams.get('error'), "email_doesn't_match");
  providerUser = { ...providerUser, email, emailVerified: false };
  const unverified = await oauth('/link-social');
  assert.equal(unverified.searchParams.get('error'), 'unable_to_link_account');
  assert.equal(database.account.length, 2);
  providerUser = { ...providerUser, emailVerified: true, id: 'claimed-google' };
  database.account.push({
    id: 'conflict-fixture',
    providerId: 'google',
    accountId: 'claimed-google',
    userId: 'another-test-user',
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  const conflict = await oauth('/link-social');
  assert.equal(
    conflict.searchParams.get('error'),
    'account_already_linked_to_different_user'
  );
  assert.equal(database.account.at(-1)?.userId, 'another-test-user');
  cookies.clear();
  providerUser = {
    id: 'fresh-google-fixture',
    name: 'New Google User',
    email: 'new-google-user@example.test',
    emailVerified: true,
  };
  const fresh = await oauth('/sign-in/social');
  assert.equal(fresh.searchParams.get('error'), null);
  const freshSession = await (await request('/get-session')).json();
  assert.equal(freshSession.user.email, providerUser.email);
  assert.equal(freshSession.user.emailVerified, true);
  const freshUserId = freshSession.user.id;
  const usersAfterSignup = database.user.length;
  cookies.clear();
  await oauth('/sign-in/social');
  assert.equal(
    (await (await request('/get-session')).json()).user.id,
    freshUserId
  );
  assert.equal(
    database.user.length,
    usersAfterSignup,
    'Returning Google user must not be registered twice'
  );
  console.log(
    'Google linking integration passed: implicit rejection, authenticated same-email linking, subsequent login, anonymous rejection, email mismatch, unverified provider and account conflict. No production accounts or external services used.'
  );
} finally {
  globalThis.fetch = originalFetch;
}
