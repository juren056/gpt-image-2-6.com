import { createFileRoute } from '@tanstack/react-router';

import { publicModelRouteOptions } from '@/lib/public-creative-routes';

export const Route = createFileRoute('/qwen-image-2-1-generator')(
  publicModelRouteOptions('qwen-image-2.1')
);
