import { lazy, Suspense, useEffect, useState } from 'react';

import { OPEN_GENERATOR_GUIDE_EVENT } from '@/lib/homepage-events';

const LazyHomepageOnboarding = lazy(() =>
  import('@/components/homepage-onboarding').then((module) => ({
    default: module.HomepageOnboarding,
  }))
);

const LazySupportWidget = lazy(() =>
  import('@/blocks/support-widget').then((module) => ({
    default: module.SupportWidget,
  }))
);

export function HomepageEnhancements() {
  const [guideRequestId, setGuideRequestId] = useState(0);
  const [supportReady, setSupportReady] = useState(false);

  useEffect(() => {
    const openGuide = () => setGuideRequestId((value) => value + 1);
    window.addEventListener(OPEN_GENERATOR_GUIDE_EVENT, openGuide);

    const supportTimer = window.setTimeout(() => setSupportReady(true), 4000);
    return () => {
      window.removeEventListener(OPEN_GENERATOR_GUIDE_EVENT, openGuide);
      window.clearTimeout(supportTimer);
    };
  }, []);

  return (
    <>
      {guideRequestId > 0 ? (
        <Suspense fallback={null}>
          <LazyHomepageOnboarding requestId={guideRequestId} />
        </Suspense>
      ) : null}
      {supportReady ? (
        <Suspense fallback={null}>
          <LazySupportWidget />
        </Suspense>
      ) : null}
    </>
  );
}
