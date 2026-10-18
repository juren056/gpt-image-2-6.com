import assert from 'node:assert/strict';

import { rewriteMessageImports } from './direct-message-imports';

const source = `import { m } from '@/paraglide/messages.js';
export const title = (locale: string) => <h1>{m['common.metadata.title']({}, { locale })}</h1>;
export const repeated = m['common.metadata.title'];
export const reward = m['common.sign.reward_badge']({ credits: 23 });`;
const modules = new Map([
  ['common.metadata.title', '@/paraglide/messages/common_metadata_title.js'],
  [
    'common.sign.reward_badge',
    '@/paraglide/messages/common_sign_reward_badge.js',
  ],
]);
for (const id of ['fixture.tsx', 'fixture.tsx?tsr-split=component']) {
  const result = rewriteMessageImports(source, id, modules)!;
  assert.ok(
    result.code.includes('from "@/paraglide/messages/common_metadata_title.js"')
  );
  assert.equal((result.code.match(/import \{/g) || []).length, 2);
  assert.ok(result.code.includes('__directParaglideMessage0({}, { locale })'));
  assert.ok(result.code.includes('repeated = __directParaglideMessage0'));
  assert.ok(result.code.includes('__directParaglideMessage1({ credits: 23 })'));
  assert.deepEqual(result.map.sourcesContent, [source]);
  assert.ok(result.map.mappings.length > 0);
  assert.ok(!result.code.includes("from '@/paraglide/messages.js'"));
}
assert.equal(
  rewriteMessageImports('export const x = 1', 'fixture.ts', modules),
  null
);
assert.throws(
  () =>
    rewriteMessageImports(
      "import { m } from '@/paraglide/messages.js'; Object.values(m)",
      'fixture.ts',
      modules
    ),
  /Unsupported/
);
assert.throws(
  () =>
    rewriteMessageImports(
      "import { m } from '@/paraglide/messages.js'; m[key]()",
      'fixture.ts',
      modules
    ),
  /Unbounded/
);
assert.throws(
  () =>
    rewriteMessageImports(
      "import { m } from '@/paraglide/messages.js'; m['missing']()",
      'fixture.ts',
      modules
    ),
  /No compiled message/
);
console.log(
  'Direct message imports preserve JSX, repeated references, arguments, locale options and source maps; invalid accesses fail closed.'
);
