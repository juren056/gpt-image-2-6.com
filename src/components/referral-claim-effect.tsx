import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { useSession } from '@/core/auth/client';
import { apiPost } from '@/lib/api-client';
import { m } from '@/paraglide/messages.js';

const KEY = 'image-studio:referral-code';

export function ReferralClaimEffect() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const attempted = useRef(false);
  useEffect(() => {
    if (!session?.user || attempted.current) return;
    const code = window.localStorage.getItem(KEY);
    if (!code) return;
    attempted.current = true;
    let cancelled = false;
    let retryTimer: number | undefined;

    const claimReward = (attempt: number) => {
      apiPost<{ rewarded: boolean; pending: boolean; credits: number }>(
        '/api/referrals',
        { code }
      )
        .then((data) => {
          if (cancelled) return;
          window.localStorage.removeItem(KEY);
          queryClient.invalidateQueries({ queryKey: ['referrals'] });
          toast.success(
            data.rewarded
              ? m['growth.rewards.referral_claimed']({ credits: data.credits })
              : m['growth.rewards.referral_pending']({ credits: data.credits })
          );
        })
        .catch((error: Error) => {
          if (cancelled) return;
          const terminal =
            /invalid referral|cannot refer yourself|new accounts only|referral limit reached|could not be verified|before the first purchase|not eligible/i.test(
              error.message
            );
          if (terminal) {
            window.localStorage.removeItem(KEY);
            toast.error(error.message);
            return;
          }
          if (attempt < 2) {
            retryTimer = window.setTimeout(
              () => claimReward(attempt + 1),
              1200 * (attempt + 1)
            );
            return;
          }
          attempted.current = false;
          toast.error(error.message);
        });
    };

    claimReward(0);
    return () => {
      cancelled = true;
      if (retryTimer !== undefined) window.clearTimeout(retryTimer);
    };
  }, [queryClient, session?.user]);
  return null;
}
