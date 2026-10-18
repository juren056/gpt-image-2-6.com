import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import {
  CreditCard,
  ExternalLink,
  Eye,
  MoreHorizontal,
  Receipt,
  RotateCcw,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';

import { useSession } from '@/core/auth/client';
import { tDynamic } from '@/core/i18n/lookups/settings-billing';
import { Link } from '@/core/i18n/navigation';
import {
  buildGa4PurchaseEvent,
  trackFunnelEvent,
} from '@/lib/analytics-events';
import { ApiError, apiGet, apiPost, type PageResult } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import { m } from '@/paraglide/messages.js';
import {
  AccountCard,
  AccountPagination,
  AccountQueryState,
} from '@/components/banana-account-cards';
import { DataTable, type Column } from '@/components/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type Subscription = {
  id: string;
  subscriptionNo: string;
  status: string;
  paymentProvider: string;
  renewalMode?: 'auto' | 'prepaid';
  paymentUserId?: string | null;
  planName?: string | null;
  productName?: string | null;
  interval?: string | null;
  intervalCount?: number | null;
  creditsAmount?: number | null;
  amount?: number | null;
  currency?: string | null;
  currentPeriodStart?: string | null;
  currentPeriodEnd?: string | null;
  canceledAt?: string | null;
  canceledEndAt?: string | null;
  canceledReason?: string | null;
  createdAt?: string | null;
};

const TABS = [
  'all',
  'active',
  'trialing',
  'paused',
  'expired',
  'pending_cancel',
  'canceled',
] as const;
type Tab = (typeof TABS)[number];

const PAGE_SIZE = 20;

function formatAmount(amount: number, currency: string) {
  const normalized = (currency || 'usd').toUpperCase();
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: normalized,
  }).format(amount / 100);
}

function statusVariant(
  status?: string | null
): 'default' | 'secondary' | 'destructive' | 'outline' {
  const s = (status || '').toLowerCase();
  if (s === 'active' || s === 'trialing') return 'default';
  if (s === 'canceled' || s === 'expired') return 'destructive';
  return 'secondary';
}

function isCancellable(
  status?: string | null,
  renewalMode?: 'auto' | 'prepaid'
) {
  if (renewalMode === 'prepaid') return false;
  const s = (status || '').toLowerCase();
  return s === 'active' || s === 'trialing';
}

