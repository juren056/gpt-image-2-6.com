'use client';

import { useEffect, useState } from 'react';
import { ChevronRight, Sparkles, type LucideIcon } from 'lucide-react';

import { Link, usePathname } from '@/core/i18n/navigation';
import { cn } from '@/lib/utils';
import { localizeHref } from '@/paraglide/runtime.js';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@/components/ui/sidebar';

export interface NavSubItem {
  href: string;
  label: string;
  newTab?: boolean;
  /** Optional notification count or short status shown at the menu's right edge. */
  badge?: React.ReactNode;
}

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  group?: string;
  newTab?: boolean;
  /** Optional notification count or short status shown at the menu's right edge. */
  badge?: React.ReactNode;
  /** Sub-items render as a collapsible group under this item. */
  items?: NavSubItem[];
}

export function AppSidebar({
  brand,
  brandHref = '/',
  navItems,
  footerNavItems,
  footer,
  appearance = 'default',
}: {
  brand: React.ReactNode;
  brandHref?: string;
  navItems: NavItem[];
  footerNavItems?: NavItem[];
  footer?: React.ReactNode;
  appearance?: 'default' | 'studio';
}) {
  const pathname = usePathname();
  const studio = appearance === 'studio';

  // Group nav items by their (static) group label.
  const groups: { label?: string; items: NavItem[] }[] = [];
  let currentGroup: string | undefined = '__initial__';
  for (const item of navItems) {
    if (item.group !== currentGroup) {
      groups.push({ label: item.group, items: [item] });
      currentGroup = item.group;
    } else {
      groups[groups.length - 1].items.push(item);
    }
  }

  // The first nav item (dashboard root, e.g. /admin) matches exactly; everything
  // else matches by path prefix so sub-routes light up their entry.
  const isActiveHref = (href: string) =>
    href === navItems[0]?.href
      ? pathname === href
      : pathname === href || pathname.startsWith(href + '/');

  // Hrefs of parent items whose sub-items contain the current route.
  const activeParents = () => {
    const set = new Set<string>();
    for (const item of navItems) {
      if (item.items?.some((sub) => isActiveHref(sub.href))) set.add(item.href);
    }
    return set;
  };

  // Which collapsible parents are open. Seeded with the active parent (SSR-safe,
  // derived from the path), then merged with the persisted set after mount.
  const storageKey = `sidebar-open:${brandHref}`;
  const [openItems, setOpenItems] = useState<Set<string>>(activeParents);

  useEffect(() => {
    let saved: string[] | null = null;
    try {
      saved = JSON.parse(localStorage.getItem(storageKey) || 'null');
    } catch {}
    setOpenItems(() => {
      const next = saved ? new Set(saved) : new Set<string>();
      for (const href of activeParents()) next.add(href);
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  // Keep the active parent open as the route changes, without touching others.
  useEffect(() => {
    setOpenItems((prev) => {
      let changed = false;
      const next = new Set(prev);
      for (const href of activeParents()) {
        if (!next.has(href)) {
          next.add(href);
          changed = true;
        }
      }
      return changed ? next : prev;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  function toggleItem(href: string) {
    setOpenItems((prev) => {
      const next = new Set(prev);
      if (next.has(href)) next.delete(href);
      else next.add(href);
      try {
        localStorage.setItem(storageKey, JSON.stringify([...next]));
      } catch {}
      return next;
    });
  }

  return (
    <Sidebar
      variant="inset"
      className={cn(
        studio &&
          '[&_[data-slot=sidebar-inner]]:overflow-hidden [&_[data-slot=sidebar-inner]]:rounded-[1.75rem] [&_[data-slot=sidebar-inner]]:border [&_[data-slot=sidebar-inner]]:border-white/10 [&_[data-slot=sidebar-inner]]:bg-[#0b0b19] [&_[data-slot=sidebar-inner]]:shadow-2xl'
      )}
    >
      <SidebarHeader className={studio ? 'p-4 pb-2' : undefined}>
        <SidebarMenu>
          <SidebarMenuItem>
            <Link
              href={brandHref}
              className={cn(
                'flex w-full items-center gap-2 text-left text-sm',
                studio
                  ? 'rounded-2xl border border-white/8 bg-white/5 p-3 text-white transition hover:bg-white/9'
                  : 'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground rounded-md px-2 py-1.5'
              )}
            >
              {studio ? (
                <span className="relative flex size-10 items-center justify-center overflow-hidden rounded-xl bg-linear-to-br from-violet-500 via-fuchsia-500 to-amber-400 shadow-lg shadow-violet-950/30">
                  <Sparkles className="size-5" />
                  <span className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,.55),transparent_28%)]" />
                </span>
              ) : null}
              <span
                className={cn(
                  'flex-1 font-serif text-lg leading-none italic',
                  studio && 'font-sans text-sm font-semibold not-italic'
                )}
              >
                {brand}
                {studio ? (
                  <span className="mt-1 block text-[9px] font-medium tracking-[.18em] text-violet-200/60 uppercase md:text-violet-200/45">
                    Imagination engine
                  </span>
                ) : null}
              </span>
            </Link>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className={studio ? 'px-2 py-3' : undefined}>
        {groups.map((group, gi) => (
          <SidebarGroup key={gi} className={studio ? 'py-2' : undefined}>
            {group.label && (
              <SidebarGroupLabel
                className={
                  studio
                    ? 'px-3 text-[9px] font-semibold tracking-[.2em] text-indigo-200/55 uppercase md:text-indigo-200/35'
                    : undefined
                }
              >
                {group.label}
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent className="flex flex-col gap-2">
              <SidebarMenu>
                {group.items.map((item) => {
                  const Icon = item.icon;

                  // Collapsible parent with sub-items.
                  if (item.items?.length) {
                    const open = openItems.has(item.href);
                    const childActive = item.items.some((sub) =>
                      isActiveHref(sub.href)
                    );
                    return (
                      <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton
                          tooltip={item.label}
                          isActive={childActive && !open}
                          aria-expanded={open}
                          onClick={() => toggleItem(item.href)}
                          className={
                            studio
                              ? 'h-11 rounded-xl text-indigo-100/80 hover:bg-white/7 hover:text-white data-[active=true]:bg-white data-[active=true]:text-indigo-950 md:text-indigo-100/65'
                              : undefined
                          }
                        >
                          <Icon />
                          <span>{item.label}</span>
                          <ChevronRight
                            className={`text-muted-foreground ml-auto size-4 shrink-0 transition-transform ${
                              open ? 'rotate-90' : ''
                            }`}
                          />
                        </SidebarMenuButton>
                        {open && (
                          <SidebarMenuSub>
                            {item.items.map((sub) => (
                              <SidebarMenuSubItem key={sub.href}>
                                <SidebarMenuSubButton
                                  render={<Link href={sub.href} />}
                                  isActive={isActiveHref(sub.href)}
                                >
                                  <span>{sub.label}</span>
                                  {sub.badge != null && (
                                    <span
                                      className="bg-destructive text-destructive-foreground ml-auto flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-xs font-medium tabular-nums"
                                      aria-label={`${sub.label}: ${sub.badge}`}
                                    >
                                      {sub.badge}
                                    </span>
                                  )}
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            ))}
                          </SidebarMenuSub>
                        )}
                      </SidebarMenuItem>
                    );
                  }

                  // Plain link.
                  return (
                    <SidebarMenuItem key={item.href}>
                      <Link href={item.href}>
                        <SidebarMenuButton
                          tooltip={item.label}
                          isActive={isActiveHref(item.href)}
                          className={
                            studio
                              ? 'h-11 rounded-xl px-3 text-indigo-100/80 transition-all hover:bg-white/7 hover:text-white data-[active=true]:bg-white data-[active=true]:font-semibold data-[active=true]:text-indigo-950 data-[active=true]:shadow-lg data-[active=true]:shadow-violet-950/25 md:text-indigo-100/65'
                              : undefined
                          }
                        >
                          <Icon />
                          <span>{item.label}</span>
                        </SidebarMenuButton>
                      </Link>
                      {item.badge != null && (
                        <SidebarMenuBadge
                          className="bg-destructive text-destructive-foreground rounded-full"
                          aria-label={`${item.label}: ${item.badge}`}
                        >
                          {item.badge}
                        </SidebarMenuBadge>
                      )}
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter
        className={
          studio
            ? 'm-3 gap-2 rounded-2xl border border-white/8 bg-white/4 p-2 text-indigo-100/85 md:text-indigo-100/70'
            : undefined
        }
      >
        {footerNavItems && footerNavItems.length > 0 && (
          <SidebarMenu>
            {footerNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.newTab
                ? false
                : item.href === '/'
                  ? pathname === '/'
                  : pathname.startsWith(item.href);
              const button = (
                <SidebarMenuButton
                  tooltip={item.label}
                  isActive={isActive}
                  className={
                    studio
                      ? 'rounded-xl hover:bg-white/8 hover:text-white data-[active=true]:bg-white/12 data-[active=true]:text-white'
                      : undefined
                  }
                >
                  <Icon />
                  <span>{item.label}</span>
                </SidebarMenuButton>
              );
              return (
                <SidebarMenuItem key={item.href}>
                  {item.newTab ? (
                    <a
                      href={localizeHref(item.href)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {button}
                    </a>
                  ) : (
                    <Link href={item.href}>{button}</Link>
                  )}
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        )}
        {footer}
      </SidebarFooter>
    </Sidebar>
  );
}
