import { mkdir } from 'node:fs/promises';
import sharp from 'sharp';

import {
  buildShirtMockupSvg,
  quantizePixels,
} from '../src/lib/keyword-image-tools';

const target = 'public/imgs/keyword';
await mkdir(target, { recursive: true });

const logo = await sharp(
  Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600">
    <circle cx="300" cy="250" r="120" fill="#e76d45"/>
    <path d="M236 274 300 157 364 274Z" fill="#f8e5c5"/>
    <text x="300" y="447" text-anchor="middle" font-family="Arial,sans-serif" font-size="68" font-weight="700" letter-spacing="8" fill="#26394b">FIELD</text>
  </svg>`)
)
  .png()
  .toBuffer();
const shirt = buildShirtMockupSvg({
  designDataUrl: `data:image/png;base64,${logo.toString('base64')}`,
  shirtColor: '#f8f7f2',
  printScale: 30,
  printY: 345,
});
await sharp(Buffer.from(shirt))
  .webp({ quality: 88 })
  .toFile(`${target}/shirt-mockup-example.webp`);

const source = await sharp(
  Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="960" height="576" viewBox="0 0 960 576">
    <rect width="960" height="576" fill="#282053"/>
    <circle cx="746" cy="140" r="90" fill="#f4c868"/>
    <path d="M0 375 142 241 275 385 403 269 570 413 730 291 960 436V576H0Z" fill="#6656a5"/>
    <path d="M0 465 168 363 307 472 478 352 652 477 835 372 960 466V576H0Z" fill="#373268"/>
    <path d="M0 515 136 477 272 514 445 469 625 527 784 462 960 510V576H0Z" fill="#1b2749"/>
    <g fill="#f4e5b4"><circle cx="100" cy="90" r="5"/><circle cx="198" cy="164" r="4"/><circle cx="340" cy="70" r="5"/><circle cx="514" cy="138" r="4"/><circle cx="873" cy="76" r="5"/></g>
    <g transform="translate(375 235)">
      <rect x="35" y="88" width="186" height="149" rx="19" fill="#69c5b6"/>
      <rect x="72" y="37" width="114" height="74" rx="18" fill="#83d7c7"/>
      <rect x="92" y="65" width="22" height="22" fill="#202d57"/>
      <rect x="145" y="65" width="22" height="22" fill="#202d57"/>
      <rect x="99" y="125" width="60" height="14" fill="#202d57"/>
      <rect x="-1" y="113" width="42" height="25" fill="#83d7c7"/>
      <rect x="215" y="113" width="42" height="25" fill="#83d7c7"/>
      <rect x="69" y="233" width="35" height="35" fill="#db855e"/>
      <rect x="154" y="233" width="35" height="35" fill="#db855e"/>
      <rect x="116" y="13" width="25" height="27" fill="#83d7c7"/>
      <circle cx="128" cy="7" r="12" fill="#f4c868"/>
    </g>
  </svg>`)
)
  .png()
  .toBuffer();
const gridWidth = 64;
const gridHeight = 38;
const small = await sharp(source)
  .resize(gridWidth, gridHeight, { fit: 'fill' })
  .ensureAlpha()
  .raw()
  .toBuffer();
const quantized = quantizePixels(new Uint8ClampedArray(small), 16);
await sharp(Buffer.from(quantized), {
  raw: { width: gridWidth, height: gridHeight, channels: 4 },
})
  .resize(gridWidth * 16, gridHeight * 16, { kernel: 'nearest' })
  .webp({ quality: 90, effort: 5 })
  .toFile(`${target}/pixel-art-example.webp`);

console.log('Generated two real keyword-tool examples');
