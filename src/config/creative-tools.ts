export type CreativeToolId = `T${
  | '01'
  | '02'
  | '03'
  | '04'
  | '05'
  | '06'
  | '07'
  | '08'
  | '09'
  | '10'
  | '11'
  | '12'
  | '13'
  | '14'
  | '15'
  | '16'
  | '17'
  | '18'
  | '19'
  | '20'
  | '21'
  | '22'
  | '23'
  | '24'
  | '25'}`;

export type CreativeToolDefinition = {
  id: CreativeToolId;
  label: string;
  mode: 'model' | 'utility' | 'canvas' | 'project' | 'pipeline';
  operation?: string;
  requiresImage?: boolean;
  description: string;
};

export const CREATIVE_TOOLS: readonly CreativeToolDefinition[] = [
  {
    id: 'T01',
    label: 'Multi-model text to image',
    mode: 'model',
    operation: 'generate',
    description:
      'Generate with the exact selected ready model and save the result.',
  },
  {
    id: 'T02',
    label: 'Reference image editing',
    mode: 'model',
    operation: 'edit',
    requiresImage: true,
    description:
      'Order, replace and remove references before instruction editing.',
  },
  {
    id: 'T03',
    label: 'Remove background',
    mode: 'utility',
    operation: 'remove-background',
    requiresImage: true,
    description: 'Create a transparent foreground with BRIA.',
  },
  {
    id: 'T04',
    label: 'Replace / generate background',
    mode: 'model',
    operation: 'replace-background',
    requiresImage: true,
    description: 'Use solid, gradient, uploaded or AI-generated backgrounds.',
  },
  {
    id: 'T05',
    label: 'Product shadow',
    mode: 'canvas',
    operation: 'shadow',
    requiresImage: true,
    description:
      'Adjust direction, blur, opacity and offset non-destructively.',
  },
  {
    id: 'T06',
    label: 'Relight',
    mode: 'model',
    operation: 'relight',
    requiresImage: true,
    description: 'Run a dedicated relighting instruction or preset.',
  },
  {
    id: 'T07',
    label: 'Remove object',
    mode: 'model',
    operation: 'remove-object',
    requiresImage: true,
    description: 'Mask a target and fill it while preserving unselected areas.',
  },
  {
    id: 'T08',
    label: 'Local repaint',
    mode: 'model',
    operation: 'repaint',
    requiresImage: true,
    description:
      'Use brush or lasso regions to replace local color, material or content.',
  },
  {
    id: 'T09',
    label: 'Outpaint',
    mode: 'model',
    operation: 'outpaint',
    requiresImage: true,
    description:
      'Expand boundaries while retaining the protected original area.',
  },
  {
    id: 'T10',
    label: 'AI upscale',
    mode: 'utility',
    operation: 'upscale',
    requiresImage: true,
    description: 'Run super-resolution and record source/output dimensions.',
  },
  {
    id: 'T11',
    label: 'Layers',
    mode: 'canvas',
    operation: 'layers',
    description: 'Order, hide, lock, group and set opacity for every layer.',
  },
  {
    id: 'T12',
    label: 'Editable text',
    mode: 'canvas',
    operation: 'text',
    description: 'Edit copy, price, font, color, alignment and line height.',
  },
  {
    id: 'T13',
    label: 'Unified canvas',
    mode: 'canvas',
    operation: 'canvas',
    description:
      'Pan, zoom, select, drag, crop, undo, redo, compose and export.',
  },
  {
    id: 'T14',
    label: 'Batch processing',
    mode: 'pipeline',
    operation: 'batch',
    requiresImage: true,
    description:
      'Bounded child jobs with progress, cancel and failed-item retry.',
  },
  {
    id: 'T15',
    label: 'Multi-size adaptation',
    mode: 'canvas',
    operation: 'multi-size',
    requiresImage: true,
    description: 'Reflow one composition into multiple output ratios.',
  },
  {
    id: 'T16',
    label: 'Brand asset library',
    mode: 'project',
    operation: 'brand',
    description:
      'Reuse a brand name, logo, palette, authorized fonts and layout.',
  },
  {
    id: 'T17',
    label: 'Product image set',
    mode: 'pipeline',
    operation: 'product-set',
    requiresImage: true,
    description: 'Create white, studio, lifestyle and ad-layout variants.',
  },
  {
    id: 'T18',
    label: 'Bitmap to SVG',
    mode: 'utility',
    operation: 'vectorize',
    requiresImage: true,
    description:
      'Create real vector paths rather than embedding the source bitmap.',
  },
  {
    id: 'T19',
    label: 'SVG edit and export',
    mode: 'canvas',
    operation: 'svg',
    description:
      'Safely preview, recolor, reduce colors, scale and download SVG.',
  },
  {
    id: 'T20',
    label: 'Logo / icon / brand graphics',
    mode: 'pipeline',
    operation: 'brand-graphics',
    description:
      'Generate a graphic set and pass selected artwork through vectorization.',
  },
  {
    id: 'T21',
    label: 'Start from template',
    mode: 'canvas',
    operation: 'template',
    description:
      'Fill a scenario recipe, preview its prompt, generate and keep editing.',
  },
  {
    id: 'T22',
    label: 'Sketch reference',
    mode: 'model',
    operation: 'edit',
    description: 'Draw or upload a sketch and use it in the provider request.',
  },
  {
    id: 'T23',
    label: 'Annotated edits',
    mode: 'model',
    operation: 'edit',
    requiresImage: true,
    description: 'Map numbered arrows, boxes and strokes to edit instructions.',
  },
  {
    id: 'T24',
    label: 'Share / reuse prompt',
    mode: 'project',
    operation: 'share',
    description: 'Create an explicit redacted copy others can parameterize.',
  },
  {
    id: 'T25',
    label: 'Continuous same-image workflow',
    mode: 'project',
    operation: 'lineage',
    description:
      'Carry one asset through generate, edit, cleanup, relight, upscale and export.',
  },
] as const;

export const CREATIVE_TOOL_IDS = CREATIVE_TOOLS.map((tool) => tool.id);
