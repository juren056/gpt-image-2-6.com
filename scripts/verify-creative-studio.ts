import assert from 'node:assert/strict';

import {
  CREATIVE_MODELS,
  requireProductionCreativeModel,
  validateCreativeRequest,
} from '../src/config/creative-studio';
import { CREATIVE_TOOLS } from '../src/config/creative-tools';
import { FalProvider } from '../src/core/ai/fal';
import { GeminiProvider } from '../src/core/ai/gemini';
import { OpenAIImageProvider } from '../src/core/ai/openai-image';
import { AIMediaType } from '../src/core/ai/types';
import {
  applyTemplate,
  recolorSvg,
  sanitizeSvgMarkup,
} from '../src/lib/creative-canvas';
import { getFalAcceptanceCases } from '../src/modules/images/fal-live-acceptance';

assert.deepEqual(
  CREATIVE_MODELS.map((model) => model.acceptanceId),
  ['M10', 'M02', 'M03', 'M04', 'M05', 'M06', 'M07', 'M08', 'M09']
);
assert.equal(new Set(CREATIVE_MODELS.map((model) => model.id)).size, 9);
assert.equal(getFalAcceptanceCases().length, 19);
assert.equal(
  CREATIVE_MODELS.every(
    (model) =>
      model.credential &&
      (!model.productionEnabled || Object.keys(model.endpoints).length) &&
      model.operations.length &&
      model.maxPromptLength > 0 &&
      model.maxReferences >= 1
  ),
  true
);
assert.equal(
  CREATIVE_MODELS.every(
    (model) => model.provider === 'fal' && model.credential === 'fal_api_key'
  ),
  true
);
assert.equal(
  CREATIVE_MODELS.filter(
    (model) => !['nano-banana-2.5', 'nano-banana-2.1'].includes(model.id)
  ).every((model) => model.productionEnabled === true),
  true
);
const nanoBanana25 = CREATIVE_MODELS.find(
  (model) => model.id === 'nano-banana-2.5'
);
assert.equal(nanoBanana25?.productionEnabled, false);
assert.deepEqual(nanoBanana25?.endpoints, {});
assert.deepEqual(nanoBanana25?.credits, {});
assert.throws(
  () => requireProductionCreativeModel('nano-banana-2.5'),
  /coming soon/
);
const nanoBanana21 = CREATIVE_MODELS.find(
  (model) => model.id === 'nano-banana-2.1'
);
assert.equal(nanoBanana21?.productionEnabled, true);
assert.equal(nanoBanana21?.endpoints.generate, 'google/nano-banana-2.1');
assert.equal(nanoBanana21?.endpoints.edit, 'google/nano-banana-2.1/edit');
assert.equal(
  requireProductionCreativeModel('nano-banana-2.1').id,
  'nano-banana-2.1'
);
assert.equal(
  validateCreativeRequest({
    model: 'nano-banana-2.1',
    operation: 'generate',
    prompt: 'A bottle',
  }).credits,
  8
);

assert.deepEqual(
  CREATIVE_TOOLS.map((tool) => tool.id),
  Array.from(
    { length: 25 },
    (_, index) => `T${String(index + 1).padStart(2, '0')}`
  )
);
assert.equal(
  CREATIVE_TOOLS.every((tool) => tool.label && tool.description && tool.mode),
  true
);

const editRequest = validateCreativeRequest({
  model: 'flux-2-pro',
  operation: 'edit',
  prompt: 'Keep the product and change the wall to cobalt blue',
  imageUrls: ['https://cdn.example.com/source.png'],
  size: 'square_hd',
});
assert.equal(editRequest.providerModel, 'fal-ai/flux-2-pro/edit');
assert.equal(editRequest.credits, 10);
assert.throws(
  () =>
    validateCreativeRequest({
      model: 'flux-2-pro',
      operation: 'edit',
      prompt: 'edit',
      imageUrls: [],
    }),
  /requires a reference image/
);
assert.throws(
  () =>
    validateCreativeRequest({
      model: 'nano-banana-2-lite',
      operation: 'relight',
      prompt: 'relight',
      imageUrls: ['https://cdn.example.com/a.png'],
    }),
  /does not support/
);
assert.throws(
  () =>
    validateCreativeRequest({
      model: 'flux-2-pro',
      operation: 'edit',
      prompt: 'edit',
      imageUrls: ['http://example.com/a.png'],
    }),
  /HTTPS/
);

