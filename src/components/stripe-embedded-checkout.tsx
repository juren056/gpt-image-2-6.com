import { useEffect, useRef, useState } from 'react';
import type { StripeEmbeddedCheckout as EmbeddedCheckout } from '@stripe/stripe-js';
import { loadStripe } from '@stripe/stripe-js/pure';
import { Loader2 } from 'lucide-react';

type Props = {
  clientSecret: string;
  publishableKey: string;
  loadingLabel: string;
  errorLabel: string;
  retryLabel: string;
};

/** Stripe owns the payment fields and final submit; card data never reaches us. */
export function StripeEmbeddedCheckout({
  clientSecret,
  publishableKey,
  loadingLabel,
  errorLabel,
  retryLabel,
}: Props) {
  const mount = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let canceled = false;
    let checkout: EmbeddedCheckout | undefined;
    setLoading(true);
    setFailed(false);
    async function initialize() {
      try {
        const stripe = await loadStripe(publishableKey);
        if (canceled) return;
        if (!stripe) throw new Error('Stripe did not load');
        const initialized = await stripe.initEmbeddedCheckout({ clientSecret });
        if (canceled || !mount.current) {
          initialized.destroy();
          return;
        }
        checkout = initialized;
        initialized.mount(mount.current);
        setLoading(false);
      } catch {
        // Do not expose provider errors or session secrets in the DOM/logs.
        if (!canceled) {
          setFailed(true);
          setLoading(false);
        }
      }
    }
    void initialize();
    return () => {
      canceled = true;
      checkout?.destroy();
    };
  }, [clientSecret, publishableKey, attempt]);

  return (
    <div className="checkout-embedded">
      {loading && (
        <p className="checkout-loading" role="status">
          <Loader2 size={18} className="animate-spin" />
          {loadingLabel}
        </p>
      )}
      {failed && (
        <div className="checkout-error" role="alert">
          {errorLabel}{' '}
          <button onClick={() => setAttempt((value) => value + 1)}>
            {retryLabel}
          </button>
        </div>
      )}
      <div ref={mount} aria-label="Stripe Checkout" />
    </div>
  );
}
