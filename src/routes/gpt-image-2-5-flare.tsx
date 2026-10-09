import { createFileRoute } from '@tanstack/react-router';

import { publicModelRouteOptions } from '@/lib/public-creative-routes';

export const Route = createFileRoute('/gpt-image-2-5-flare')(
  publicModelRouteOptions('gpt-image-2.5-flare')
);
