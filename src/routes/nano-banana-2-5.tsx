import { createFileRoute } from '@tanstack/react-router';

import { nanoSiteAliasRouteOptions } from '@/lib/nano-site-alias';

export const Route = createFileRoute('/nano-banana-2-5')(
  nanoSiteAliasRouteOptions('/')
);
