import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const source = await readFile(
  new URL('../public/favicon.svg', import.meta.url)
);
for (const [name, size] of [
  ['favicon-48x48.png', 48],
  ['favicon-96x96.png', 96],
  ['apple-touch-icon.png', 180],
  ['icon-192.png', 192],
  ['icon-512.png', 512],
]) {
  await sharp(source)
    .resize(size, size)
    .png()
    .toFile(fileURLToPath(new URL(`../public/${name}`, import.meta.url)));
}
const sizes = [48, 96];
const buffers = await Promise.all(
  sizes.map((size) => sharp(source).resize(size, size).png().toBuffer())
);
const header = Buffer.alloc(6 + sizes.length * 16);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(sizes.length, 4);
let offset = header.length;
for (let i = 0; i < sizes.length; i++) {
  const position = 6 + i * 16;
  header[position] = sizes[i];
  header[position + 1] = sizes[i];
  header.writeUInt16LE(1, position + 4);
  header.writeUInt16LE(32, position + 6);
  header.writeUInt32LE(buffers[i].length, position + 8);
  header.writeUInt32LE(offset, position + 12);
  offset += buffers[i].length;
}
await writeFile(
  new URL('../public/favicon.ico', import.meta.url),
  Buffer.concat([header, ...buffers])
);
