import { createFileRoute } from '@tanstack/react-router';

import { publicToolRouteOptions } from '@/lib/public-creative-routes';

export const Route = createFileRoute('/add-shadow-to-image')(
  publicToolRouteOptions('T05')
);
