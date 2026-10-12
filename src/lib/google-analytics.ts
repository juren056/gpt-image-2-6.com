export type AnalyticsWindow = {
  dataLayer?: unknown[];
  gtag?: (...args: unknown[]) => void;
  initializedGa4Ids?: Set<string>;
};

export function initializeGoogleAnalytics(
  target: AnalyticsWindow,
  measurementId: string
): boolean {
  const id = measurementId.trim();
  if (!/^G-[A-Z0-9]+$/.test(id)) return false;
  target.dataLayer ??= [];
  target.gtag ??= function (..._args: unknown[]) {
    // gtag's queue requires the native Arguments object used by Google's
    // installation snippet; a rest-parameter array is not equivalent.
    target.dataLayer!.push(arguments);
  };
  target.initializedGa4Ids ??= new Set();
  if (!target.initializedGa4Ids.has(id)) {
    target.initializedGa4Ids.add(id);
    target.gtag('js', new Date());
    // Enhanced measurement owns History API page views. An additional manual
    // page_view would double-count navigation.
    target.gtag('config', id);
  }
  return true;
}
