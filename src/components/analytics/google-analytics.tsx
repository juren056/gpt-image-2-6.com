import { useEffect } from 'react';

import {
  initializeGoogleAnalytics,
  type AnalyticsWindow,
} from '@/lib/google-analytics';

// Public config arrives after hydration: React-inserted inline scripts are
// inert. Initialize in an effect before loading Google's asynchronous script.
export function GoogleAnalytics({ measurementId }: { measurementId: string }) {
  useEffect(() => {
    if (!initializeGoogleAnalytics(window as AnalyticsWindow, measurementId))
      return;
    if (document.getElementById('ga-loader')) return;
    const script = document.createElement('script');
    script.id = 'ga-loader';
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId.trim())}`;
    document.head.appendChild(script);
  }, [measurementId]);
  return null;
}
