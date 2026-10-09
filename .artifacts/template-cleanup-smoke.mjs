import assert from 'node:assert/strict';

const origin = 'http://127.0.0.1:4318';
const kept = ['/', '/zh', '/models', '/ai-image-editor', '/image-to-svg', '/pricing', '/sitemap.xml', '/llms.txt'];
const removed = ['/qwen-image-editor', '/qwen-image-3-1', '/qwen-image-3-api', '/qwen-image-2-1-generator', '/qwen-image-3-product-photo-test', '/brands/qwen.svg'];
for (const path of kept) {
  const response = await fetch(origin + path);
  assert.equal(response.status, 200, `${path}: ${response.status}`);
  const body = await response.text();
  assert.doesNotMatch(body, /qwen|通义千问|千问/i, `${path} contains retired branding`);
}
for (const path of removed) {
  const response = await fetch(origin + path, { redirect: 'manual' });
  assert.equal(response.status, 404, `${path} remains accessible (${response.status})`);
}
console.log(`Production smoke passed: ${kept.length} retained routes, ${removed.length} removed routes/assets.`);
