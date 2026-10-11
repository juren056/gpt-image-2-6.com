import { createFileRoute } from '@tanstack/react-router';

import { nanoSiteRouteOptions } from '@/lib/nano-site-routes';

export const Route = createFileRoute('/posts/nano-banana-21-vs-pro')(
  nanoSiteRouteOptions('comparison')
);
