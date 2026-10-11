import assert from 'node:assert/strict';

import {
  readDeskMetadata,
  safeStudioSource,
  STUDIO_TOOL_LAYOUTS,
} from '../src/lib/studio-desk';

const drawing = 'data:image/png;base64,iVBORw0KGgo=';
const draft = {
  prompt: 'Keep the object, change the setting',
  drawingData: drawing,
  drawingSourceUrl: '/imgs/example.png',
  selectionMode: 'eraser' as const,
  noteMode: 'box' as const,
  uploadUrls: ['/imgs/example.png'],
  brandLogoUrl: '/icon-192.png',
  resultUrl: '/api/images/one.png',
  resultTaskId: 'task-one',
  outputs: [
    {
      name: '1-Upscale.png',
      url: 'https://cdn.example/result.png',
      taskId: 'task-upscale',
    },
  ],
  statuses: ['Step 1: Upscale · completed'],
  brand: {
    name: 'Orbit',
    font: 'Inter',
    primary: '#ffca00',
    secondary: '#ffffff',
  },
  layers: [
    {
      id: 'one',
      name: 'Product',
      src: '/imgs/example.png',
      opacity: 75,
      visible: true,
      locked: true,
      x: 25,
      y: 60,
      scale: 90,
      rotation: 12,
    },
  ],
};
const original = { activeTool: 'T07', drafts: { T07: draft } };
const restored = readDeskMetadata(JSON.parse(JSON.stringify(original)));
assert.deepEqual(
  restored,
  original,
  'Restoration must retain masks, logo identity, layer controls and input URLs'
);
assert.equal(Object.keys(STUDIO_TOOL_LAYOUTS).length, 25);
assert.equal(new Set(Object.values(STUDIO_TOOL_LAYOUTS)).size, 25);
assert.equal(
  readDeskMetadata({ activeTool: 'constructor', drafts: {} }),
  undefined
);
assert.equal(readDeskMetadata({ activeTool: 'T26', drafts: {} }), undefined);
for (const invalid of [
  { fontSize: 'huge' },
  { drawingData: 'data:text/html,<script>' },
  { uploadUrls: ['javascript:alert(1)'] },
  { outputs: [{ name: 'unsafe', url: 'javascript:alert(1)' }] },
  { outputs: [{ name: 'temporary', url: 'blob:temporary' }] },
  { resultUrl: 'data:text/html,<script>' },
  { layers: [{ ...draft.layers[0], src: 'data:image/svg+xml,<svg>' }] },
]) {
  assert.deepEqual(
    readDeskMetadata({ activeTool: 'T07', drafts: { T07: invalid } })?.drafts,
    {}
  );
}
assert.equal(safeStudioSource('//external.example/a.png'), undefined);
assert.equal(safeStudioSource('javascript:alert(1)'), undefined);
assert.equal(safeStudioSource('/imgs/example.png'), '/imgs/example.png');
assert.equal(
  safeStudioSource('https://cdn.example/a.png'),
  'https://cdn.example/a.png'
);
console.log(
  'Studio desk: 25 unique layouts; project draft round-trip and unsafe-input guards passed.'
);
