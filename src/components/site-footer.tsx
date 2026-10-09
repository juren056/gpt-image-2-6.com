import type { ComponentType, SVGProps } from 'react';

import { Link } from '@/core/i18n/navigation';
import { envConfigs } from '@/config';
import { cn } from '@/lib/utils';
import { FooterLocaleLinks } from '@/components/locale-selector';

export interface FooterColumn {
  title: string;
  /** external: open in a new tab. Off-site (http) hrefs always open in a new tab. */
  links: { label: string; href: string; external?: boolean }[];
}

/** Off-site URLs render as plain <a>; internal paths use the locale-aware Link. */
const isExternalHref = (href: string) => /^https?:\/\//.test(href);

export interface FooterSocial {
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  href: string;
  label: string;
}

function IndieDealsBadge() {
  return (
    <a
      href="https://indie.deals?ref=https%3A%2F%2Fqwenimage3.com"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Find us on Indie.Deals"
      className="indie-deals-badge rounded-[10px] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-400"
    >
      <svg
        width="180"
        height="60"
        viewBox="0 0 180 60"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          <linearGradient
            id="indieDealsBadgeGradient"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#e6f0fc" />
          </linearGradient>
        </defs>

        <rect
          width="180"
          height="60"
          rx="10"
          fill="url(#indieDealsBadgeGradient)"
        />
        <rect
          x="0.75"
          y="0.75"
          width="178.5"
          height="58.5"
          rx="9.25"
          fill="none"
          stroke="#0070f3"
          strokeWidth="1.5"
          strokeOpacity="0.3"
        />
        <image
          href="https://indie.deals/logo_badge.png"
          x="14.4"
          y="12"
          width="36"
          height="36"
          preserveAspectRatio="xMidYMid meet"
        />
        <text
          x="120.6"
          y="22.8"
          textAnchor="middle"
          dominantBaseline="middle"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontSize="10.8"
          fontWeight="normal"
          fill="#4b5563"
          letterSpacing="0.01em"
        >
          Find us on
        </text>
        <text
          x="120.6"
          y="39"
          textAnchor="middle"
          dominantBaseline="middle"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontSize="13.2"
          fontWeight="bold"
          fill="#0070f3"
          letterSpacing="0.01em"
        >
          Indie.Deals
        </text>
      </svg>
    </a>
  );
}

function FeaturedBadges() {
  const badgeLinkClass =
    'inline-flex shrink-0 items-center justify-center rounded-[10px] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-400';

  return (
    <div
      className="flex flex-wrap items-center gap-3"
      aria-label="Featured on independent product directories"
    >
      <IndieDealsBadge />

      <a
        href="https://tooldirs.com"
        target="_blank"
        rel="noopener"
        className={badgeLinkClass}
      >
        <img
          src="https://tooldirs.com/badge/badge_light.svg"
          alt="Featured on ToolDirs"
          width="200"
          height="54"
          className="h-[54px] w-[200px]"
          loading="lazy"
          decoding="async"
        />
      </a>

      <a
        href="https://neeed.directory"
        target="_blank"
        rel="noopener"
        className={badgeLinkClass}
      >
        <img
          src="https://neeed.directory/badges/neeed-badge-dark.svg"
          alt="Featured on neeed.directory"
          width="139"
          height="54"
          className="h-auto max-h-[54px] w-[139px]"
          loading="lazy"
          decoding="async"
        />
      </a>

      <a
        href="https://turbo0.com/item/qwen-image-30-generator"
        target="_blank"
        rel="noopener noreferrer"
        className={badgeLinkClass}
      >
        <img
          src="https://img.turbo0.com/badge-listed-dark.svg"
          alt="Listed on Turbo0"
          width="202"
          height="54"
          className="h-[54px] w-auto"
          loading="lazy"
          decoding="async"
        />
      </a>

      <a
        href="https://aidirs.org/item/qwen-image-3"
        target="_blank"
        rel="noopener noreferrer"
        className={badgeLinkClass}
      >
        <img
          src="https://aidirs.org/badges/badge-listed-dark.svg"
          alt="Listed on AIDirs"
          width="210"
          height="54"
          className="h-[54px] w-auto max-w-[210px] object-contain"
          loading="lazy"
          decoding="async"
        />
      </a>

      <a
        href="https://launchdaily.info/products/qwen-image-30-generator?ref=launchdaily_badge"
        target="_blank"
        rel="noopener"
        className={badgeLinkClass}
      >
        <img
          src="https://launchdaily.info/badge/qwen-image-30-generator"
          alt="Featured on LaunchDaily"
          width="200"
          height="54"
          className="h-[54px] w-[200px]"
          loading="lazy"
          decoding="async"
        />
      </a>

      <a
        href="https://www.listbulb.com/tools/qwenimage3"
        target="_blank"
        rel="noopener"
        className={badgeLinkClass}
      >
        <img
          src="https://www.listbulb.com/featured-on-listbulb-dark.svg"
          alt="Featured on ListBulb"
          width="210"
          height="54"
          className="h-[54px] w-auto max-w-[210px] object-contain"
          loading="lazy"
          decoding="async"
        />
      </a>

      <a
        href="https://launchsoar.com"
        target="_blank"
        rel="noopener noreferrer"
        data-launch-badge="true"
        className="inline-flex shrink-0 items-center gap-2.5 rounded-full border border-[#1f2937] bg-[#0b1220] px-3.5 py-2.5 font-sans leading-none text-white no-underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-400"
      >
        <img
          src="https://launchsoar.com/logo.png"
          alt="Launch"
          className="h-[18px] w-auto invert"
          width="18"
          height="18"
          loading="lazy"
          decoding="async"
        />
        <span className="flex flex-col gap-0.5 leading-[1.1]">
          <span className="text-xs opacity-80">Listed on</span>
          <span className="text-sm font-bold">Launch</span>
        </span>
      </a>
    </div>
  );
}

