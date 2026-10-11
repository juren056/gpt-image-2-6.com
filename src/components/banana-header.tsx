import { useEffect, useState, type ReactNode } from 'react';
import { Check, Languages, Menu, Moon, Sun, X } from 'lucide-react';

import { Link } from '@/core/i18n/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

export type BananaNavLink = { href: string; label: string };
type BananaHeaderProps = {
  brand: string;
  logo: string;
  navLabel: string;
  links: BananaNavLink[];
  announcement?: { text: string; cta: string; dismiss: string };
  loginLabel: string;
  signupLabel: string;
  mobileSignupLabel: string;
  openMenuLabel: string;
  closeMenuLabel: string;
  languageLabel: string;
  languages: Array<{ code: string; label: string }>;
  activeLanguage: string;
  onLanguageChange: (code: string) => void;
  themeLabel: string;
  dark: boolean;
  onThemeChange: () => void;
  account?: ReactNode;
};
const bannerStorageKey = 'banana21-announcement-dismissed-v1';

export function BananaHeader(props: BananaHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  useEffect(() => {
    try {
      setBannerDismissed(sessionStorage.getItem(bannerStorageKey) === '1');
    } catch {
      /* Storage is optional. */
    }
  }, []);
  const dismissBanner = () => {
    setBannerDismissed(true);
    try {
      sessionStorage.setItem(bannerStorageKey, '1');
    } catch {
      /* Keep the in-memory preference. */
    }
  };
  const languageControl = (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="banana-chrome-icon"
        aria-label={props.languageLabel}
        title={props.languageLabel}
      >
        <Languages size={18} aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="max-h-80 overflow-y-auto">
        {props.languages.map((language) => (
          <DropdownMenuItem
            key={language.code}
            onClick={() => props.onLanguageChange(language.code)}
          >
            <span lang={language.code} className="flex-1">
              {language.label}
            </span>
            {props.activeLanguage === language.code && (
              <Check size={14} aria-hidden="true" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
  const themeControl = (
    <button
      type="button"
      className="banana-chrome-icon"
      aria-label={props.themeLabel}
      title={props.themeLabel}
      onClick={props.onThemeChange}
    >
      {props.dark ? (
        <Moon size={18} aria-hidden="true" />
      ) : (
        <Sun size={18} aria-hidden="true" />
      )}
    </button>
  );
  return (
    <>
      {props.announcement && !bannerDismissed && (
        <aside className="banana-announcement">
          <span>{props.announcement.text}</span>
          <Link href="/pricing" className="banana-announcement-cta">
            {props.announcement.cta}
          </Link>
          <button
            type="button"
            className="banana-announcement-close"
            onClick={dismissBanner}
            aria-label={props.announcement.dismiss}
          >
            <X size={18} aria-hidden="true" />
          </button>
        </aside>
      )}
      <header className="banana-header">
        <div className="banana-header-inner">
          <div className="banana-header-brand-group">
            <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
              <SheetTrigger
                className="banana-chrome-icon banana-mobile-menu"
                aria-label={props.openMenuLabel}
              >
                <Menu size={20} aria-hidden="true" />
              </SheetTrigger>
              <SheetContent
                side="left"
                showCloseButton={false}
                className="banana-navigation-sheet"
              >
                <SheetHeader>
                  <SheetTitle>{props.navLabel}</SheetTitle>
                  <SheetClose
                    className="banana-chrome-icon banana-sheet-close"
                    aria-label={props.closeMenuLabel}
                  >
                    <X size={20} aria-hidden="true" />
                  </SheetClose>
                </SheetHeader>
                <Link
                  href="/"
                  className="banana-header-brand banana-sheet-brand"
                  onClick={() => setMenuOpen(false)}
                >
                  <img src={props.logo} width={36} height={36} alt="" />
                  <span>{props.brand}</span>
                </Link>
                <nav aria-label={props.navLabel} className="banana-sheet-links">
                  {props.links.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMenuOpen(false)}
                    >
                      {link.label}
                    </Link>
                  ))}
                </nav>
                <div className="banana-sheet-controls">
                  {themeControl}
                  {languageControl}
                </div>
                {!props.account && (
                  <Link
                    href="/sign-in?callbackUrl=%2F%23tool-generator"
                    className="banana-sheet-login"
                    onClick={() => setMenuOpen(false)}
                  >
                    {props.loginLabel}
                  </Link>
                )}
              </SheetContent>
            </Sheet>
            <Link href="/" className="banana-header-brand">
              <img src={props.logo} width={36} height={36} alt="" />
              <span>{props.brand}</span>
            </Link>
          </div>
          <nav className="banana-desktop-nav" aria-label={props.navLabel}>
            {props.links.map((link) => (
              <Link key={link.href} href={link.href}>
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="banana-header-actions">
            <div className="banana-mobile-theme">{themeControl}</div>
            <div className="banana-desktop-controls">
              {themeControl}
              {languageControl}
            </div>
            {props.account || (
              <>
                <Link
                  className="banana-header-login"
                  href="/sign-in?callbackUrl=%2F%23tool-generator"
                >
                  {props.loginLabel}
                </Link>
                <Link
                  className="banana-header-signup"
                  href="/sign-up?callbackUrl=%2F%23tool-generator"
                >
                  <span className="banana-desktop-signup-label">
                    {props.signupLabel}
                  </span>
                  <span className="banana-mobile-signup-label">
                    {props.mobileSignupLabel}
                  </span>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>
    </>
  );
}
