import { createFileRoute } from '@tanstack/react-router';

import { nanoSiteAliasRouteOptions } from '@/lib/nano-site-alias';

export const Route = createFileRoute('/vs-pro')(
  nanoSiteAliasRouteOptions('/posts/nano-banana-21-vs-pro')
);
