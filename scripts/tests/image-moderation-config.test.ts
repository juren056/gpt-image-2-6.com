import assert from 'node:assert/strict';

import { inspectProviderSafetyPayload } from '../../src/core/ai/moderation';
import {
  imageModerationConfig,
  validateImageModerationSettings,
} from '../../src/lib/image-moderation-config';

const stored = {
  openai_api_key: 'test-only-existing-key',
  openai_base_url: 'owner@example.com',
  content_safety_openai_enabled: 'false',
};
assert.equal(imageModerationConfig(stored).apiKey, '');
assert.equal(stored.openai_api_key, 'test-only-existing-key');
assert.equal(
  imageModerationConfig({ ...stored, content_safety_openai_enabled: 'true' })
    .apiKey,
  stored.openai_api_key
);
assert.equal(
  imageModerationConfig({ openai_api_key: stored.openai_api_key }).apiKey,
  stored.openai_api_key
);
assert.equal(
  inspectProviderSafetyPayload({ has_nsfw_concepts: [true] })?.decision,
  'block'
);
for (const address of [
  'owner@example.com',
  'sk-test-only',
  'http://api.example.com/v1',
  'https://user:password@api.example.com/v1',
  'https://api.example.com/v1?token=test',
]) {
  assert.throws(() =>
    validateImageModerationSettings({ openai_base_url: address })
  );
}
validateImageModerationSettings({
  openai_base_url: 'https://api.openai.com/v1',
  content_safety_openai_enabled: 'false',
});
validateImageModerationSettings({ openai_base_url: '' });
assert.throws(() =>
  validateImageModerationSettings({ content_safety_openai_enabled: 'off' })
);
console.log('Image moderation configuration regressions passed');
