import { and, count, desc, eq, gt, inArray, isNull, or } from 'drizzle-orm';

import { db } from '@/core/db';
import {
  AlipayProvider,
  CreemProvider,
  PaymentManager,
  StripeProvider,
  WechatPayProvider,
} from '@/core/payment';
import {
  PaymentEventType,
  PaymentStatus,
  PaymentType,
  SubscriptionCycleType,
  type CheckoutSession,
  type PaymentEvent,
  type PaymentOrder,
} from '@/core/payment/types';
import {
  order,
  paymentEvent,
  referral,
  subscription,
  user,
} from '@/config/db/schema';
import { getPricingProduct } from '@/config/pricing';
import { getAllConfigs } from '@/modules/config/service';
import {
  calculateCreditExpirationTime,
  CreditTransactionScene,
  grant,
  restoreOrderDisputeCredits,
  revokeByOrder,
} from '@/modules/credits/service';
import {
  addCalendarMonths,
  findByProviderSubscriptionId,
  findBySubscriptionNo,
  isPrepaidSubscriptionId,
  PREPAID_SUBSCRIPTION_PREFIX,
  SubscriptionStatus,
  updateBySubscriptionNo,
  type NewSubscription,
  type UpdateSubscription,
} from '@/modules/subscriptions/service';
import { getSnowId, getUniSeq, getUuid } from '@/lib/hash';

// --- Order types ---

enum OrderStatus {
  PENDING = 'pending',
  CREATED = 'created',
  PAID = 'paid',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  PARTIALLY_REFUNDED = 'partially_refunded',
  DISPUTED = 'disputed',
}

export async function rewardPendingReferralAfterFirstPurchase(params: {
  tx: any;
  userId: string;
  userEmail: string;
  orderNo: string;
  paidAmount: number;
}) {
  if (!Number.isFinite(params.paidAmount) || params.paidAmount <= 0) return;

  const [pending] = await params.tx
    .select()
    .from(referral)
    .where(
      and(
        eq(referral.referredUserId, params.userId),
        eq(referral.status, 'pending')
      )
    )
    .limit(1);
  if (!pending) return;

  // The current checkout is already marked paid inside this transaction. A
  // count other than one means this is not the friend's first real purchase.
  const [paidOrders] = await params.tx
    .select({ total: count() })
    .from(order)
    .where(
      and(
        eq(order.userId, params.userId),
        eq(order.status, OrderStatus.PAID),
        or(
          gt(order.paymentAmount, 0),
          and(isNull(order.paymentAmount), gt(order.amount, 0))
        ),
        isNull(order.deletedAt)
      )
    );
  if (Number(paidOrders?.total || 0) !== 1) return;

  if (pending.sourceHash) {
    const [sourceRewards] = await params.tx
      .select({ total: count() })
      .from(referral)
      .where(
        and(
          eq(referral.sourceHash, pending.sourceHash),
          eq(referral.status, 'rewarded')
        )
      );
    if (Number(sourceRewards?.total || 0) >= 2) {
      await params.tx
        .update(referral)
        .set({ status: 'ineligible' })
        .where(
          and(eq(referral.id, pending.id), eq(referral.status, 'pending'))
        );
      return;
    }
  }

  // Claim the pending referral before granting. The entire payment transaction
  // rolls back if either credit grant fails, so callbacks remain idempotent.
  const [claimed] = await params.tx
    .update(referral)
    .set({ status: 'rewarded', rewardedAt: new Date() })
    .where(and(eq(referral.id, pending.id), eq(referral.status, 'pending')))
    .returning();
  if (!claimed) return;

  const [referrer] = await params.tx
    .select({ email: user.email })
    .from(user)
    .where(eq(user.id, claimed.referrerId))
    .limit(1);
  const expiresAt = new Date(Date.now() + 365 * 86_400_000);
  const metadata = JSON.stringify({
    referralId: claimed.id,
    qualifyingOrderNo: params.orderNo,
  });
  await grant({
    userId: claimed.referrerId,
    userEmail: referrer?.email || '',
    credits: claimed.rewardCredits,
    transactionNo: `referral:${claimed.id}:referrer`,
    scene: CreditTransactionScene.REWARD,
    description: 'Referral reward after friend first purchase',
    expiresAt,
    metadata,
    tx: params.tx,
  });
  await grant({
    userId: claimed.referredUserId,
    userEmail: params.userEmail,
    credits: claimed.rewardCredits,
    transactionNo: `referral:${claimed.id}:referred`,
    scene: CreditTransactionScene.REWARD,
    description: 'Referral welcome reward after first purchase',
    expiresAt,
    metadata,
    tx: params.tx,
  });
}

// --- Payment Manager ---

let manager: PaymentManager | null = null;
let managerConfigHash = '';

