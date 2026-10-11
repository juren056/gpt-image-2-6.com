import { createFileRoute } from '@tanstack/react-router';

import { nanoSiteAliasRouteOptions } from '@/lib/nano-site-alias';

export const Route = createFileRoute('/migration')(
  nanoSiteAliasRouteOptions('/guide/nano-banana-2-to-2-1')
);
