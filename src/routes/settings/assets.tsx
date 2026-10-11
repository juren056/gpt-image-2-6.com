import { createFileRoute } from '@tanstack/react-router';

import { AccountAssets } from '@/blocks/banana-account-assets';

export const Route = createFileRoute('/settings/assets')({
  component: AccountAssets,
  head: () => ({ meta: [{ name: 'robots', content: 'noindex, nofollow' }] }),
});
