import { useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from '@tanstack/react-form';
import { createFileRoute } from '@tanstack/react-router';
import {
  ArrowLeft,
  ChevronDown,
  Github,
  KeyRound,
  Loader2,
  Mail,
} from 'lucide-react';
import { z } from 'zod';

import { authClient, signIn, useSession } from '@/core/auth/client';
import { Link, useRouter } from '@/core/i18n/navigation';
import { envConfigs } from '@/config';
import { trackFunnelEvent } from '@/lib/analytics-events';
import { formatAuthError } from '@/lib/auth-error';
import {
  buildAuthSwitchQuery,
  resolvePostAuthDestination,
  toAbsoluteAuthCallbackURL,
  validateAuthSearch,
} from '@/lib/auth-navigation';
import { m } from '@/paraglide/messages.js';
import { localizeHref } from '@/paraglide/runtime.js';
import { usePublicConfig } from '@/hooks/use-public-config';
import { AuthMarketingShell } from '@/components/auth-marketing-shell';
import { TextField } from '@/components/form-field';
import { Button } from '@/components/ui/button';
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';

const RESEND_COOLDOWN_SECONDS = 60;

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4">
      <path
        fill="#4285F4"
        d="M21.35 12.23c0-.71-.06-1.4-.18-2.07H12v3.91h5.24a4.48 4.48 0 0 1-1.94 2.94v2.54h3.14c1.84-1.69 2.91-4.18 2.91-7.32Z"
      />
      <path
        fill="#34A853"
        d="M12 21.75c2.63 0 4.84-.87 6.45-2.36l-3.14-2.54c-.87.58-1.98.93-3.31.93-2.54 0-4.69-1.72-5.46-4.03H3.29v2.62A9.75 9.75 0 0 0 12 21.75Z"
      />
      <path
        fill="#FBBC05"
        d="M6.54 13.75A5.86 5.86 0 0 1 6.23 12c0-.61.1-1.2.31-1.75V7.63H3.29A9.74 9.74 0 0 0 2.25 12c0 1.57.38 3.06 1.04 4.37l3.25-2.62Z"
      />
      <path
        fill="#EA4335"
        d="M12 6.22c1.43 0 2.71.49 3.72 1.45l2.79-2.79A9.35 9.35 0 0 0 12 2.25a9.75 9.75 0 0 0-8.71 5.38l3.25 2.62C7.31 7.94 9.46 6.22 12 6.22Z"
      />
    </svg>
  );
}