async function getPaymentManager(): Promise<PaymentManager> {
  const configs = await getAllConfigs();
  const c = (key: string) => configs[key] || '';

  // Rebuild manager if provider configs changed
  const hash = JSON.stringify([
    c('stripe_secret_key') || c('stripe_api_key'),
    c('stripe_publishable_key'),
    c('stripe_signing_secret') || c('stripe_webhook_secret'),
    c('stripe_enabled'),
    c('creem_enabled'),
    c('creem_api_key'),
    c('alipay_app_id'),
    c('wechat_mch_id'),
    c('default_payment_provider'),
  ]);
  if (manager && hash === managerConfigHash) return manager;

  manager = new PaymentManager();
  managerConfigHash = hash;

  const stripeKey = c('stripe_secret_key') || c('stripe_api_key');
  if (stripeKey) {
    const isDefault =
      !c('default_payment_provider') ||
      c('default_payment_provider') === 'stripe';
    manager.addProvider(
      new StripeProvider({
        secretKey: stripeKey,
        publishableKey: c('stripe_publishable_key'),
        signingSecret:
          c('stripe_signing_secret') || c('stripe_webhook_secret') || undefined,
        allowPromotionCodes: true,
        allowedPaymentMethods: ['card', 'wechat_pay', 'alipay'],
      }),
      isDefault
    );
  }

  if (c('creem_enabled') === 'true' && c('creem_api_key')) {
    const isDefault = c('default_payment_provider') === 'creem';
    manager.addProvider(
      new CreemProvider({
        apiKey: c('creem_api_key'),
        signingSecret: c('creem_signing_secret') || undefined,
        environment:
          c('creem_environment') === 'production' ? 'production' : 'sandbox',
      }),
      isDefault
    );
  }

  if (c('alipay_app_id') && c('alipay_private_key')) {
    const isDefault = c('default_payment_provider') === 'alipay';
    manager.addProvider(
      new AlipayProvider({
        appId: c('alipay_app_id'),
        privateKey: c('alipay_private_key'),
        alipayPublicKey: c('alipay_public_key'),
        notifyUrl: c('alipay_notify_url') || undefined,
      }),
      isDefault
    );
  }

  if (c('wechat_mch_id') && c('wechat_private_key')) {
    const isDefault = c('default_payment_provider') === 'wechat';
    manager.addProvider(
      new WechatPayProvider({
        appId: c('wechat_app_id'),
        mchId: c('wechat_mch_id'),
        apiV3Key: c('wechat_api_v3_key'),
        privateKey: c('wechat_private_key'),
        serialNo: c('wechat_serial_no'),
        notifyUrl: c('wechat_notify_url') || undefined,
        platformCert: c('wechat_platform_cert') || undefined,
      }),
      isDefault
    );
  }

  return manager;
}

// --- Checkout ---

export async function createCheckout(params: {
  userId: string;
  userEmail?: string;
  paymentOrder: PaymentOrder;
  provider?: string;
  productName?: string;
  planName?: string;
  credits?: number;
  creditsValidDays?: number;
}): Promise<CheckoutSession> {
  const {
    userId,
    userEmail,
    paymentOrder,
    provider,
    productName,
    planName,
    credits,
    creditsValidDays,
  } = params;
  const pm = await getPaymentManager();
  const orderNo = getUniSeq('ORD');
  const configs = await getAllConfigs();
  const appUrl = configs.app_url || 'http://localhost:3000';

  // Resolve provider-specific product ID (e.g. Creem product_ids_mapping)
  const resolvedProvider = provider || pm.getDefaultProvider()?.name;
  let resolvedProductId = paymentOrder.productId;
  if (resolvedProvider === 'creem' && paymentOrder.productId) {
    const mapping = configs.creem_product_ids_mapping;
    if (mapping) {
      try {
        const map = JSON.parse(mapping) as Record<string, string>;
        if (map[paymentOrder.productId]) {
          resolvedProductId = map[paymentOrder.productId];
        }
      } catch {
        // invalid JSON — fall through with original productId
      }
    }
  }

  const finalSuccessUrl =
    paymentOrder.successUrl || `${appUrl}/settings/billing?success=1`;
  const callbackSuccessUrl = `${appUrl}/api/payment/callback?order_no=${orderNo}&redirect=${encodeURIComponent(finalSuccessUrl)}`;

  const session = await pm.createPayment({
    order: {
      ...paymentOrder,
      metadata: {
        ...(paymentOrder.metadata || {}),
        order_no: orderNo,
        user_id: userId,
        product_id: paymentOrder.productId || '',
      },
      productId: resolvedProductId,
      orderNo,
      successUrl: callbackSuccessUrl,
      cancelUrl:
        paymentOrder.cancelUrl || `${appUrl}/settings/billing?canceled=1`,
    },
    provider,
  });

  await db()
    .insert(order)
    .values({
      id: getUuid(),
      orderNo,
      userId,
      userEmail: userEmail || '',
      status: OrderStatus.CREATED,
      amount: paymentOrder.price?.amount || 0,
      currency: paymentOrder.price?.currency || 'usd',
      productId: paymentOrder.productId || '',
      productName: productName || null,
      planName: planName || null,
      creditsAmount: credits ?? null,
      creditsValidDays: creditsValidDays ?? null,
      paymentType: paymentOrder.type || 'one-time',
      paymentInterval: paymentOrder.plan?.interval || 'one-time',
      paymentProvider: session.provider,
      paymentSessionId: session.checkoutInfo.sessionId,
      checkoutInfo: JSON.stringify({
        ...session.checkoutInfo,
        clientSecret: undefined,
      }),
      checkoutResult: JSON.stringify(
        session.provider === 'stripe'
          ? { ...session.checkoutResult, client_secret: undefined }
          : session.checkoutResult
      ),
      checkoutUrl: session.checkoutInfo.checkoutUrl,
      description: paymentOrder.description || '',
    });

  return session;
}

