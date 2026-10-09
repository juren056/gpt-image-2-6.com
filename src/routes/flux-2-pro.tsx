import { createFileRoute } from '@tanstack/react-router';

import { publicModelRouteOptions } from '@/lib/public-creative-routes';

export const Route = createFileRoute('/flux-2-pro')(
  publicModelRouteOptions('flux-2-pro')
);
