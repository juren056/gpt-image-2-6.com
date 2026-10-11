import { createFileRoute } from '@tanstack/react-router';

import { nanoSiteRouteOptions } from '@/lib/nano-site-routes';

export const Route = createFileRoute('/logo')(nanoSiteRouteOptions('logo'));
