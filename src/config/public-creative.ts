import type { CreativeModelId } from '@/config/creative-studio';
import type { CreativeToolId } from '@/config/creative-tools';

export type PublicPanelType =
  | 'generate'
  | 'edit'
  | 'upload'
  | 'background'
  | 'shadow'
  | 'relight'
  | 'mask'
  | 'outpaint'
  | 'layers'
  | 'text'
  | 'canvas'
  | 'batch'
  | 'resize'
  | 'brand'
  | 'product-set'
  | 'vectorize'
  | 'svg'
  | 'logo'
  | 'templates'
  | 'sketch'
  | 'annotate'
  | 'prompt'
  | 'workflow';

export type PublicModelPage = {
  id: CreativeModelId;
  name: string;
  path: string;
  summary: string;
  useCase: string;
  image: string;
  availability?: 'coming-soon' | 'preview';
  seoTitle?: string;
  seoDescription?: string;
  dateModified?: string;
};

export const PUBLIC_MODEL_PAGES: readonly PublicModelPage[] = [
  {
    id: 'gpt-image-2.5-flare',
    name: 'GPT Image 2.5 Flare',
    path: '/gpt-image-2-5-flare',
    summary:
      'Generate or edit detailed campaign images with rich prompt control.',
    useCase: 'High-detail campaign concepts',
    image: '/imgs/tools/ai-poster-showcase.webp',
  },
  {
    id: 'gpt-image-2.5-sunburst',
    name: 'GPT Image 2.5 Sunburst',
    path: '/gpt-image-2-5-sunburst',
    summary:
      'Create and revise images with an independent Sunburst endpoint and price.',
    useCase: 'Fast visual exploration and edits',
    image: '/imgs/showcase/cliff-library.webp',
  },
  {
    id: 'nano-banana-2',
    name: 'Nano Banana 2',
    path: '/nano-banana-2',
    summary:
      'Generate images or transform reference images while preserving intent.',
    useCase: 'Reference-led creative editing',
    image: '/imgs/showcase/ceramic-artist.webp',
  },
  {
    id: 'nano-banana-2.5',
    name: 'Nano Banana 2.5',
    path: '/nano-banana-2-5',
    summary:
      'A launch-ready generation and editing workspace prepared for the future Nano Banana 2.5 API.',
    useCase:
      'Preview the prepared workflow while endpoint, capabilities, and pricing await official confirmation',
    image: '/imgs/seo/controlled-comparison.webp',
    availability: 'coming-soon',
  },
  {
    id: 'nano-banana-2-lite',
    name: 'Nano Banana 2 Lite',
    path: '/nano-banana-2-lite',
    summary:
      'A lighter generator and single-reference editor for focused everyday tasks.',
    useCase: 'Simple generation and one-image edits',
    image: '/imgs/showcase/midnight-train.webp',
  },
  {
    id: 'nano-banana-pro',
    name: 'Nano Banana Pro',
    path: '/nano-banana-pro',
    summary:
      'Premium generation and multi-reference editing for demanding compositions.',
    useCase: 'Multi-reference commercial imagery',
    image: '/imgs/tools/ai-product-photo-showcase.webp',
  },
  {
    id: 'seedream-5-pro',
    name: 'Seedream 5.0 Pro',
    path: '/seedream-5-pro',
    summary:
      'Generate or edit high-resolution images with verified registry settings.',
    useCase: 'High-resolution editorial visuals',
    image: '/imgs/showcase/cobalt-perfume.webp',
  },
  {
    id: 'flux-2-pro',
    name: 'FLUX.2 [pro]',
    path: '/flux-2-pro',
    summary:
      'Use the dedicated pro endpoint for controlled generation and reference edits.',
    useCase: 'Art direction and precise compositions',
    image: '/imgs/generated/feature-styles-1783598714340.png',
  },
] as const;

export type PublicToolPage = {
  id: CreativeToolId;
  name: string;
  path: string;
  category: 'Create' | 'Product' | 'Enhance' | 'Design' | 'Workflow';
  panel: PublicPanelType;
  summary: string;
  action: string;
  image: string;
  cardImage: string;
  seoTitle?: string;
  seoDescription?: string;
};

