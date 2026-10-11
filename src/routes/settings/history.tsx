import { createFileRoute } from '@tanstack/react-router';

import { AccountAssets } from '@/blocks/banana-account-assets';

export const Route = createFileRoute('/settings/history')({
  component: () => <AccountAssets history />,
  head: () => ({ meta: [{ name: 'robots', content: 'noindex, nofollow' }] }),
});
