import { createFileRoute, Outlet } from '@tanstack/react-router';
import {
  Coins,
  CreditCard,
  Gift,
  Home,
  ImageIcon,
  Key,
  LayoutDashboard,
  LifeBuoy,
  Receipt,
  Shapes,
  User,
} from 'lucide-react';

import { envConfigs } from '@/config';
import { m } from '@/paraglide/messages.js';
import { usePublicConfig } from '@/hooks/use-public-config';
import { SupportWidget } from '@/blocks/support-widget';
import { AppLayout } from '@/components/app-layout';

export const Route = createFileRoute('/settings')({
  component: SettingsLayout,
});

function SettingsLayout() {
  const publicConfig = usePublicConfig();
  const studioEnabled = publicConfig.data?.creative_studio_enabled === 'true';
  const navItems = [
    {
      href: '/settings',
      label: m['settings.nav.overview'](),
      icon: LayoutDashboard,
      group: m['settings.nav.group_workspace'](),
    },
    {
      href: '/settings/generate',
      label: m['settings.nav.generate'](),
      icon: ImageIcon,
      group: m['settings.nav.group_create'](),
    },
    ...(studioEnabled
      ? [
          {
            href: '/settings/studio',
            label: m['settings.nav.studio'](),
            icon: Shapes,
            group: m['settings.nav.group_create'](),
          },
        ]
      : []),
    {
      href: '/settings/billing',
      label: m['settings.nav.billing'](),
      icon: CreditCard,
      group: m['settings.nav.group_resources'](),
    },
    {
      href: '/settings/payments',
      label: m['settings.nav.payments'](),
      icon: Receipt,
      group: m['settings.nav.group_resources'](),
    },
    {
      href: '/settings/credits',
      label: m['settings.nav.credits'](),
      icon: Coins,
      group: m['settings.nav.group_resources'](),
    },
    {
      href: '/settings/referrals',
      label: m['settings.nav.referrals'](),
      icon: Gift,
      group: m['settings.nav.group_grow'](),
    },
    {
      href: '/settings/apikeys',
      label: m['settings.nav.apikeys'](),
      icon: Key,
      group: m['settings.nav.group_grow'](),
    },
    {
      href: '/settings/tickets',
      label: m['settings.nav.tickets'](),
      icon: LifeBuoy,
      group: m['settings.nav.group_grow'](),
    },
  ];

  const footerNavItems = [
    {
      href: '/settings/profile',
      label: m['settings.nav.profile'](),
      icon: User,
    },
    { href: '/', label: m['common.systems.home'](), icon: Home, newTab: true },
  ];

  return (
    <AppLayout
      navItems={navItems}
      footerNavItems={footerNavItems}
      brand={envConfigs.app_name}
      brandHref="/settings"
      appearance="studio"
    >
      <Outlet />
      <SupportWidget />
    </AppLayout>
  );
}
