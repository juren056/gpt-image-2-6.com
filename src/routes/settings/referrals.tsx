import { useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import {
  AlertCircle,
  Check,
  Copy,
  Gift,
  Loader2,
  RefreshCw,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';

import { apiGet } from '@/lib/api-client';
import { m } from '@/paraglide/messages.js';
import { localizeHref } from '@/paraglide/runtime.js';
import { Button } from '@/components/ui/button';

type Overview = {
  code: string;
  rewardCredits: number;
  successfulReferrals: number;
  pendingReferrals: number;
  earnedCredits: number;
  items: Array<{
    id: string;
    status: string;
    rewardCredits: number;
    createdAt: string;
  }>;
};

export const Route = createFileRoute('/settings/referrals')({
  component: ReferralsPage,
});

function ReferralsPage() {
  const [copied, setCopied] = useState(false);
  const [copying, setCopying] = useState(false);
  const linkInputRef = useRef<HTMLInputElement>(null);
  const query = useQuery({
    queryKey: ['referrals'],
    queryFn: () => apiGet<Overview>('/api/referrals'),
    retry: 2,
  });
  const link = query.data
    ? typeof window === 'undefined'
      ? ''
      : new URL(
          localizeHref(`/r/${query.data.code}`),
          window.location.origin
        ).toString()
    : '';
  async function copyLink() {
    if (!link || copying) return;
    setCopying(true);
    try {
      let copiedSuccessfully = false;
      if (window.isSecureContext && navigator.clipboard?.writeText) {
        try {
          await navigator.clipboard.writeText(link);
          copiedSuccessfully = true;
        } catch {
          // Fall back to copying the selected input value below.
        }
      }
      if (!copiedSuccessfully && linkInputRef.current) {
        linkInputRef.current.focus();
        linkInputRef.current.select();
        linkInputRef.current.setSelectionRange(0, link.length);
        copiedSuccessfully = document.execCommand('copy');
      }
      if (!copiedSuccessfully) throw new Error('Clipboard unavailable');
      setCopied(true);
      toast.success(m['settings.referrals.copied']());
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      toast.error(m['settings.referrals.copy_failed']());
    } finally {
      setCopying(false);
    }
  }
  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 p-4 sm:p-8">
      <div>
        <p className="text-primary text-xs font-semibold tracking-[.18em] uppercase">
          {m['settings.referrals.eyebrow']()}
        </p>
        <h1 className="mt-2 font-serif text-3xl tracking-tight sm:text-4xl">
          {m['settings.referrals.title']()}
        </h1>
        <p className="text-muted-foreground mt-3 max-w-2xl">
          {m['settings.referrals.purchase_description']({
            credits: query.data?.rewardCredits ?? 10,
          })}
        </p>
      </div>
      <section className="border-border bg-card rounded-2xl border p-5 sm:p-7">
        <label htmlFor="referral-link" className="text-sm font-semibold">
          {m['settings.referrals.your_link']()}
        </label>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input
            ref={linkInputRef}
            id="referral-link"
            readOnly
            value={link}
            aria-busy={query.isLoading}
            placeholder={
              query.isLoading ? m['settings.referrals.loading_link']() : ''
            }
            onFocus={(event) => event.currentTarget.select()}
            className="border-input bg-background h-11 min-w-0 flex-1 rounded-xl border px-3 text-sm"
          />
          <Button
            onClick={copyLink}
            disabled={!link || copying || query.isLoading}
            className="h-11 rounded-xl"
          >
            {copying ? (
              <Loader2 className="animate-spin" />
            ) : copied ? (
              <Check />
            ) : (
              <Copy />
            )}
            {copied
              ? m['settings.referrals.copied']()
              : m['settings.referrals.copy']()}
          </Button>
        </div>
        <p className="text-muted-foreground mt-3 text-xs">
          {m['settings.referrals.purchase_rules']()}
        </p>
        {query.isError ? (
          <div
            role="alert"
            className="mt-4 flex flex-col gap-3 rounded-xl border border-red-300/45 bg-red-50 p-3 text-sm text-red-800 sm:flex-row sm:items-center dark:border-red-900 dark:bg-red-950/35 dark:text-red-200"
          >
            <span className="flex min-w-0 flex-1 items-center gap-2">
              <AlertCircle className="size-4 shrink-0" />
              {m['settings.referrals.load_failed']()}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => query.refetch()}
              disabled={query.isFetching}
              className="rounded-full"
            >
              <RefreshCw
                className={query.isFetching ? 'animate-spin' : undefined}
              />
              {m['common.error.retry']()}
            </Button>
          </div>
        ) : null}
      </section>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="border-border bg-card rounded-2xl border p-5">
          <Users className="text-primary size-5" />
          <p className="text-muted-foreground mt-4 text-sm">
            {m['settings.referrals.pending']()}
          </p>
          <p className="mt-1 text-3xl font-semibold">
            {query.data?.pendingReferrals ?? 0}
          </p>
        </div>
        <div className="border-border bg-card rounded-2xl border p-5">
          <Users className="text-primary size-5" />
          <p className="text-muted-foreground mt-4 text-sm">
            {m['settings.referrals.successful']()}
          </p>
          <p className="mt-1 text-3xl font-semibold">
            {query.data?.successfulReferrals ?? 0}
          </p>
        </div>
        <div className="border-border bg-card rounded-2xl border p-5">
          <Gift className="text-primary size-5" />
          <p className="text-muted-foreground mt-4 text-sm">
            {m['settings.referrals.earned']()}
          </p>
          <p className="mt-1 text-3xl font-semibold">
            {query.data?.earnedCredits ?? 0}
          </p>
        </div>
      </div>
      {query.data?.items.length ? (
        <section className="border-border bg-card rounded-2xl border p-5">
          <h2 className="font-semibold">
            {m['settings.referrals.activity']()}
          </h2>
          <div className="mt-4 divide-y">
            {query.data.items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between py-3 text-sm"
              >
                <span className="text-muted-foreground">
                  {new Date(item.createdAt).toLocaleDateString()}
                </span>
                <span className="font-semibold">
                  {item.status === 'rewarded' ? '+' : ''}
                  {item.rewardCredits} ·{' '}
                  {item.status === 'rewarded'
                    ? m['settings.referrals.status_rewarded']()
                    : item.status === 'pending'
                      ? m['settings.referrals.status_pending']()
                      : m['settings.referrals.status_ineligible']()}
                </span>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
