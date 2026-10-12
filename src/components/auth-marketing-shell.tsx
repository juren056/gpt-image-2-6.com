import type { ReactNode } from 'react';
import {
  ArrowLeft,
  CalendarCheck,
  Coins,
  Moon,
  ShieldCheck,
  Sun,
  Users,
} from 'lucide-react';

import { Link } from '@/core/i18n/navigation';

import '@/styles/banana-auth.css';

export type AuthGalleryContent = {
  headline: string;
  description: string;
  badge: string | null;
  back: string;
  theme: string;
  disclosure: string;
  images: {
    src: string;
    srcSet?: string;
    sizes?: string;
    alt: string;
    label: string;
    kind: string;
  }[];
  rewards: { title: string; description: string }[];
  benefits: string[];
  terms: string;
  privacy: string;
};
export function AuthMarketingShell({
  children,
  content,
  appName,
  appLogo,
  dark,
  onThemeChange,
}: {
  children: ReactNode;
  content: AuthGalleryContent;
  appName: string;
  appLogo: string;
  dark: boolean;
  onThemeChange: () => void;
}) {
  return (
    <main className="nano-auth auth-gallery">
      <header className="auth-gallery-header">
        <Link href="/" className="auth-gallery-brand">
          <img src={appLogo} alt="" width={34} height={34} />
          <span>{appName}</span>
        </Link>
        <nav className="auth-gallery-nav" aria-label={content.back}>
          <Link
            href="/"
            className="auth-gallery-back"
            aria-label={content.back}
          >
            <ArrowLeft size={17} />
            <span>{content.back}</span>
          </Link>
          <button
            type="button"
            className="auth-theme-toggle"
            aria-label={content.theme}
            onClick={onThemeChange}
          >
            {dark ? <Sun size={19} /> : <Moon size={19} />}
          </button>
        </nav>
      </header>
      <div className="auth-gallery-layout">
        <aside className="auth-gallery-showcase">
          <div className="auth-gallery-intro">
            {content.badge && (
              <p className="auth-credit-badge">
                <Coins size={15} />
                {content.badge}
              </p>
            )}
            <h2 className="auth-gallery-title">{content.headline}</h2>
            <p className="auth-gallery-description">{content.description}</p>
          </div>
          <div className="auth-gallery-art">
            {content.images.map(({ src, srcSet, sizes, alt, label, kind }) => (
              <figure key={kind} className={`auth-art auth-art-${kind}`}>
                <img
                  src={src}
                  srcSet={srcSet}
                  sizes={sizes}
                  alt={alt}
                  width={1280}
                  height={720}
                  decoding="async"
                  loading={kind === 'poster' ? 'eager' : 'lazy'}
                  fetchPriority={kind === 'poster' ? 'high' : 'low'}
                />
                <figcaption>{label}</figcaption>
              </figure>
            ))}
            <div className="auth-art-corner" aria-hidden="true" />
          </div>
          <p className="auth-gallery-disclosure">{content.disclosure}</p>
          <div className="auth-gallery-rewards">
            {content.rewards.map(({ title, description }, index) => (
              <div className="auth-reward" key={title}>
                {index === 0 ? (
                  <CalendarCheck size={20} />
                ) : (
                  <Users size={20} />
                )}
                <div>
                  <p>{title}</p>
                  <span>{description}</span>
                </div>
              </div>
            ))}
          </div>
          <ul className="auth-gallery-benefits">
            {content.benefits.map((label) => (
              <li key={label}>
                <ShieldCheck size={14} />
                {label}
              </li>
            ))}
          </ul>
        </aside>
        <div className="auth-gallery-form-panel">
          <div className="auth-gallery-form">{children}</div>
          <footer className="auth-gallery-legal">
            <Link href="/terms-of-service">{content.terms}</Link>
            <span aria-hidden="true">/</span>
            <Link href="/privacy-policy">{content.privacy}</Link>
          </footer>
        </div>
      </div>
    </main>
  );
}
