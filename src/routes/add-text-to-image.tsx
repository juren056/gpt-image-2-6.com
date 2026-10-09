import { createFileRoute } from '@tanstack/react-router';

import { publicToolRouteOptions } from '@/lib/public-creative-routes';

export const Route = createFileRoute('/add-text-to-image')(
  publicToolRouteOptions('T12')
);