// --- Payment callback (return_url) ---

export async function handlePaymentCallback(orderNo: string) {
  // Find the order
  const [existingOrder] = await db()
    .select()
    .from(order)
    .where(eq(order.orderNo, orderNo))
    .limit(1);

  if (!existingOrder) return;
  if (existingOrder.status === OrderStatus.PAID) return;

  // Query the payment provider for latest status
  const pm = await getPaymentManager();
  const provider = pm.getProvider(existingOrder.paymentProvider);
  if (!provider) return;

  const session = await provider.getPaymentSession({
    sessionId: existingOrder.paymentSessionId || existingOrder.orderNo,
  });

  // Reuse the same atomic success handler as the webhook so that
  // subscriptions are created and credits granted on synchronous return too.
  // This is important in environments where webhooks aren't reachable (e.g. localhost).
  await handleCheckoutSuccess(session, existingOrder.paymentProvider);
}

// --- Webhook handling ---

export async function handleWebhook(params: {
  req: Request;
  provider: string;
}): Promise<PaymentEvent> {
  const pm = await getPaymentManager();
  const event = await pm.getPaymentEvent({
    req: params.req,
    provider: params.provider,
  });
  const providerEventId = event.eventResult?.id as string | undefined;
  if (providerEventId) {
    const shouldProcess = await claimPaymentEvent({
      id: providerEventId,
      provider: params.provider,
      eventType: event.eventType,
      payload: JSON.stringify(event.eventResult),
    });
    if (!shouldProcess) return event;
  }

  const session = event.paymentSession;
  const eventType = event.eventType;

  try {
    if (session) {
      if (eventType === PaymentEventType.CHECKOUT_SUCCESS) {
        await handleCheckoutSuccess(session, params.provider);
      } else if (eventType === PaymentEventType.PAYMENT_SUCCESS) {
        if (
          session.paymentInfo?.subscriptionCycleType ===
          SubscriptionCycleType.RENEWAL
        ) {
          await handleSubscriptionRenewal(session, params.provider);
        } else if (
          session.paymentInfo?.subscriptionCycleType ===
          SubscriptionCycleType.CREATE
        ) {
          await attachInitialInvoicePayment(session, params.provider);
        } else {
          await handleCheckoutSuccess(session, params.provider);
        }
      } else if (eventType === PaymentEventType.PAYMENT_FAILED) {
        await handleSubscriptionPaymentFailed(session, params.provider);
      } else if (eventType === PaymentEventType.PAYMENT_REFUNDED) {
        await handlePaymentRefunded(session, params.provider);
      } else if (eventType === PaymentEventType.PAYMENT_DISPUTED) {
        await handlePaymentDisputed(session, params.provider);
      } else if (eventType === PaymentEventType.PAYMENT_DISPUTE_CLOSED) {
        await handlePaymentDisputeClosed(
          session,
          event.eventResult,
          params.provider
        );
      } else if (eventType === PaymentEventType.SUBSCRIBE_UPDATED) {
        await handleSubscriptionUpdated(session, params.provider);
      } else if (eventType === PaymentEventType.SUBSCRIBE_CANCELED) {
        await handleSubscriptionCanceled(session, params.provider);
      }
    }
    if (providerEventId) await finishPaymentEvent(providerEventId, 'processed');
  } catch (error) {
    if (providerEventId) {
      await finishPaymentEvent(
        providerEventId,
        'failed',
        error instanceof Error ? error.message : 'Unknown payment event error'
      );
    }
    throw error;
  }

  return event;
}

async function claimPaymentEvent(params: {
  id: string;
  provider: string;
  eventType: string;
  payload: string;
}) {
  const [existing] = await db()
    .select()
    .from(paymentEvent)
    .where(eq(paymentEvent.id, params.id))
    .limit(1);

  if (existing?.status === 'processed') return false;
  if (existing?.status === 'processing') {
    const age = Date.now() - new Date(existing.updatedAt).getTime();
    if (age < 10 * 60 * 1000) return false;
  }

  if (existing) {
    await db()
      .update(paymentEvent)
      .set({ status: 'processing', error: null, payload: params.payload })
      .where(eq(paymentEvent.id, params.id));
    return true;
  }

  try {
    await db().insert(paymentEvent).values({
      id: params.id,
      provider: params.provider,
      eventType: params.eventType,
      status: 'processing',
      payload: params.payload,
    });
    return true;
  } catch {
    return false;
  }
}

async function finishPaymentEvent(
  id: string,
  status: 'processed' | 'failed',
  error?: string
) {
  await db()
    .update(paymentEvent)
    .set({ status, error: error || null })
    .where(eq(paymentEvent.id, id));
}

// --- Checkout Success: update order + create subscription + grant credits ---