function SignInPage() {
  const router = useRouter();
  const { data: session, isPending: sessionPending } = useSession();
  const navigatingRef = useRef(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otpStage, setOtpStage] = useState<'email' | 'code'>('email');
  const [otpEmail, setOtpEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [otpPending, setOtpPending] = useState(false);
  const [socialPending, setSocialPending] = useState<
    'google' | 'github' | null
  >(null);
  const [cooldown, setCooldown] = useState(0);

  const search = Route.useSearch();
  const afterLoginUrl = resolvePostAuthDestination(search);
  const switchQuery = buildAuthSwitchQuery(afterLoginUrl);
  const signInSchema = z.object({
    email: z
      .string()
      .trim()
      .min(1, m['common.sign.validation_email_required']())
      .email(m['common.sign.validation_email_invalid']()),
    password: z
      .string()
      .min(1, m['common.sign.validation_password_required']()),
  });
  const emailSchema = z
    .string()
    .trim()
    .min(1, m['common.sign.validation_email_required']())
    .email(m['common.sign.validation_email_invalid']());

  useEffect(() => {
    if (sessionPending || navigatingRef.current) return;
    if (session?.user) {
      if (window.sessionStorage.getItem('qwenimage3:signup-pending')) {
        trackFunnelEvent('signup_success');
        window.sessionStorage.removeItem('qwenimage3:signup-pending');
      }
      navigatingRef.current = true;
      window.location.assign(localizeHref(afterLoginUrl));
    }
  }, [afterLoginUrl, sessionPending, session?.user]);

  useEffect(() => {
    if (search.authError === 'oauth') {
      setError(m['common.sign.oauth_failed']());
    }
  }, [search.authError]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setTimeout(
      () => setCooldown((value) => value - 1),
      1000
    );
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  const configQuery = usePublicConfig();
  const configs = configQuery.data ?? {};
  const configsLoaded = configQuery.isSuccess;
  const emailEnabled = configs.email_auth_enabled !== 'false';
  const emailOtpEnabled = configs.email_otp_sign_in_enabled === 'true';
  const googleEnabled = configs.google_auth_enabled === 'true';
  const githubEnabled = configs.github_auth_enabled === 'true';
  const passwordResetEnabled = configs.password_reset_enabled === 'true';
  const hasSocial = googleEnabled || githubEnabled;
  const hasAnyMethod = emailEnabled || emailOtpEnabled || hasSocial;
  const starterCredits =
    configs.initial_credits_enabled === 'true'
      ? Math.max(
          0,
          Number.parseInt(configs.initial_credits_amount || '0', 10) || 0
        )
      : 0;

  useEffect(() => {
    if (configsLoaded && !emailOtpEnabled) setShowPassword(true);
  }, [configsLoaded, emailOtpEnabled]);

  const oauthErrorCallback = useMemo(() => {
    const params = new URLSearchParams({
      authError: 'oauth',
      callbackUrl: afterLoginUrl,
    });
    return `/sign-in?${params.toString()}`;
  }, [afterLoginUrl]);

  function finishSignIn() {
    navigatingRef.current = true;
    window.location.assign(localizeHref(afterLoginUrl));
  }

  async function sendSignInCode() {
    trackFunnelEvent('email_signup_clicked', { source: 'auth_page' });
    setError('');
    const parsed = emailSchema.safeParse(otpEmail);
    if (!parsed.success) {
      setError(
        parsed.error.issues[0]?.message ||
          m['common.sign.error_sign_in_failed']()
      );
      return;
    }

    const email = parsed.data.toLowerCase();
    setOtpPending(true);
    try {
      const result = await authClient.emailOtp.sendVerificationOtp({
        email,
        type: 'sign-in',
      });
      if (result.error) {
        setError(
          formatAuthError(
            result.error,
            m['common.sign.email_code_send_failed']()
          )
        );
        return;
      }
      setOtpEmail(email);
      setOtp('');
      setOtpStage('code');
      setCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (err: unknown) {
      setError(formatAuthError(err, m['common.sign.email_code_send_failed']()));
    } finally {
      setOtpPending(false);
    }
  }

  async function verifySignInCode() {
    setError('');
    if (!/^\d{6}$/.test(otp)) {
      setError(m['common.sign.verify_email_code_invalid']());
      return;
    }

    setOtpPending(true);
    try {
      const defaultName = otpEmail.split('@')[0]?.slice(0, 64) || 'User';
      const result = await authClient.signIn.emailOtp({
        email: otpEmail,
        otp,
        name: defaultName,
      });
      if (result.error) {
        setError(
          formatAuthError(result.error, m['common.sign.email_code_invalid']())
        );
        return;
      }
      finishSignIn();
    } catch (err: unknown) {
      setError(formatAuthError(err, m['common.sign.email_code_invalid']()));
    } finally {
      setOtpPending(false);
    }
  }

  const form = useForm({
    defaultValues: { email: '', password: '' },
    validators: { onSubmit: signInSchema },
    onSubmit: async ({ value }) => {
      setError('');
      try {
        const result: any = await signIn.email({
          email: value.email.trim().toLowerCase(),
          password: value.password,
        });
        if (result.error) {
          const status = result.error.status;
          const code = result.error.code;
          const msg = result.error.message || '';
          if (
            code === 'EMAIL_NOT_VERIFIED' ||
            (status === 403 && /not verified/i.test(msg))
          ) {
            let verificationSent = false;
            try {
              const sendResult = await authClient.emailOtp.sendVerificationOtp({
                email: value.email.trim().toLowerCase(),
                type: 'email-verification',
              });
              verificationSent = !sendResult.error;
            } catch {
              verificationSent = false;
            }

            const verifyParams = new URLSearchParams({
              email: value.email.trim().toLowerCase(),
              callbackUrl: afterLoginUrl,
              [verificationSent ? 'sent' : 'sendFailed']: '1',
            });
            router.push(`/verify-email?${verifyParams.toString()}`);
            return;
          }
          setError(
            formatAuthError(
              result.error,
              m['common.sign.error_sign_in_failed']()
            )
          );
        } else {
          finishSignIn();
        }
      } catch (err: unknown) {
        if (import.meta.env.DEV) {
          console.error(
            'Sign-in request failed',
            err instanceof Error ? err.message : 'Unknown error'
          );
        }
        setError(formatAuthError(err, m['common.sign.error_sign_in_failed']()));
      }
    },
  });

  async function handleSocial(provider: 'google' | 'github') {
    if (socialPending) return;
    setError('');
    setSocialPending(provider);
    if (provider === 'google') {
      trackFunnelEvent('google_signup_clicked', { source: 'auth_page' });
    }
    try {
      // Better Auth 1.6 rejects relative callback URLs that contain a hash.
      // Use a validated same-origin absolute URL so destinations such as
      // /#generator survive the OAuth round trip.
      const callbackURL = toAbsoluteAuthCallbackURL(
        afterLoginUrl,
        window.location.origin
      );
      const result = await signIn.social({
        provider,
        callbackURL,
        // This relative URL contains no literal fragment; the nested callback
        // value is query-encoded, so Better Auth accepts it safely.
        errorCallbackURL: oauthErrorCallback,
      });
      if (result?.error) {
        setError(m['common.sign.oauth_failed']());
        setSocialPending(null);
      }
    } catch {
      setError(m['common.sign.oauth_failed']());
      setSocialPending(null);
    }
  }

  return (
    <AuthMarketingShell starterCredits={starterCredits}>
      <section className="w-full" aria-labelledby="sign-in-title">
        <div className="mb-8 space-y-3 text-center">
          <Link
            href="/"
            className="text-muted-foreground hover:text-foreground inline-block font-serif text-base italic transition-colors"
          >
            {envConfigs.app_name}
          </Link>
          <h1
            id="sign-in-title"
            className="text-foreground text-3xl font-bold tracking-tight"
          >
            {m['common.sign.login_to']({ appName: envConfigs.app_name })}
          </h1>
        </div>
        <div>
          {!configsLoaded ? (
            <div className="flex min-h-32 items-center justify-center">
              <Loader2 className="text-muted-foreground size-5 animate-spin" />
            </div>
          ) : !hasAnyMethod ? (
            <div className="rounded-lg border border-dashed p-6 text-center">
              <p className="text-sm font-medium">
                {m['common.sign.no_methods_title']()}
              </p>
              <p className="text-muted-foreground mt-1 text-sm">
                {m['common.sign.no_methods_description']()}
              </p>
            </div>
          ) : otpStage === 'code' ? (
            <div className="space-y-4">
              {error && (
                <div className="bg-destructive/10 text-destructive rounded-lg p-3 text-sm">
                  {error}
                </div>
              )}
              <div className="space-y-1 text-center">
                <p className="font-medium">
                  {m['common.sign.email_code_title']()}
                </p>
                <p className="text-muted-foreground text-sm">
                  {m['common.sign.email_code_description']({
                    email: otpEmail,
                  })}
                </p>
              </div>
              <Input
                value={otp}
                onChange={(event) =>
                  setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))
                }
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && otp.length === 6) {
                    void verifySignInCode();
                  }
                }}
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                autoFocus
                aria-label={m['common.sign.verify_email_code_label']()}
                placeholder="000000"
                className="h-14 text-center font-mono text-2xl tracking-[0.45em]"
              />
              <Button
                className="w-full"
                disabled={otpPending || otp.length !== 6}
                onClick={verifySignInCode}
              >
                {otpPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <>
                    <KeyRound className="size-4" />
                    {m['common.sign.sign_in_with_code']()}
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                disabled={otpPending || cooldown > 0}
                onClick={sendSignInCode}
              >
                {cooldown > 0
                  ? m['common.sign.resend_code_countdown']({
                      seconds: cooldown,
                    })
                  : m['common.sign.resend_code']()}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => {
                  setError('');
                  setOtp('');
                  setOtpStage('email');
                }}
              >
                <ArrowLeft className="size-4" />
                {m['common.sign.use_different_email']()}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {error && (
                <div className="bg-destructive/10 text-destructive rounded-lg p-3 text-sm">
                  {error}
                </div>
              )}

              {hasSocial && (
                <div className="space-y-2">
                  {googleEnabled && (
                    <Button
                      variant="outline"
                      type="button"
                      className="h-11 w-full bg-transparent"
                      disabled={socialPending !== null}
                      onClick={() => handleSocial('google')}
                    >
                      {socialPending === 'google' ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <GoogleIcon />
                      )}
                      {m['common.sign.google_sign_in']()}
                    </Button>
                  )}
                  {githubEnabled && (
                    <Button
                      variant="outline"
                      type="button"
                      className="h-11 w-full bg-transparent"
                      disabled={socialPending !== null}
                      onClick={() => handleSocial('github')}
                    >
                      {socialPending === 'github' ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Github className="size-4" />
                      )}
                      {m['common.sign.github_sign_in']()}
                    </Button>
                  )}
                </div>
              )}

              {emailOtpEnabled && hasSocial && (
                <FieldSeparator>{m['common.sign.or']()}</FieldSeparator>
              )}

              {emailOtpEnabled && (
                <div className="space-y-3">
                  <Input
                    type="email"
                    value={otpEmail}
                    onChange={(event) => setOtpEmail(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') void sendSignInCode();
                    }}
                    autoComplete="email"
                    placeholder={m['common.sign.email_placeholder']()}
                    aria-label={m['common.sign.email_title']()}
                    className="h-11"
                  />
                  <Button
                    type="button"
                    className="bg-foreground text-background hover:bg-foreground/90 h-11 w-full"
                    disabled={otpPending}
                    onClick={sendSignInCode}
                  >
                    {otpPending ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <>
                        <Mail className="size-4" />
                        {m['common.sign.continue_with_email']()}
                      </>
                    )}
                  </Button>
                  <p className="text-muted-foreground text-center text-xs">
                    {m['common.sign.email_code_tip']()}
                  </p>
                </div>
              )}

              {emailEnabled && emailOtpEnabled && !showPassword && (
                <Button
                  type="button"
                  variant="ghost"
                  className="mt-2 w-full"
                  onClick={() => setShowPassword(true)}
                >
                  {m['common.sign.show_other_options']()}
                  <ChevronDown className="size-4" />
                </Button>
              )}

              {emailEnabled && showPassword && (
                <>
                  {(emailOtpEnabled || hasSocial) && (
                    <FieldSeparator>
                      {m['common.sign.password_sign_in']()}
                    </FieldSeparator>
                  )}
                  <form
                    noValidate
                    onSubmit={(event) => {
                      event.preventDefault();
                      const validation = signInSchema.safeParse(
                        form.state.values
                      );
                      if (!validation.success) {
                        setError(
                          validation.error.issues[0]?.message ||
                            m['common.sign.error_sign_in_failed']()
                        );
                        return;
                      }
                      form.handleSubmit();
                    }}
                  >
                    <FieldGroup>
                      <form.Field name="email">
                        {(field) => (
                          <TextField
                            field={field}
                            label={m['common.sign.email_title']()}
                            type="email"
                            required
                            autoComplete="email"
                            placeholder={m['common.sign.email_placeholder']()}
                          />
                        )}
                      </form.Field>
                      <form.Field name="password">
                        {(field) => (
                          <Field>
                            <div className="flex items-center justify-between">
                              <FieldLabel htmlFor={field.name}>
                                {m['common.sign.password_title']()}
                              </FieldLabel>
                              {passwordResetEnabled && (
                                <Link
                                  href="/forgot-password"
                                  className="text-muted-foreground hover:text-foreground text-sm underline underline-offset-4"
                                >
                                  {m['common.sign.forgot_password']()}
                                </Link>
                              )}
                            </div>
                            <Input
                              id={field.name}
                              name={field.name}
                              type="password"
                              value={field.state.value}
                              onChange={(event) =>
                                field.handleChange(event.target.value)
                              }
                              onBlur={field.handleBlur}
                              required
                              autoComplete="current-password"
                              placeholder={m[
                                'common.sign.password_placeholder'
                              ]()}
                            />
                          </Field>
                        )}
                      </form.Field>
                      <form.Subscribe selector={(state) => state.isSubmitting}>
                        {(isSubmitting) => (
                          <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? (
                              <Loader2 className="size-4 animate-spin" />
                            ) : (
                              m['common.sign.password_sign_in']()
                            )}
                          </Button>
                        )}
                      </form.Subscribe>
                    </FieldGroup>
                  </form>
                </>
              )}

              {emailEnabled && (
                <FieldDescription className="text-center">
                  {m['common.sign.no_account']()}{' '}
                  <Link
                    href={`/sign-up${switchQuery}`}
                    className="underline underline-offset-4"
                  >
                    {m['common.sign.sign_up_title']()}
                  </Link>
                </FieldDescription>
              )}
            </div>
          )}
        </div>
      </section>
    </AuthMarketingShell>
  );
}

export const Route = createFileRoute('/(auth)/sign-in')({
  validateSearch: validateAuthSearch,
  component: SignInPage,
});
