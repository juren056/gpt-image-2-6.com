import assert from 'node:assert/strict';

import {
  safeInternalAuthDestination,
  toAbsoluteAuthCallbackURL,
} from '../src/lib/auth-navigation';
import { parseEditorDraft } from '../src/lib/editor-draft';

const origin = 'https://nanobanana21pro.com';

assert.equal(
  toAbsoluteAuthCallbackURL('/#generator', origin),
  'https://nanobanana21pro.com/#generator'
);
assert.equal(
  toAbsoluteAuthCallbackURL('/zh/ai-video-generator#tool', origin),
  'https://nanobanana21pro.com/zh/ai-video-generator#tool'
);
assert.equal(
  toAbsoluteAuthCallbackURL('/sign-in?authError=oauth', origin),
  'https://nanobanana21pro.com/settings/generate'
);
assert.equal(
  toAbsoluteAuthCallbackURL('https://evil.example/phish', origin),
  'https://nanobanana21pro.com/settings/generate'
);
assert.equal(
  toAbsoluteAuthCallbackURL(
    'https://evil.example/phish',
    origin,
    '//evil.example'
  ),
  'https://nanobanana21pro.com/settings/generate'
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
