import type { ComponentType } from 'react';
import {
  CircleDashed,
  CodeXml,
  Crop,
  Eraser,
  Expand,
  ImagePlus,
  Images,
  Layers3,
  LayoutTemplate,
  MessageSquareText,
  PackageOpen,
  Paintbrush,
  PanelsTopLeft,
  PencilRuler,
  PenTool,
  Ratio,
  ScanLine,
  ScanSearch,
  Shapes,
  Share2,
  SunMedium,
  SwatchBook,
  Type,
  WandSparkles,
  Workflow,
} from 'lucide-react';

import type { CreativeToolId } from '@/config/creative-tools';
import { cn } from '@/lib/utils';

export type VisualIcon = ComponentType<{
  className?: string;
  'aria-hidden'?: boolean | 'true' | 'false';
}>;

type ModelVisual = {
  brand:
    | 'AI'
    | 'OpenAI'
    | 'Google Gemini'
    | 'ByteDance Seed'
    | 'Black Forest Labs';
  src: string;
  markClassName?: string;
  surfaceClassName: string;
};

const MODEL_VISUALS: Record<string, ModelVisual> = {
  generic: {
    brand: 'AI',
    src: '/logo.svg',
    surfaceClassName:
      'border-violet-200 bg-violet-50 dark:border-violet-400/20 dark:bg-violet-400/10',
  },
  openai: {
    brand: 'OpenAI',
    src: '/brands/openai.svg',
    markClassName: 'dark:invert',
    surfaceClassName:
      'border-slate-200 bg-white dark:border-white/15 dark:bg-white/5',
  },
  gemini: {
    brand: 'Google Gemini',
    src: '/brands/gemini.svg',
    surfaceClassName:
      'border-blue-200 bg-blue-50 dark:border-blue-400/20 dark:bg-blue-400/10',
  },
  seed: {
    brand: 'ByteDance Seed',
    src: '/brands/seed.ico',
    surfaceClassName:
      'border-cyan-200 bg-cyan-50 dark:border-cyan-400/20 dark:bg-cyan-400/10',
  },
  bfl: {
    brand: 'Black Forest Labs',
    src: '/brands/bfl-symbol-black.svg',
    surfaceClassName:
      'border-slate-200 bg-white dark:border-white/15 dark:bg-white',
  },
};

export function getModelVisual(modelId: string): ModelVisual {
  if (modelId.startsWith('gpt-')) return MODEL_VISUALS.openai;
  if (modelId.startsWith('nano-banana')) return MODEL_VISUALS.gemini;
  if (modelId.startsWith('seedream')) return MODEL_VISUALS.seed;
  if (modelId.startsWith('flux-')) return MODEL_VISUALS.bfl;
  return MODEL_VISUALS.generic;
}

export function ModelBrandMark({
  modelId,
  className,
}: {
  modelId: string;
  className?: string;
}) {
  const visual = getModelVisual(modelId);
  return (
    <img
      src={visual.src}
      alt=""
      aria-hidden="true"
      width={20}
      height={20}
      className={cn('size-5 object-contain', visual.markClassName, className)}
    />
  );
}

export function ModelBrandTile({
  modelId,
  className,
  markClassName,
}: {
  modelId: string;
  className?: string;
  markClassName?: string;
}) {
  const visual = getModelVisual(modelId);
  return (
    <span
      data-model-visual={modelId}
      className={cn(
        'flex size-10 shrink-0 items-center justify-center rounded-xl border',
        visual.surfaceClassName,
        className
      )}
      title={visual.brand}
    >
      <ModelBrandMark modelId={modelId} className={markClassName} />
    </span>
  );
}

const TOOL_TONES = {
  create:
    'border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-400/20 dark:bg-violet-400/10 dark:text-violet-300',
  product:
    'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-300',
  enhance:
    'border-cyan-200 bg-cyan-50 text-cyan-700 dark:border-cyan-400/20 dark:bg-cyan-400/10 dark:text-cyan-300',
  design:
    'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-300',
  workflow:
    'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300',
} as const;

export const CREATIVE_TOOL_VISUALS: Record<
  CreativeToolId,
  { icon: VisualIcon; surfaceClassName: string }
> = {
  T01: { icon: ImagePlus, surfaceClassName: TOOL_TONES.create },
  T02: { icon: WandSparkles, surfaceClassName: TOOL_TONES.create },
  T03: { icon: Eraser, surfaceClassName: TOOL_TONES.product },
  T04: { icon: PanelsTopLeft, surfaceClassName: TOOL_TONES.product },
  T05: { icon: CircleDashed, surfaceClassName: TOOL_TONES.product },
  T06: { icon: SunMedium, surfaceClassName: TOOL_TONES.product },
  T07: { icon: ScanLine, surfaceClassName: TOOL_TONES.enhance },
  T08: { icon: Paintbrush, surfaceClassName: TOOL_TONES.enhance },
  T09: { icon: Expand, surfaceClassName: TOOL_TONES.enhance },
  T10: { icon: ScanSearch, surfaceClassName: TOOL_TONES.enhance },
  T11: { icon: Layers3, surfaceClassName: TOOL_TONES.design },
  T12: { icon: Type, surfaceClassName: TOOL_TONES.design },
  T13: { icon: Crop, surfaceClassName: TOOL_TONES.design },
  T14: { icon: Images, surfaceClassName: TOOL_TONES.workflow },
  T15: { icon: Ratio, surfaceClassName: TOOL_TONES.design },
  T16: { icon: SwatchBook, surfaceClassName: TOOL_TONES.workflow },
  T17: { icon: PackageOpen, surfaceClassName: TOOL_TONES.product },
  T18: { icon: PenTool, surfaceClassName: TOOL_TONES.design },
  T19: { icon: CodeXml, surfaceClassName: TOOL_TONES.design },
  T20: { icon: Shapes, surfaceClassName: TOOL_TONES.create },
  T21: { icon: LayoutTemplate, surfaceClassName: TOOL_TONES.design },
  T22: { icon: PencilRuler, surfaceClassName: TOOL_TONES.create },
  T23: { icon: MessageSquareText, surfaceClassName: TOOL_TONES.workflow },
  T24: { icon: Share2, surfaceClassName: TOOL_TONES.workflow },
  T25: { icon: Workflow, surfaceClassName: TOOL_TONES.workflow },
};

export function CreativeToolTile({
  toolId,
  className,
}: {
  toolId: CreativeToolId;
  className?: string;
}) {
  const visual = CREATIVE_TOOL_VISUALS[toolId];
  const Icon = visual.icon;
  return (
    <span
      data-tool-visual={toolId}
      className={cn(
        'flex size-10 shrink-0 items-center justify-center rounded-xl border',
        visual.surfaceClassName,
        className
      )}
    >
      <Icon className="size-5" aria-hidden="true" />
    </span>
  );
}
