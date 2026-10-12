import { createRouter } from '@tanstack/react-router';

import '@/styles/site-dropdowns.css';

import * as Sentry from '@sentry/tanstackstart-react';

import { deLocalizeUrl, localizeUrl } from '@/paraglide/runtime.js';

import { routeTree } from './routeTree.gen';

let sentryInitialized = false;

function initClientMonitoring() {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (typeof window === 'undefined' || !dsn || sentryInitialized) return;

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    sendDefaultPii: false,
    tracesSampleRate: Number(
      import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE || 0.1
    ),
  });
  sentryInitialized = true;
}

export function getRouter() {
  initClientMonitoring();
  const router = createRouter({
    routeTree,
    defaultPreload: 'intent',
    scrollRestoration: true,
    // Paraglide owns locale prefixes: incoming URLs are de-localized before
    // matching (routes are locale-free), outgoing hrefs get re-localized.
    rewrite: {
      input: ({ url }) => deLocalizeUrl(url),
      output: ({ url }) => localizeUrl(url),
    },
  });
  return router;
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
