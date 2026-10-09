import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { createFileRoute, Outlet } from '@tanstack/react-router';
import {
  CreditCard,
  FolderOpen,
  Home,
  Images,
  LayoutDashboard,
  LifeBuoy,
  Settings,
  Shield,
} from 'lucide-react';

import { useSession } from '@/core/auth/client';
import { usePathname } from '@/core/i18n/navigation';
import { envConfigs } from '@/config';
import { apiGet, type PageResult } from '@/lib/api-client';
import { m } from '@/paraglide/messages.js';
import { AppLayout } from '@/components/app-layout';

export const Route = createFileRoute('/admin')({
  component: AdminLayout,
});

function AdminLayout() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const isUsersPage =
    pathname === '/admin/users' || pathname.startsWith('/admin/users/');
  const [usersSeenAt, setUsersSeenAt] = useState<number | null>(null);

  useEffect(() => {
    const storageKey = 'admin-users-last-seen-at';
    const stored = Number(localStorage.getItem(storageKey));
    const seenAt =
      isUsersPage || !Number.isFinite(stored) || stored <= 0
        ? Date.now()
        : stored;
    if (isUsersPage || stored !== seenAt) {
      localStorage.setItem(storageKey, String(seenAt));
    }
    setUsersSeenAt(seenAt);
  }, [isUsersPage]);

  const openTicketsQuery = useQuery({
    queryKey: ['admin-tickets', 'open-count'],
    queryFn: () =>
      apiGet<PageResult<unknown>>(
        '/api/admin/tickets?page=1&pageSize=1&status=open'
      ),
    enabled: !!session?.user,
    staleTime: 15_000,
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  });
  const openTicketCount = openTicketsQuery.data?.total ?? 0;
  const pendingPaymentsQuery = useQuery({
    queryKey: ['admin-payments', 'pending-count'],
    queryFn: () =>
      apiGet<PageResult<unknown>>(
        '/api/admin/orders?page=1&pageSize=1&status=pending'
      ),
    enabled: !!session?.user,
    staleTime: 15_000,
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  });
  const pendingPaymentCount = pendingPaymentsQuery.data?.total ?? 0;
  const newUsersQuery = useQuery({
    queryKey: ['admin-users', 'new-count', usersSeenAt],
    queryFn: () =>
      apiGet<PageResult<unknown>>(
        `/api/admin/users?page=1&pageSize=1&createdAfter=${usersSeenAt}`
      ),
    enabled: !!session?.user && usersSeenAt !== null && !isUsersPage,
    staleTime: 15_000,
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  });
  const newUserCount = isUsersPage ? 0 : (newUsersQuery.data?.total ?? 0);
  const group = m['common.systems.admin']();
  const navItems = [
    {
      href: '/admin',
      label: m['admin.nav.overview'](),
      icon: LayoutDashboard,
      group,
    },
    {
      href: '/admin/users',
      label: m['admin.nav.rbac'](),
      icon: Shield,
      group,
      items: [
        {
          href: '/admin/users',
          label: m['admin.nav.users'](),
          badge:
            newUserCount > 0
              ? newUserCount > 99
                ? '99+'
                : newUserCount
              : undefined,
        },
        { href: '/admin/invite-codes', label: m['admin.nav.invite_codes']() },
        { href: '/admin/roles', label: m['admin.nav.roles']() },
        { href: '/admin/permissions', label: m['admin.nav.permissions']() },
      ],
    },
    {
      href: '/admin/categories',
      label: m['admin.nav.content'](),
      icon: FolderOpen,
      group,
      items: [
        { href: '/admin/categories', label: m['admin.nav.categories']() },
        { href: '/admin/posts', label: m['admin.nav.posts']() },
      ],
    },
    {
      href: '/admin/generations',
      label: m['admin.nav.generations'](),
      icon: Images,
      group,
    },
    {
      href: '/admin/payments',
      label: m['admin.nav.billing'](),
      icon: CreditCard,
      group,
      items: [
        {
          href: '/admin/payments',
          label: m['admin.nav.payments'](),
          badge:
            pendingPaymentCount > 0
              ? pendingPaymentCount > 99
                ? '99+'
                : pendingPaymentCount
              : undefined,
        },
        { href: '/admin/subscriptions', label: m['admin.nav.subscriptions']() },
        { href: '/admin/credits', label: m['admin.nav.credits']() },
      ],
    },
    {
      href: '/admin/tickets',
      label: m['admin.nav.tickets'](),
      icon: LifeBuoy,
      group,
      badge:
        openTicketCount > 0
          ? openTicketCount > 99
            ? '99+'
            : openTicketCount
          : undefined,
    },
  ];

  const footerNavItems = [
    {
      href: '/admin/settings',
      label: m['admin.nav.settings'](),
      icon: Settings,
    },
    { href: '/', label: m['common.systems.home'](), icon: Home, newTab: true },
  ];

  return (
    <AppLayout
      navItems={navItems}
      footerNavItems={footerNavItems}
      brand={envConfigs.app_name}
      brandHref="/admin"
      profileHref="/settings/profile"
      requirePermission="admin.*"
    >
      <Outlet />
    </AppLayout>
  );
}