async function handleCheckoutSuccess(session: any, provider: string) {
  // Different providers expose the session identifier under different keys.
  // We try the common shapes; for Alipay the natural key is out_trade_no
  // (which equals our orderNo and the value we stored in paymentSessionId).
  const result = session.paymentResult || {};
  const sessionId: string =
    result.id ||
    result.object?.id ||
    result.out_trade_no ||
    result.outTradeNo ||
    '';
  if (!sessionId) return;

  // Find order by session ID
  const [existingOrder] = await db()
    .select()
    .from(order)
    .where(and(eq(order.paymentSessionId, sessionId), isNull(order.deletedAt)))
    .limit(1);

  if (!existingOrder) return;

  // Idempotency: skip if already paid
  if (existingOrder.status === OrderStatus.PAID) return;
  if (
    existingOrder.status !== OrderStatus.CREATED &&
    existingOrder.status !== OrderStatus.PENDING
  )
    return;

  const paymentInfo = session.paymentInfo;
  const subscriptionInfo = session.subscriptionInfo;
  const catalogProduct = getPricingProduct(existingOrder.productId || '');
  const prepaidMembership =
    catalogProduct?.membership?.renewalMode === 'prepaid'
      ? catalogProduct.membership
      : null;

  if (session.paymentStatus === PaymentStatus.SUCCESS) {
    // Prepare order update
    const orderUpdate: Record<string, any> = {
      status: OrderStatus.PAID,
      paymentResult: JSON.stringify(session.paymentResult),
      paymentAmount: paymentInfo?.paymentAmount || null,
      paymentCurrency: paymentInfo?.paymentCurrency || null,
      paymentEmail: paymentInfo?.paymentEmail || null,
      paidAt: paymentInfo?.paidAt || new Date(),
      transactionId: paymentInfo?.transactionId || null,
      invoiceId: paymentInfo?.invoiceId || null,
      invoiceUrl: paymentInfo?.invoiceUrl || null,
      paymentIntentId: paymentInfo?.paymentIntentId || null,
      chargeId: paymentInfo?.chargeId || null,
      paymentUserName: paymentInfo?.paymentUserName || null,
      paymentUserId: paymentInfo?.paymentUserId || null,
      discountCode: paymentInfo?.discountCode || null,
      discountAmount: paymentInfo?.discountAmount || null,
    };

    // Atomically update order + create subscription + grant credits
    await db().transaction(async (tx: any) => {
      // Claim the order inside the transaction. The callback and webhook can
      // arrive concurrently; only one is allowed to create benefits.
      const [claimed] = await tx
        .update(order)
        .set({ status: OrderStatus.PAID })
        .where(
          and(
            eq(order.id, existingOrder.id),
            inArray(order.status, [OrderStatus.CREATED, OrderStatus.PENDING])
          )
        )
        .returning({ id: order.id });
      if (!claimed) return;

      let benefitPeriodEnd = subscriptionInfo?.currentPeriodEnd;

      // 1. Create an auto-renewing provider subscription if applicable.
      if (subscriptionInfo && session.subscriptionId) {
        const subNo = getSnowId();
        const newSub: any = {
          id: getUuid(),
          subscriptionNo: subNo,
          userId: existingOrder.userId,
          userEmail:
            existingOrder.userEmail || existingOrder.paymentEmail || '',
          status: subscriptionInfo.status || SubscriptionStatus.ACTIVE,
          // Provider subscriptions use their real provider subscription ID.
          paymentProvider: provider,
          subscriptionId: session.subscriptionId,
          subscriptionResult: JSON.stringify(session.subscriptionResult),
          productId: existingOrder.productId,
          description: subscriptionInfo.description || 'Subscription Created',
          amount: subscriptionInfo.amount,
          currency: subscriptionInfo.currency,
          interval: subscriptionInfo.interval,
          intervalCount: subscriptionInfo.intervalCount,
          trialPeriodDays: subscriptionInfo.trialPeriodDays,
          currentPeriodStart: subscriptionInfo.currentPeriodStart,
          currentPeriodEnd: subscriptionInfo.currentPeriodEnd,
          billingUrl: subscriptionInfo.billingUrl,
          planName: existingOrder.planName || existingOrder.productName,
          productName: existingOrder.productName,
          creditsAmount: existingOrder.creditsAmount,
          creditsValidDays: existingOrder.creditsValidDays,
          paymentProductId: existingOrder.paymentProductId,
          paymentUserId: paymentInfo?.paymentUserId,
        };
        await tx.insert(subscription).values(newSub);
        orderUpdate.subscriptionNo = subNo;
        orderUpdate.subscriptionId = session.subscriptionId;
        orderUpdate.subscriptionResult = JSON.stringify(
          session.subscriptionResult
        );
      } else if (prepaidMembership) {
        // Alipay can't be used with Stripe Checkout subscription mode. A
        // prepaid membership therefore creates an internal, fixed-term
        // entitlement after the one-time payment succeeds.
        const periodStart = paymentInfo?.paidAt || new Date();
        const periodEnd = addCalendarMonths(
          periodStart,
          prepaidMembership.durationMonths || 1
        );
        const subNo = getSnowId();
        const prepaidSubscriptionId = `${PREPAID_SUBSCRIPTION_PREFIX}${existingOrder.orderNo}`;
        const prepaidResult = {
          kind: 'prepaid',
          orderNo: existingOrder.orderNo,
          paymentSessionId: existingOrder.paymentSessionId,
        };

        await tx.insert(subscription).values({
          id: getUuid(),
          subscriptionNo: subNo,
          userId: existingOrder.userId,
          userEmail:
            existingOrder.userEmail || existingOrder.paymentEmail || '',
          status: SubscriptionStatus.ACTIVE,
          paymentProvider: provider,
          subscriptionId: prepaidSubscriptionId,
          subscriptionResult: JSON.stringify(prepaidResult),
          productId: existingOrder.productId,
          description: `${existingOrder.planName || existingOrder.productName || 'Membership'} prepaid membership`,
          amount: existingOrder.amount,
          currency: existingOrder.currency,
          interval: catalogProduct?.plan?.interval || 'month',
          intervalCount: catalogProduct?.plan?.intervalCount || 1,
          currentPeriodStart: periodStart,
          currentPeriodEnd: periodEnd,
          planName: existingOrder.planName || existingOrder.productName,
          productName: existingOrder.productName,
          creditsAmount: existingOrder.creditsAmount,
          creditsValidDays: existingOrder.creditsValidDays,
          paymentProductId: existingOrder.paymentProductId,
          paymentUserId: paymentInfo?.paymentUserId,
        });

        orderUpdate.subscriptionNo = subNo;
        orderUpdate.subscriptionId = prepaidSubscriptionId;
        orderUpdate.subscriptionResult = JSON.stringify(prepaidResult);
        benefitPeriodEnd = periodEnd;
      }

      // 2. Grant credits if applicable
      if (existingOrder.creditsAmount && existingOrder.creditsAmount > 0) {
        const credits = existingOrder.creditsAmount;
        const expiresAt = calculateCreditExpirationTime({
          creditsValidDays: existingOrder.creditsValidDays || 0,
          currentPeriodEnd: benefitPeriodEnd,
        });

        await grant({
          userId: existingOrder.userId,
          userEmail: existingOrder.userEmail || '',
          orderNo: existingOrder.orderNo,
          subscriptionNo: orderUpdate.subscriptionNo || '',
          transactionNo: getSnowId(),
          scene: orderUpdate.subscriptionNo ? 'subscription' : 'payment',
          credits,
          description: 'Grant credit',
          expiresAt,
          tx,
        });
      }

      // 3. Reward a pending referral only after the friend's first paid order.
      await rewardPendingReferralAfterFirstPurchase({
        tx,
        userId: existingOrder.userId,
        userEmail: existingOrder.userEmail || paymentInfo?.paymentEmail || '',
        orderNo: existingOrder.orderNo,
        paidAmount: Number(
          paymentInfo?.paymentAmount ?? existingOrder.amount ?? 0
        ),
      });

      // 4. Update order
      await tx
        .update(order)
        .set(orderUpdate)
        .where(eq(order.id, existingOrder.id));
    });
  } else if (
    session.paymentStatus === PaymentStatus.FAILED ||
    session.paymentStatus === PaymentStatus.CANCELED
  ) {
    await db()
      .update(order)
      .set({
        status: OrderStatus.FAILED,
        paymentResult: JSON.stringify(session.paymentResult),
      })
      .where(eq(order.id, existingOrder.id));
  }
}

