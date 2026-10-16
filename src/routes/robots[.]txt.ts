import { createFileRoute } from '@tanstack/react-router';

import { envConfigs } from '@/config';

export const Route = createFileRoute('/robots.txt')({
  server: {
    handlers: {
      GET: () => {
        const body = [
          'User-Agent: *',
          'Allow: /',
          'Disallow: /admin',
          'Disallow: /settings',
          'Disallow: /api/',
          'Disallow: /zh/admin',
          'Disallow: /zh/settings',
          'Disallow: /zh/api/',
          // The exact public API guide is readable; API endpoints remain blocked.
          'Allow: /api/$',
          'Allow: /zh/api/$',
          '',
          'User-Agent: OAI-SearchBot',
          'Allow: /',
          'Disallow: /admin',
          'Disallow: /settings',
          'Disallow: /api/',
          'Disallow: /zh/admin',
          'Disallow: /zh/settings',
          'Disallow: /zh/api/',
          'Allow: /api/$',
          'Allow: /zh/api/$',
          '',
          'User-Agent: ChatGPT-User',
          'Allow: /',
          'Disallow: /admin',
          'Disallow: /settings',
          'Disallow: /api/',
          'Disallow: /zh/admin',
          'Disallow: /zh/settings',
          'Disallow: /zh/api/',
          'Allow: /api/$',
          'Allow: /zh/api/$',
          '',
          'User-Agent: GPTBot',
          'Allow: /',
          'Disallow: /admin',
          'Disallow: /settings',
          'Disallow: /api/',
          'Disallow: /zh/admin',
          'Disallow: /zh/settings',
          'Disallow: /zh/api/',
          'Allow: /api/$',
          'Allow: /zh/api/$',
          '',
          `Sitemap: ${envConfigs.app_url}/sitemap.xml`,
          '',
        ].join('\n');
        return new Response(body, {
          headers: {
            'Content-Type': 'text/plain',
            'Cache-Control':
              'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800',
          },
        });
      },
    },
  },
});
