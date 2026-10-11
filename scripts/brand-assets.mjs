import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

// One vector master; deterministic exports keep all brand surfaces consistent.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const publicDir = path.join(root, 'public');
const brandDir = path.join(publicDir, 'brand');
await fs.mkdir(brandDir, { recursive: true });

// Selected proposal D, redrawn as an editable pixel-grid master. Integer
// coordinates make the silhouette crisp even in the 16px favicon.
const mark = `<g transform="scale(32)" shape-rendering="crispEdges">
  <path d="M11 2h2v1h1v2h1v5h-1v2h-1v1h-1v1h-2v1H5v-1H3v-1H2v-2h1v-1h3V9h2V8h1V7h1V6h1V4h-1V3h1Z" fill="#191C18"/>
  <path d="M12 5h2v5h-1v2h-1v1h-2v1H5v-1H3v-2h3v-1h2V9h1V8h1V7h1V6h1Z" fill="#FFD43B"/>
  <path d="M11 3h2v2h-1V4h-1Z" fill="#B6DE55"/>
</g>`;
const svg = (
  body,
  width = 512,
  height = 512,
  label = 'Nano Banana — Pixel Peel'
) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title"><title id="title">${label}</title>${body}</svg>\n`;
const icon = svg(mark);
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
  await rendered.png().toFile(path.join(publicDir, name));
}
// Transparent artwork uses purpose=any; remove the obsolete opaque maskable set.
for (const size of [192, 512]) {
  await fs.rm(path.join(publicDir, `icon-maskable-${size}.png`), {
    force: true,
  });
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
  <path d="M944 64h64v64h64v64h64v64h64M1008 480h64v-64h64v-64h64" fill="none" stroke="#31372B" stroke-width="16"/>
  <g transform="translate(764 119) scale(.76)">${mark}</g>
  <text x="80" y="125" fill="#FFD43B" font-family="Segoe UI,Arial,sans-serif" font-size="22" font-weight="700" letter-spacing="4">NANO BANANA</text>
  <text x="76" y="266" fill="#FAF9F2" font-family="Segoe UI,Arial,sans-serif" font-size="76" font-weight="700" letter-spacing="-3">Small pixels.</text>
  <text x="76" y="359" fill="#FAF9F2" font-family="Segoe UI,Arial,sans-serif" font-size="76" font-weight="700" letter-spacing="-3">Big imagination.</text>
  <text x="80" y="443" fill="#C1C6B7" font-family="Segoe UI,Arial,sans-serif" font-size="26">AI image generation &amp; editing</text>
  <path d="M80 510h70" stroke="#FFD43B" stroke-width="5" stroke-linecap="round"/>
  <text x="80" y="568" fill="#C1C6B7" font-family="Segoe UI,Arial,sans-serif" font-size="21">nanobanana21pro.com</text>`,
  1200,
  630,
  'Nano Banana — Small pixels. Big imagination.'
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
          src: `/icon-${size}.png?v=pixel-peel-transparent-2`,
          sizes: `${size}x${size}`,
          type: 'image/png',
          purpose: 'any',
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
