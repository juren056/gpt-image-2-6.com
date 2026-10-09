import {
  Clapperboard,
  Eraser,
  Film,
  PackageOpen,
  Palette,
  RadioTower,
  SlidersHorizontal,
  Sparkles,
  Video,
  Youtube,
  type LucideIcon,
} from 'lucide-react';

import type { ToolCatalogItem } from '@/lib/tools';

export const TOOL_ICONS: Record<ToolCatalogItem['icon'], LucideIcon> = {
  sparkles: Sparkles,
  palette: Palette,
  package: PackageOpen,
  youtube: Youtube,
  radio: RadioTower,
  film: Film,
  video: Video,
  clapperboard: Clapperboard,
  eraser: Eraser,
  sliders: SlidersHorizontal,
};

export function ToolIcon({
  name,
  className,
}: {
  name: ToolCatalogItem['icon'];
  className?: string;
}) {
  const Icon = TOOL_ICONS[name];
  return <Icon className={className} aria-hidden="true" />;
}
