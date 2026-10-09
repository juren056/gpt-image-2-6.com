/// <reference types="vite/client" />
import { useEffect, type ReactNode } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import {
  createRootRoute,
  HeadContent,
  Outlet,
  Scripts,
  type ErrorComponentProps,
} from '@tanstack/react-router';
import * as Sentry from '@sentry/tanstackstart-react';
import { ThemeProvider } from 'next-themes';

import { Link } from '@/core/i18n/navigation';
import { isRtlLocale } from '@/config/locale';
import { getQueryClient } from '@/lib/query-client';
import { m } from '@/paraglide/messages.js';
import { getLocale } from '@/paraglide/runtime.js';
import { usePublicConfig } from '@/hooks/use-public-config';
import { GoogleAnalytics } from '@/components/analytics/google-analytics';
import { Plausible } from '@/components/analytics/plausible';
import { CustomerService } from '@/components/customer-service';
import { GoogleOneTap } from '@/components/google-one-tap';
import { ReferralClaimEffect } from '@/components/referral-claim-effect';
import { Toaster } from '@/components/ui/sonner';

import '@fontsource-variable/inter';
import '@fontsource/libre-baskerville/400.css';
import '@fontsource/libre-baskerville/700.css';
import '@fontsource/libre-baskerville/400-italic.css';
import '@/styles/globals.css';

const DEFAULT_GOOGLE_ANALYTICS_ID = 'G-MNN3QKYV5P';

export const Route = createRootRoute({
  head: () => {
    const locale = getLocale();

    return {
      meta: [
        { charSet: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        {
          title: m['common.metadata.title']({}, { locale: locale as any }),
        },
        {
          name: 'description',
          content: m['common.metadata.description'](
            {},
            { locale: locale as any }
          ),
        },
      ],
      links: [
        {
          rel: 'icon',
          href: '/favicon.ico',
          type: 'image/x-icon',
          sizes: '48x48 96x96',
        },
        {
          rel: 'icon',
          href: '/favicon-48x48.png',
          type: 'image/png',
          sizes: '48x48',
        },
        {
          rel: 'icon',
          href: '/favicon-96x96.png',
          type: 'image/png',
          sizes: '96x96',
        },
        { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' },
        {
          rel: 'apple-touch-icon',
          href: '/apple-touch-icon.png',
          sizes: '180x180',
        },
        { rel: 'manifest', href: '/site.webmanifest' },
      ],
    };
  },
  component: RootComponent,
  shellComponent: RootDocument,
  notFoundComponent: NotFound,
  errorComponent: RootError,
});

function RootComponent() {
  return (
    <QueryClientProvider client={getQueryClient()}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <Outlet />
        <Toaster position="top-center" richColors />
        <GoogleOneTap />
        <ReferralClaimEffect />
        <PublicRuntimeIntegrations />
      </ThemeProvider>
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
}

/**
 * Runtime integrations intentionally load from the CDN-cached public config
 * endpoint after hydration. Keeping DB-backed settings out of the root route
 * means crawlers and anonymous page views cannot wake Postgres during SSR.
 */
function PublicRuntimeIntegrations() {
  const { data: configs } = usePublicConfig();
  const gaId =
    configs?.google_analytics_id?.trim() || DEFAULT_GOOGLE_ANALYTICS_ID;
  const plausibleDomain = configs?.plausible_domain?.trim() || '';
  const plausibleSrc = configs?.plausible_src?.trim() || '';
  const crispWebsiteId =
    configs?.crisp_enabled === 'true'
      ? configs.crisp_website_id?.trim() || ''
      : '';
  const tawkPropertyId =
    configs?.tawk_enabled === 'true'
      ? configs.tawk_property_id?.trim() || ''
      : '';
  const tawkWidgetId =
    configs?.tawk_enabled === 'true'
      ? configs.tawk_widget_id?.trim() || ''
      : '';

  return (
    <>
      <GoogleAnalytics measurementId={gaId} />
      {plausibleDomain ? (
        <Plausible domain={plausibleDomain} src={plausibleSrc || undefined} />
      ) : null}
      <CustomerService
        crispWebsiteId={crispWebsiteId || undefined}
        tawkPropertyId={tawkPropertyId || undefined}
        tawkWidgetId={tawkWidgetId || undefined}
      />
    </>
  );
}

function RootDocument({ children }: { children: ReactNode }) {
  const locale = getLocale();

  return (
    <html
      lang={locale}
      dir={isRtlLocale(locale) ? 'rtl' : 'ltr'}
      suppressHydrationWarning
    >
      <head>
        <HeadContent />
      </head>
      <body className="font-sans antialiased">
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function NotFound() {
  return (
    <div className="bg-background text-foreground flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-6xl font-bold">404</h1>
      <p className="text-muted-foreground">{m['common.not_found.message']()}</p>
      <Link href="/" className="text-sm underline underline-offset-4">
        {m['common.not_found.back_home']()}
      </Link>
    </div>
  );
}

function RootError({ error, reset }: ErrorComponentProps) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="bg-background text-foreground flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-4xl font-bold">{m['common.error.title']()}</h1>
      <p className="text-muted-foreground">{m['common.error.message']()}</p>
      {import.meta.env.DEV && error instanceof Error && (
        <pre className="bg-muted mt-2 max-w-lg overflow-auto rounded p-4 text-xs">
          {error.message}
        </pre>
      )}
      <button
        type="button"
        onClick={reset}
        className="text-sm underline underline-offset-4"
      >
        {m['common.error.retry']()}
      </button>
    </div>
  );
}