// --- Subscription Renewal ---

export async function handleSubscriptionRenewal(
  session: any,
  provider: string
) {
  if (!session.subscriptionId || !session.subscriptionInfo) return;

  const existingSub = await findByProviderSubscriptionId({
    provider,
    subscriptionId: session.subscriptionId,
  });
  if (!existingSub || !existingSub.amount || !existingSub.currency) return;

  const subscriptionInfo = session.subscriptionInfo;
  if (
    !subscriptionInfo.currentPeriodStart ||
    !subscriptionInfo.currentPeriodEnd
  )
    return;

  if (session.paymentStatus !== PaymentStatus.SUCCESS) return;

  const paymentInfo = session.paymentInfo;

  // Idempotency: drop duplicate renewals for the same provider transaction.
  if (paymentInfo?.transactionId) {
    const [dup] = await db()
      .select({ id: order.id })
      .from(order)
      .where(
        and(
          eq(order.transactionId, paymentInfo.transactionId),
          eq(order.paymentProvider, provider)
        )
      )
      .limit(1);
    if (dup) return;
  }

  const renewalOrderNo = getSnowId();

  await db().transaction(async (tx: any) => {
    // 1. Update subscription period
    await tx
      .update(subscription)
      .set({
        currentPeriodStart: subscriptionInfo.currentPeriodStart,
        currentPeriodEnd: subscriptionInfo.currentPeriodEnd,
      })
      .where(eq(subscription.subscriptionNo, existingSub.subscriptionNo));

    // 2. Create renewal order
    await tx.insert(order).values({
      id: getUuid(),
      orderNo: renewalOrderNo,
      userId: existingSub.userId,
      userEmail: existingSub.userEmail || '',
      status: OrderStatus.PAID,
      amount: existingSub.amount,
      currency: existingSub.currency,
      productId: existingSub.productId || '',
      paymentType: 'renew',
      paymentInterval: existingSub.interval || '',
      paymentProvider: provider,
      checkoutInfo: '',
      description: 'Subscription Renewal',
      productName: existingSub.productName || '',
      planName: existingSub.planName || '',
      creditsAmount: existingSub.creditsAmount,
      creditsValidDays: existingSub.creditsValidDays,
      paymentProductId: existingSub.paymentProductId || '',
      paymentResult: JSON.stringify(session.paymentResult),
      paymentAmount: paymentInfo?.paymentAmount,
      paymentCurrency: paymentInfo?.paymentCurrency,
      paymentEmail: paymentInfo?.paymentEmail,
      paidAt: paymentInfo?.paidAt || new Date(),
      invoiceId: paymentInfo?.invoiceId,
      invoiceUrl: paymentInfo?.invoiceUrl,
      paymentIntentId: paymentInfo?.paymentIntentId,
      chargeId: paymentInfo?.chargeId,
      subscriptionNo: existingSub.subscriptionNo,
      subscriptionId: session.subscriptionId,
      transactionId: paymentInfo?.transactionId,
      paymentUserName: paymentInfo?.paymentUserName,
      paymentUserId: paymentInfo?.paymentUserId,
    });

    // 3. Grant credits for renewal
    if (existingSub.creditsAmount && existingSub.creditsAmount > 0) {
      const credits = existingSub.creditsAmount;
      const expiresAt = calculateCreditExpirationTime({
        creditsValidDays: existingSub.creditsValidDays || 0,
        currentPeriodEnd: subscriptionInfo.currentPeriodEnd,
      });

      await grant({
        userId: existingSub.userId,
        userEmail: existingSub.userEmail || '',
        orderNo: renewalOrderNo,
        subscriptionNo: existingSub.subscriptionNo,
        transactionNo: getSnowId(),
        scene: 'renewal',
        credits,
        description: 'Grant credit',
        expiresAt,
        tx,
      });
    }
  });
}