function BillingPage() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const userId = session?.user.id;
  const [tab, setTab] = useState<Tab>('all');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [viewing, setViewing] = useState<Subscription | null>(null);
  const [canceling, setCanceling] = useState<Subscription | null>(null);

  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get('purchase') !== 'success') return;
    void apiGet<
      PageResult<{
        id: string;
        orderNo: string;
        status: string;
        amount: number;
        currency: string;
      }>
    >('/api/user/orders?page=1&pageSize=1&status=paid')
      .then((result) => {
        const paidOrder = result.items[0];
        if (paidOrder?.status === 'paid') {
          const receiptKey = `image-studio:purchase-receipt:${paidOrder.id}`;
          if (!window.localStorage.getItem(receiptKey)) {
            trackFunnelEvent('purchase_success');
            window.localStorage.setItem(receiptKey, 'recorded');
          }
          const stagedPurchase = buildGa4PurchaseEvent({
            transactionId: paidOrder.orderNo,
            amountMinor: paidOrder.amount,
            currency: paidOrder.currency,
          });
          if (stagedPurchase) {
            window.sessionStorage.setItem(
              'image-studio:pending-ga4-purchase',
              JSON.stringify(stagedPurchase)
            );
          }
        }
      })
      .catch(() => {
        /* Payment status remains available through the order-history retry. */
      });
    url.searchParams.delete('purchase');
    window.history.replaceState(
      null,
      '',
      `${url.pathname}${url.search}${url.hash}`
    );
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [tab, debouncedSearch]);

  const currentQuery = useQuery({
    queryKey: ['billing', userId, 'current'],
    enabled: !!userId,
    queryFn: () =>
      apiGet<Subscription | null>('/api/user/subscriptions/current'),
  });
  const current = currentQuery.data ?? null;

  const listQuery = useQuery({
    queryKey: ['billing', userId, 'list', page, tab, debouncedSearch],
    enabled: !!userId,
    queryFn: () => {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(PAGE_SIZE),
      });
      if (tab !== 'all') params.set('status', tab);
      if (debouncedSearch) params.set('search', debouncedSearch);
      return apiGet<PageResult<Subscription>>(
        `/api/user/subscriptions?${params}`
      );
    },
    placeholderData: (previousData, previousQuery) =>
      previousQuery?.queryKey[1] === userId ? previousData : undefined,
  });
  const rows = listQuery.data?.items ?? [];
  const total = listQuery.data?.total ?? 0;

  const cancelMutation = useMutation({
    mutationFn: (subscriptionNo: string) =>
      apiPost('/api/user/subscriptions/cancel', { subscriptionNo }),
    onSuccess: () => {
      toast.success(m['settings.billing.cancel_success']());
      setCanceling(null);
      queryClient.invalidateQueries({ queryKey: ['billing'] });
      queryClient.invalidateQueries({
        queryKey: ['user-subscription-current'],
      });
    },
    onError: (err) => {
      toast.error(
        err instanceof ApiError
          ? err.message || m['settings.billing.cancel_failed']()
          : m['settings.billing.cancel_failed']()
      );
    },
  });
  const resumeMutation = useMutation({
    mutationFn: (subscriptionNo: string) =>
      apiPost('/api/user/subscriptions/resume', { subscriptionNo }),
    onSuccess: () => {
      toast.success(m['settings.billing.resume_success']());
      queryClient.invalidateQueries({ queryKey: ['billing'] });
      queryClient.invalidateQueries({
        queryKey: ['user-subscription-current'],
      });
    },
    onError: (err) => {
      toast.error(
        err instanceof Error
          ? err.message
          : m['settings.billing.resume_failed']()
      );
    },
  });
  const portalMutation = useMutation({
    mutationFn: (subscriptionNo: string) =>
      apiPost<{ billingUrl?: string }>('/api/user/subscriptions/portal', {
        subscriptionNo,
      }),
    onSuccess: (data) => {
      if (data.billingUrl) window.location.href = data.billingUrl;
    },
    onError: (err) => {
      toast.error(
        err instanceof Error
          ? err.message
          : m['settings.billing.portal_failed']()
      );
    },
  });
  const submitting = cancelMutation.isPending;

  function confirmCancel() {
    if (!canceling) return;
    cancelMutation.mutate(canceling.subscriptionNo);
  }

  const columns: Column<Subscription>[] = [
    {
      header: m['settings.billing.subscription_no'](),
      cell: (r) => (
        <span className="font-mono text-xs">{r.subscriptionNo}</span>
      ),
    },
    {
      header: m['settings.billing.plan'](),
      cell: (r) => (
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium">
            {r.planName || r.productName || '—'}
          </span>
          <Badge variant="outline">
            {r.renewalMode === 'prepaid'
              ? m['settings.billing.prepaid']()
              : m['settings.billing.auto_renew']()}
          </Badge>
        </div>
      ),
    },
    {
      header: m['settings.billing.interval'](),
      cell: (r) =>
        r.interval ? (
          <span className="text-sm">
            {r.intervalCount ? `${r.intervalCount} ` : ''}
            {r.interval}
          </span>
        ) : (
          '—'
        ),
    },
    {
      header: m['settings.billing.status'](),
      cell: (r) => <Badge variant={statusVariant(r.status)}>{r.status}</Badge>,
    },
    {
      header: m['settings.billing.amount'](),
      cell: (r) =>
        r.amount && r.currency ? (
          <span className="tabular-nums">
            {formatAmount(r.amount, r.currency)}
          </span>
        ) : (
          '—'
        ),
    },
    {
      header: m['settings.billing.current_period'](),
      cell: (r) => (
        <span className="text-muted-foreground text-xs whitespace-pre-line">
          {r.currentPeriodStart && r.currentPeriodEnd
            ? `${new Date(r.currentPeriodStart).toLocaleDateString()}\n~ ${new Date(r.currentPeriodEnd).toLocaleDateString()}`
            : '—'}
        </span>
      ),
    },
    {
      header: m['settings.billing.end_time'](),
      cell: (r) => (
        <span className="text-muted-foreground text-sm">
          {r.canceledEndAt
            ? new Date(r.canceledEndAt).toLocaleDateString()
            : '—'}
        </span>
      ),
    },
    {
      header: m['settings.billing.date'](),
      cell: (r) => (
        <span className="text-muted-foreground text-sm">
          {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '—'}
        </span>
      ),
    },
    {
      header: m['settings.billing.actions_col'](),
      className: 'w-[80px]',
      cell: (r) => (
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="ghost" size="icon" className="size-7">
                <MoreHorizontal className="size-4" />
              </Button>
            }
          />
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setViewing(r)}>
              <Eye className="size-4" />
              {m['settings.billing.view']()}
            </DropdownMenuItem>
            {r.renewalMode !== 'prepaid' &&
              r.paymentProvider === 'stripe' &&
              r.paymentUserId && (
                <DropdownMenuItem
                  onClick={() => portalMutation.mutate(r.subscriptionNo)}
                  disabled={portalMutation.isPending}
                >
                  <CreditCard className="size-4" />
                  {m['settings.billing.manage_payment']()}
                </DropdownMenuItem>
              )}
            <DropdownMenuItem
              onClick={() =>
                isCancellable(r.status, r.renewalMode) && setCanceling(r)
              }
              disabled={!isCancellable(r.status, r.renewalMode)}
            >
              <XCircle className="size-4" />
              {m['settings.billing.cancel']()}
            </DropdownMenuItem>
            {r.renewalMode !== 'prepaid' && r.status === 'pending_cancel' && (
              <DropdownMenuItem
                onClick={() => resumeMutation.mutate(r.subscriptionNo)}
                disabled={resumeMutation.isPending}
              >
                <RotateCcw className="size-4" />
                {m['settings.billing.resume']()}
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="banana-account-pages">
      <h1 className="sr-only">{m['settings.billing.title']()}</h1>
      <AccountCard>
        <div className="banana-account-card-heading">
          <h2>{m['settings.billing.subscription']()}</h2>
          <Link href="/pricing" className="banana-account-primary">
            {current
              ? m['settings.billing.adjust']()
              : m['settings.billing.subscribe']()}
          </Link>
        </div>
        <AccountQueryState
          loading={currentQuery.isPending}
          error={currentQuery.isError}
          loadingLabel={m['settings.profile.loading']()}
          errorLabel={m['banana.account.load_failed']()}
          retryLabel={m['common.error.retry']()}
          onRetry={() => {
            void currentQuery.refetch();
          }}
        />
        {!currentQuery.isError &&
          currentQuery.isSuccess &&
          (current ? (
            <>
              <p className="banana-account-subscription-name">
                {current.planName || current.productName || '—'}
              </p>
              <div className="banana-account-subscription-details">
                <Badge variant={statusVariant(current.status)}>
                  {current.status}
                </Badge>
                <Badge variant="outline">
                  {current.renewalMode === 'prepaid'
                    ? m['settings.billing.prepaid']()
                    : m['settings.billing.auto_renew']()}
                </Badge>
                {current.amount != null && current.currency && (
                  <span>
                    {formatAmount(current.amount, current.currency)}
                    {current.interval ? ` / ${current.interval}` : ''}
                  </span>
                )}
              </div>
              {current.canceledEndAt ? (
                <p className="banana-account-card-description">
                  {m['settings.billing.ends_on']({
                    date: new Date(current.canceledEndAt).toLocaleDateString(),
                  })}
                </p>
              ) : current.currentPeriodEnd ? (
                <p className="banana-account-card-description">
                  {(current.renewalMode === 'prepaid'
                    ? m['settings.billing.valid_until']
                    : m['settings.billing.renews_on'])({
                    date: new Date(
                      current.currentPeriodEnd
                    ).toLocaleDateString(),
                  })}
                </p>
              ) : null}
              {current.creditsAmount != null && (
                <p className="banana-account-card-description">
                  {m['settings.payments.credits']()}:{' '}
                  {current.creditsAmount.toLocaleString()}
                </p>
              )}
              <div className="banana-account-subscription-actions">
                <button
                  type="button"
                  className="banana-account-secondary"
                  onClick={() => setViewing(current)}
                >
                  {m['settings.billing.view']()}
                </button>
                {current.renewalMode !== 'prepaid' &&
                  current.paymentProvider === 'stripe' &&
                  current.paymentUserId && (
                    <button
                      type="button"
                      className="banana-account-secondary"
                      disabled={portalMutation.isPending}
                      onClick={() =>
                        portalMutation.mutate(current.subscriptionNo)
                      }
                    >
                      {m['settings.billing.manage_payment']()}
                    </button>
                  )}
                {isCancellable(current.status, current.renewalMode) && (
                  <button
                    type="button"
                    className="banana-account-secondary"
                    onClick={() => setCanceling(current)}
                  >
                    {m['settings.billing.cancel']()}
                  </button>
                )}
                {current.renewalMode !== 'prepaid' &&
                  current.status === 'pending_cancel' && (
                    <button
                      type="button"
                      className="banana-account-secondary"
                      disabled={resumeMutation.isPending}
                      onClick={() =>
                        resumeMutation.mutate(current.subscriptionNo)
                      }
                    >
                      {m['settings.billing.resume']()}
                    </button>
                  )}
              </div>
            </>
          ) : (
            <>
              <p className="banana-account-subscription-name">
                {m['banana.account.free_plan']()}
              </p>
              <p className="banana-account-card-description">
                {m['banana.account.no_active_subscription']()}
              </p>
            </>
          ))}
      </AccountCard>
      <OrderHistory userId={userId} />
      <AccountCard>
        <details>
          <summary className="cursor-pointer text-sm font-semibold">
            {m['banana.account.subscription_history']()}
          </summary>
          <div className="mt-5 space-y-4">
            <div className="border-border flex gap-1 overflow-x-auto overflow-y-hidden border-b">
              {TABS.map((tb) => (
                <button
                  key={tb}
                  onClick={() => setTab(tb)}
                  className={cn(
                    '-mb-px border-b-2 px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors',
                    tab === tb
                      ? 'border-primary text-foreground'
                      : 'text-muted-foreground hover:text-foreground border-transparent'
                  )}
                >
                  {tDynamic(`settings.billing.tab_${tb}`)}
                </button>
              ))}
            </div>

            <div>
              <AccountQueryState
                loading={listQuery.isPending}
                error={listQuery.isError}
                loadingLabel={m['settings.profile.loading']()}
                errorLabel={m['banana.account.load_failed']()}
                retryLabel={m['common.error.retry']()}
                onRetry={() => {
                  void listQuery.refetch();
                }}
              />
              {!listQuery.isError && listQuery.data && (
                <DataTable
                  columns={columns}
                  data={rows}
                  total={total}
                  page={page}
                  pageSize={PAGE_SIZE}
                  onPageChange={setPage}
                  rowKey={(r) => r.id}
                  emptyText={m['settings.billing.no_subscription']()}
                  search={search}
                  onSearchChange={setSearch}
                  onRefresh={async () => {
                    currentQuery.refetch();
                    await listQuery.refetch();
                  }}
                  loading={listQuery.isFetching}
                />
              )}
            </div>
          </div>
        </details>
      </AccountCard>

      <Dialog open={!!viewing} onOpenChange={(v) => !v && setViewing(null)}>
        <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {m['settings.billing.subscription_details']()}
            </DialogTitle>
            <DialogDescription className="font-mono text-xs">
              {viewing?.subscriptionNo}
            </DialogDescription>
          </DialogHeader>
          {viewing && (
            <div className="space-y-3 py-2 text-sm">
              <DetailRow label={m['settings.billing.plan']()}>
                {viewing.planName || viewing.productName || '—'}
              </DetailRow>
              <DetailRow label={m['settings.billing.status']()}>
                <Badge variant={statusVariant(viewing.status)}>
                  {viewing.status}
                </Badge>
              </DetailRow>
              <DetailRow label={m['settings.billing.amount']()}>
                {viewing.amount && viewing.currency
                  ? `${formatAmount(viewing.amount, viewing.currency)}${
                      viewing.interval ? ` / ${viewing.interval}` : ''
                    }`
                  : '—'}
              </DetailRow>
              <DetailRow label={m['settings.billing.provider']()}>
                {viewing.paymentProvider}
              </DetailRow>
              <DetailRow label={m['settings.billing.renewal_mode']()}>
                {viewing.renewalMode === 'prepaid'
                  ? m['settings.billing.prepaid']()
                  : m['settings.billing.auto_renew']()}
              </DetailRow>
              <DetailRow label={m['settings.billing.period_start']()}>
                {viewing.currentPeriodStart
                  ? new Date(viewing.currentPeriodStart).toLocaleString()
                  : '—'}
              </DetailRow>
              <DetailRow label={m['settings.billing.period_end']()}>
                {viewing.currentPeriodEnd
                  ? new Date(viewing.currentPeriodEnd).toLocaleString()
                  : '—'}
              </DetailRow>
              {viewing.canceledAt && (
                <DetailRow label={m['settings.billing.canceled_at']()}>
                  {new Date(viewing.canceledAt).toLocaleString()}
                </DetailRow>
              )}
              {viewing.canceledEndAt && (
                <DetailRow label={m['settings.billing.canceled_end_at']()}>
                  {new Date(viewing.canceledEndAt).toLocaleString()}
                </DetailRow>
              )}
              {viewing.canceledReason && (
                <DetailRow label={m['settings.billing.canceled_reason']()}>
                  {viewing.canceledReason}
                </DetailRow>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewing(null)}>
              {m['settings.billing.close']()}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!canceling} onOpenChange={(v) => !v && setCanceling(null)}>
        <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{m['settings.billing.cancel_title']()}</DialogTitle>
            <DialogDescription>
              {m['settings.billing.cancel_description']({
                plan: canceling?.planName || canceling?.productName || '—',
              })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCanceling(null)}
              disabled={submitting}
            >
              {m['settings.billing.cancel_back']()}
            </Button>
            <Button
              variant="destructive"
              onClick={confirmCancel}
              disabled={submitting}
            >
              {submitting
                ? m['settings.billing.canceling']()
                : m['settings.billing.cancel_confirm']()}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

type BillingOrder = {
  id: string;
  orderNo: string;
  status: string;
  amount: number;
  currency: string;
  productName?: string | null;
  planName?: string | null;
  creditsAmount?: number | null;
  invoiceUrl?: string | null;
  paidAt?: string | null;
  createdAt: string;
};
function OrderHistory({ userId }: { userId?: string }) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);
  const query = useQuery({
    queryKey: ['billing-orders', userId, page, debouncedSearch],
    enabled: !!userId,
    queryFn: () => {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(PAGE_SIZE),
      });
      if (debouncedSearch) params.set('search', debouncedSearch);
      return apiGet<PageResult<BillingOrder>>(`/api/user/orders?${params}`);
    },
    placeholderData: (previousData, previousQuery) =>
      previousQuery?.queryKey[1] === userId ? previousData : undefined,
  });
  return (
    <AccountCard>
      <div className="banana-account-card-heading">
        <h2>{m['banana.account.order_history']()}</h2>
        <Link href="/settings/payments" className="banana-account-secondary">
          {m['settings.payments.title']()}
        </Link>
      </div>
      <div className="banana-account-list-toolbar">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="banana-account-search"
          placeholder={m['common.search.placeholder']()}
          aria-label={m['common.search.placeholder']()}
        />
        <button
          type="button"
          className="banana-account-secondary"
          disabled={query.isFetching}
          onClick={() => {
            void query.refetch();
          }}
        >
          {m['common.table.refresh']()}
        </button>
      </div>
      <AccountQueryState
        loading={query.isPending}
        error={query.isError}
        loadingLabel={m['settings.profile.loading']()}
        errorLabel={m['banana.account.load_failed']()}
        retryLabel={m['common.error.retry']()}
        onRetry={() => {
          void query.refetch();
        }}
      />
      {!query.isError && query.data && (
        <div aria-busy={query.isFetching}>
          {query.data.items.length ? (
            query.data.items.map((order) => (
              <div className="banana-account-order-row" key={order.id}>
                <span className="banana-account-activity-icon">
                  <Receipt size={18} />
                </span>
                <div className="banana-account-activity-description">
                  <strong>
                    {order.planName || order.productName || order.orderNo}
                  </strong>
                  <span>
                    {new Date(
                      order.paidAt || order.createdAt
                    ).toLocaleDateString()}{' '}
                    · {order.orderNo}
                  </span>
                </div>
                <Badge variant={statusVariant(order.status)}>
                  {order.status}
                </Badge>
                <span className="banana-account-order-price">
                  {formatAmount(order.amount, order.currency)}
                </span>
                {order.invoiceUrl && /^https?:\/\//i.test(order.invoiceUrl) && (
                  <a
                    href={order.invoiceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="banana-account-order-invoice"
                  >
                    <ExternalLink size={14} />
                    {m['settings.payments.invoice']()}
                  </a>
                )}
              </div>
            ))
          ) : (
            <p className="banana-account-empty">
              {m['settings.payments.no_payments']()}
            </p>
          )}
          <AccountPagination
            page={page}
            total={query.data.total}
            pageSize={PAGE_SIZE}
            previousLabel={m['common.table.previous']()}
            nextLabel={m['common.table.next']()}
            onPageChange={setPage}
            busy={query.isFetching}
          />
        </div>
      )}
    </AccountCard>
  );
}

function DetailRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-muted-foreground w-32 shrink-0">{label}</span>
      <span className="flex-1">{children}</span>
    </div>
  );
}

export const Route = createFileRoute('/settings/billing')({
  component: BillingPage,
});
