import { TOOL_CATALOG, type ToolKind } from '@/lib/tools';
import { m } from '@/paraglide/messages.js';

const copyByKind: Record<
  ToolKind,
  () => { title: string; description: string }
> = {
  image: () => ({
    title: m['landing.nav.image.generator.title'](),
    description: m['landing.nav.image.generator.description'](),
  }),
  creative_studio: () => ({
    title: m['settings.studio.title'](),
    description: m['settings.studio.description'](),
  }),
  poster: () => ({
    title: m['landing.nav.image.poster.title'](),
    description: m['landing.nav.image.poster.description'](),
  }),
  product_photo: () => ({
    title: m['landing.nav.image.product_photo.title'](),
    description: m['landing.nav.image.product_photo.description'](),
  }),
  youtube_thumbnail: () => ({
    title: m['landing.nav.image.youtube_thumbnail.title'](),
    description: m['landing.nav.image.youtube_thumbnail.description'](),
  }),
  wan3: () => ({
    title: m['landing.nav.video.wan3.title'](),
    description: m['landing.nav.video.wan3.description'](),
  }),
  seedance25: () => ({
    title: m['landing.nav.video.seedance25.title'](),
    description: m['landing.nav.video.seedance25.description'](),
  }),
  video: () => ({
    title: m['landing.nav.video.seedance20.title'](),
    description: m['landing.nav.video.seedance20.description'](),
  }),
  minimax_h3: () => ({
    title: m['landing.nav.video.minimax_h3.title'](),
    description: m['landing.nav.video.minimax_h3.description'](),
  }),
  background_remover: () => ({
    title: m['landing.nav.tools.background_remover.title'](),
    description: m['landing.nav.tools.background_remover.description'](),
  }),
  matcha_filter: () => ({
    title: m['landing.nav.tools.matcha_filter.title'](),
    description: m['landing.nav.tools.matcha_filter.description'](),
  }),
};

export function getLocalizedTools() {
  return TOOL_CATALOG.map((tool) => ({ ...tool, ...copyByKind[tool.kind]() }));
}
