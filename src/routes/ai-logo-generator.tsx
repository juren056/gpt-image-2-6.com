import { createFileRoute } from '@tanstack/react-router';

import { publicToolRouteOptions } from '@/lib/public-creative-routes';

export const Route = createFileRoute('/ai-logo-generator')(
  publicToolRouteOptions('T20')
);