// --- Renewal failure / refund / dispute ---

async function handleSubscriptionPaymentFailed(session: any, provider: string) {
  if (!session.subscriptionId) return;
  const existingSub = await findByProviderSubscriptionId({
    provider,
    subscriptionId: session.subscriptionId,
  });
  if (!existingSub) return;

  await updateBySubscriptionNo(existingSub.subscriptionNo, {
    status: SubscriptionStatus.PAST_DUE,
  });
}

async function attachInitialInvoicePayment(session: any, provider: string) {
  const metadata = session.subscriptionInfo?.metadata || session.metadata || {};
  let existingOrder: typeof order.$inferSelect | undefined;

  if (metadata.order_no) {
    [existingOrder] = await db()
      .select()
      .from(order)
      .where(eq(order.orderNo, metadata.order_no))
      .limit(1);
  }
  if (!existingOrder && session.subscriptionId) {
    [existingOrder] = await db()
      .select()
      .from(order)
      .where(
        and(
          eq(order.paymentProvider, provider),
          eq(order.subscriptionId, session.subscriptionId)
        )
      )
      .limit(1);
  }
  if (!existingOrder) return;

  await db()
    .update(order)
    .set({
      invoiceId: session.paymentInfo?.invoiceId,
      invoiceUrl: session.paymentInfo?.invoiceUrl,
      paymentIntentId: session.paymentInfo?.paymentIntentId,
      chargeId: session.paymentInfo?.chargeId,
    })
    .where(eq(order.id, existingOrder.id));
}

async function findOrderForAdjustment(session: any) {
  const invoiceId = session.paymentInfo?.invoiceId;
  const paymentIntentId = session.paymentInfo?.paymentIntentId;
  if (!invoiceId && !paymentIntentId) return null;
  const [result] = await db()
    .select()
    .from(order)
    .where(
      and(
        or(
          invoiceId ? eq(order.invoiceId, invoiceId) : undefined,
          paymentIntentId
            ? eq(order.paymentIntentId, paymentIntentId)
            : undefined
        ),
        isNull(order.deletedAt)
      )
    )
    .orderBy(desc(order.createdAt))
    .limit(1);
  return result || null;
}

async function handlePaymentRefunded(session: any, providerName: string) {
  const existingOrder = await findOrderForAdjustment(session);
  if (!existingOrder) return;

  const charge = session.paymentResult || {};
  const paidAmount = Math.max(
    1,
    charge.amount || existingOrder.paymentAmount || 1
  );
  const refundedAmount = Math.max(0, charge.amount_refunded || 0);
  let previouslyRefunded = 0;
  try {
    const previousResult = existingOrder.paymentResult
      ? JSON.parse(existingOrder.paymentResult)
      : null;
    previouslyRefunded = Math.max(0, previousResult?.amount_refunded || 0);
  } catch {
    // The first refund replaces the checkout/invoice payload with a charge.
  }
  const newlyRefunded = Math.max(0, refundedAmount - previouslyRefunded);
  const fullyRefunded =
    charge.refunded === true || refundedAmount >= paidAmount;
  const creditsToRevoke = Math.ceil(
    (existingOrder.creditsAmount || 0) * Math.min(1, newlyRefunded / paidAmount)
  );

  if (creditsToRevoke > 0) {
    await revokeByOrder({
      orderNo: existingOrder.orderNo,
      credits: creditsToRevoke,
      scene: 'refund',
      description: fullyRefunded
        ? 'Payment refunded'
        : 'Payment partially refunded',
    });
  }

  await db()
    .update(order)
    .set({
      status: fullyRefunded
        ? OrderStatus.REFUNDED
        : OrderStatus.PARTIALLY_REFUNDED,
      paymentResult: JSON.stringify(charge),
    })
    .where(eq(order.id, existingOrder.id));

  // A full refund must also stop the next renewal. The already-refunded
  // credits were revoked above, while account data remains accessible.
  if (fullyRefunded && existingOrder.subscriptionNo) {
    const sub = await findBySubscriptionNo(existingOrder.subscriptionNo);
    if (sub && isPrepaidSubscriptionId(sub.subscriptionId)) {
      await updateBySubscriptionNo(sub.subscriptionNo, {
        status: SubscriptionStatus.CANCELED,
        canceledAt: new Date(),
        canceledEndAt: new Date(),
        canceledReason: 'Payment refunded',
        canceledReasonType: 'refund',
      });
      return;
    }
    const pm = await getPaymentManager();
    const provider = pm.getProvider(providerName);
    if (sub && provider?.cancelSubscription) {
      const canceled = await provider.cancelSubscription({
        subscriptionId: sub.subscriptionId,
      });
      const info = canceled.subscriptionInfo;
      await updateBySubscriptionNo(sub.subscriptionNo, {
        status: info?.status || SubscriptionStatus.PENDING_CANCEL,
        canceledAt: info?.canceledAt || new Date(),
        canceledEndAt: info?.canceledEndAt || sub.currentPeriodEnd,
        canceledReason: 'Payment refunded',
        canceledReasonType: 'refund',
      });
    }
  }
}

