'use client';

import { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Sparkles } from 'lucide-react';

import { useSession } from '@/core/auth/client';
import { usePathname, useRouter } from '@/core/i18n/navigation';
import { apiGet } from '@/lib/api-client';
import { isSigningOut } from '@/lib/auth-transition';
import { useUserPermissions } from '@/hooks/use-user-permissions';
import { AppSidebar, type NavItem } from '@/components/app-sidebar';
import { ThemeToggle } from '@/components/theme-toggle';
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { UserMenu } from '@/components/user-menu';

export function AppLayout({
  children,
  navItems,
  footerNavItems,
  brand,
  brandHref = '/',
  mobileBrand,
  headerExtra,
  profileHref,
  requirePermission,
  unauthorizedRedirect = '/settings',
  appearance = 'default',
}: {
  children: React.ReactNode;
  navItems: NavItem[];
  footerNavItems?: NavItem[];
  brand: React.ReactNode;
  brandHref?: string;
  mobileBrand?: React.ReactNode;
  headerExtra?: React.ReactNode;
  profileHref?: string;
  requirePermission?: string;
  unauthorizedRedirect?: string;
  appearance?: 'default' | 'studio';
}) {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  // Guard against a double redirect: useLocation() flips to "/sign-in" the moment
  // we navigate (while this layout is still mounted), which would otherwise re-fire
  // the effect and overwrite callbackUrl with the sign-in path itself.
  const redirectingRef = useRef(false);

  // Invite-only gate: needs the user's membership status (also covers social
  // logins). `needsInvite` is computed server-side in /api/user/info.
  const userInfoQuery = useQuery({
    queryKey: ['user-info'],
    queryFn: () => apiGet<{ needsInvite?: boolean }>('/api/user/info'),
    staleTime: 60_000,
    enabled: !!session?.user,
  });
  const needsInvite = userInfoQuery.data?.needsInvite === true;
  const membershipResolved =
    !session?.user || userInfoQuery.isSuccess || userInfoQuery.isError;

  // Only query permissions once we have a session and a permission gate.
  const permissionsEnabled = !!session?.user && !!requirePermission;
  const permissionsQuery = useUserPermissions(permissionsEnabled);
  const isAdmin = permissionsQuery.data?.isAdmin === true;

  // Authorization resolution mirrors the original imperative flow:
  // - no permission gate → authorized once a session exists + membership ok
  // - permission gate → authorized only when the query resolves with isAdmin
  const authorized =
    !!session?.user &&
    membershipResolved &&
    !needsInvite &&
    (!requirePermission || isAdmin);

  useEffect(() => {
    if (isPending) return;

    if (!session?.user) {
      if (isSigningOut()) return;
      if (redirectingRef.current) return;
      redirectingRef.current = true;
      // Remember where the user was headed so sign-in can send them back.
      // pathname is already locale-free; append the live query string.
      const search =
        typeof window !== 'undefined' ? window.location.search : '';
      const callbackUrl = `${pathname}${search}`;
      router.push(`/sign-in?callbackUrl=${encodeURIComponent(callbackUrl)}`);
      return;
    }

    // Invite-only gate: wait for membership status, then bounce unredeemed
    // (incl. social) users to the redeem page. Admins are exempt server-side.
    if (userInfoQuery.isPending) return;
    if (needsInvite) {
      if (!redirectingRef.current) {
        redirectingRef.current = true;
        router.push('/redeem-invite');
      }
      return;
    }

    if (!requirePermission) return;

    // Wait for the permissions query to resolve before deciding.
    if (permissionsQuery.isPending) return;

    if (permissionsQuery.isError || !isAdmin) {
      router.push(unauthorizedRedirect);
    }
  }, [
    isPending,
    session,
    router,
    pathname,
    requirePermission,
    unauthorizedRedirect,
    userInfoQuery.isPending,
    needsInvite,
    permissionsQuery.isPending,
    permissionsQuery.isError,
    isAdmin,
  ]);

  if (isPending || !authorized || !session?.user) {
    return (
      <div className="bg-background flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="border-primary size-6 animate-spin rounded-full border-2 border-t-transparent" />
          <span className="text-muted-foreground text-sm">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider
      className={
        appearance === 'studio'
          ? 'studio-app-shell bg-[#080812] [--sidebar-width:17.5rem]'
          : undefined
      }
    >
      <AppSidebar
        brand={brand}
        brandHref={brandHref}
        navItems={navItems}
        footerNavItems={footerNavItems}
        appearance={appearance}
        footer={
          <UserMenu
            name={session.user.name || 'User'}
            email={session.user.email}
            image={session.user.image}
            profileHref={profileHref}
            appearance={appearance}
          />
        }
      />
      {/* min-w-0: let the inset shrink below its content's min-content width —
          otherwise wide tables stretch the page and force horizontal scroll
          instead of scrolling inside their own overflow-x-auto wrappers */}
      <SidebarInset
        className={
          appearance === 'studio'
            ? 'min-w-0 overflow-hidden border border-white/70 bg-[#f5f3ff] shadow-2xl shadow-black/20 md:my-3 md:mr-3 md:rounded-[2rem] dark:border-white/8 dark:bg-[#10101a]'
            : 'min-w-0'
        }
      >
        <header
          className={
            appearance === 'studio'
              ? 'sticky top-0 z-30 flex h-16 shrink-0 items-center gap-2 border-b border-indigo-950/6 bg-[#f5f3ff]/85 px-2 backdrop-blur-xl dark:border-white/8 dark:bg-[#10101a]/85'
              : 'flex h-14 shrink-0 items-center gap-2'
          }
        >
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger
              className={
                appearance === 'studio'
                  ? '-ml-1 rounded-xl border border-indigo-950/8 bg-white/70 shadow-sm dark:border-white/10 dark:bg-white/5'
                  : '-ml-1'
              }
            />
            {appearance === 'studio' ? (
              <div className="hidden items-center gap-2 text-xs font-semibold tracking-[.16em] text-indigo-950/45 uppercase sm:flex dark:text-indigo-100/45">
                <Sparkles className="size-3.5 text-violet-500" />
                Creative OS
              </div>
            ) : null}
          </div>
          <div className="flex-1" />
          {appearance === 'studio' ? <ThemeToggle /> : null}
          {headerExtra && (
            <div className="flex items-center gap-1 px-4">{headerExtra}</div>
          )}
        </header>
        <main
          className={
            appearance === 'studio'
              ? 'flex-1 overflow-auto bg-[radial-gradient(circle_at_12%_8%,rgba(124,58,237,.09),transparent_28%),radial-gradient(circle_at_92%_2%,rgba(236,72,153,.07),transparent_24%)]'
              : 'flex-1 overflow-auto'
          }
        >
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
