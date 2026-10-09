import { createFileRoute } from '@tanstack/react-router';

import { publicToolRouteOptions } from '@/lib/public-creative-routes';

export const Route = createFileRoute('/product-image-set-generator')(
  publicToolRouteOptions('T17')
);
