import type { ReactNode } from 'react';
import type { CheckoutProduct } from '@/types/checkout';
import { ArrowLeft, Loader2, LockKeyhole, ShieldCheck } from 'lucide-react';

import { Link } from '@/core/i18n/navigation';

type Props = {
  brand: string;
  logo: string;
  locale: string;
  product?: CheckoutProduct;
  email?: string;
  loading: boolean;
  pending: boolean;
  error?: string;
  signedIn: boolean;
  ready: boolean;
  paymentForm?: ReactNode;
  fallbackAvailable: boolean;
  fallbackPending: boolean;
  copy: Record<string, string>;
  onCheckout: () => void;
  onFallback: () => void;
  onRetry: () => void;
  backHref?: string;
};
export function BananaCheckout({
  brand,
  logo,
  locale,
  product,
  loading,
  pending,
  error,
  signedIn,
  ready,
  paymentForm,
  fallbackAvailable,
  fallbackPending,
  copy,
  onCheckout,
  onFallback,
  onRetry,
  backHref = '/pricing',
}: Props) {
  const money = product
    ? new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: product.currency,
      }).format(product.priceInCents / 100)
    : '—';
  const billing = product?.recurring
    ? copy.monthly
    : product?.prepaidMonths
      ? copy.prepaid
      : copy.once;
  const validity =
    product?.recurring || product?.prepaidMonths
      ? copy.cycle
      : `${product?.creditsValidDays || 365} ${copy.days}`;
  return (
    <main className="banana-checkout">
      <aside className="checkout-story">
        <Link href="/" className="checkout-brand">
          <img src={logo} alt="" width="38" height="38" />
          {brand}
        </Link>
        <div className="checkout-story-body">
          <h1>
            {copy.headline}
            <br />
            <span>{copy.accent}</span>
          </h1>
          <p>{copy.intro}</p>
          <div className="checkout-product">
            <p>{product?.productName || brand}</p>
            <strong>{money}</strong>
            <span>{billing}</span>
          </div>
          <h2>{copy.details}</h2>
          <dl>
            <div>
              <dt>{copy.credits}</dt>
              <dd>{product?.credits.toLocaleString(locale) || '—'}</dd>
            </div>
            <div>
              <dt>{copy.validity}</dt>
              <dd>{validity}</dd>
            </div>
            <div>
              <dt>{copy.renewal}</dt>
              <dd>{billing}</dd>
            </div>
          </dl>
          <p className="checkout-tax">{copy.tax}</p>
        </div>
        <div className="checkout-orbit" aria-hidden="true">
          <i />
          <i />
          <i />
        </div>
      </aside>
      <section className="checkout-payment">
        <Link href={backHref} className="checkout-back">
          <ArrowLeft size={16} />
          {copy.back}
        </Link>
        <div className="checkout-payment-body">
          <div className="checkout-secure-label">
            <ShieldCheck size={17} />
            {brand}
          </div>
          <h2>{copy.title}</h2>
          <p>{copy.description}</p>
          <div className="checkout-total">
            <span>{product?.productName || '—'}</span>
            <strong>{money}</strong>
            <span>{billing}</span>
          </div>
          <div
            className={`checkout-form${paymentForm ? 'checkout-form-embedded' : ''}`}
          >
            {error && (
              <div className="checkout-error" role="alert">
                <p>{error}</p>
                <div className="checkout-error-actions">
                  {fallbackAvailable ? (
                    <button
                      type="button"
                      className="checkout-fallback"
                      disabled={fallbackPending}
                      onClick={onFallback}
                    >
                      {fallbackPending ? copy.working : copy.fallback}
                    </button>
                  ) : null}
                  <button
                    type="button"
                    className="checkout-retry"
                    disabled={fallbackPending}
                    onClick={onRetry}
                  >
                    {copy.retry}
                  </button>
                </div>
              </div>
            )}
            {!loading && !product && (
              <p className="checkout-error" role="alert">
                {copy.missing}
              </p>
            )}
            {!loading && !ready && (
              <p className="checkout-error" role="alert">
                {copy.unavailable}{' '}
                <button type="button" onClick={onRetry}>
                  {copy.retry}
                </button>
              </p>
            )}
            {paymentForm}
            {(pending || loading) && (
              <p className="checkout-loading" role="status">
                <Loader2 size={18} className="animate-spin" />
                {copy.working}
              </p>
            )}
            {!signedIn && !loading && (
              <button
                className="checkout-pay"
                disabled={loading || pending || !product || !ready}
                onClick={onCheckout}
              >
                <LockKeyhole size={17} />
                {copy.signin}
              </button>
            )}
            <p className="checkout-security">
              <LockKeyhole size={14} />
              {copy.secure}
            </p>
          </div>
          <nav className="checkout-legal">
            <Link href="/terms-of-service">{copy.terms}</Link>
            <Link href="/refund-policy">{copy.refund}</Link>
          </nav>
        </div>
      </section>
    </main>
  );
}
