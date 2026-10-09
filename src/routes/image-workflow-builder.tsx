import { createFileRoute } from '@tanstack/react-router';

import { publicToolRouteOptions } from '@/lib/public-creative-routes';

export const Route = createFileRoute('/image-workflow-builder')(
  publicToolRouteOptions('T25')
);
