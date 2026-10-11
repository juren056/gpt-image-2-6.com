import { createFileRoute } from '@tanstack/react-router';

import { AccountWorkflowLibrary } from '@/blocks/banana-account-assets';

export const Route = createFileRoute('/settings/skills')({
  component: () => <AccountWorkflowLibrary kind="skills" />,
  head: () => ({ meta: [{ name: 'robots', content: 'noindex, nofollow' }] }),
});
