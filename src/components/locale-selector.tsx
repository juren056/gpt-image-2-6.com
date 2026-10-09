import { Check, ChevronDown, Globe } from 'lucide-react';

import { isRtlLocale, localeNames } from '@/config/locale';
import { cn } from '@/lib/utils';
import { m } from '@/paraglide/messages.js';
import { getLocale, locales, setLocale } from '@/paraglide/runtime.js';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const footerLocaleMeta: Record<string, { code: string; name: string }> = {
  en: { code: 'US', name: 'English' },
  ko: { code: 'KR', name: '한국어' },
  ja: { code: 'JP', name: '日本語' },
  es: { code: 'ES', name: 'Español' },
  de: { code: 'DE', name: 'Deutsch' },
  fr: { code: 'FR', name: 'Français' },
  ru: { code: 'RU', name: 'Русский' },
  ar: { code: 'SA', name: 'العربية' },
  pt: { code: 'PT', name: 'Português' },
  it: { code: 'IT', name: 'Italiano' },
  zh: { code: 'CN', name: '中文' },
  'zh-TW': { code: 'TW', name: '繁體中文' },
  tr: { code: 'TR', name: 'Türkçe' },
  vi: { code: 'VN', name: 'Tiếng Việt' },
  nl: { code: 'NL', name: 'Nederlands' },
  th: { code: 'TH', name: 'ไทย' },
  pl: { code: 'PL', name: 'Polski' },
  hu: { code: 'HU', name: 'Magyar' },
};

export function LocaleSelector({
  variant = 'icon',
  className,
}: {
  variant?: 'icon' | 'pill';
  className?: string;
}) {
  const locale = getLocale();
  const compactLocaleNames: Record<string, string> = {
    en: 'EN',
    zh: '简中',
    'zh-TW': '繁中',
    ru: 'RU',
  };
  const compactLocale =
    compactLocaleNames[locale] || locale.split('-')[0]?.toUpperCase() || locale;
  const accessibleLabel = `${m['common.nav.switch_language']()}: ${localeNames[locale] || locale}`;

  function handleSwitch(newLocale: string) {
    // Writes the locale cookie and reloads on the localized URL.
    setLocale(newLocale as typeof locale);
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={accessibleLabel}
        title={accessibleLabel}
        className={cn(
          'inline-flex items-center transition-colors outline-none',
          variant === 'icon'
            ? 'border-border/70 bg-background/70 text-foreground hover:bg-accent min-h-10 min-w-14 justify-center gap-1.5 rounded-full border px-2.5 shadow-sm'
            : 'min-h-10 gap-2 rounded-full border px-4 text-sm',
          className
        )}
      >
        {variant === 'icon' ? (
          <>
            <Globe className="text-muted-foreground size-4 shrink-0" />
            <span lang={locale} className="text-xs font-bold tracking-wide">
              {compactLocale}
            </span>
            <ChevronDown className="text-muted-foreground size-3 shrink-0" />
          </>
        ) : (
          <>
            <Globe className="size-4" />
            <span>{localeNames[locale] || locale}</span>
            <ChevronDown className="size-4 opacity-70" />
          </>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="max-h-96 min-w-40 overflow-y-auto"
      >
        {locales.map((loc) => (
          <DropdownMenuItem
            key={loc}
            onClick={() => handleSwitch(loc)}
            className="flex min-h-10 items-center justify-between gap-2"
          >
            <span
              lang={loc}
              dir={isRtlLocale(loc) ? 'rtl' : 'ltr'}
              className="min-w-0 flex-1 font-medium"
            >
              {localeNames[loc] || loc}
            </span>
            {loc === locale && <Check className="size-3.5" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function FooterLocaleLinks({ className }: { className?: string }) {
  const locale = getLocale();

  return (
    <nav
      aria-label={m['common.nav.switch_language']()}
      className={cn('flex flex-wrap items-center gap-x-2 gap-y-2', className)}
    >
      {locales.map((loc) => {
        const meta = footerLocaleMeta[loc] ?? {
          code: loc.slice(0, 2).toUpperCase(),
          name: localeNames[loc] || loc,
        };
        const active = loc === locale;

        return (
          <button
            key={loc}
            type="button"
            lang={loc}
            dir={isRtlLocale(loc) ? 'rtl' : 'ltr'}
            aria-current={active ? 'page' : undefined}
            aria-label={`${m['common.nav.switch_language']()}: ${meta.name}`}
            onClick={() => setLocale(loc as typeof locale)}
            className={cn(
              'inline-flex min-h-10 items-center gap-1.5 rounded-lg px-2.5 text-xs transition-colors outline-none focus-visible:ring-2 focus-visible:ring-blue-400',
              active
                ? 'bg-neutral-900 font-semibold text-white shadow-sm ring-1 ring-neutral-700'
                : 'text-neutral-400 hover:bg-white/5 hover:text-neutral-100'
            )}
          >
            <span
              className={cn(
                'text-[9px] font-bold tracking-wide uppercase',
                active ? 'text-neutral-300' : 'text-neutral-500'
              )}
            >
              {meta.code}
            </span>
            <span>{meta.name}</span>
          </button>
        );
      })}
    </nav>
  );
}
