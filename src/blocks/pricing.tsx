import { useEffect, useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  Boxes,
  CalendarDays,
  Check,
  Clock3,
  Code2,
  CreditCard,
  Gauge,
  Images,
  LockKeyhole,
  Mail,
  Sparkles,
  WandSparkles,
} from 'lucide-react';
import { toast } from 'sonner';

import { useSession } from '@/core/auth/client';
import { Link, useRouter } from '@/core/i18n/navigation';
import { trackFunnelEvent } from '@/lib/analytics-events';
import { apiPost } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import { m } from '@/paraglide/messages.js';
import { usePublicConfig } from '@/hooks/use-public-config';
import {
  PaymentProviderModal,
  type PaymentProvider,
} from '@/components/payment-provider-modal';
import {
  PricingTable,
  type PricingGroup,
  type PricingPlan,
} from '@/components/pricing-table';

const ALL_PROVIDERS: PaymentProvider[] = [
  'stripe',
  'creem',
  'paypal',
  'alipay',
  'wechat',
];

export function Pricing({
  title,
  headingLevel = 'h2',
  compact = false,
}: {
  title?: string;
  headingLevel?: 'h1' | 'h2';
  compact?: boolean;
} = {}) {
  const router = useRouter();
  const { data: session } = useSession();
  const { data: configsData } = usePublicConfig();
  const configs = configsData ?? {};
  const [modalOpen, setModalOpen] = useState(false);
  const [pendingPlan, setPendingPlan] = useState<PricingPlan | null>(null);
  const [loadingProvider, setLoadingProvider] =
    useState<PaymentProvider | null>(null);
  const [monthlyImages, setMonthlyImages] = useState(137);
  const [returningPlanId, setReturningPlanId] = useState<string | undefined>();

  useEffect(() => {
    if (!compact) trackFunnelEvent('pricing_view');
  }, [compact]);

  useEffect(() => {
    if (!session?.user) return;
    const planId = window.sessionStorage.getItem('image-studio:pending-plan');
    if (!planId) return;
    setReturningPlanId(planId);
    window.sessionStorage.removeItem('image-studio:pending-plan');
    window.setTimeout(
      () =>
        document
          .getElementById('pricing')
          ?.scrollIntoView({ behavior: 'smooth' }),
      100
    );
    toast.info(m['landing.pricing.plan_restored']());
  }, [session?.user]);
  const Heading = headingLevel;

  const enabledProviders = useMemo<PaymentProvider[]>(
    () => ALL_PROVIDERS.filter((p) => configs[`${p}_enabled`] === 'true'),
    [configs]
  );

  const starterFeatures = [
    { icon: Images, label: m['landing.pricing.feature_starter_images']() },
    { icon: Sparkles, label: m['landing.pricing.feature_starter_credits']() },
    { icon: LockKeyhole, label: m['landing.pricing.feature_private']() },
    { icon: Gauge, label: m['landing.pricing.feature_two_jobs']() },
    { icon: Clock3, label: m['landing.pricing.feature_30_history']() },
    { icon: Mail, label: m['landing.pricing.feature_email_support']() },
  ];
  const creatorFeatures = [
    { icon: Check, label: m['landing.pricing.feature_everything_starter']() },
    { icon: Images, label: m['landing.pricing.feature_creator_images']() },
    { icon: Sparkles, label: m['landing.pricing.feature_creator_credits']() },
    { icon: Boxes, label: m['landing.pricing.feature_batch_four']() },
    { icon: Gauge, label: m['landing.pricing.feature_priority']() },
    { icon: WandSparkles, label: m['landing.pricing.feature_upscales_20']() },
  ];
  const proFeatures = [
    { icon: Check, label: m['landing.pricing.feature_everything_creator']() },
    { icon: Images, label: m['landing.pricing.feature_pro_images']() },
    { icon: Sparkles, label: m['landing.pricing.feature_pro_credits']() },
    { icon: Boxes, label: m['landing.pricing.feature_batch_eight']() },
    { icon: Code2, label: m['landing.pricing.feature_api_access']() },
    { icon: Clock3, label: m['landing.pricing.feature_365_history']() },
  ];
  const boostFeatures = [
    { icon: Sparkles, label: m['landing.pricing.pack_boost_credits']() },
    { icon: Images, label: m['landing.pricing.pack_boost_images']() },
    { icon: CreditCard, label: m['landing.pricing.pack_one_time']() },
    { icon: CalendarDays, label: m['landing.pricing.pack_validity']() },
  ];
  const flexFeatures = [
    { icon: Sparkles, label: m['landing.pricing.pack_flex_credits']() },
    { icon: Images, label: m['landing.pricing.pack_flex_images']() },
    { icon: CreditCard, label: m['landing.pricing.pack_one_time']() },
    { icon: CalendarDays, label: m['landing.pricing.pack_validity']() },
  ];
  const powerFeatures = [
    { icon: Sparkles, label: m['landing.pricing.pack_power_credits']() },
    { icon: Images, label: m['landing.pricing.pack_power_images']() },
    { icon: CreditCard, label: m['landing.pricing.pack_one_time']() },
    { icon: CalendarDays, label: m['landing.pricing.pack_validity']() },
  ];

  const fullGroups: PricingGroup[] = [
    {
      key: 'monthly',
      label: m['landing.pricing.card_monthly'](),
      plans: [
        {
          id: 'starter-monthly',
          name: m['landing.pricing.starter'](),
          description: m['landing.pricing.starter_desc'](),
          price: '$8.99',
          originalPrice: '$12',
          promotionLabel: m['landing.pricing.limited_offer'](),
          interval: 'mo',
          billingNote: m['landing.pricing.auto_renew_note'](),
          features: starterFeatures,
          productId: 'starter_monthly',
          paymentProvider: 'stripe',
          priceInCents: 899,
          currency: 'usd',
          credits: 400,
          plan: { name: 'Starter', interval: 'month', intervalCount: 1 },
        },
        {
          id: 'creator-monthly',
          name: m['landing.pricing.creator'](),
          description: m['landing.pricing.creator_desc'](),
          price: '$19.99',
          originalPrice: '$29',
          promotionLabel: m['landing.pricing.limited_offer'](),
          interval: 'mo',
          billingNote: m['landing.pricing.auto_renew_note'](),
          featured: true,
          badge: m['landing.pricing.popular'](),
          features: creatorFeatures,
          productId: 'creator_monthly',
          paymentProvider: 'stripe',
          priceInCents: 1999,
          currency: 'usd',
          credits: 1100,
          plan: { name: 'Creator', interval: 'month', intervalCount: 1 },
        },
        {
          id: 'pro-monthly',
          name: m['landing.pricing.pro'](),
          description: m['landing.pricing.pro_desc'](),
          price: '$44.99',
          originalPrice: '$69',
          promotionLabel: m['landing.pricing.limited_offer'](),
          interval: 'mo',
          billingNote: m['landing.pricing.auto_renew_note'](),
          badge: m['landing.pricing.best_value'](),
          features: proFeatures,
          productId: 'pro_monthly',
          paymentProvider: 'stripe',
          priceInCents: 4499,
          currency: 'usd',
          credits: 2800,
          plan: { name: 'Pro', interval: 'month', intervalCount: 1 },
        },
      ],
    },
    {
      key: 'prepaid-monthly',
      label: m['landing.pricing.alipay_prepaid'](),
      plans: [
        {
          id: 'starter-prepaid-monthly',
          name: m['landing.pricing.starter'](),
          description: m['landing.pricing.starter_desc'](),
          price: '$8.99',
          originalPrice: '$12',
          promotionLabel: m['landing.pricing.limited_offer'](),
          billingNote: m['landing.pricing.prepaid_note'](),
          features: starterFeatures,
          buttonText: m['landing.pricing.prepay_alipay'](),
          productId: 'starter_prepaid_monthly',
          productName: 'Starter Prepaid Membership',
          paymentProvider: 'stripe',
          priceInCents: 899,
          currency: 'usd',
          credits: 400,
          plan: { name: 'Starter', interval: 'month', intervalCount: 1 },
        },
        {
          id: 'creator-prepaid-monthly',
          name: m['landing.pricing.creator'](),
          description: m['landing.pricing.creator_desc'](),
          price: '$19.99',
          originalPrice: '$29',
          promotionLabel: m['landing.pricing.limited_offer'](),
          featured: true,
          badge: m['landing.pricing.popular'](),
          billingNote: m['landing.pricing.prepaid_note'](),
          features: creatorFeatures,
          buttonText: m['landing.pricing.prepay_alipay'](),
          productId: 'creator_prepaid_monthly',
          productName: 'Creator Prepaid Membership',
          paymentProvider: 'stripe',
          priceInCents: 1999,
          currency: 'usd',
          credits: 1100,
          plan: { name: 'Creator', interval: 'month', intervalCount: 1 },
        },
        {
          id: 'pro-prepaid-monthly',
          name: m['landing.pricing.pro'](),
          description: m['landing.pricing.pro_desc'](),
          price: '$44.99',
          originalPrice: '$69',
          promotionLabel: m['landing.pricing.limited_offer'](),
          badge: m['landing.pricing.best_value'](),
          billingNote: m['landing.pricing.prepaid_note'](),
          features: proFeatures,
          buttonText: m['landing.pricing.prepay_alipay'](),
          productId: 'pro_prepaid_monthly',
          productName: 'Pro Prepaid Membership',
          paymentProvider: 'stripe',
          priceInCents: 4499,
          currency: 'usd',
          credits: 2800,
          plan: { name: 'Pro', interval: 'month', intervalCount: 1 },
        },
      ],
    },
    {
      key: 'credit-packs',
      label: m['landing.pricing.credit_packs'](),
      plans: [
        {
          id: 'credits-boost',
          name: m['landing.pricing.pack_boost'](),
          description: m['landing.pricing.pack_boost_desc'](),
          price: '$4.99',
          originalPrice: '$9',
          promotionLabel: m['landing.pricing.limited_offer'](),
          features: boostFeatures,
          buttonText: m['landing.pricing.buy_credits'](),
          productId: 'credits_boost',
          productName: 'Mini Credit Pack',
          priceInCents: 499,
          currency: 'usd',
          credits: 200,
          creditsValidDays: 365,
        },
        {
          id: 'credits-flex',
          name: m['landing.pricing.pack_flex'](),
          description: m['landing.pricing.pack_flex_desc'](),
          price: '$11.99',
          originalPrice: '$22',
          promotionLabel: m['landing.pricing.limited_offer'](),
          featured: true,
          badge: m['landing.pricing.popular'](),
          features: flexFeatures,
          buttonText: m['landing.pricing.buy_credits'](),
          productId: 'credits_flex',
          productName: 'Flex Credit Pack',
          priceInCents: 1199,
          currency: 'usd',
          credits: 600,
          creditsValidDays: 365,
        },
        {
          id: 'credits-power',
          name: m['landing.pricing.pack_power'](),
          description: m['landing.pricing.pack_power_desc'](),
          price: '$26.99',
          originalPrice: '$49',
          promotionLabel: m['landing.pricing.limited_offer'](),
          badge: m['landing.pricing.best_value'](),
          features: powerFeatures,
          buttonText: m['landing.pricing.buy_credits'](),
          productId: 'credits_power',
          productName: 'Power Credit Pack',
          priceInCents: 2699,
          currency: 'usd',
          credits: 1500,
          creditsValidDays: 365,
        },
      ],
    },
  ];

  const honestGroups: PricingGroup[] = fullGroups.map((group) => ({
    ...group,
    plans: group.plans.map((plan) => ({
      ...plan,
      originalPrice: undefined,
      promotionLabel: undefined,
    })),
  }));
  const groups: PricingGroup[] = compact
    ? [
        {
          key: 'homepage-recommended',
          label: m['landing.pricing.popular'](),
          plans: [
            honestGroups[0].plans[1],
            {
              ...honestGroups[2].plans[1],
              featured: false,
              badge: undefined,
            },
          ],
        },
      ]
    : honestGroups;
  const recommendedTier =
    monthlyImages <= 50 ? 'starter' : monthlyImages <= 137 ? 'creator' : 'pro';

  const checkoutMutation = useMutation({
    mutationFn: ({
      plan,
      provider,
    }: {
      plan: PricingPlan;
      provider: PaymentProvider;
    }) =>
      apiPost<{ checkout_url?: string }>('/api/payment/checkout', {
        product_id: plan.productId,
        payment_provider: provider,
      }),
    onSuccess: (data) => {
      if (!data?.checkout_url) {
        toast.error(m['landing.pricing.checkout_unavailable']());
        setLoadingProvider(null);
        return;
      }
      window.location.href = data.checkout_url;
    },
    onError: (error: Error) => {
      toast.error(error.message || m['landing.pricing.checkout_unavailable']());
      setLoadingProvider(null);
    },
  });

  function startCheckout(plan: PricingPlan, provider: PaymentProvider) {
    if (provider === 'stripe' && configs.stripe_ready !== 'true') {
      toast.info(m['landing.pricing.checkout_unavailable']());
      return;
    }
    const productId = plan.productId;
    if (!productId) {
      toast.error(m['landing.pricing.checkout_unavailable']());
      return;
    }
    setLoadingProvider(provider);
    trackFunnelEvent('checkout_started', {
      product: productId,
      provider,
    });
    checkoutMutation.mutate({ plan, provider });
  }

  function handleCheckout(plan: PricingPlan) {
    const productId = plan.productId;
    if (!productId) {
      toast.error(m['landing.pricing.checkout_unavailable']());
      return;
    }
    trackFunnelEvent(
      productId.startsWith('credits_')
        ? 'credit_pack_clicked'
        : 'subscription_clicked',
      { product: productId }
    );
    if (!session?.user) {
      window.sessionStorage.setItem('image-studio:pending-plan', plan.id);
      router.push('/sign-up?callbackUrl=%2Fpricing');
      return;
    }
    if (enabledProviders.length === 0) {
      toast.info(m['landing.pricing.checkout_unavailable']());
      return;
    }
    if (plan.paymentProvider) {
      const requiredProvider = plan.paymentProvider as PaymentProvider;
      if (!enabledProviders.includes(requiredProvider)) {
        toast.error(m['landing.pricing.checkout_unavailable']());
        return;
      }
      startCheckout(plan, requiredProvider);
      return;
    }
    const selectEnabled = configs.select_payment_enabled === 'true';
    const defaultProvider = (configs.default_payment_provider ||
      enabledProviders[0]) as PaymentProvider;
    if (selectEnabled && enabledProviders.length > 1) {
      setPendingPlan(plan);
      setModalOpen(true);
      return;
    }
    startCheckout(plan, defaultProvider);
  }

  return (
    <section
      id="pricing"
      className="border-border relative isolate overflow-hidden border-t px-3 py-16 sm:px-4 sm:py-32"
    >
      <div className="relative z-10 mx-auto max-w-6xl">
        <div
          data-tour="subscription-overview"
          className="mb-9 text-center sm:mb-16"
        >
          <p className="text-primary mb-3 text-xs font-semibold tracking-[0.2em] uppercase">
            {m['landing.pricing.eyebrow']()}
          </p>
          <Heading className="font-serif text-4xl tracking-tight sm:text-5xl">
            {title ?? m['landing.pricing.title']()}
          </Heading>
          <p className="text-muted-foreground mx-auto mt-4 max-w-2xl text-sm leading-relaxed sm:mt-5 sm:text-base">
            {compact
              ? m['landing.pricing.homepage_description']()
              : m['landing.pricing.description']()}
          </p>
          <p className="text-muted-foreground mt-3 text-xs">
            {m['landing.pricing.credit_note']()}
          </p>
        </div>
        {!compact ? (
          <div className="border-border bg-muted/30 mx-auto mb-8 max-w-2xl rounded-2xl border p-4 text-center sm:p-5">
            <p className="text-sm font-semibold">
              {m['landing.pricing.recommender_title']()}
            </p>
            <div className="mt-3 flex justify-center gap-2">
              {[50, 137, 350].map((amount) => (
                <button
                  key={amount}
                  type="button"
                  onClick={() => setMonthlyImages(amount)}
                  className={cn(
                    'border-border rounded-full border px-4 py-2 text-sm font-semibold',
                    monthlyImages === amount
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background hover:bg-muted'
                  )}
                >
                  {m['landing.pricing.images_per_month']({ count: amount })}
                </button>
              ))}
            </div>
            <p className="text-muted-foreground mt-3 text-xs">
              {m['landing.pricing.recommender_hint']()}
            </p>
          </div>
        ) : null}
        <PricingTable
          groups={groups}
          onCheckout={handleCheckout}
          recommendedTier={compact ? undefined : recommendedTier}
          selectedPlanId={returningPlanId}
          valueLabel={m['landing.pricing.value_per_image']({
            price: '{price}',
          })}
        />
        {compact ? (
          <div className="mt-8 text-center">
            <Link
              href="/pricing"
              className="text-primary hover:text-primary/80 text-sm font-semibold underline underline-offset-4"
            >
              {m['landing.pricing.view_all']()}
            </Link>
          </div>
        ) : (
          <p className="text-muted-foreground mx-auto mt-7 max-w-3xl text-center text-xs leading-5">
            {m['landing.pricing.legal_prefix']()}{' '}
            <Link
              href="/terms-of-service"
              className="underline underline-offset-2"
            >
              {m['landing.footer.terms']()}
            </Link>{' '}
            {m['landing.pricing.legal_and']()}{' '}
            <Link
              href="/refund-policy"
              className="underline underline-offset-2"
            >
              {m['landing.footer.refunds']()}
            </Link>
            {m['landing.pricing.legal_suffix']()}
          </p>
        )}
      </div>

      <PaymentProviderModal
        open={modalOpen}
        onOpenChange={(open) => {
          setModalOpen(open);
          if (!open) {
            setPendingPlan(null);
            setLoadingProvider(null);
          }
        }}
        providers={enabledProviders.length ? enabledProviders : ['stripe']}
        loadingProvider={loadingProvider}
        onSelect={(provider) =>
          pendingPlan ? startCheckout(pendingPlan, provider) : undefined
        }
        planName={pendingPlan?.name}
        price={pendingPlan?.price}
      />
    </section>
  );
}
