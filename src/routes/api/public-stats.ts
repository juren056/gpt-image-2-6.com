import { createFileRoute } from '@tanstack/react-router';

import { getAuth } from '@/core/auth';
import { canViewCommunityMetrics } from '@/modules/community-access/service';
import { getPublicStats } from '@/modules/public-stats/service';
import { respData, respErr } from '@/lib/resp';

function hasSessionCookie(request: Request): boolean {
  const cookie = request.headers.get('cookie') || '';
  return /(?:^|;\s*)(?:__Secure-)?better-auth\.session_token=/.test(cookie);
}

function anonymousStatsResponse() {
  const response = respData({
    canViewMetrics: false,
    onlineCreators: null,
    generationsToday: null,
    totalCreators: null,
    leaderboard: [],
    measuredAt: new Date().toISOString(),
  });
  response.headers.set(
    'Cache-Control',
    'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400'
  );
  return response;
}

async function GET({ request }: { request: Request }) {
  try {
    // The default Better Auth cookie names are stable in the installed
    // package. Most public requests have no session cookie, so return before
    // constructing auth or touching Postgres.
    if (!hasSessionCookie(request)) return anonymousStatsResponse();

    const auth = getAuth();
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) return anonymousStatsResponse();

    const canViewMetrics = await canViewCommunityMetrics(session.user.id);
    if (!canViewMetrics) {
      const response = respData({
        canViewMetrics: false,
        onlineCreators: null,
        generationsToday: null,
        totalCreators: null,
        leaderboard: [],
        measuredAt: new Date().toISOString(),
      });
      response.headers.set('Cache-Control', 'private, max-age=300');
      return response;
    }

    const stats = await getPublicStats();
    const response = respData({
      ...stats,
      canViewMetrics: true,
    });
    response.headers.set('Cache-Control', 'private, no-store');
    return response;
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Failed to load public stats';
    return respErr(message);
  }
}

export const Route = createFileRoute('/api/public-stats')({
  server: { handlers: { GET } },
});