async function handlePaymentDisputed(session: any, providerName: string) {
  const existingOrder = await findOrderForAdjustment(session);
  if (!existingOrder) return;

  if (existingOrder.creditsAmount) {
    await revokeByOrder({
      orderNo: existingOrder.orderNo,
      credits: existingOrder.creditsAmount,
      scene: 'dispute',
      description: 'Credits held during payment dispute',
    });
  }
  await db()
    .update(order)
    .set({ status: OrderStatus.DISPUTED })
    .where(eq(order.id, existingOrder.id));

  if (existingOrder.subscriptionNo) {
    const sub = await findBySubscriptionNo(existingOrder.subscriptionNo);
    if (sub && isPrepaidSubscriptionId(sub.subscriptionId)) {
      await updateBySubscriptionNo(sub.subscriptionNo, {
        status: SubscriptionStatus.PAUSED,
        canceledAt: new Date(),
        canceledEndAt: sub.currentPeriodEnd,
        canceledReason: 'Payment dispute opened',
        canceledReasonType: 'payment_dispute',
      });
      return;
    }
    const pm = await getPaymentManager();
    const provider = pm.getProvider(providerName);
    if (sub && provider?.cancelSubscription) {
      const canceled = await provider.cancelSubscription({
        subscriptionId: sub.subscriptionId,
      });
      const info = canceled.subscriptionInfo;
      await updateBySubscriptionNo(sub.subscriptionNo, {
        status: info?.status || SubscriptionStatus.PENDING_CANCEL,
        canceledAt: info?.canceledAt || new Date(),
        canceledEndAt: info?.canceledEndAt || sub.currentPeriodEnd,
        canceledReason: 'Payment dispute opened',
        canceledReasonType: 'payment_dispute',
      });
    }
  }
}

async function handlePaymentDisputeClosed(
  session: any,
  rawEvent: any,
  providerName: string
) {
  const existingOrder = await findOrderForAdjustment(session);
  if (!existingOrder) return;

  const dispute = rawEvent?.data?.object || {};
  if (dispute.status === 'won') {
    await restoreOrderDisputeCredits(existingOrder.orderNo);
    await db()
      .update(order)
      .set({ status: OrderStatus.PAID })
      .where(eq(order.id, existingOrder.id));

    if (existingOrder.subscriptionNo) {
      const sub = await findBySubscriptionNo(existingOrder.subscriptionNo);
      if (
        sub &&
        isPrepaidSubscriptionId(sub.subscriptionId) &&
        sub.status === SubscriptionStatus.PAUSED &&
        sub.canceledReasonType === 'payment_dispute'
      ) {
        await updateBySubscriptionNo(sub.subscriptionNo, {
          status:
            sub.currentPeriodEnd && sub.currentPeriodEnd > new Date()
              ? SubscriptionStatus.ACTIVE
              : SubscriptionStatus.EXPIRED,
          canceledAt: null,
          canceledEndAt: null,
          canceledReason: '',
          canceledReasonType: '',
        });
        return;
      }
      const pm = await getPaymentManager();
      const provider = pm.getProvider(providerName);
      if (
        sub?.status === SubscriptionStatus.PENDING_CANCEL &&
        sub.canceledReasonType === 'payment_dispute' &&
        provider?.resumeSubscription
      ) {
        const resumed = await provider.resumeSubscription({
          subscriptionId: sub.subscriptionId,
        });
        await updateBySubscriptionNo(sub.subscriptionNo, {
          status: resumed.subscriptionInfo?.status || SubscriptionStatus.ACTIVE,
          canceledAt: null,
          canceledEndAt: null,
          canceledReason: '',
          canceledReasonType: '',
        });
      }
    }
  } else if (dispute.status === 'lost') {
    await db()
      .update(order)
      .set({ status: OrderStatus.REFUNDED })
      .where(eq(order.id, existingOrder.id));

    if (existingOrder.subscriptionNo) {
      const sub = await findBySubscriptionNo(existingOrder.subscriptionNo);
      if (sub && isPrepaidSubscriptionId(sub.subscriptionId)) {
        await updateBySubscriptionNo(sub.subscriptionNo, {
          status: SubscriptionStatus.CANCELED,
          canceledAt: new Date(),
          canceledEndAt: new Date(),
          canceledReason: 'Payment dispute lost',
          canceledReasonType: 'payment_dispute',
        });
      }
    }
  }
}

