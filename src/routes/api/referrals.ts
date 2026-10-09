import { createFileRoute } from '@tanstack/react-router';

import { getAuth } from '@/core/auth';
import {
  getReferralOverview,
  reserveReferralClaim,
} from '@/modules/referrals/service';
import { md5 } from '@/lib/hash';
import { enforceMinIntervalRateLimit } from '@/lib/rate-limit';
import { respData, respErr } from '@/lib/resp';

async function GET({ request }: { request: Request }) {
  try {
    const session = await getAuth().api.getSession({
      headers: request.headers,
    });
    if (!session?.user) return respErr('Unauthorized');
    return respData(await getReferralOverview(session.user.id));
  } catch (error) {
    console.error('[referrals] Failed to load referral overview', {
      error: error instanceof Error ? error.message : String(error),
    });
    return respErr('Unable to load referrals. Please try again shortly.');
  }
}

async function POST({ request }: { request: Request }) {
  const limited = await enforceMinIntervalRateLimit(request, {
    intervalMs: 3000,
    keyPrefix: 'referral-claim',
  });
  if (limited) return limited;
  try {
    const session = await getAuth().api.getSession({
      headers: request.headers,
    });
    if (!session?.user) return respErr('Unauthorized');
    const body = await request.json().catch(() => ({}));
    const code = String(body?.code || '')
      .trim()
      .toUpperCase();
    if (!/^[A-Z0-9_-]{6,24}$/.test(code))
      return respErr('Invalid referral code');
    const sourceIp =
      request.headers.get('cf-connecting-ip') ||
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      '';
    const fingerprint = sourceIp
      ? md5(`${sourceIp}|${request.headers.get('user-agent') || ''}`)
      : '';
    const claim = await reserveReferralClaim({
      code,
      referredUserId: session.user.id,
      sourceHash: fingerprint,
    });
    if (claim.status === 'ineligible') {
      return respErr('Referral is not eligible for rewards');
    }
    return respData({
      rewarded: claim.status === 'rewarded',
      pending: claim.status === 'pending',
      credits: claim.rewardCredits,
    });
  } catch (error) {
    console.error('[referrals] Failed to claim referral reward', {
      error: error instanceof Error ? error.message : String(error),
    });
    return respErr(
      error instanceof Error ? error.message : 'Unable to claim referral'
    );
  }
}

export const Route = createFileRoute('/api/referrals')({
  server: { handlers: { GET, POST } },
});
