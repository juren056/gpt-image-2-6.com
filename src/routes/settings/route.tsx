import { createFileRoute, Outlet } from '@tanstack/react-router';

import { envConfigs } from '@/config';
import { m } from '@/paraglide/messages.js';
import { AccountShell } from '@/blocks/banana-account-shell';
import { SupportWidget } from '@/blocks/support-widget';

export const Route = createFileRoute('/settings')({
  loader: () => ({
    title: `${m['account.menu.account']()} · ${envConfigs.app_name}`,
  }),
  head: ({ loaderData }) => ({
    meta: [
      { title: loaderData?.title || envConfigs.app_name },
      { name: 'robots', content: 'noindex, follow' },
    ],
  }),
  component: SettingsLayout,
});
function SettingsLayout() {
  return (
    <AccountShell>
      <Outlet />
      <SupportWidget />
    </AccountShell>
  );
}
