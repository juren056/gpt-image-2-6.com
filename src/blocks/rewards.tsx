import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, CalendarCheck, Check, Gift, Users } from 'lucide-react';
import { toast } from 'sonner';

import { useSession } from '@/core/auth/client';
import { Link } from '@/core/i18n/navigation';
import { apiGet, apiPost } from '@/lib/api-client';
import { m } from '@/paraglide/messages.js';
import { Button } from '@/components/ui/button';

type CheckInState = {
  claimedToday: boolean;
  streak: number;
  nextReward: number;
  cycleTotal: number;
};

export function Rewards() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const stateQuery = useQuery({
    queryKey: ['daily-check-in'],
    queryFn: () => apiGet<CheckInState>('/api/check-in'),
    enabled: mounted && Boolean(session?.user),
    staleTime: 30_000,
  });
  const claimMutation = useMutation({
    mutationFn: () =>
      apiPost<CheckInState & { claimed: boolean; reward: number }>(
        '/api/check-in'
      ),
    onSuccess: (data) => {
      queryClient.setQueryData(['daily-check-in'], data);
      queryClient.invalidateQueries({ queryKey: ['user-credits'] });
      if (data.claimed) {
        toast.success(m['growth.rewards.claimed']({ credits: data.reward }));
      }
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const state = stateQuery.data;
  const signedIn = mounted && Boolean(session?.user);

  return (
    <section
      id="rewards"
      className="relative scroll-mt-28 overflow-hidden px-4 py-16 sm:py-28"
    >
      <div className="pointer-events-none absolute inset-x-0 top-1/2 h-72 -translate-y-1/2 bg-[radial-gradient(ellipse_at_center,rgba(79,70,229,.10),transparent_68%)]" />
      <div className="relative mx-auto max-w-6xl">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <p className="text-primary text-xs font-semibold tracking-[.2em] uppercase">
            {m['growth.rewards.eyebrow']()}
          </p>
          <h2 className="mt-3 font-serif text-3xl tracking-tight sm:text-5xl">
            {m['growth.rewards.title']()}
          </h2>
          <p className="text-muted-foreground mt-4 leading-relaxed">
            {m['growth.rewards.description']()}
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <article className="border-border bg-card relative overflow-hidden rounded-[1.75rem] border p-6 shadow-sm sm:p-8">
            <div className="absolute top-0 right-0 size-40 rounded-full bg-amber-300/12 blur-3xl" />
            <span className="flex size-11 items-center justify-center rounded-2xl bg-amber-300 text-amber-950">
              <CalendarCheck className="size-5" />
            </span>
            <h3 className="mt-6 text-2xl font-semibold tracking-tight">
              {m['growth.rewards.checkin_title']()}
            </h3>
            <p className="text-muted-foreground mt-2 max-w-lg text-sm leading-6">
              {m['growth.rewards.checkin_description']({
                credits: state?.cycleTotal ?? 33,
              })}
            </p>
            {signedIn ? (
              <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button
                  onClick={() => claimMutation.mutate()}
                  disabled={
                    Boolean(state?.claimedToday) ||
                    claimMutation.isPending ||
                    stateQuery.isLoading
                  }
                  className="rounded-full"
                >
                  {state?.claimedToday ? (
                    <Check className="size-4" />
                  ) : (
                    <Gift className="size-4" />
                  )}
                  {state?.claimedToday
                    ? m['growth.rewards.claimed_today']()
                    : m['growth.rewards.claim']({
                        credits: state?.nextReward ?? 3,
                      })}
                </Button>
                <span className="text-muted-foreground text-sm">
                  {m['growth.rewards.streak']({ days: state?.streak ?? 0 })}
                </span>
              </div>
            ) : (
              <Link
                href="/sign-up?callbackUrl=%2F%23rewards"
                className="bg-primary text-primary-foreground mt-7 inline-flex h-10 items-center gap-2 rounded-full px-5 text-sm font-semibold"
              >
                {m['growth.rewards.sign_up']()}
                <ArrowRight className="size-4" />
              </Link>
            )}
          </article>

          <article className="relative overflow-hidden rounded-[1.75rem] bg-indigo-950 p-6 text-white shadow-xl shadow-indigo-950/10 sm:p-8">
            <div className="absolute right-0 bottom-0 size-48 rounded-full bg-fuchsia-400/15 blur-3xl" />
            <span className="flex size-11 items-center justify-center rounded-2xl bg-white/10 text-fuchsia-200">
              <Users className="size-5" />
            </span>
            <h3 className="mt-6 text-2xl font-semibold tracking-tight">
              {m['growth.rewards.invite_title']()}
            </h3>
            <p className="mt-2 max-w-lg text-sm leading-6 text-indigo-100/70">
              {m['growth.rewards.invite_purchase_description']()}
            </p>
            <Link
              href={
                signedIn
                  ? '/settings/referrals'
                  : '/sign-up?callbackUrl=%2Fsettings%2Freferrals'
              }
              className="mt-7 inline-flex h-10 items-center gap-2 rounded-full bg-white px-5 text-sm font-semibold text-indigo-950 transition hover:bg-indigo-50"
            >
              {m['growth.rewards.invite_cta']()}
              <ArrowRight className="size-4" />
            </Link>
          </article>
        </div>
      </div>
    </section>
  );
}
