import assert from 'node:assert/strict';

import {
  CREATIVE_MODELS,
  getCreativeUnitCredits,
} from '../../src/config/creative-studio';
import {
  GENERATOR_DRAFT_KEY,
  markGeneratorDraftAccepted,
  normalizeGeneratorDraft,
  PREVIOUS_GENERATOR_DRAFT_KEY,
  publicRecipeDraft,
  resolveGeneratorEntry,
  savePreviousGeneratorDraft,
} from '../../src/lib/generator-entry';

const old = {
  prompt: 'Old English brief',
  model: 'nano-banana-pro',
  operation: 'edit',
  aspectRatio: '16:9',
  resolution: '4K',
  outputCount: 4,
  imageUrls: ['https://example.invalid/reference.png'],
};
const selected = resolveGeneratorEntry(
  new URLSearchParams('recipe=chinese-tea-poster'),
  old,
  old,
  'nano-banana-2.1'
);
assert(selected.draft?.prompt.includes('春山新茶'));
assert.equal(selected.draft?.model, 'nano-banana-2.1');
assert.equal(selected.draft?.aspectRatio, '3:4');
assert.equal(selected.draft?.resolution, '2K');
assert.equal(selected.draft?.outputCount, 1);
assert.deepEqual(selected.draft?.imageUrls, []);
const continued = resolveGeneratorEntry(
  new URLSearchParams(),
  { ...selected.draft, pendingSelection: true },
  old,
  'nano-banana-2.1'
);
assert(continued.explicit);
assert.equal(continued.draft?.prompt, selected.draft?.prompt);
const missing = resolveGeneratorEntry(
  new URLSearchParams('recipe=missing'),
  old,
  old,
  'nano-banana-2.1'
);
assert(missing.missing);
assert.equal(missing.draft, null);
const query = resolveGeneratorEntry(
  new URLSearchParams(
    'prompt=Fresh&model=nano-banana-2.1&ratio=9:16&resolution=1K'
  ),
  old,
  old,
  'nano-banana-pro'
);
assert.equal(query.draft?.prompt, 'Fresh');
assert.equal(query.draft?.aspectRatio, '9:16');
assert.equal(query.draft?.outputCount, 1);
const handoff = resolveGeneratorEntry(
  new URLSearchParams('resume=recipe'),
  old,
  {
    ...selected.draft,
    operation: 'edit',
    imageUrls: ['https://example.invalid/new.png'],
  },
  'nano-banana-2.1',
  true
);
assert.equal(handoff.draft?.imageUrls[0], 'https://example.invalid/new.png');
assert.equal(handoff.draft?.resolution, '2K');
const fresh = resolveGeneratorEntry(
  new URLSearchParams(),
  null,
  null,
  'nano-banana-2.1'
);
assert.equal(fresh.draft, null);
const bad = normalizeGeneratorDraft({
  ...old,
  model: 'unknown',
  aspectRatio: 'invalid',
  resolution: 'invalid',
  outputCount: -1,
  imageUrls: [
    'javascript:bad',
    'http://example.invalid',
    'https://example.invalid/ok',
  ],
});
assert.equal(bad?.model, 'nano-banana-2.1');
assert.equal(bad?.resolution, '1K');
assert.equal(bad?.outputCount, 1);
assert.deepEqual(bad?.imageUrls, ['https://example.invalid/ok']);
const storage = new Map([[GENERATOR_DRAFT_KEY, JSON.stringify(old)]]);
savePreviousGeneratorDraft({
  getItem: (k) => storage.get(k) || null,
  setItem: (k, v) => {
    storage.set(k, v);
  },
});
assert.equal(
  JSON.parse(storage.get(PREVIOUS_GENERATOR_DRAFT_KEY)!).prompt,
  old.prompt
);
assert.throws(() =>
  savePreviousGeneratorDraft({
    getItem: () => {
      throw Error('storage denied');
    },
    setItem: () => {},
  })
);
for (const id of ['NB-05', 'NB-06', 'NB-07', 'NB-08', 'NB-16', 'NB-17']) {
  const d = publicRecipeDraft(id)!;
  assert.equal(d.model, 'nano-banana-2.1');
  assert.equal(d.resolution, '1K');
  assert.equal(d.outputCount, 1);
  assert.equal(
    getCreativeUnitCredits(
      CREATIVE_MODELS.find((m) => m.id === d.model)!,
      d.operation,
      d.resolution
    ),
    8
  );
}
assert.equal(publicRecipeDraft('NB-18'), null);
const asset = normalizeGeneratorDraft({
  ...old,
  model: 'fal-ai/nano-banana-pro/edit',
});
assert.equal(asset?.model, 'nano-banana-pro');
assert.equal(asset?.outputCount, 4);
assert.equal(asset?.aspectRatio, '16:9');
console.log(
  'Generator entry regression passed: stale draft, explicit recipe, query, login handoff, missing recipe, malformed input, storage denial and six real examples.'
);

const submitted = publicRecipeDraft('chinese-tea-poster')!;
const latest = publicRecipeDraft('NB-17')!;
const acceptedStorage = new Map([
  [
    GENERATOR_DRAFT_KEY,
    JSON.stringify({ ...submitted, pendingSelection: true }),
  ],
]);
const adapter = {
  getItem: (key: string) => acceptedStorage.get(key) || null,
  setItem: (key: string, value: string) => {
    acceptedStorage.set(key, value);
  },
};
assert(markGeneratorDraftAccepted(adapter, submitted));
assert.equal(
  JSON.parse(acceptedStorage.get(GENERATOR_DRAFT_KEY)!).pendingSelection,
  false
);
const newerRaw = JSON.stringify({ ...latest, pendingSelection: true });
acceptedStorage.set(GENERATOR_DRAFT_KEY, newerRaw);
assert.equal(markGeneratorDraftAccepted(adapter, submitted), false);
assert.equal(acceptedStorage.get(GENERATOR_DRAFT_KEY), newerRaw);
assert.equal(
  markGeneratorDraftAccepted(
    {
      getItem: () => {
        throw Error('denied');
      },
      setItem: () => {},
    },
    submitted
  ),
  false
);
console.log(
  'Accepted request clears only its matching draft; delayed responses preserve newer selections.'
);
