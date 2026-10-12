import { useEffect, useState, type ReactNode } from 'react';
import { useTheme } from 'next-themes';

import { envConfigs } from '@/config';
import { m } from '@/paraglide/messages.js';
import { AuthMarketingShell as AuthGallery } from '@/components/auth-marketing-shell';

export function AuthMarketingShell({
  children,
  starterCredits,
  mode,
}: {
  children: ReactNode;
  starterCredits: number;
  mode: 'sign-in' | 'sign-up';
}) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const dark = mounted && resolvedTheme === 'dark';
  return (
    <AuthGallery
      appName={envConfigs.app_name}
      appLogo={envConfigs.app_logo}
      dark={dark}
      onThemeChange={() => setTheme(dark ? 'light' : 'dark')}
      content={{
        headline:
          mode === 'sign-in'
            ? m['common.sign.gallery_login_headline']()
            : m['common.sign.gallery_signup_headline'](),
        description: m['common.sign.reward_description'](),
        badge:
          mode === 'sign-up' && starterCredits > 0
            ? m['common.sign.reward_badge']({ credits: starterCredits })
            : null,
        back: m['common.pages.back_to_home'](),
        theme: dark
          ? m['common.nav.theme_light']()
          : m['common.nav.theme_dark'](),
        disclosure: m['common.sign.gallery_disclosure'](),
        images: [
          {
            src: '/images/auth-gallery/brand-audio-20261012.webp',
            srcSet:
              '/images/auth-gallery/brand-audio-640-20261012.webp 640w, /images/auth-gallery/brand-audio-20261012.webp 1280w',
            sizes: '(min-width: 1024px) 44vw, calc(100vw - 40px)',
            alt: m['common.sign.gallery_brand_alt'](),
            label: m['common.sign.gallery_brand_label'](),
            kind: 'poster',
          },
          {
            src: '/images/auth-gallery/space-studio-20261012.webp',
            alt: m['common.sign.gallery_space_alt'](),
            label: m['common.sign.gallery_space_label'](),
            kind: 'space',
          },
          {
            src: '/images/auth-gallery/social-streetwear-20261012.webp',
            alt: m['common.sign.gallery_social_alt'](),
            label: m['common.sign.gallery_social_label'](),
            kind: 'social',
          },
        ],
        rewards: [
          {
            title: m['common.sign.checkin_title'](),
            description: m['common.sign.checkin_description'](),
          },
          {
            title: m['common.sign.invite_title'](),
            description: m['common.sign.invite_purchase_description'](),
          },
        ],
        benefits: [
          m['common.sign.reward_benefit_create'](),
          m['common.sign.reward_benefit_private'](),
          m['common.sign.reward_benefit_no_card'](),
        ],
        terms: m['landing.footer.terms'](),
        privacy: m['landing.footer.privacy'](),
      }}
    >
      {children}
    </AuthGallery>
  );
}
