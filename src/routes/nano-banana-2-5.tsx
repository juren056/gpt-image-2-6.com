import { createFileRoute } from '@tanstack/react-router';

import { publicModelRouteOptions } from '@/lib/public-creative-routes';

export const Route = createFileRoute('/nano-banana-2-5')(
  publicModelRouteOptions('nano-banana-2.5')
);
