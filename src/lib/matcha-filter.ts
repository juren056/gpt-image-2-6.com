const MATCHA_STRENGTHS = [0.58, 0.68, 0.78, 0.88, 0.92] as const;

export const DEFAULT_MATCHA_FILTER_STRENGTH = 0.86;
export const MATCHA_COLORIZATION_THRESHOLD = 0.88;
export const MATCHA_COLORIZATION_STRENGTH = 0.62;

export function sanitizeMatchaFilterStrength(value: unknown) {
  const strength = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(strength)) return DEFAULT_MATCHA_FILTER_STRENGTH;
  return Math.min(0.92, Math.max(0.55, strength));
}

export function shouldRunMatchaColorization(strength: unknown) {
  return (
    sanitizeMatchaFilterStrength(strength) >= MATCHA_COLORIZATION_THRESHOLD
  );
}

export function estimateMatchaFilterStrength(pixels: Uint8ClampedArray) {
  let visiblePixels = 0;
  let matchaPixels = 0;
  let matchaSaturation = 0;
  let blueDeficit = 0;

  for (let index = 0; index + 3 < pixels.length; index += 4) {
    const red = pixels[index] / 255;
    const green = pixels[index + 1] / 255;
    const blue = pixels[index + 2] / 255;
    const alpha = pixels[index + 3] / 255;
    const max = Math.max(red, green, blue);
    const min = Math.min(red, green, blue);

    if (alpha < 0.5 || max < 0.08 || max > 0.98) continue;

    const delta = max - min;
    const saturation = max ? delta / max : 0;
    let hue = 0;
    if (delta) {
      if (max === red) hue = 60 * (((green - blue) / delta) % 6);
      else if (max === green) hue = 60 * ((blue - red) / delta + 2);
      else hue = 60 * ((red - green) / delta + 4);
      if (hue < 0) hue += 360;
    }

    visiblePixels += 1;
    blueDeficit += Math.max(0, (red + green) / 2 - blue);

    if (hue >= 42 && hue <= 150 && saturation >= 0.12) {
      matchaPixels += 1;
      matchaSaturation += saturation;
    }
  }

  if (!visiblePixels) return DEFAULT_MATCHA_FILTER_STRENGTH;

  const castCoverage = matchaPixels / visiblePixels;
  const averageMatchaSaturation = matchaPixels
    ? matchaSaturation / matchaPixels
    : 0;
  const averageBlueDeficit = blueDeficit / visiblePixels;
  const score =
    castCoverage * 0.62 +
    averageMatchaSaturation * 0.23 +
    Math.min(1, averageBlueDeficit * 3) * 0.15;

  if (score < 0.16) return MATCHA_STRENGTHS[0];
  if (score < 0.28) return MATCHA_STRENGTHS[1];
  if (score < 0.43) return MATCHA_STRENGTHS[2];
  if (score < 0.62) return MATCHA_STRENGTHS[3];
  return MATCHA_STRENGTHS[4];
}
