import { Film, Images, LayoutGrid } from 'lucide-react';

import { tDynamic } from '@/core/i18n/dynamic';
import {
  PUBLIC_MODEL_PAGES,
  PUBLIC_TOOL_PAGES,
} from '@/config/public-creative';
import { m } from '@/paraglide/messages.js';
import { getLocalizedTools } from '@/blocks/tool-catalog';
import { SiteHeader, type NavItem } from '@/components/site-header';
import { TOOL_ICONS } from '@/components/tool-icon';

export function Header() {
  const tools = getLocalizedTools();
  const linksFor = (category: 'image' | 'video' | 'edit') =>
    tools
      .filter((tool) => tool.category === category)
      .map((tool) => ({
        href: tool.href,
        label: tool.title,
        description: tool.description,
        icon: TOOL_ICONS[tool.icon],
        isNew: tool.isNew,
      }));
  const navItems: NavItem[] = [
    {
      type: 'link',
      href: '/#generator',
      label: m['landing.nav.generator'](),
    },
    {
      type: 'link',
      href: '/prompts',
      label: m['prompt_library.title'](),
    },
    {
      type: 'group',
      label: 'Image Models',
      links: [
        {
          href: '/models',
          label: 'All image models',
          description: 'Compare generation, editing, limits, and pricing.',
          icon: Images,
        },
        {
          href: '/qwen-image-3-1',
          label: 'Qwen Image 3.1',
          description: 'Announced for 2026 · API and pricing not released.',
          icon: Images,
          isNew: true,
        },
        ...PUBLIC_MODEL_PAGES.map((model) => ({
          href: model.path,
          label: model.name,
          description: model.useCase,
          modelId: model.id,
        })),
      ],
    },
    {
      type: 'group',
      label: m['landing.nav.ai_tools'](),
      links: [
        {
          href: '/tools',
          label: m['landing.nav.tools.all.title'](),
          description: m['landing.nav.tools.all.description'](),
          icon: LayoutGrid,
        },
        {
          href: '/seedance-2-5-draft-mode',
          label: tDynamic('seedance_draft.nav_label'),
          description: tDynamic('seedance_draft.nav_description'),
          icon: Film,
          isNew: true,
        },
        ...PUBLIC_TOOL_PAGES.map((tool) => ({
          href: tool.path,
          label: tool.name,
          description: tool.summary,
          toolId: tool.id,
        })),
        ...linksFor('video'),
        ...linksFor('edit').filter(
          (link) => !PUBLIC_TOOL_PAGES.some((tool) => tool.path === link.href)
        ),
      ],
    },
    { type: 'link', href: '/lab', label: 'Resources' },
    {
      type: 'link',
      href: '/pricing',
      label: m['landing.nav.pricing'](),
    },
  ];

  return <SiteHeader navItems={navItems} />;
}
