import { createFileRoute } from '@tanstack/react-router';

import { publicModelRouteOptions } from '@/lib/public-creative-routes';

export const Route = createFileRoute('/nano-banana-pro')(
  publicModelRouteOptions('nano-banana-pro')
);
