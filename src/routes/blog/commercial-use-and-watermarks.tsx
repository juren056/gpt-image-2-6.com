import { createFileRoute } from '@tanstack/react-router';

import { nanoSiteRouteOptions } from '@/lib/nano-site-routes';

export const Route = createFileRoute('/blog/commercial-use-and-watermarks')(
  nanoSiteRouteOptions('blogRights')
);
