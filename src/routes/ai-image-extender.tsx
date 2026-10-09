import { createFileRoute } from '@tanstack/react-router';

import { publicToolRouteOptions } from '@/lib/public-creative-routes';

export const Route = createFileRoute('/ai-image-extender')(
  publicToolRouteOptions('T09')
);
