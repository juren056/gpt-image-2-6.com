import { createFileRoute } from '@tanstack/react-router';

import { AccountWorkflowLibrary } from '@/blocks/banana-account-assets';

export const Route = createFileRoute('/settings/prompts')({
  component: () => <AccountWorkflowLibrary kind="prompts" />,
  head: () => ({ meta: [{ name: 'robots', content: 'noindex, nofollow' }] }),
});
