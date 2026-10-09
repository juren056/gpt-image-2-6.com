import assert from 'node:assert/strict';

import {
  safeInternalAuthDestination,
  toAbsoluteAuthCallbackURL,
} from '../src/lib/auth-navigation';
import { parseEditorDraft } from '../src/lib/editor-draft';

const origin = 'https://qwenimage3.com';

assert.equal(
  toAbsoluteAuthCallbackURL('/#generator', origin),
  'https://qwenimage3.com/#generator'
);
assert.equal(
  toAbsoluteAuthCallbackURL('/zh/ai-video-generator#tool', origin),
  'https://qwenimage3.com/zh/ai-video-generator#tool'
);
assert.equal(
  toAbsoluteAuthCallbackURL('/sign-in?authError=oauth', origin),
  'https://qwenimage3.com/settings/generate'
);
assert.equal(
  toAbsoluteAuthCallbackURL('https://evil.example/phish', origin),
  'https://qwenimage3.com/settings/generate'
);
assert.equal(
  toAbsoluteAuthCallbackURL(
    'https://evil.example/phish',
    origin,
    '//evil.example'
  ),
  'https://qwenimage3.com/settings/generate'
);
assert.equal(safeInternalAuthDestination('/#generator'), '/#generator');
assert.equal(safeInternalAuthDestination('//evil.example'), null);
assert.equal(safeInternalAuthDestination('/sign-in'), null);

assert.deepEqual(
  parseEditorDraft(
    JSON.stringify({
      prompt: 'Keep the exact label',
      imageUrls: [
        'https://cdn.example.test/product.webp',
        'javascript:alert(1)',
        'https://cdn.example.test/detail.webp',
        'https://cdn.example.test/back.webp',
        'https://cdn.example.test/ignored.webp',
      ],
    }),
    origin
  ),
  {
    prompt: 'Keep the exact label',
    imageUrls: [
      'https://cdn.example.test/product.webp',
      'https://cdn.example.test/detail.webp',
      'https://cdn.example.test/back.webp',
    ],
  }
);
assert.deepEqual(parseEditorDraft('{invalid json', origin), {
  prompt: '',
  imageUrls: [],
});

console.log('Auth navigation verification passed.');
