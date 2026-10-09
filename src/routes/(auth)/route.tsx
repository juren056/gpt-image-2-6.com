import { createFileRoute, Outlet } from '@tanstack/react-router';

export const Route = createFileRoute('/(auth)')({
  head: () => ({
    meta: [
      { name: 'robots', content: 'noindex, follow' },
      { name: 'googlebot', content: 'noindex, follow' },
    ],
  }),
  component: Outlet,
});
