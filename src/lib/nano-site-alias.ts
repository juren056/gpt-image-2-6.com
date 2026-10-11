import { redirect, type ParsedLocation } from '@tanstack/react-router';

import { envConfigs } from '@/config';
import { getLocale, localizeUrl } from '@/paraglide/runtime.js';

/** Permanent editorial aliases share content and preserve localized navigation. */
export function nanoSiteAliasRouteOptions(path: string) {
  return {
    beforeLoad: ({ location }: { location: ParsedLocation }) => {
      const target = localizeUrl(new URL(path, envConfigs.app_url), {
        locale: getLocale(),
      });
      const source = new URL(location.href, envConfigs.app_url);
      throw redirect({
        href: `${target.pathname}${source.search}${source.hash}`,
        statusCode: 301,
      });
    },
  };
}
