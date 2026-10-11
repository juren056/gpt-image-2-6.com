import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';

import { useSession } from '@/core/auth/client';
import { envConfigs } from '@/config';
import { localeNames } from '@/config/locale';
import { getLocale, locales, setLocale } from '@/paraglide/runtime.js';
import { bananaText } from '@/blocks/banana-messages';
import { BananaHeader } from '@/components/banana-header';
import { SiteUserMenu } from '@/components/site-user-menu';

export function Header({ announcement = true }: { announcement?: boolean }) {
  const locale = getLocale();
  const text = (key: string) =>
    bananaText(`chrome.${key}`, locale === 'zh' ? 'zh' : 'en');
  const { data: session } = useSession();
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const user = session?.user;
  return (
    <BananaHeader
      brand={envConfigs.app_name}
      logo={envConfigs.app_logo}
      navLabel={text('navigation')}
      links={[
        { href: '/settings/studio', label: text('studio') },
        { href: '/#tool-generator', label: text('generate') },
        { href: '/#features', label: text('features') },
        { href: '/vs-2', label: text('comparison') },
        { href: '/pricing', label: text('pricing') },
        { href: '/#faq', label: text('faq') },
      ]}
      announcement={
        announcement
          ? {
              text: text('announcement'),
              cta: text('explore_plans'),
              dismiss: text('dismiss'),
            }
          : undefined
      }
      loginLabel={text('login')}
      signupLabel={text('start_free')}
      mobileSignupLabel={text('sign_up')}
      openMenuLabel={text('open_menu')}
      closeMenuLabel={text('close_menu')}
      languageLabel={text('language')}
      languages={locales.map((code) => ({
        code,
        label: localeNames[code] || code,
      }))}
      activeLanguage={locale}
      onLanguageChange={(code) => setLocale(code as typeof locale)}
      themeLabel={text('theme')}
      dark={mounted ? resolvedTheme === 'dark' : true}
      onThemeChange={() =>
        setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
      }
      account={
        user ? (
          <SiteUserMenu
            name={user.name || user.email}
            email={user.email}
            image={user.image}
          />
        ) : undefined
      }
    />
  );
}
