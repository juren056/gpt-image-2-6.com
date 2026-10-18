import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';

import { NANO_SITE_PAGES, type NanoPageId } from '@/config/nano-site';
import { locales } from '@/paraglide/runtime.js';

const pageIds = Object.keys(NANO_SITE_PAGES) as [NanoPageId, ...NanoPageId[]];

/** Public, bounded page copy. SSR calls this in-process; navigation fetches only its page. */
export const getNanoSiteDataFn = createServerFn({ method: 'GET' })
  .validator(z.object({ id: z.enum(pageIds), locale: z.enum(locales) }))
  .handler(async ({ data }) => {
    const { getNanoSitePresentation } =
      await import('@/blocks/nano-site-content');
    return getNanoSitePresentation(data.id, data.locale);
  });
