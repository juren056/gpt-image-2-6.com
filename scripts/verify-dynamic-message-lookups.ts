import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

import {
  getMatchaFilterFaqs,
  getMinimaxH3Faqs,
  getSpecialToolFaqs,
  getToolFaqs,
  getWan3Faqs,
} from '../src/blocks/public-faq-copy';
import { workflowCopy } from '../src/blocks/workflow-copy';
import { createMessageLookup } from '../src/core/i18n/dynamic';
import { m } from '../src/paraglide/messages.js';
import { locales } from '../src/paraglide/runtime.js';

const scopes = JSON.parse(
  readFileSync(
    new URL('./dynamic-message-scopes.json', import.meta.url),
    'utf8'
  )
) as Record<string, string[]>;
const catalog = JSON.parse(
  readFileSync(new URL('../messages/en.json', import.meta.url), 'utf8')
) as Record<string, unknown>;
const allMessages = m as Record<string, unknown>;
let checked = 0;
for (const [scope, prefixes] of Object.entries(scopes)) {
  const { messages, tDynamic, hasDynamicMessage } = await import(
    `../src/core/i18n/lookups/${scope}.ts`
  );
  const expected = Object.keys(catalog)
    .filter((key) => prefixes.some((prefix) => key.startsWith(prefix)))
    .sort();
  assert.deepEqual(Object.keys(messages).sort(), expected, scope);
  for (const key of expected) {
    // Identical function preserves parameters, locale dispatch, fallback and metadata.
    assert.equal(messages[key], allMessages[key], `${scope}: ${key}`);
    assert.equal(hasDynamicMessage(key), true);
    checked++;
  }
  for (const locale of locales) {
    const localized = JSON.parse(
      readFileSync(
        new URL(`../messages/${locale}.json`, import.meta.url),
        'utf8'
      )
    );
    for (const key of expected)
      assert.ok(Object.hasOwn(localized, key), `${locale}: ${key}`);
  }
  for (const key of ['missing.key', 'toString', '__proto__', 'constructor']) {
    assert.equal(hasDynamicMessage(key), false);
    assert.equal(tDynamic(key), key);
  }
}
const lookup = createMessageLookup({
  'example.credits': m['common.sign.reward_badge'],
});
for (const locale of locales) {
  assert.equal(
    lookup.tDynamic('example.credits', { credits: 23 }, { locale }),
    m['common.sign.reward_badge']({ credits: 23 }, { locale })
  );
}
console.log(
  `Passed ${checked} scoped function identities, ${locales.length} locales, interpolation, locale overrides, missing keys and prototype keys.`
);

// A computed access to the complete message namespace defeats tree shaking.
const sourceRoot = new URL('../src/', import.meta.url);
let sourceFiles = 0;
for (const entry of readdirSync(sourceRoot, {
  recursive: true,
  withFileTypes: true,
})) {
  if (!entry.isFile() || !/\.tsx?$/.test(entry.name)) continue;
  const filename = path.join(entry.parentPath, entry.name);
  if (filename.includes(`${path.sep}paraglide${path.sep}`)) continue;
  const file = ts.createSourceFile(
    filename,
    readFileSync(filename, 'utf8'),
    ts.ScriptTarget.Latest,
    true
  );
  const visit = (node: ts.Node) => {
    if (ts.isElementAccessExpression(node)) {
      let object: ts.Expression = node.expression;
      while (ts.isParenthesizedExpression(object) || ts.isAsExpression(object))
        object = object.expression;
      if (ts.isIdentifier(object) && object.text === 'm') {
        assert.ok(
          node.argumentExpression &&
            (ts.isStringLiteral(node.argumentExpression) ||
              ts.isNoSubstitutionTemplateLiteral(node.argumentExpression)),
          `Unbounded message namespace in ${filename}`
        );
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(file);
  sourceFiles++;
}
console.log(
  `Verified ${sourceFiles} source files contain no unbounded message namespace access.`
);

for (const locale of locales) {
  assert.equal(
    workflowCopy(locale).title,
    m['workflow.title']({}, { locale }),
    `Explicit workflow locale: ${locale}`
  );
}
console.log(
  'Explicit workflow copy locale passed for all 18 locales, independently of RPC request URL.'
);

for (const locale of locales) {
  const groups = [
    ['tools.poster', getToolFaqs('poster', locale), 6],
    ['tools.product_photo', getToolFaqs('product_photo', locale), 6],
    ['tools.video', getSpecialToolFaqs('video', locale), 5],
    [
      'tools.youtube_thumbnail',
      getSpecialToolFaqs('youtube_thumbnail', locale),
      5,
    ],
    [
      'tools.background_remover',
      getSpecialToolFaqs('background_remover', locale),
      5,
    ],
    ['tools.matcha_filter', getMatchaFilterFaqs(locale), 5],
    ['wan3', getWan3Faqs(locale), 6],
    ['minimax_h3', getMinimaxH3Faqs(locale), 5],
  ] as const;
  for (const [prefix, items, count] of groups) {
    assert.equal(items.length, count);
    items.forEach((item, index) => {
      for (const part of ['question', 'answer'] as const) {
        const fn = allMessages[`${prefix}.faq_${index + 1}_${part}`] as (
          inputs: object,
          options: { locale: string }
        ) => string;
        assert.equal(
          item[part],
          fn({}, { locale }),
          `${locale}: ${prefix} ${index + 1} ${part}`
        );
      }
    });
  }
}
console.log(
  'All 43 public FAQs preserve their question/answer text in all 18 locales without workspace imports.'
);
