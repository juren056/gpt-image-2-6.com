type TurnstileVerification = {
  success?: boolean;
  action?: string;
};

export async function verifyTurnstileToken(params: {
  token: string;
  secretKey: string;
  remoteIp?: string;
  expectedAction?: string;
}) {
  if (!params.token.trim()) return false;

  const body = new URLSearchParams({
    secret: params.secretKey,
    response: params.token,
  });
  if (params.remoteIp) body.set('remoteip', params.remoteIp);

  try {
    const response = await fetch(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body,
        signal: AbortSignal.timeout(5_000),
      }
    );
    if (!response.ok) return false;
    const result = (await response.json()) as TurnstileVerification;
    if (!result.success) return false;
    return !params.expectedAction || result.action === params.expectedAction;
  } catch {
    // Cost-bearing anonymous generation fails closed if verification is down.
    // Signed-in generation remains available through the credit path.
    return false;
  }
}
