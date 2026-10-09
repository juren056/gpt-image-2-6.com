import { IMAGE_GENERATION_COST } from '@/config/image-models';
import {
  BACKGROUND_REMOVAL_COST,
  MATCHA_FILTER_REMOVAL_COST,
  MINIMAX_H3_CREDITS_PER_SECOND,
  SEEDANCE25_CREDITS_PER_SECOND,
  VIDEO_GENERATION_COST,
  VIDEO_GENERATION_COST_LONG,
  WAN3_CREDITS_PER_SECOND,
  WAN3_DURATIONS,
} from '@/config/media-tools';

export type ToolCategory = 'image' | 'video' | 'edit';
export type ToolInput = 'prompt' | 'image' | 'video';
export type ToolOutput = 'image' | 'video';

export type ToolPricing =
  | { type: 'fixed'; credits: number }
  | { type: 'range'; minCredits: number; maxCredits: number }
  | { type: 'preview' };

export type ToolKind =
  | 'image'
  | 'creative_studio'
  | 'poster'
  | 'product_photo'
  | 'youtube_thumbnail'
  | 'wan3'
  | 'seedance25'
  | 'video'
  | 'minimax_h3'
  | 'background_remover'
  | 'matcha_filter';

export type ScenarioToolKind = 'poster' | 'product_photo';

export type ToolCatalogItem = {
  kind: ToolKind;
  category: ToolCategory;
  path: string;
  href: string;
  image: string;
  relatedGuide: string;
  icon:
    | 'sparkles'
    | 'palette'
    | 'package'
    | 'youtube'
    | 'radio'
    | 'film'
    | 'video'
    | 'clapperboard'
    | 'eraser'
    | 'sliders';
  input: ToolInput[];
  output: ToolOutput;
  pricing: ToolPricing;
  keywords: string[];
  relatedTools: ToolKind[];
  homepageRank: number;
  directoryRank: number;
  featured?: boolean;
  popular?: boolean;
  isNew?: boolean;
  isPreview?: boolean;
};

