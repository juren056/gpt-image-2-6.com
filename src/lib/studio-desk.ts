import { z } from 'zod';

import type { CreativeToolId } from '@/config/creative-tools';

/** Serializable tool controls only. Files, signed-in identity and secrets stay out. */
export type StudioToolDraft = {
  prompt?: string;
  modelId?: string;
  color?: string;
  color2?: string;
  amount?: number;
  amount2?: number;
  x?: number;
  y?: number;
  text?: string;
  fontSize?: number;
  rotation?: number;
  flipX?: boolean;
  flipY?: boolean;
  crop?: number;
  fit?: 'contain' | 'cover' | 'extend';
  outputSet?: string;
  scale?: 2 | 4;
  svgWidth?: number;
  lighting?: string;
  svg?: string;
  brand?: { name: string; font: string; primary: string; secondary: string };
  selectedOutputs?: string[];
  steps?: string[];
  template?: string;
  industry?: string;
  logoStyle?: string;
  drawingData?: string;
  drawingSourceUrl?: string;
  selectionMode?: 'brush' | 'eraser';
  noteMode?: 'arrow' | 'box' | 'brush';
  uploadUrls?: string[];
  brandLogoUrl?: string;
  resultUrl?: string;
  resultTaskId?: string;
  outputs?: Array<{ name: string; url: string; taskId?: string }>;
  statuses?: string[];
  layers?: Array<{
    id: string;
    name: string;
    src: string;
    opacity: number;
    visible: boolean;
    locked: boolean;
    x: number;
    y: number;
    scale: number;
    rotation: number;
  }>;
};
export type StudioDeskCopy = Record<string, string>;
export type StudioDeskContext = {
  copy: StudioDeskCopy;
  initialDraft?: StudioToolDraft;
  sourceUrl?: string;
  onDraft: (draft: StudioToolDraft) => void;
  onResult: (url: string, taskId?: string) => void;
  onBusy: (busy: boolean) => void;
  onSource?: (url: string) => void;
};
export type StudioDeskMetadata = {
  activeTool: CreativeToolId;
  drafts: Partial<Record<CreativeToolId, StudioToolDraft>>;
};

export const STUDIO_TOOL_LAYOUTS: Record<CreativeToolId, string> = {
  T01: 'generate',
  T02: 'compare',
  T03: 'cutout',
  T04: 'background',
  T05: 'shadow',
  T06: 'light',
  T07: 'erase',
  T08: 'repaint',
  T09: 'extend',
  T10: 'detail',
  T11: 'layers',
  T12: 'type',
  T13: 'canvas',
  T14: 'queue',
  T15: 'sizes',
  T16: 'brand',
  T17: 'campaign',
  T18: 'trace',
  T19: 'vector',
  T20: 'identity',
  T21: 'templates',
  T22: 'sketch',
  T23: 'annotate',
  T24: 'recipe',
  T25: 'sequence',
};

export function safeStudioSource(value?: string): string | undefined {
  if (!value || value.length > 8192) return;
  if (/^https?:\/\//i.test(value) || /^\/(?!\/)/.test(value)) return value;
}

export function readDeskMetadata(
  value: unknown
): StudioDeskMetadata | undefined {
  if (!value || typeof value !== 'object') return;
  const item = value as Partial<StudioDeskMetadata>;
  if (!item.activeTool || !Object.hasOwn(STUDIO_TOOL_LAYOUTS, item.activeTool))
    return;
  if (
    !item.drafts ||
    typeof item.drafts !== 'object' ||
    Array.isArray(item.drafts)
  )
    return;
  // Metadata comes back from our authenticated project endpoint. Bound input
  // size before handing it to controlled fields; never render SVG as raw HTML.
  if (JSON.stringify(item.drafts).length > 1_500_000) return;
  const short = z.string().max(240);
  const number = z.number().min(-4096).max(8192);
  const draftSchema = z
    .object({
      prompt: z.string().max(32000),
      modelId: short,
      color: short,
      color2: short,
      amount: number,
      amount2: number,
      x: number,
      y: number,
      text: z.string().max(32000),
      fontSize: z.number().min(1).max(2048),
      rotation: number,
      flipX: z.boolean(),
      flipY: z.boolean(),
      crop: z.number().min(1).max(100),
      fit: z.enum(['contain', 'cover', 'extend']),
      outputSet: z.enum(['social', 'youtube', 'store']),
      scale: z.union([z.literal(2), z.literal(4)]),
      svgWidth: z.number().min(1).max(8192),
      lighting: short,
      svg: z.string().max(200000),
      brand: z.object({
        name: short,
        font: short,
        primary: short,
        secondary: short,
      }),
      selectedOutputs: z.array(short).max(20),
      steps: z.array(short).max(20),
      template: short,
      industry: short,
      logoStyle: short,
      drawingData: z
        .string()
        .max(1_000_000)
        .regex(/^(?:data:image\/png;base64,[A-Za-z0-9+/=]+)?$/),
      selectionMode: z.enum(['brush', 'eraser']),
      noteMode: z.enum(['arrow', 'box', 'brush']),
      uploadUrls: z
        .array(z.string().refine((value) => Boolean(safeStudioSource(value))))
        .max(20),
      brandLogoUrl: z
        .string()
        .refine((value) => !value || Boolean(safeStudioSource(value))),
      resultUrl: z.string().refine((value) => Boolean(safeStudioSource(value))),
      resultTaskId: short,
      outputs: z
        .array(
          z.object({
            name: short,
            taskId: short.optional(),
            url: z.string().refine((value) => Boolean(safeStudioSource(value))),
          })
        )
        .max(40),
      statuses: z.array(z.string().max(500)).max(40),
      drawingSourceUrl: z
        .string()
        .refine((value) => !value || Boolean(safeStudioSource(value))),
      layers: z
        .array(
          z.object({
            id: short,
            name: short,
            src: z.string().refine((value) => Boolean(safeStudioSource(value))),
            opacity: z.number().min(0).max(100),
            visible: z.boolean(),
            locked: z.boolean(),
            x: number,
            y: number,
            scale: number,
            rotation: number,
          })
        )
        .max(20),
    })
    .partial();
  const drafts: StudioDeskMetadata['drafts'] = {};
  for (const [id, draft] of Object.entries(item.drafts)) {
    if (!Object.hasOwn(STUDIO_TOOL_LAYOUTS, id)) continue;
    const parsed = draftSchema.safeParse(draft);
    if (parsed.success) drafts[id as CreativeToolId] = parsed.data;
  }
  return { activeTool: item.activeTool, drafts };
}
