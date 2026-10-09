const OFFICIAL_RELEASE_URL = 'https://qwen.ai/blog?id=qwen-image-3.0';
const FAL_API_URL =
  'https://fal.ai/models/alibaba/qwen-image-3/text-to-image/api';

async function inspectUrl(url: string) {
  const response = await fetch(url, {
    redirect: 'follow',
    signal: AbortSignal.timeout(15_000),
    headers: { 'user-agent': 'qwenimage3-readiness-check/1.0' },
  });
  const body = await response.text();
  return { url, status: response.status, body };
}

const [official, fal] = await Promise.all([
  inspectUrl(OFFICIAL_RELEASE_URL),
  inspectUrl(FAL_API_URL),
]);
const officialReleased =
  official.status === 200 && /Qwen-Image-3\.0/i.test(official.body);
const falPublished =
  fal.status === 200 &&
  /alibaba\/qwen-image-3\/text-to-image/i.test(fal.body) &&
  !/(page not found|model not found|404)/i.test(fal.body);

const result = {
  checkedAt: new Date().toISOString(),
  state: officialReleased && falPublished ? 'AVAILABLE' : 'UNAVAILABLE',
  productionIntegrationEnabled: officialReleased && falPublished,
  official: {
    url: OFFICIAL_RELEASE_URL,
    status: official.status,
    model: 'Qwen-Image-3.0',
    released: officialReleased,
  },
  fal: {
    url: FAL_API_URL,
    status: fal.status,
    model: 'alibaba/qwen-image-3/text-to-image',
    published: falPublished,
  },
};

console.log(JSON.stringify(result, null, 2));

if (!officialReleased || !falPublished) {
  process.exitCode = 1;
}

export {};
