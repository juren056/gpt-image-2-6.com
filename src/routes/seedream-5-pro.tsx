import { createFileRoute } from '@tanstack/react-router';

import { publicModelRouteOptions } from '@/lib/public-creative-routes';

export const Route = createFileRoute('/seedream-5-pro')(
  publicModelRouteOptions('seedream-5-pro')
);
