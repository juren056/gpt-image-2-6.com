import { readFile } from 'node:fs/promises';
import path from 'node:path';

const settings = JSON.parse(
  await readFile(path.resolve('project.inlang/settings.json'), 'utf8')
);
const baseLocale = settings.baseLocale;
const base = JSON.parse(
  await readFile(path.resolve(`messages/${baseLocale}.json`), 'utf8')
);
const baseKeys = Object.keys(base);
const placeholders = (value) =>
  (String(value).match(/\{[^{}]+\}/g) ?? []).sort().join('|');
let failed = false;

for (const locale of settings.locales) {
  let messages;
  try {
    messages = JSON.parse(
      await readFile(path.resolve(`messages/${locale}.json`), 'utf8')
    );
  } catch (error) {
    console.error(`${locale}: missing or invalid catalog (${error.message})`);
    failed = true;
    continue;
  }

  const keys = Object.keys(messages);
  const missing = baseKeys.filter((key) => !(key in messages));
  const extra = keys.filter((key) => !(key in base));
  const mismatched = baseKeys.filter(
    (key) =>
      key !== '$schema' &&
      placeholders(base[key]) !== placeholders(messages[key])
  );
  const tokens = baseKeys.filter((key) =>
    String(messages[key]).includes('ZXQPH')
  );
  const corrupted = baseKeys.filter((key) =>
    /\?{3,}/.test(String(messages[key]))
  );
  const ok =
    !missing.length &&
    !extra.length &&
    !mismatched.length &&
    !tokens.length &&
    !corrupted.length;
  console.log(
    `${locale}: ${keys.length} keys, ${missing.length} missing, ${extra.length} extra, ` +
      `${mismatched.length} placeholder mismatches, ${tokens.length} protected tokens, ` +
      `${corrupted.length} corrupted values`
  );
  if (!ok) failed = true;
}

if (failed) process.exitCode = 1;
