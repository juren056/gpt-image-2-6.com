import { createFileRoute } from '@tanstack/react-router';

import { nanoSiteRouteOptions } from '@/lib/nano-site-routes';

export const Route = createFileRoute('/vs-gpt-image')(
  nanoSiteRouteOptions('versusGpt')
);
