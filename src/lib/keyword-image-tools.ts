export type ShirtColor = '#f8f7f2' | '#1b2232' | '#d6d9df' | '#d94f45';

export function hasRasterSignature(mime: string, bytes: Uint8Array): boolean {
  if (mime === 'image/png') {
    const signature = [137, 80, 78, 71, 13, 10, 26, 10];
    return signature.every((value, index) => bytes[index] === value);
  }
  if (mime === 'image/jpeg') return bytes[0] === 0xff && bytes[1] === 0xd8;
  if (mime === 'image/webp') {
    return (
      String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' &&
      String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP'
    );
  }
  return false;
}

const SHIRT_COLORS = new Set<ShirtColor>([
  '#f8f7f2',
  '#1b2232',
  '#d6d9df',
  '#d94f45',
]);

export function buildShirtMockupSvg(params: {
  designDataUrl: string;
  shirtColor: ShirtColor;
  printScale: number;
  printY: number;
}): string {
  if (
    !/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(
      params.designDataUrl
    )
  ) {
    throw new Error('Upload a PNG, JPEG, or WebP design.');
  }
  if (!SHIRT_COLORS.has(params.shirtColor))
    throw new Error('Invalid shirt color.');
  const scale = Math.max(15, Math.min(32, Math.round(params.printScale)));
  const y = Math.max(315, Math.min(450, Math.round(params.printY)));
  const width = Math.round((scale / 100) * 900);
  const x = Math.round((900 - width) / 2);
  const isDark = params.shirtColor === '#1b2232';
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 900 900" width="900" height="900">
    <defs>
      <radialGradient id="surface"><stop stop-color="#ffffff"/><stop offset="1" stop-color="#e8e5df"/></radialGradient>
      <linearGradient id="fabric" x2="1" y2="1"><stop stop-color="#ffffff" stop-opacity=".17"/><stop offset=".5" stop-color="#ffffff" stop-opacity="0"/><stop offset="1" stop-color="#000000" stop-opacity=".14"/></linearGradient>
      <filter id="shadow" x="-30%" y="-30%" width="160%" height="170%"><feGaussianBlur stdDeviation="22"/></filter>
      <clipPath id="print-area"><rect x="300" y="290" width="300" height="460" rx="6"/></clipPath>
    </defs>
    <rect width="900" height="900" fill="url(#surface)"/>
    <ellipse cx="453" cy="790" rx="290" ry="40" fill="#20242e" opacity=".17" filter="url(#shadow)"/>
    <path d="M326 166 223 208 112 356 239 430 294 353 292 753 Q450 793 608 753 L606 353 661 430 788 356 677 208 574 166 530 204 Q450 243 370 204Z" fill="${params.shirtColor}" stroke="${isDark ? '#121824' : '#babdc1'}" stroke-width="5" stroke-linejoin="round"/>
    <path d="M326 166 223 208 112 356 239 430 294 353 292 753 Q450 793 608 753 L606 353 661 430 788 356 677 208 574 166 530 204 Q450 243 370 204Z" fill="url(#fabric)"/>
    <path d="M370 204 Q450 255 530 204 Q505 297 450 298 Q395 297 370 204Z" fill="${isDark ? '#111827' : '#e4e1da'}" opacity=".8"/>
    <path d="M370 204 Q450 255 530 204" fill="none" stroke="${isDark ? '#434b5d' : '#b9b8b4'}" stroke-width="5"/>
    <path d="M292 753 Q450 793 608 753" fill="none" stroke="${isDark ? '#101725' : '#b9b8b4'}" stroke-width="4" opacity=".55"/>
    <path d="M294 353 Q321 380 323 414 M606 353 Q579 380 577 414" fill="none" stroke="#777" stroke-width="5" opacity=".13"/>
    <g clip-path="url(#print-area)"><image x="${x}" y="${y}" width="${width}" height="${width}" preserveAspectRatio="xMidYMid meet" xlink:href="${params.designDataUrl}"/></g>
  </svg>`;
}

export function quantizePixels(
  pixels: Uint8ClampedArray,
  paletteSize: 4 | 8 | 16 | 32
): Uint8ClampedArray {
  const result = new Uint8ClampedArray(pixels);
  const levels =
    paletteSize <= 4 ? 2 : paletteSize <= 8 ? 3 : paletteSize <= 16 ? 4 : 6;
  const step = 255 / (levels - 1);
  for (let index = 0; index < result.length; index += 4) {
    if (result[index + 3] < 16) {
      result[index + 3] = 0;
      continue;
    }
    for (let channel = 0; channel < 3; channel += 1) {
      result[index + channel] =
        Math.round(result[index + channel] / step) * step;
    }
  }
  return result;
}

export function dominantPalette(
  pixels: Uint8ClampedArray,
  limit = 3
): string[] {
  const counts = new Map<string, number>();
  for (let index = 0; index < pixels.length; index += 16) {
    if (pixels[index + 3] < 128) continue;
    const hex = [0, 1, 2]
      .map((channel) =>
        Math.min(255, Math.round(pixels[index + channel] / 32) * 32)
          .toString(16)
          .padStart(2, '0')
          .slice(-2)
      )
      .join('');
    counts.set(hex, (counts.get(hex) || 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([hex]) => `#${hex}`);
}
