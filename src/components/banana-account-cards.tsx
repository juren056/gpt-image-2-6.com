import type { ReactNode } from 'react';
import { ArrowLeft, ArrowRight, RefreshCw } from 'lucide-react';

import { Link } from '@/core/i18n/navigation';

export type AccountCreditBalance = {
  balance: number;
  subscriptionCredits: number;
  purchasedCredits: number;
  promotionalCredits: number;
  nextExpiresAt?: string | null;
};

export function AccountCard({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`banana-account-card ${className}`}>{children}</section>
  );
}

export function AccountQueryState({
  loading,
  error,
  loadingLabel,
  errorLabel,
  retryLabel,
  onRetry,
}: {
  loading: boolean;
  error: boolean;
  loadingLabel: string;
  errorLabel: string;
  retryLabel: string;
  onRetry: () => void;
}) {
  if (error)
    return (
      <div className="banana-account-query" role="alert">
        <span>{errorLabel}</span>
        <button
          type="button"
          onClick={onRetry}
          className="banana-account-secondary"
        >
          <RefreshCw size={16} />
          {retryLabel}
        </button>
      </div>
    );
  if (loading)
    return (
      <p className="banana-account-query" role="status">
        {loadingLabel}
      </p>
    );
  return null;
}

export function AccountBalanceCard({
  balance,
  title,
  purchaseLabel,
  labels,
  expiryLabel,
  noExpiryLabel,
}: {
  balance: AccountCreditBalance;
  title: string;
  purchaseLabel: string;
  labels: { purchased: string; promotional: string; subscription: string };
  expiryLabel: string;
  noExpiryLabel: string;
}) {
  const total =
    balance.purchasedCredits +
    balance.promotionalCredits +
    balance.subscriptionCredits;
  const buckets = [
    {
      label: labels.purchased,
      value: balance.purchasedCredits,
      kind: 'purchased',
    },
    {
      label: labels.promotional,
      value: balance.promotionalCredits,
      kind: 'promotional',
    },
    {
      label: labels.subscription,
      value: balance.subscriptionCredits,
      kind: 'subscription',
    },
  ];
  return (
    <AccountCard className="banana-account-balance">
      <div className="banana-account-card-heading">
        <h2>{title}</h2>
        <Link href="/pricing" className="banana-account-primary">
          {purchaseLabel}
        </Link>
      </div>
      <p className="banana-account-balance-number">
        {balance.balance.toLocaleString()}
      </p>
      <div className="banana-account-balance-bar" aria-hidden="true">
        {buckets.map((bucket) => (
          <span
            key={bucket.kind}
            data-kind={bucket.kind}
            style={{
              width: `${total > 0 ? (bucket.value / total) * 100 : 0}%`,
            }}
          />
        ))}
      </div>
      <div className="banana-account-balance-legend">
        {buckets.map((bucket) => (
          <span key={bucket.kind}>
            <i data-kind={bucket.kind} />
            {bucket.label}
            <strong>{bucket.value.toLocaleString()}</strong>
          </span>
        ))}
      </div>
      <p className="banana-account-expiry">
        {balance.nextExpiresAt
          ? `${expiryLabel} ${new Date(balance.nextExpiresAt).toLocaleDateString()}`
          : noExpiryLabel}
      </p>
    </AccountCard>
  );
}

export function AccountActivityRow({
  icon,
  title,
  date,
  change,
  balance,
  balanceLabel,
}: {
  icon: ReactNode;
  title: string;
  date: string;
  change: number;
  balance?: number | null;
  balanceLabel?: string;
}) {
  return (
    <div className="banana-account-activity-row">
      <span className="banana-account-activity-icon">{icon}</span>
      <div className="banana-account-activity-description">
        <strong>{title}</strong>
        <span>{date}</span>
      </div>
      <strong
        className={`banana-account-delta ${change > 0 ? 'is-positive' : ''}`}
      >
        {change > 0 ? '+' : ''}
        {change.toLocaleString()}
      </strong>
      {balanceLabel && (
        <span className="banana-account-activity-balance">
          {balanceLabel} {balance == null ? '—' : balance.toLocaleString()}
        </span>
      )}
    </div>
  );
}

export function AccountPagination({
  page,
  total,
  pageSize,
  previousLabel,
  nextLabel,
  onPageChange,
  busy,
}: {
  page: number;
  total: number;
  pageSize: number;
  previousLabel: string;
  nextLabel: string;
  onPageChange: (page: number) => void;
  busy: boolean;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (pages === 1) return null;
  return (
    <nav
      className="banana-account-pagination"
      aria-label={`${previousLabel} / ${nextLabel}`}
    >
      <button
        type="button"
        disabled={page <= 1 || busy}
        onClick={() => onPageChange(page - 1)}
        className="banana-account-secondary"
      >
        <ArrowLeft size={16} />
        {previousLabel}
      </button>
      <span>
        {page} / {pages}
      </span>
      <button
        type="button"
        disabled={page >= pages || busy}
        onClick={() => onPageChange(page + 1)}
        className="banana-account-secondary"
      >
        {nextLabel}
        <ArrowRight size={16} />
      </button>
    </nav>
  );
}
