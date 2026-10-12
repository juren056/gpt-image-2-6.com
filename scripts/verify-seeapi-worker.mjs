import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import path from 'node:path';

// Resolve the existing Wrangler/Vite runtimes rather than adding test packages.
const wranglerRequire = createRequire(
  import.meta.resolve('wrangler/package.json')
);
const viteRequire = createRequire(import.meta.resolve('vite/package.json'));
const { Miniflare } = wranglerRequire('miniflare');
const { build } = viteRequire('esbuild');
const bundle = await build({
  stdin: {
    contents: `import { moderateWithSeeAPI } from './src/core/ai/seeapi-moderation';
export default { async fetch() { return Response.json(await moderateWithSeeAPI({apiKey:'worker-test-only',imageUrls:['https://example.com/test.png']})); } };`,
    resolveDir: path.resolve('.'),
    sourcefile: 'seeapi-worker-test.ts',
  },
  bundle: true,
  write: false,
  format: 'esm',
  platform: 'browser',
});
let scenario = 'allow';
let calls = [];
const mf = new Miniflare({
  modules: true,
  script: bundle.outputFiles[0].text,
  compatibilityDate: '2026-06-10',
  outboundService: async (request) => {
    const url = new URL(request.url);
    calls.push({ url: request.url, method: request.method });
    assert.equal(url.origin, 'https://api.seeapi.com');
    assert.equal(
      request.headers.get('authorization'),
      'Bearer worker-test-only'
    );
    if (scenario === 'redirect')
      return new Response(null, {
        status: 302,
        headers: { Location: 'https://redirect.example.com/credentials' },
      });
    if (request.method === 'POST')
      return Response.json(
        { id: 'task_worker', status: 'queued', result: null },
        { status: 202 }
      );
    return Response.json({
      id: 'task_worker',
      status: 'succeeded',
      error: null,
      result: {
        type: 'json',
        data: {
          flagged: scenario === 'block',
          categories: {
            nsfw: scenario === 'block' ? ['test-label'] : [],
            special_care: [],
          },
        },
      },
    });
  },
});
try {
  for (const test of ['allow', 'block', 'redirect']) {
    scenario = test;
    calls = [];
    const result = await (
      await mf.dispatchFetch('https://test.example.com/')
    ).json();
    assert.equal(result.decision, test === 'redirect' ? 'review' : test);
    assert.equal(calls.length, test === 'redirect' ? 1 : 2);
    if (test === 'redirect') assert.equal(result.reasonCode, 'seeapi_http_302');
  }
  console.log(
    'SeeAPI Workers runtime passed: allow, block, redirect rejection without credential forwarding.'
  );
} finally {
  await mf.dispose();
}