export const PUBLIC_TOOL_PAGES: readonly PublicToolPage[] = [
  {
    id: 'T01',
    name: 'AI Image Generator',
    path: '/ai-image-generator',
    category: 'Create',
    panel: 'generate',
    summary: 'Choose an available model and turn a prompt into a new image.',
    action: 'Generate image',
    image: '/imgs/generated/hero-1783598692895.png',
    cardImage: '/imgs/tool-cards/ai-image-generator.webp',
  },
  {
    id: 'T02',
    name: 'AI Image Editor',
    path: '/ai-image-editor',
    category: 'Create',
    panel: 'edit',
    summary:
      'Upload reference images, choose an editing model, and describe the change.',
    action: 'Edit image',
    image: '/imgs/seo/ecommerce-campaign-board.webp',
    cardImage: '/imgs/tool-cards/ai-image-editor.webp',
  },
  {
    id: 'T03',
    name: 'Background Remover',
    path: '/image-background-remover',
    category: 'Product',
    panel: 'upload',
    summary: 'Remove a photo background and download a transparent PNG.',
    action: 'Remove background',
    image: '/imgs/showcase/background-removal-workflow-v2.webp',
    cardImage: '/imgs/tool-cards/background-remover.webp',
  },
  {
    id: 'T04',
    name: 'Background Changer',
    path: '/background-changer',
    category: 'Product',
    panel: 'background',
    summary:
      'Apply a solid, gradient, uploaded, or generated scene behind a subject.',
    action: 'Apply background',
    image: '/imgs/tools/ai-product-photo-showcase.webp',
    cardImage: '/imgs/tool-cards/background-changer.webp',
  },
  {
    id: 'T05',
    name: 'Add Shadow to Image',
    path: '/add-shadow-to-image',
    category: 'Product',
    panel: 'shadow',
    summary:
      'Create a product shadow with visible direction, blur, opacity, and offset controls.',
    action: 'Export with shadow',
    image: '/imgs/showcase/cobalt-perfume.webp',
    cardImage: '/imgs/tool-cards/add-shadow.webp',
  },
  {
    id: 'T06',
    name: 'AI Relight',
    path: '/ai-relight',
    category: 'Product',
    panel: 'relight',
    summary:
      'Relight a photo with a selected lighting setup and optional direction.',
    action: 'Relight image',
    image: '/imgs/showcase/ceramic-artist.webp',
    cardImage: '/imgs/tool-cards/ai-relight.webp',
  },
  {
    id: 'T07',
    name: 'Object Remover',
    path: '/remove-object-from-photo',
    category: 'Enhance',
    panel: 'mask',
    summary: 'Mark an unwanted object and remove only the selected area.',
    action: 'Remove selected object',
    image: '/imgs/showcase/cliff-library.webp',
    cardImage: '/imgs/tool-cards/object-remover.webp',
  },
  {
    id: 'T08',
    name: 'AI Inpainting',
    path: '/ai-inpainting',
    category: 'Enhance',
    panel: 'mask',
    summary:
      'Paint a mask and replace the selected region from a local description.',
    action: 'Replace selected area',
    image: '/imgs/generated/feature-styles-1783598714340.png',
    cardImage: '/imgs/tool-cards/ai-inpainting.webp',
  },
  {
    id: 'T09',
    name: 'AI Image Extender',
    path: '/ai-image-extender',
    category: 'Enhance',
    panel: 'outpaint',
    summary:
      'Choose new boundaries and extend an image without stretching the original.',
    action: 'Extend image',
    image: '/imgs/showcase/midnight-train.webp',
    cardImage: '/imgs/tool-cards/image-extender.webp',
  },
  {
    id: 'T10',
    name: 'AI Image Upscaler',
    path: '/ai-image-upscaler',
    category: 'Enhance',
    panel: 'upload',
    summary: 'Upscale an image at 2× or 4× and compare the output dimensions.',
    action: 'Upscale image',
    image: '/imgs/seo/controlled-comparison.webp',
    cardImage: '/imgs/tool-cards/image-upscaler.webp',
  },
  {
    id: 'T11',
    name: 'Image Layers Editor',
    path: '/image-layers-editor',
    category: 'Design',
    panel: 'layers',
    summary:
      'Arrange, hide, lock, reorder, and adjust the opacity of image layers.',
    action: 'Export composition',
    image: '/imgs/seo/ecommerce-campaign-board.webp',
    cardImage: '/imgs/tool-cards/layers-editor.webp',
  },
  {
    id: 'T12',
    name: 'Add Text to Image',
    path: '/add-text-to-image',
    category: 'Design',
    panel: 'text',
    summary:
      'Place editable text with independent size, color, alignment, and position.',
    action: 'Export image',
    image: '/imgs/seo/text-rendering-case.webp',
    cardImage: '/imgs/tool-cards/add-text.webp',
  },
  {
    id: 'T13',
    name: 'Online Image Editor',
    path: '/online-image-editor',
    category: 'Design',
    panel: 'canvas',
    summary:
      'Crop, rotate, resize, and export an image in one focused workspace.',
    action: 'Export edit',
    image: '/imgs/generated/feature-generate-1783598708214.png',
    cardImage: '/imgs/tool-cards/online-image-editor.webp',
  },
  {
    id: 'T14',
    name: 'Batch Image Editor',
    path: '/batch-image-editor',
    category: 'Workflow',
    panel: 'batch',
    summary:
      'Queue multiple images, follow item-level progress, and retry failed items only.',
    action: 'Process batch',
    image: '/imgs/seo/prompt-case-board.webp',
    cardImage: '/imgs/tool-cards/batch-image-editor.webp',
  },
  {
    id: 'T15',
    name: 'Image Resizer',
    path: '/image-resizer',
    category: 'Workflow',
    panel: 'resize',
    summary:
      'Export one design to platform sizes with contain, cover, or image extension.',
    action: 'Resize and export',
    image: '/imgs/tools/ai-youtube-thumbnail-showcase.webp',
    cardImage: '/imgs/tool-cards/image-resizer.webp',
  },
  {
    id: 'T16',
    name: 'Brand Kit',
    path: '/brand-kit',
    category: 'Workflow',
    panel: 'brand',
    summary: 'Set a brand name, logo, colors, and fonts for reusable designs.',
    action: 'Apply brand',
    image: '/imgs/tools/ai-poster-showcase.webp',
    cardImage: '/imgs/tool-cards/brand-kit.webp',
  },
  {
    id: 'T17',
    name: 'Product Image Set',
    path: '/product-image-set-generator',
    category: 'Product',
    panel: 'product-set',
    summary:
      'Create a selected set of white, studio, lifestyle, and ad-layout product images.',
    action: 'Create image set',
    image: '/imgs/tools/ai-product-photo-showcase.webp',
    cardImage: '/imgs/tool-cards/product-image-set.webp',
  },
  {
    id: 'T18',
    name: 'Vectorize Image',
    path: '/image-to-svg',
    category: 'Design',
    panel: 'vectorize',
    summary:
      'Convert PNG, JPG, or WebP artwork into editable SVG paths instead of wrapping a bitmap.',
    action: 'Convert to SVG',
    image: '/imgs/generated/feature-styles-1783598714340.png',
    cardImage: '/imgs/tool-cards/image-to-svg.webp',
    seoTitle: 'Vectorize Image Online - PNG/JPG to Editable SVG',
    seoDescription:
      'Vectorize an image into editable SVG paths. Upload PNG, JPG, or WebP artwork, inspect the result, and download the traced vector file.',
  },
  {
    id: 'T19',
    name: 'SVG Editor',
    path: '/svg-editor',
    category: 'Design',
    panel: 'svg',
    summary:
      'Paste or upload safe SVG markup, recolor it, resize it, and export SVG.',
    action: 'Export SVG',
    image: '/imgs/seo/api-workflow.webp',
    cardImage: '/imgs/tool-cards/svg-editor.webp',
  },
  {
    id: 'T20',
    name: 'AI Logo Generator',
    path: '/ai-logo-generator',
    category: 'Create',
    panel: 'logo',
    summary:
      'Create a logo brief from brand, industry, style, and graphic type.',
    action: 'Generate logo',
    image: '/imgs/seo/text-rendering-case.webp',
    cardImage: '/imgs/tool-cards/ai-logo-generator.webp',
  },
  {
    id: 'T21',
    name: 'Design Templates',
    path: '/templates',
    category: 'Design',
    panel: 'templates',
    summary:
      'Choose a visual template, fill its fields, preview it, and continue editing.',
    action: 'Use template',
    image: '/imgs/tools/ai-poster-showcase.webp',
    cardImage: '/imgs/tool-cards/design-templates.webp',
  },
  {
    id: 'T22',
    name: 'Sketch to Image',
    path: '/sketch-to-image',
    category: 'Create',
    panel: 'sketch',
    summary:
      'Draw or upload a sketch and pass it as the actual generation reference.',
    action: 'Generate from sketch',
    image: '/imgs/generated/feature-generate-1783598708214.png',
    cardImage: '/imgs/tool-cards/sketch-to-image.webp',
  },
  {
    id: 'T23',
    name: 'Annotate & Edit Image',
    path: '/annotate-image-edit',
    category: 'Enhance',
    panel: 'annotate',
    summary:
      'Place numbered notes, arrows, boxes, and brush marks before applying edits.',
    action: 'Apply edits',
    image: '/imgs/seo/controlled-comparison.webp',
    cardImage: '/imgs/tool-cards/annotate-edit.webp',
  },
  {
    id: 'T24',
    name: 'Prompt Builder & Sharing',
    path: '/prompt-builder',
    category: 'Workflow',
    panel: 'prompt',
    summary:
      'Build a reusable prompt recipe from variables and share a redacted copy.',
    action: 'Save recipe',
    image: '/imgs/seo/prompt-case-board.webp',
    cardImage: '/imgs/tool-cards/prompt-builder.webp',
  },
  {
    id: 'T25',
    name: 'Image Workflow Builder',
    path: '/image-workflow-builder',
    category: 'Workflow',
    panel: 'workflow',
    summary:
      'Build a visible sequence of image steps with per-step cost and results.',
    action: 'Run workflow',
    image: '/imgs/seo/api-workflow.webp',
    cardImage: '/imgs/tool-cards/workflow-builder.webp',
  },
] as const;

export function findPublicModel(id: string) {
  return PUBLIC_MODEL_PAGES.find((item) => item.id === id);
}

export function findPublicTool(id: string) {
  return PUBLIC_TOOL_PAGES.find((item) => item.id === id);
}
