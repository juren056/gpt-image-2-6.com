/** Checkout needs a credential and a signed callback to fulfil purchases. */
export function isStripeCheckoutReady(configs: Record<string, string>) {
  return (
    configs.stripe_enabled === 'true' &&
    Boolean(configs.stripe_secret_key || configs.stripe_api_key) &&
    Boolean(configs.stripe_signing_secret || configs.stripe_webhook_secret)
  );
}
