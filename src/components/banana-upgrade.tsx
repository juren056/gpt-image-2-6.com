import { Check, Gift } from 'lucide-react';

import { Link } from '@/core/i18n/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';

export type UpgradePlan = {
  id: string;
  name: string;
  price: string;
  credits: number;
  featured: boolean;
};
export function BananaUpgrade({
  open,
  onOpenChange,
  title,
  description,
  plans,
  popular,
  creditsLabel,
  monthly,
  billingNote,
  features,
  choose,
  unavailable,
  ready,
  pending,
  regular,
  skip,
  onCheckout,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  plans: UpgradePlan[];
  popular: string;
  creditsLabel: string;
  monthly: string;
  billingNote: string;
  features: string[];
  choose: string;
  unavailable: string;
  ready: boolean;
  pending: boolean;
  regular: string;
  skip: string;
  onCheckout: (id: string) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="banana-account banana-upgrade-dialog">
        <div className="banana-upgrade-heading">
          <Gift size={18} />
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </div>
        <div className="banana-upgrade-grid">
          {plans.map((plan) => (
            <article
              key={plan.id}
              className={`banana-upgrade-card ${plan.featured ? 'banana-upgrade-card--popular' : ''}`}
            >
              {plan.featured && (
                <div className="banana-upgrade-popular">{popular}</div>
              )}
              <div className="banana-upgrade-card-inner">
                <h3>{plan.name}</h3>
                <p className="banana-upgrade-price">
                  <strong>{plan.price}</strong>
                  <span>/ {monthly}</span>
                </p>
                <p className="banana-upgrade-billing">{billingNote}</p>
                <button
                  type="button"
                  disabled={!ready || pending}
                  onClick={() => onCheckout(plan.id)}
                  className={plan.featured ? 'banana-account-primary' : ''}
                >
                  {ready ? choose : unavailable}
                </button>
                <p className="banana-upgrade-credit-amount">
                  <strong>{plan.credits.toLocaleString()}</strong>{' '}
                  {creditsLabel}
                </p>
                <div
                  className="banana-upgrade-credit-meter"
                  aria-hidden="true"
                />
                <ul>
                  {features.map((feature) => (
                    <li key={feature}>
                      <Check size={16} />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </div>
        <div className="banana-upgrade-footer">
          <Link href="/pricing" onClick={() => onOpenChange(false)}>
            {regular} →
          </Link>
          <button type="button" onClick={() => onOpenChange(false)}>
            {skip}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
