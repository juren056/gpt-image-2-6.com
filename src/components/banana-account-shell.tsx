import { useState, type ReactNode } from 'react';
import { ArrowRight, PanelLeft, Search, type LucideIcon } from 'lucide-react';

import { Link } from '@/core/i18n/navigation';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';

export type AccountNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: string;
};
export function BananaAccountShell({
  children,
  brand,
  logo,
  nav,
  pathname,
  accountLabel,
  title,
  tabs,
  creditsLabel,
  creditUnit,
  getCredits,
  recent,
  history,
  toggle,
  searchLabel,
  account,
  balance,
  onUpgrade,
  onSearch,
  rewardLabel,
  onReward,
}: {
  children: ReactNode;
  brand: string;
  logo: string;
  nav: AccountNavItem[];
  pathname: string;
  accountLabel: string;
  title: string;
  tabs: { href: string; label: string }[];
  creditsLabel: string;
  creditUnit: string;
  getCredits: string;
  recent: string;
  history: AccountNavItem;
  toggle: string;
  searchLabel: string;
  account: ReactNode;
  balance: number | null;
  onUpgrade: () => void;
  onSearch: () => void;
  rewardLabel: string;
  onReward: () => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const sidebar = (
    <>
      <div className="banana-account-brand">
        <Link href="/">
          <img src={logo} alt="" width="24" height="24" />
          <span>{brand}</span>
        </Link>
        <button type="button" aria-label={searchLabel} onClick={onSearch}>
          <Search size={17} />
        </button>
      </div>
      <div className="banana-account-sidebar-scroll">
        <nav className="banana-account-nav" aria-label={accountLabel}>
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              activeOptions={{ exact: true }}
              onClick={() => setMobileOpen(false)}
              aria-current={pathname === item.href ? 'page' : undefined}
            >
              <item.icon size={17} />
              <span>{item.label}</span>
              {item.badge && <small>{item.badge}</small>}
            </Link>
          ))}
        </nav>
        <div className="banana-account-recent">
          <span>{recent}</span>
          <ArrowRight size={15} />
        </div>
        <nav className="banana-account-nav">
          <Link
            href={history.href}
            onClick={() => setMobileOpen(false)}
            aria-current={pathname === history.href ? 'page' : undefined}
          >
            <history.icon size={17} />
            <span>{history.label}</span>
          </Link>
        </nav>
      </div>
      <div className="banana-account-sidebar-bottom">
        <button
          type="button"
          className="banana-account-reward-entry"
          onClick={onReward}
        >
          {rewardLabel}
        </button>
        <div className="banana-account-credit-panel">
          <span>{creditsLabel}</span>
          <p>
            <strong>{balance === null ? '—' : balance.toLocaleString()}</strong>{' '}
            {creditUnit}
          </p>
          <button type="button" onClick={onUpgrade}>
            <span>{getCredits}</span>
            <ArrowRight size={18} />
          </button>
        </div>
        {account}
      </div>
    </>
  );
  return (
    <div
      className={`banana-account banana-account-shell ${collapsed ? 'banana-account-shell--collapsed' : ''}`}
    >
      <aside className="banana-account-sidebar">{sidebar}</aside>
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent
          side="left"
          className="banana-account banana-account-mobile-sidebar"
        >
          <SheetTitle className="sr-only">{accountLabel}</SheetTitle>
          {sidebar}
        </SheetContent>
      </Sheet>
      <div className="banana-account-inset">
        <header className="banana-account-header">
          <button
            type="button"
            className="banana-account-desktop-toggle"
            aria-label={toggle}
            aria-expanded={!collapsed}
            onClick={() => setCollapsed((value) => !value)}
          >
            <PanelLeft size={17} />
          </button>
          <button
            type="button"
            className="banana-account-mobile-toggle"
            aria-label={toggle}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen(true)}
          >
            <PanelLeft size={17} />
          </button>
          <span>{title}</span>
          {tabs.length > 0 && (
            <nav aria-label={accountLabel} className="banana-account-tabs">
              {tabs.map((tab) => (
                <Link
                  key={tab.href}
                  href={tab.href}
                  aria-current={pathname === tab.href ? 'page' : undefined}
                >
                  {tab.label}
                </Link>
              ))}
            </nav>
          )}
        </header>
        <main className="banana-account-main">{children}</main>
      </div>
    </div>
  );
}
