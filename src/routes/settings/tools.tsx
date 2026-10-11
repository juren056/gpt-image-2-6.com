import { createFileRoute } from '@tanstack/react-router';

import { AccountWorkflowLibrary } from '@/blocks/banana-account-assets';

export const Route = createFileRoute('/settings/tools')({
  component: () => <AccountWorkflowLibrary kind="tools" />,
  head: () => ({ meta: [{ name: 'robots', content: 'noindex, nofollow' }] }),
});
