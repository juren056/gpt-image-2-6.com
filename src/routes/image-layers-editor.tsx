import { createFileRoute } from '@tanstack/react-router';

import { publicToolRouteOptions } from '@/lib/public-creative-routes';

export const Route = createFileRoute('/image-layers-editor')(
  publicToolRouteOptions('T11')
);