// --- Subscription Updated ---

async function handleSubscriptionUpdated(session: any, provider: string) {
  if (!session.subscriptionId || !session.subscriptionInfo) return;

  const existingSub = await findByProviderSubscriptionId({
    provider,
    subscriptionId: session.subscriptionId,
  });
  if (!existingSub) return;

  const info = session.subscriptionInfo;
  await updateBySubscriptionNo(existingSub.subscriptionNo, {
    status: info.status,
    currentPeriodStart: info.currentPeriodStart,
    currentPeriodEnd: info.currentPeriodEnd,
    canceledAt: info.canceledAt || null,
    canceledEndAt: info.canceledEndAt || null,
    canceledReason: info.canceledReason || '',
    canceledReasonType: info.canceledReasonType || '',
  });
}

// --- Subscription Canceled ---

async function handleSubscriptionCanceled(session: any, provider: string) {
  if (!session.subscriptionId || !session.subscriptionInfo) return;

  const existingSub = await findByProviderSubscriptionId({
    provider,
    subscriptionId: session.subscriptionId,
  });
  if (!existingSub) return;

  const info = session.subscriptionInfo;
  await updateBySubscriptionNo(existingSub.subscriptionNo, {
    status: SubscriptionStatus.CANCELED,
    canceledAt: info.canceledAt,
    canceledEndAt: info.canceledEndAt,
    canceledReason: info.canceledReason,
    canceledReasonType: info.canceledReasonType,
  });
}

// --- Cancel subscription (user-initiated) ---

export async function cancelUserSubscription(params: {
  userId: string;
  subscriptionNo: string;
}) {
  const { userId, subscriptionNo } = params;

  const sub = await findBySubscriptionNo(subscriptionNo);
  if (!sub) throw new Error('Subscription not found');
  if (sub.userId !== userId) throw new Error('Forbidden');

  if (
    sub.status === SubscriptionStatus.CANCELED ||
    sub.status === SubscriptionStatus.EXPIRED
  ) {
    return sub;
  }

  if (isPrepaidSubscriptionId(sub.subscriptionId)) {
    throw new Error(
      'Prepaid memberships do not auto-renew and cannot be canceled.'
    );
  }

  const pm = await getPaymentManager();
  const provider = pm.getProvider(sub.paymentProvider);
  if (!provider || !provider.cancelSubscription) {
    throw new Error('Cancellation not supported for this provider');
  }

  const session = await provider.cancelSubscription({
    subscriptionId: sub.subscriptionId,
  });

  const info = session.subscriptionInfo;
  const updated = await updateBySubscriptionNo(subscriptionNo, {
    status: info?.status || SubscriptionStatus.CANCELED,
    canceledAt: info?.canceledAt || new Date(),
    canceledEndAt: info?.canceledEndAt || null,
    canceledReason: info?.canceledReason || 'Canceled by user',
    canceledReasonType: info?.canceledReasonType || 'user_request',
  });

  return updated;
}

export async function resumeUserSubscription(params: {
  userId: string;
  subscriptionNo: string;
}) {
  const sub = await findBySubscriptionNo(params.subscriptionNo);
  if (!sub) throw new Error('Subscription not found');
  if (sub.userId !== params.userId) throw new Error('Forbidden');
  if (isPrepaidSubscriptionId(sub.subscriptionId)) {
    throw new Error('Prepaid memberships cannot be resumed.');
  }
  if (sub.status !== SubscriptionStatus.PENDING_CANCEL) return sub;

  const pm = await getPaymentManager();
  const provider = pm.getProvider(sub.paymentProvider);
  if (!provider?.resumeSubscription) {
    throw new Error('Resuming is not supported for this provider');
  }

  const session = await provider.resumeSubscription({
    subscriptionId: sub.subscriptionId,
  });
  const info = session.subscriptionInfo;
  return updateBySubscriptionNo(sub.subscriptionNo, {
    status: info?.status || SubscriptionStatus.ACTIVE,
    canceledAt: null,
    canceledEndAt: null,
    canceledReason: '',
    canceledReasonType: '',
  });
}

export async function getUserBillingPortal(params: {
  userId: string;
  subscriptionNo: string;
}) {
  const sub = await findBySubscriptionNo(params.subscriptionNo);
  if (!sub) throw new Error('Subscription not found');
  if (sub.userId !== params.userId) throw new Error('Forbidden');
  if (isPrepaidSubscriptionId(sub.subscriptionId)) {
    throw new Error('Prepaid memberships do not have a billing portal.');
  }
  if (!sub.paymentUserId) throw new Error('Billing customer is unavailable');

  const pm = await getPaymentManager();
  const provider = pm.getProvider(sub.paymentProvider);
  if (!provider?.getPaymentBilling) {
    throw new Error('Billing portal is not supported for this provider');
  }
  const configs = await getAllConfigs();
  return provider.getPaymentBilling({
    customerId: sub.paymentUserId,
    returnUrl: `${configs.app_url || 'http://localhost:3000'}/settings/billing`,
  });
}

// --- Query helpers ---

export async function getUserOrders(userId: string) {
  return db()
    .select()
    .from(order)
    .where(and(eq(order.userId, userId), isNull(order.deletedAt)))
    .orderBy(desc(order.createdAt));
}
