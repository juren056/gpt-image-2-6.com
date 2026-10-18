import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { betterAuth } from 'better-auth';
import { memoryAdapter } from 'better-auth/adapters/memory';
import { oneTap } from 'better-auth/plugins';
import { exportJWK, generateKeyPair, SignJWT } from 'jose';

import { SITE_ACCOUNT_LINKING } from '../src/lib/auth-policy';
import { classifyOneTapFailure } from '../src/lib/one-tap-error';

async function main() {
  const database: Record<string, any[]> = {
    user: [],
    account: [],
    session: [],
    verification: [],
  };
  const origin = 'http://localhost:3198';
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
      },
    },
    plugins: [oneTap()],
    logger: { disabled: true },
    rateLimit: { enabled: false },
  });
  const { publicKey, privateKey } = await generateKeyPair('RS256');
  const jwk = {
    ...(await exportJWK(publicKey)),
    alg: 'RS256',
    kid: 'isolated-test-key',
  };
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input) => {
    assert.equal(String(input), 'https://www.googleapis.com/oauth2/v3/certs');
    return Response.json({ keys: [jwk] });
  };
  async function request(path: string, body?: object, cookie?: string) {
    return auth.handler(
      new Request(origin + '/api/auth' + path, {
        method: body ? 'POST' : 'GET',
        headers: {
          Origin: origin,
          'Content-Type': 'application/json',
          ...(cookie ? { Cookie: cookie } : {}),
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
      })
    );
  }
  async function token(
    email: string,
    audience = 'test-only-client',
    subject = email
  ) {
    return new SignJWT({
      email,
      email_verified: true,
      name: 'Isolated Google user',
    })
      .setProtectedHeader({ alg: 'RS256', kid: 'isolated-test-key' })
      .setIssuer('https://accounts.google.com')
      .setAudience(audience)
      .setSubject(subject)
      .setIssuedAt()
      .setExpirationTime('5m')
      .sign(privateKey);
  }
  try {
    assert.equal(
      (
        await request('/sign-up/email', {
          email: 'old@example.test',
          password: randomBytes(24).toString('hex'),
          name: 'Existing user',
        })
      ).status,
      200
    );
    const blocked = await request('/one-tap/callback', {
      idToken: await token('old@example.test'),
    });
    assert.equal(blocked.status, 401);
    assert.equal(
      classifyOneTapFailure({
        ...(await blocked.json()),
        status: blocked.status,
      }),
      'not-linked'
    );
    assert.equal(database.account.length, 1);
    database.user[0].emailVerified = true;
    assert.equal(
      (
        await request('/one-tap/callback', {
          idToken: await token('old@example.test'),
        })
      ).status,
      401
    );
    assert.equal(
      database.account.length,
      1,
      'Verified but unbound users also need explicit linking'
    );

    const fresh = await request('/one-tap/callback', {
      idToken: await token('fresh@example.test'),
    });
    assert.equal(fresh.status, 200);
    const result = await fresh.json();
    const cookie = fresh.headers
      .getSetCookie()
      .map((value) => value.split(';')[0])
      .join('; ');
    assert(cookie.includes('session_token'));
    const session = await (
      await request('/get-session', undefined, cookie)
    ).json();
    assert.equal(session.user.id, result.user.id);
    assert.equal(session.user.emailVerified, true);
    assert.equal(
      (await (await request('/get-session', undefined, cookie)).json()).user.id,
      result.user.id
    );
    const again = await request('/one-tap/callback', {
      idToken: await token('fresh@example.test'),
    });
    assert.equal((await again.json()).user.id, result.user.id);
    assert.equal(database.user.length, 2);
    assert.equal(
      (
        await request('/one-tap/callback', {
          idToken: await token('fresh@example.test', 'wrong-audience'),
        })
      ).status,
      400
    );
    assert.equal(
      (await request('/one-tap/callback', { idToken: 'invalid-token' })).status,
      400
    );
    assert.equal(
      classifyOneTapFailure({
        message: '<script>provider text</script>',
        status: 401,
      }),
      'generic'
    );
    console.log(
      'One Tap isolated integration passed: old account rejection, signed JWT new registration, session cookie, session persistence, returning user, invalid audience and invalid token. No real Google or production accounts used.'
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