export function SiteFooter({
  tagline,
  columns,
  socials,
  copyright,
}: {
  tagline?: string;
  columns?: FooterColumn[];
  socials?: FooterSocial[];
  copyright?: string;
}) {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-neutral-950 text-neutral-100">
      <div className="mx-auto max-w-7xl px-6 pt-14 pb-6 sm:px-10 sm:pt-16 lg:px-16">
        {tagline && (
          <p className="mb-12 max-w-2xl font-serif text-3xl leading-[1.15] tracking-tight text-neutral-100 italic sm:text-4xl">
            {tagline}
          </p>
        )}

        {columns && columns.length > 0 && (
          <div
            className={cn(
              'grid gap-x-8 gap-y-10 sm:gap-x-12',
              columns.length <= 3
                ? 'grid-cols-2 sm:grid-cols-3'
                : columns.length === 4
                  ? 'grid-cols-2 sm:grid-cols-4'
                  : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5'
            )}
          >
            {columns.map((col) => (
              <div key={col.title} className="space-y-5">
                <p className="text-[13px] font-semibold tracking-wide text-neutral-100">
                  {col.title}
                </p>
                <ul className="space-y-2">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      {isExternalHref(link.href) ? (
                        <a
                          href={link.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-neutral-400 transition-colors hover:text-neutral-100"
                        >
                          {link.label}
                        </a>
                      ) : (
                        <Link
                          href={link.href}
                          target={link.external ? '_blank' : undefined}
                          className="text-sm text-neutral-400 transition-colors hover:text-neutral-100"
                        >
                          {link.label}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}

        {/* Social links */}
        <div className="mt-8">
          {socials && socials.length > 0 ? (
            <div className="flex items-center gap-5">
              {socials.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  aria-label={s.label}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-neutral-300 transition-colors hover:text-neutral-100"
                >
                  <s.icon className="size-[18px]" />
                </a>
              ))}
            </div>
          ) : (
            <div />
          )}
        </div>

        {/* Bottom bar */}
        <div className="mt-6 border-t border-neutral-800 pt-5">
          <FeaturedBadges />
          <span className="mt-5 block text-sm text-neutral-400 sm:text-right">
            {copyright ||
              `© ${year} ${envConfigs.app_name}. All rights reserved.`}
          </span>
          <FooterLocaleLinks className="mt-8 border-t border-neutral-800 pt-5" />
        </div>
      </div>
    </footer>
  );
}
