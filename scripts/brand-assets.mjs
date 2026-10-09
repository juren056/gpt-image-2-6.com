import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

// One vector master; deterministic exports keep all brand surfaces consistent.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const publicDir = path.join(root, 'public');
const brandDir = path.join(publicDir, 'brand');
await fs.mkdir(brandDir, { recursive: true });

const mark = `<g>
  <path d="M113 160l-8-28 22-8 11 33" fill="#B98125"/>
  <path d="M119 151C115 259 192 332 288 315c57-10 99-55 123-114-2 112-83 194-182 181C126 369 73 274 100 168Z" fill="#FFD43B"/>
  <path d="M111 178c-14 79 31 158 115 174 77 15 143-36 172-103-30 98-107 143-182 115-72-27-106-99-105-186Z" fill="#F3AA19"/>
  <path d="M136 231c17 45 50 73 98 81" fill="none" stroke="#FFF3A7" stroke-width="12" stroke-linecap="round"/>
  <path d="m352 88 15 41 41 15-41 15-15 41-15-41-41-15 41-15Z" fill="#FFF3A7"/>
  <rect x="269" y="184" width="18" height="18" rx="4" fill="#FFD43B"/>
</g>`;
const svg = (
  body,
  width = 512,
  height = 512,
  label = 'Nano Banana — banana spark'
) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title"><title id="title">${label}</title>${body}</svg>\n`;
const icon = svg(
  `<rect width="512" height="512" rx="120" fill="#191C18"/>${mark}`
);
const maskable = svg(
  `<rect width="512" height="512" fill="#191C18"/><g transform="translate(51.2 51.2) scale(.8)">${mark}</g>`
);
const transparent = svg(mark);
await fs.writeFile(path.join(publicDir, 'logo.svg'), icon);
await fs.writeFile(path.join(publicDir, 'favicon.svg'), icon);
await fs.writeFile(path.join(brandDir, 'nano-banana-mark.svg'), transparent);
await fs.writeFile(path.join(brandDir, 'nano-banana-icon.svg'), icon);
const wordmark = svg(
  `<g transform="translate(0 0) scale(.1875)">${mark}</g><text x="116" y="64" fill="#191C18" font-family="Inter,Segoe UI,Arial,sans-serif" font-weight="700" font-size="48" letter-spacing="-2">Nano Banana</text>`,
  432,
  96,
  'Nano Banana wordmark'
);
await fs.writeFile(path.join(brandDir, 'nano-banana-wordmark.svg'), wordmark);

const files = [
  ['favicon-16x16.png', 16],
  ['favicon-32x32.png', 32],
  ['favicon-48x48.png', 48],
  ['favicon-96x96.png', 96],
  ['apple-touch-icon.png', 180],
  ['icon-192.png', 192],
  ['icon-512.png', 512],
  ['logo.png', 512],
  ['brand/nano-banana-icon-1024.png', 1024],
];
for (const [name, size] of files) {
  const rendered = sharp(Buffer.from(icon)).resize(size, size);
  if (name === 'apple-touch-icon.png') {
    rendered.flatten({ background: '#191C18' });
  }
  await rendered.png().toFile(path.join(publicDir, name));
}
for (const size of [192, 512]) {
  await sharp(Buffer.from(maskable))
    .resize(size, size)
    .png()
    .toFile(path.join(publicDir, `icon-maskable-${size}.png`));
}
await sharp(Buffer.from(transparent))
  .png()
  .toFile(path.join(brandDir, 'nano-banana-mark.png'));

// ICO stores the real PNG payloads at each advertised resolution.
const sizes = [16, 32, 48, 96];
const pngs = await Promise.all(
  sizes.map((size) =>
    sharp(Buffer.from(icon)).resize(size, size).png().toBuffer()
  )
);
const header = Buffer.alloc(6 + 16 * sizes.length);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(sizes.length, 4);
let offset = header.length;
sizes.forEach((size, index) => {
  const entry = 6 + 16 * index;
  header[entry] = size;
  header[entry + 1] = size;
  header.writeUInt16LE(1, entry + 4);
  header.writeUInt16LE(32, entry + 6);
  header.writeUInt32LE(pngs[index].length, entry + 8);
  header.writeUInt32LE(offset, entry + 12);
  offset += pngs[index].length;
});
await fs.writeFile(
  path.join(publicDir, 'favicon.ico'),
  Buffer.concat([header, ...pngs])
);

const social = svg(
  `<rect width="1200" height="630" fill="#191C18"/>
  <circle cx="1040" cy="120" r="230" fill="none" stroke="#31372B" stroke-width="2"/>
  <circle cx="1040" cy="120" r="330" fill="none" stroke="#31372B" stroke-width="2"/>
  <g transform="translate(745 98) scale(.85)">${mark}</g>
  <text x="80" y="125" fill="#FFD43B" font-family="Segoe UI,Arial,sans-serif" font-size="22" font-weight="700" letter-spacing="4">NANO BANANA</text>
  <text x="76" y="266" fill="#FAF9F2" font-family="Segoe UI,Arial,sans-serif" font-size="76" font-weight="700" letter-spacing="-3">Small spark.</text>
  <text x="76" y="359" fill="#FAF9F2" font-family="Segoe UI,Arial,sans-serif" font-size="76" font-weight="700" letter-spacing="-3">Big imagination.</text>
  <text x="80" y="443" fill="#C1C6B7" font-family="Segoe UI,Arial,sans-serif" font-size="26">AI image generation &amp; editing</text>
  <path d="M80 510h70" stroke="#FFD43B" stroke-width="5" stroke-linecap="round"/>
  <text x="80" y="568" fill="#C1C6B7" font-family="Segoe UI,Arial,sans-serif" font-size="21">nanobanana21pro.com</text>`,
  1200,
  630,
  'Nano Banana — Small spark. Big imagination.'
);
await fs.writeFile(path.join(brandDir, 'nano-banana-social.svg'), social);
await sharp(Buffer.from(social))
  .png()
  .toFile(path.join(brandDir, 'nano-banana-social.png'));

await fs.writeFile(
  path.join(publicDir, 'site.webmanifest'),
  JSON.stringify(
    {
      id: '/',
      name: 'Nano Banana',
      short_name: 'Nano Banana',
      description: 'AI image generation and editing studio',
      lang: 'en',
      start_url: '/',
      scope: '/',
      display: 'standalone',
      theme_color: '#191C18',
      background_color: '#191C18',
      icons: [
        ...[192, 512].map((size) => ({
          src: `/icon-${size}.png`,
          sizes: `${size}x${size}`,
          type: 'image/png',
          purpose: 'any',
        })),
        ...[192, 512].map((size) => ({
          src: `/icon-maskable-${size}.png`,
          sizes: `${size}x${size}`,
          type: 'image/png',
          purpose: 'maskable',
        })),
      ],
    },
    null,
    2
  ) + '\n'
);

console.log(
  'Exported Nano Banana SVG masters, PNG icons, multi-resolution ICO, manifest and 1200×630 social card.'
);