const safeSvg = sanitizeSvgMarkup(
  '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script><path fill="#000000" onclick="alert(1)" d="M0 0h10v10z"/></svg>'
);
assert.doesNotMatch(safeSvg, /script|onclick/i);
assert.match(recolorSvg(safeSvg, '#000000', '#7c3aed'), /#7c3aed/);
assert.match(applyTemplate('white-product', { product: 'shoe' }), /shoe/);

const originalFetch = globalThis.fetch;
const requests: Array<{ url: string; init?: RequestInit }> = [];
globalThis.fetch = async (input, init) => {
  const url = String(input);
  requests.push({ url, init });
  if (url.includes('generativelanguage.googleapis.com')) {
    return new Response(
      JSON.stringify({
        candidates: [
          {
            content: {
              parts: [
                { text: 'done', thoughtSignature: 'opaque-provider-signature' },
                {
                  inlineData: {
                    mimeType: 'image/png',
                    data: Buffer.from('gemini-image').toString('base64'),
                  },
                },
              ],
            },
          },
        ],
        usageMetadata: { totalTokenCount: 12 },
      }),
      { status: 200, headers: { 'content-type': 'application/json' } }
    );
  }
  if (url.includes('queue.fal.run')) {
    return new Response(
      JSON.stringify({ request_id: `fal-${requests.length}` }),
      {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }
    );
  }
  return new Response(
    JSON.stringify({
      data: [{ b64_json: Buffer.from('openai-image').toString('base64') }],
      usage: { total_tokens: 9 },
    }),
    { status: 200, headers: { 'content-type': 'application/json' } }
  );
};

const uploaded: string[] = [];
const uploadFile = async (file: {
  body: Buffer | Uint8Array;
  key: string;
  contentType: string;
}) => {
  uploaded.push(file.key);
  return { url: `https://cdn.example.com/${file.key}` };
};
const openai = await new OpenAIImageProvider({
  apiKey: 'test',
  uploadFile,
}).generate({
  params: {
    mediaType: AIMediaType.IMAGE,
    model: 'gpt-image-2.5-flare',
    prompt: 'contract test',
    options: { size: '1024x1024', quality: 'auto' },
  },
});
assert.equal(openai.taskStatus, 'success');
assert.match(requests[0].url, /\/images\/generations$/);
assert.match(String(requests[0].init?.body), /gpt-image-2.5-flare/);

const gemini = await new GeminiProvider({
  apiKey: 'test',
  uploadFile,
}).generate({
  params: {
    mediaType: AIMediaType.IMAGE,
    model: 'gemini-3.1-flash-image',
    prompt: 'contract test',
    options: { image_size: '1024' },
  },
});
assert.equal(gemini.taskStatus, 'success');
assert.match(requests[1].url, /gemini-3\.1-flash-image:generateContent/);
assert.equal(
  (
    gemini.taskResult as {
      conversationParts: Array<{ thoughtSignature?: string }>;
    }
  ).conversationParts[0].thoughtSignature,
  'opaque-provider-signature'
);
assert.equal(uploaded.length, 2);

const fal = new FalProvider({ apiKey: 'test' });
for (const definition of CREATIVE_MODELS.filter(
  (candidate) => candidate.provider === 'fal'
)) {
  for (const [operation, endpoint] of Object.entries(definition.endpoints)) {
    const result = await fal.generate({
      params: {
        mediaType: AIMediaType.IMAGE,
        model: endpoint,
        prompt: 'provider contract test',
        options:
          operation === 'edit'
            ? definition.id === 'flux-2-pro'
              ? { image_urls: ['https://cdn.example.com/source.png'] }
              : { image_urls: ['https://cdn.example.com/source.png'] }
            : {
                [definition.sizeParameter]: definition.sizes[0],
                num_images: 1,
              },
      },
    });
    assert.equal(result.taskStatus, 'pending');
    assert.equal(requests.at(-1)?.url.endsWith(`/${endpoint}`), true);
  }
}
globalThis.fetch = originalFetch;

console.log(
  'Creative Studio registry, tools, validation, templates, and SVG safety checks passed.'
);
