import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { Coins, Image, RefreshCw, Sparkles } from 'lucide-react';

import { useSession } from '@/core/auth/client';
import { apiGet, type PageResult } from '@/lib/api-client';
import { m } from '@/paraglide/messages.js';
import {
  AccountActivityRow,
  AccountBalanceCard,
  AccountCard,
  AccountPagination,
  AccountQueryState,
  type AccountCreditBalance,
} from '@/components/banana-account-cards';

type CreditRow = {
  id: string;
  transactionNo: string;
  transactionType: string;
  transactionScene?: string | null;
  credits: number;
  balanceAfter: number | null;
  description?: string | null;
  createdAt: string;
};
type Tab = 'all' | 'grant' | 'consume';
const PAGE_SIZE = 20;
function CreditsPage() {
  const { data: session } = useSession();
  const userId = session?.user.id;
  const [tab, setTab] = useState<Tab>('all');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);
  useEffect(() => {
    setPage(1);
  }, [tab, debouncedSearch]);
  const balanceQuery = useQuery({
    queryKey: ['user-credits', userId, 'balance'],
    enabled: !!userId,
    queryFn: () => apiGet<AccountCreditBalance>('/api/credits'),
  });
  const query = useQuery({
    queryKey: ['user-credits', userId, page, tab, debouncedSearch],
    enabled: !!userId,
    queryFn: () => {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(PAGE_SIZE),
      });
      if (tab !== 'all') params.set('transactionType', tab);
      if (debouncedSearch) params.set('search', debouncedSearch);
      return apiGet<PageResult<CreditRow>>(`/api/user/credits?${params}`);
    },
    placeholderData: (previousData, previousQuery) =>
      previousQuery?.queryKey[1] === userId ? previousData : undefined,
  });
  const tabs = [
    { value: 'all' as const, label: m['settings.credits.tab_all']() },
    { value: 'grant' as const, label: m['banana.account.earned']() },
    { value: 'consume' as const, label: m['banana.account.spent']() },
  ];
  return (
    <div className="banana-account-pages">
      <h1 className="sr-only">{m['settings.credits.title']()}</h1>
      {balanceQuery.data ? (
        <AccountBalanceCard
          balance={balanceQuery.data}
          title={m['banana.account.current_balance']()}
          purchaseLabel={m['settings.credits.purchase']()}
          labels={{
            purchased: m['banana.account.purchased'](),
            promotional: m['banana.account.free_tier'](),
            subscription: m['banana.account.subscription'](),
          }}
          expiryLabel={m['settings.credits.next_expiry']()}
          noExpiryLabel={m['settings.credits.no_expiry']()}
        />
      ) : (
        <AccountCard>
          <AccountQueryState
            loading={balanceQuery.isPending}
            error={balanceQuery.isError}
            loadingLabel={m['settings.profile.loading']()}
            errorLabel={m['banana.account.load_failed']()}
            retryLabel={m['common.error.retry']()}
            onRetry={() => {
              void balanceQuery.refetch();
            }}
          />
        </AccountCard>
      )}
      <AccountCard>
        <div className="banana-account-card-heading">
          <div>
            <h2>{m['banana.account.recent_activity']()}</h2>
            <p className="banana-account-card-description">
              {m['banana.account.credit_changes']()}
            </p>
          </div>
          <div
            className="banana-account-segments"
            aria-label={m['settings.credits.type']()}
          >
            {tabs.map((item) => (
              <button
                key={item.value}
                type="button"
                aria-pressed={tab === item.value}
                onClick={() => setTab(item.value)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
        <div className="banana-account-list-toolbar">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={m['common.search.placeholder']()}
            aria-label={m['common.search.placeholder']()}
            className="banana-account-search"
          />
          <button
            type="button"
            className="banana-account-secondary"
            disabled={query.isFetching}
            aria-label={m['common.table.refresh']()}
            onClick={() => {
              void query.refetch();
              void balanceQuery.refetch();
            }}
          >
            <RefreshCw size={16} />
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
              query.data.items.map((row) => (
                <AccountActivityRow
                  key={row.id}
                  icon={
                    row.transactionScene === 'ai_generation' ? (
                      <Image size={18} />
                    ) : row.credits > 0 ? (
                      <Sparkles size={18} />
                    ) : (
                      <Coins size={18} />
                    )
                  }
                  title={
                    row.description || row.transactionScene || row.transactionNo
                  }
                  date={new Date(row.createdAt).toLocaleDateString()}
                  change={row.credits}
                  balance={row.balanceAfter}
                  balanceLabel={m['settings.credits.balance']()}
                />
              ))
            ) : (
              <p className="banana-account-empty">
                {m['settings.credits.no_records']()}
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
    </div>
  );
}
export const Route = createFileRoute('/settings/credits')({
  component: CreditsPage,
});
