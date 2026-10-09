import { createFileRoute } from '@tanstack/react-router';

import { gptImageOpportunityRouteOptions } from '@/lib/gpt-image-opportunity-routes';

export const Route = createFileRoute('/gpt-image-2-5-poster-generator')(
  gptImageOpportunityRouteOptions('poster')
);
