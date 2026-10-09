import assert from 'node:assert/strict';

process.env.AUTH_SECRET = 'unit-test-auth-secret-with-enough-entropy';

const { buildFalWebhookUrl, createFalWebhookToken, verifyFalWebhookToken } =
  await import('../src/modules/images/fal-webhook');

const taskId = 'local-image-task-123';
const token = createFalWebhookToken(taskId);
assert.ok(token);
assert.equal(verifyFalWebhookToken(taskId, token), true);
assert.equal(verifyFalWebhookToken(`${taskId}-other`, token), false);
assert.equal(verifyFalWebhookToken(taskId, `${token.slice(0, -1)}0`), false);

const callback = buildFalWebhookUrl('https://qwenimage3.com', taskId);
assert.ok(callback);
const callbackUrl = new URL(callback);
assert.equal(callbackUrl.origin, 'https://qwenimage3.com');
assert.equal(callbackUrl.pathname, '/api/images/fal-webhook');
assert.equal(callbackUrl.searchParams.get('task'), taskId);
assert.equal(callbackUrl.searchParams.get('token'), token);
assert.equal(buildFalWebhookUrl('http://localhost:3000', taskId), undefined);

console.log('Fal webhook token verification passed.');
