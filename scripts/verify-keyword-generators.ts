import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import sharp from 'sharp';

import {
  buildShirtMockupSvg,
  dominantPalette,
  hasRasterSignature,
  quantizePixels,
} from '../src/lib/keyword-image-tools';
import {
  getImageDownloadFilename,
  readBoundedVectorResponse,
  validateEditableVectorSvg,
} from '../src/modules/images/download';

const transparentPng =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScL/ewAAAABJRU5ErkJggg==';
const shirt = buildShirtMockupSvg({
  designDataUrl: transparentPng,
  shirtColor: '#1b2232',
  printScale: 30,
  printY: 360,
});
assert.match(shirt, /<image\s/);
assert.match(shirt, /#1b2232/);
assert.match(shirt, /xlink:href="data:image\/png;base64,/);
assert.equal(
  hasRasterSignature(
    'image/png',
    Buffer.from(transparentPng.split(',')[1], 'base64')
  ),
  true
);
assert.equal(
  hasRasterSignature('image/png', Buffer.from('<svg onload="alert(1)"/>')),
  false
);
const sampleDesign = await sharp(
  Buffer.from(
    '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="#f00"/></svg>'
  )
)
  .png()
  .toBuffer();
const renderedShirt = await sharp(
  Buffer.from(
    buildShirtMockupSvg({
      designDataUrl: `data:image/png;base64,${sampleDesign.toString('base64')}`,
      shirtColor: '#1b2232',
      printScale: 30,
      printY: 360,
    })
  )
)
  .png()
  .raw()
  .toBuffer({ resolveWithObject: true });
const center =
  (450 * renderedShirt.info.width + 450) * renderedShirt.info.channels;
assert.ok(
  renderedShirt.data[center] > 200,
  'Print should render in the shirt center'
);
assert.ok(
  renderedShirt.data[center + 1] < 80,
  'Print should retain its red color'
);
assert.throws(
  () =>
    buildShirtMockupSvg({
      designDataUrl: 'data:image/svg+xml,<svg onload="alert(1)"/>',
      shirtColor: '#1b2232',
      printScale: 30,
      printY: 360,
    }),
  /Upload/
);

assert.deepEqual(
  [...quantizePixels(new Uint8ClampedArray([255, 128, 0, 255]), 4)],
  [255, 255, 0, 255]
);
assert.deepEqual(
  [...quantizePixels(new Uint8ClampedArray([55, 60, 65, 0]), 16)],
  [55, 60, 65, 0]
);
assert.deepEqual(dominantPalette(new Uint8ClampedArray([255, 255, 255, 255])), [
  '#ffffff',
]);

assert.equal(
  validateEditableVectorSvg('<svg><path d="M0 0h1"/></svg>'),
  '<svg><path d="M0 0h1"/></svg>'
);
assert.throws(
  () =>
    validateEditableVectorSvg(
      '<svg><image href="data:image/png;base64,abc"/></svg>'
    ),
  /editable vector/
);
assert.throws(
  () =>
    validateEditableVectorSvg(
      '<svg><script>alert(1)</script><path d="M0 0"/></svg>'
    ),
  /editable vector/
);
assert.equal(
  getImageDownloadFilename('task-1', 'image/svg+xml'),
  'qwen-image-task-1.svg'
);
assert.equal(
  await readBoundedVectorResponse(new Response('<svg><path d="M0 0"/></svg>')),
  '<svg><path d="M0 0"/></svg>'
);

const english = JSON.parse(readFileSync('messages/en.json', 'utf8')) as Record<
  string,
  string
>;
const chinese = JSON.parse(readFileSync('messages/zh.json', 'utf8')) as Record<
  string,
  string
>;
for (const key of Object.keys(english).filter((name) =>
  name.startsWith('keyword.')
)) {
  assert.ok(chinese[key], `Missing Chinese copy: ${key}`);
}
const sitemap = readFileSync('src/routes/sitemap[.]xml.ts', 'utf8');
assert.match(sitemap, /\/shirt-mockup-generator/);
assert.match(sitemap, /\/pixel-art-generator/);
assert.doesNotMatch(sitemap, /\/image-to-prompt/);
assert.match(
  readFileSync('src/routes/image-to-prompt.tsx', 'utf8'),
  /indexableLocales: \[\]/
);
console.log('Keyword generator checks passed');
