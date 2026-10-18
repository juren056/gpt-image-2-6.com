import assert from 'node:assert/strict';

import {
  classifyOAuthLinkError,
  googleLinkRecoveryDestination,
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
const recovery = new URL(
  googleLinkRecoveryDestination('/#tool-generator'),
  origin
);
assert.equal(recovery.pathname, '/settings/profile');
assert.equal(recovery.searchParams.get('returnTo'), '/#tool-generator');
assert.equal(
  new URL(
    googleLinkRecoveryDestination('//evil.example'),
    origin
  ).searchParams.get('returnTo'),
  '/settings/generate'
);
assert.equal(classifyOAuthLinkError('account_not_linked'), 'not-linked');
assert.equal(classifyOAuthLinkError("email_doesn't_match"), 'different-email');
assert.equal(
  classifyOAuthLinkError('account_already_linked_to_different_user'),
  'conflict'
);
assert.equal(classifyOAuthLinkError('<script>alert(1)</script>'), 'generic');

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

const { googleRecoveryTarget } = await import('../src/lib/auth-navigation');
const { applySiteAuthPolicy } = await import('../src/lib/auth-policy');
assert.equal(
  googleRecoveryTarget('/#generator', 'account_not_linked'),
  '/#generator'
);
assert.equal(
  googleRecoveryTarget(googleLinkRecoveryDestination('/#generator')),
  '/#generator'
);
assert.equal(
  googleRecoveryTarget('//evil.example', 'account_not_linked'),
  null
);
assert.equal(
  googleRecoveryTarget(
    '/settings/profile?connect=google&returnTo=https://evil.example'
  ),
  '/settings/generate'
);
const policy = applySiteAuthPolicy({
  google_auth_enabled: 'true',
  google_one_tap_enabled: 'true',
  email_otp_sign_in_enabled: 'true',
  email_verification_enabled: 'true',
  github_auth_enabled: 'true',
});
assert.equal(policy.email_otp_sign_in_enabled, 'false');
assert.equal(policy.email_verification_enabled, 'false');
assert.equal(policy.github_auth_enabled, 'false');
assert.equal(policy.google_auth_enabled, 'true');
assert.equal(policy.google_one_tap_enabled, 'true');