/** Canonical list used by every user-facing tool discovery surface. */
export const TOOL_CATALOG: ToolCatalogItem[] = [
  {
    kind: 'image',
    category: 'image',
    path: '/',
    href: '/#generator',
    image: '/imgs/generated/hero-1783598692895.png',
    relatedGuide: '/prompts',
    icon: 'sparkles',
    input: ['prompt'],
    output: 'image',
    pricing: { type: 'fixed', credits: IMAGE_GENERATION_COST },
    keywords: ['text to image', 'ai image', 'image generator'],
    relatedTools: ['poster', 'product_photo', 'background_remover'],
    homepageRank: 1,
    directoryRank: 1,
    featured: true,
    popular: true,
  },
  {
    kind: 'creative_studio',
    category: 'edit',
    path: '/settings/studio',
    href: '/settings/studio',
    image: '/imgs/generated/hero-1783598692895.png',
    relatedGuide: '/prompts',
    icon: 'palette',
    input: ['prompt', 'image'],
    output: 'image',
    pricing: { type: 'preview' },
    keywords: [
      'creative studio',
      'image editor',
      'upscale',
      'vectorize',
      'background',
      'batch',
      'canvas',
    ],
    relatedTools: ['image', 'product_photo', 'background_remover'],
    homepageRank: 9,
    directoryRank: 2,
    featured: true,
    isNew: true,
  },
  {
    kind: 'poster',
    category: 'image',
    path: '/ai-poster-generator',
    href: '/ai-poster-generator#generator',
    image: '/imgs/tools/ai-poster-showcase.webp',
    relatedGuide: '/ai-poster-generator',
    icon: 'palette',
    input: ['prompt'],
    output: 'image',
    pricing: { type: 'fixed', credits: IMAGE_GENERATION_COST },
    keywords: ['poster', 'text rendering', 'flyer', 'marketing design'],
    relatedTools: ['image', 'youtube_thumbnail', 'background_remover'],
    homepageRank: 2,
    directoryRank: 2,
    popular: true,
  },
  {
    kind: 'product_photo',
    category: 'image',
    path: '/ai-product-photo-generator',
    href: '/ai-product-photo-generator#generator',
    image: '/imgs/tools/ai-product-photo-showcase.webp',
    relatedGuide: '/ai-product-photo-generator',
    icon: 'package',
    input: ['prompt'],
    output: 'image',
    pricing: { type: 'fixed', credits: IMAGE_GENERATION_COST },
    keywords: ['product photo', 'ecommerce', 'commercial image', 'product'],
    relatedTools: ['image', 'background_remover', 'poster'],
    homepageRank: 3,
    directoryRank: 3,
    popular: true,
  },
  {
    kind: 'youtube_thumbnail',
    category: 'image',
    path: '/ai-youtube-thumbnail-generator',
    href: '/ai-youtube-thumbnail-generator#tool',
    image: '/imgs/tools/ai-youtube-thumbnail-showcase.webp',
    relatedGuide: '/ai-poster-generator',
    icon: 'youtube',
    input: ['prompt'],
    output: 'image',
    pricing: { type: 'fixed', credits: IMAGE_GENERATION_COST },
    keywords: ['youtube', 'thumbnail', 'video cover', 'social image'],
    relatedTools: ['poster', 'image', 'product_photo'],
    homepageRank: 4,
    directoryRank: 4,
  },
  {
    kind: 'wan3',
    category: 'video',
    path: '/wan-3-0',
    href: '/wan-3-0#generator',
    image: '/imgs/showcase/wan-3-preview.webp',
    relatedGuide: '/prompts',
    icon: 'radio',
    input: ['prompt', 'image', 'video'],
    output: 'video',
    pricing: {
      type: 'range',
      minCredits: WAN3_DURATIONS[0] * WAN3_CREDITS_PER_SECOND,
      maxCredits:
        WAN3_DURATIONS[WAN3_DURATIONS.length - 1] * WAN3_CREDITS_PER_SECOND,
    },
    keywords: ['wan 3', 'text to video', 'image to video', 'video generator'],
    relatedTools: ['seedance25', 'video', 'minimax_h3'],
    homepageRank: 5,
    directoryRank: 5,
    isNew: true,
  },
  {
    kind: 'seedance25',
    category: 'video',
    path: '/seedance-2-5',
    href: '/seedance-2-5#tool',
    image: '/imgs/tools/seedance-motion-preview.webp',
    relatedGuide: '/prompts',
    icon: 'film',
    input: ['prompt', 'image'],
    output: 'video',
    pricing: {
      type: 'range',
      minCredits: 5 * SEEDANCE25_CREDITS_PER_SECOND,
      maxCredits: 30 * SEEDANCE25_CREDITS_PER_SECOND,
    },
    keywords: ['seedance 2.5', 'image to video', 'motion', 'ai video'],
    relatedTools: ['wan3', 'video', 'minimax_h3'],
    homepageRank: 6,
    directoryRank: 6,
    isNew: true,
  },
  {
    kind: 'video',
    category: 'video',
    path: '/ai-video-generator',
    href: '/ai-video-generator#tool',
    image: '/imgs/tools/ai-video-storyboard-showcase.webp',
    relatedGuide: '/prompts',
    icon: 'video',
    input: ['prompt'],
    output: 'video',
    pricing: {
      type: 'range',
      minCredits: VIDEO_GENERATION_COST,
      maxCredits: VIDEO_GENERATION_COST_LONG,
    },
    keywords: ['ai video', 'text to video', 'video generator'],
    relatedTools: ['wan3', 'seedance25', 'minimax_h3'],
    homepageRank: 7,
    directoryRank: 7,
    popular: true,
  },
  {
    kind: 'minimax_h3',
    category: 'video',
    path: '/minimax-h3',
    href: '/minimax-h3#generator',
    image: '/imgs/tools/seedance-motion-preview.webp',
    relatedGuide: '/prompts',
    icon: 'clapperboard',
    input: ['prompt'],
    output: 'video',
    pricing: {
      type: 'range',
      minCredits: 5 * MINIMAX_H3_CREDITS_PER_SECOND,
      maxCredits: 15 * MINIMAX_H3_CREDITS_PER_SECOND,
    },
    keywords: ['minimax h3', 'cinematic video', 'text to video'],
    relatedTools: ['wan3', 'seedance25', 'video'],
    homepageRank: 8,
    directoryRank: 8,
    isNew: true,
  },
  {
    kind: 'background_remover',
    category: 'edit',
    path: '/image-background-remover',
    href: '/image-background-remover#tool',
    image: '/imgs/tools/background-remover-robot-cutout.png',
    relatedGuide: '/ai-product-photo-generator',
    icon: 'eraser',
    input: ['image'],
    output: 'image',
    pricing: { type: 'fixed', credits: BACKGROUND_REMOVAL_COST },
    keywords: ['background remover', 'transparent png', 'cutout', 'ecommerce'],
    relatedTools: ['product_photo', 'poster', 'image'],
    homepageRank: 9,
    directoryRank: 9,
    popular: true,
  },
  {
    kind: 'matcha_filter',
    category: 'edit',
    path: '/remove-matcha-filter',
    href: '/remove-matcha-filter#tool',
    image: '/imgs/tools/remove-matcha-filter/after.webp',
    relatedGuide: '/prompts',
    icon: 'sliders',
    input: ['image'],
    output: 'image',
    pricing: { type: 'fixed', credits: MATCHA_FILTER_REMOVAL_COST },
    keywords: ['remove filter', 'matcha filter', 'photo restoration'],
    relatedTools: ['background_remover', 'image', 'product_photo'],
    homepageRank: 10,
    directoryRank: 10,
    isNew: true,
  },
];

export const TOOL_PATHS = Object.fromEntries(
  TOOL_CATALOG.map(({ kind, path }) => [kind, path])
) as Record<ToolKind, string>;

export const TOOL_IMAGES = Object.fromEntries(
  TOOL_CATALOG.map(({ kind, image }) => [kind, image])
) as Record<ToolKind, string>;
