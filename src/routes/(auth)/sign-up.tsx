import { useCallback, useEffect, useRef, useState } from 'react';
import { useForm } from '@tanstack/react-form';
import { createFileRoute } from '@tanstack/react-router';
import { Github, Loader2 } from 'lucide-react';
import { z } from 'zod';

import { authClient, signIn, signUp, useSession } from '@/core/auth/client';
import { Link, useRouter } from '@/core/i18n/navigation';
import { trackFunnelEvent } from '@/lib/analytics-events';
import { apiPost } from '@/lib/api-client';
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
import { AuthMarketingShell } from '@/blocks/auth-marketing-shell';
import { AuthConfigFeedback } from '@/components/auth-config-feedback';
import { AuthPasswordField } from '@/components/auth-password-field';
import { TextField } from '@/components/form-field';
import { GoogleIcon } from '@/components/google-icon';
import { TurnstileWidget } from '@/components/turnstile-widget';
import { Button } from '@/components/ui/button';
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldSeparator,
} from '@/components/ui/field';

function SignUpPage() {
  const router = useRouter();
  const { data: session, isPending: sessionPending } = useSession();
  // Set right before we navigate so the already-signed-in effect doesn't also fire.
  const navigatingRef = useRef(false);
  const [error, setError] = useState('');
  const [socialPending, setSocialPending] = useState<
    'google' | 'github' | null
  >(null);
  const [captchaToken, setCaptchaToken] = useState('');
  const [captchaResetSignal, setCaptchaResetSignal] = useState(0);
  const handleCaptchaToken = useCallback((token: string) => {
    setCaptchaToken(token);
  }, []);

  const search = Route.useSearch();
  const afterLoginUrl = resolvePostAuthDestination(search);
  const switchQuery = buildAuthSwitchQuery(afterLoginUrl);
  const signUpSchema = z
    .object({
      name: z
        .string()
        .trim()
        .min(1, m['common.sign.validation_name_required']()),
      email: z
        .string()
        .trim()
        .min(1, m['common.sign.validation_email_required']())
        .email(m['common.sign.validation_email_invalid']()),
      password: z.string().min(8, m['common.sign.validation_password_min']()),
      confirmPassword: z
        .string()
        .min(1, m['common.sign.validation_confirm_password_required']()),
      inviteCode: z.string(),
    })
    .refine((d) => d.password === d.confirmPassword, {
      path: ['confirmPassword'],
      message: m['common.sign.password_mismatch'](),
    });

  // Already signed in (visited /sign-up directly, or a stale callbackUrl looped
  // back here) → go home. The auth pages never gate themselves, so this can't loop.
  useEffect(() => {
    if (sessionPending || navigatingRef.current) return;
    if (session?.user) {
      navigatingRef.current = true;
      router.push('/');
    }
  }, [sessionPending, session?.user, router]);

  const configQuery = usePublicConfig();
  // The root also requests public config. Its cache can resolve before this
  // lazy route hydrates, so keep the first client render identical to SSR.
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  const configs = hydrated ? (configQuery.data ?? {}) : {};

  const configsLoaded = hydrated && configQuery.isSuccess;
  const emailEnabled = configs.email_auth_enabled !== 'false';
  const emailOtpEnabled = configs.email_otp_sign_in_enabled === 'true';
  const googleEnabled = configs.google_auth_enabled === 'true';
  const githubEnabled = configs.github_auth_enabled === 'true';
  const emailVerificationEnabled =
    configs.email_verification_enabled === 'true';
  const inviteCodeRequired = configs.invite_code_required === 'true';
  const turnstileEnabled = configs.turnstile_enabled === 'true';
  const turnstileSiteKey = configs.turnstile_site_key || '';
  // Invite-only mode cannot collect an invite code during an OAuth redirect,
  // so hide social creation while preserving email sign-up enforcement.
  const hasSocial = !inviteCodeRequired && (googleEnabled || githubEnabled);
  const hasAnyMethod = emailEnabled || emailOtpEnabled || hasSocial;
  const starterCredits =
    configs.initial_credits_enabled === 'true'
      ? Math.max(
          0,
          Number.parseInt(configs.initial_credits_amount || '0', 10) || 0
        )
      : 0;

  const form = useForm({
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      inviteCode: '',
    },
    validators: { onSubmit: signUpSchema },
    onSubmit: async ({ value }) => {
      setError('');
      const trimmedInvite = value.inviteCode.trim();
      if (inviteCodeRequired && !trimmedInvite) {
        setError(m['common.sign.invite_code_required']());
        return;
      }
      try {
        // Pre-validate invite code so we don't create an unredeemable account.
        if (inviteCodeRequired) {
          try {
            await apiPost('/api/invite-codes/validate', {
              code: trimmedInvite,
            });
          } catch (err: any) {
            setError(err?.message || m['common.sign.invite_code_invalid']());
            return;
          }
        }

        const result = await signUp.email({
          name: value.name.trim(),
          email: value.email.trim().toLowerCase(),
          password: value.password,
          fetchOptions: {
            headers: {
              ...(trimmedInvite ? { 'x-invite-code': trimmedInvite } : {}),
              ...(turnstileEnabled && captchaToken
                ? { 'x-captcha-response': captchaToken }
                : {}),
            },
          },
        });
        if (result.error) {
          setError(
            formatAuthError(
              result.error,
              m['common.sign.error_sign_up_failed']()
            )
          );
          if (turnstileEnabled) setCaptchaResetSignal((value) => value + 1);
          return;
        }

        // Try to redeem when feature is enabled.
        // - Without email verification: we have a session immediately, redeem now.
        // - With email verification: redeem after sign-in; we still attempt now in
        //   case autoSignIn is on, and silently swallow the unauthorized failure.
        if (inviteCodeRequired && trimmedInvite) {
          try {
            await apiPost('/api/invite-codes/redeem', { code: trimmedInvite });
          } catch {}
        }

        if (emailVerificationEnabled) {
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
          const verifyPath = `/verify-email?${verifyParams.toString()}`;
          router.push(verifyPath);
        } else {
          // Hard navigation so the destination reloads with a fresh session
          // cookie — a client push would let the guard read a stale (logged-out)
          // session store and bounce straight back to /sign-in.
          navigatingRef.current = true;
          window.location.assign(localizeHref(afterLoginUrl));
        }
      } catch (err: unknown) {
        if (turnstileEnabled) setCaptchaResetSignal((value) => value + 1);
        if (import.meta.env.DEV) {
          console.error(
            'Sign-up request failed',
            err instanceof Error ? err.message : 'Unknown error'
          );
        }
        setError(formatAuthError(err, m['common.sign.error_sign_up_failed']()));
      }
    },
  });

  async function handleSocial(provider: 'google' | 'github') {
    if (provider === 'google') {
      trackFunnelEvent('google_signup_clicked', { source: 'signup_page' });
      window.sessionStorage.setItem('image-studio:signup-pending', '1');
    }
    const callbackURL = toAbsoluteAuthCallbackURL(
      afterLoginUrl,
      window.location.origin
    );
    setError('');
    setSocialPending(provider);
    try {
      const result = await signIn.social({ provider, callbackURL });
      if (result.error)
        setError(
          formatAuthError(result.error, m['common.sign.error_sign_in_failed']())
        );
    } catch (err: unknown) {
      setError(formatAuthError(err, m['common.sign.error_sign_in_failed']()));
    } finally {
      setSocialPending(null);
    }
  }

  return (
    <AuthMarketingShell starterCredits={starterCredits} mode="sign-up">
      <section aria-labelledby="sign-up-title">
        <div className="auth-form-heading">
          <h1 id="sign-up-title">{m['common.sign.sign_up_title']()}</h1>
          <p>{m['common.sign.sign_up_description']()}</p>
        </div>
        {!configsLoaded ? (
          <AuthConfigFeedback
            failed={hydrated && configQuery.isError}
            pending={configQuery.isFetching}
            message={m['common.error.message']()}
            retryLabel={m['common.error.retry']()}
            loadingLabel={m['settings.profile.loading']()}
            onRetry={() => void configQuery.refetch()}
          />
        ) : !hasAnyMethod ? (
          <div className="rounded-lg border border-dashed p-6 text-center">
            <p className="text-sm font-medium">
              {m['common.sign.no_methods_title']()}
            </p>
            <p className="text-muted-foreground mt-1 text-sm">
              {m['common.sign.no_methods_description']()}
            </p>
          </div>
        ) : (
          <form
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              const validation = signUpSchema.safeParse(form.state.values);
              if (!validation.success) {
                setError(
                  validation.error.issues[0]?.message ||
                    m['common.sign.error_sign_up_failed']()
                );
                return;
              }
              form.handleSubmit();
            }}
          >
            <FieldGroup>
              {error && (
                <div
                  role="alert"
                  className="bg-destructive/10 text-destructive rounded-lg p-3 text-sm"
                >
                  {error}
                </div>
              )}

              {hasSocial && (
                <Field>
                  {googleEnabled && (
                    <Button
                      variant="outline"
                      data-auth-variant="outline"
                      type="button"
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
                      data-auth-variant="outline"
                      type="button"
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
                </Field>
              )}

              {hasSocial && (emailEnabled || emailOtpEnabled) && (
                <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card">
                  {m['common.sign.or']()}
                </FieldSeparator>
              )}

              {emailOtpEnabled && (
                <Field>
                  <Link
                    href={`/sign-in${switchQuery}`}
                    onClick={() => {
                      trackFunnelEvent('email_signup_clicked', {
                        source: 'signup_page',
                      });
                      window.sessionStorage.setItem(
                        'image-studio:signup-pending',
                        '1'
                      );
                    }}
                    className="auth-email-link"
                  >
                    {m['common.sign.continue_with_email']()}
                  </Link>
                  <FieldDescription className="text-center">
                    {m['common.sign.email_code_tip']()}
                  </FieldDescription>
                </Field>
              )}

              {emailEnabled && !emailOtpEnabled && (
                <>
                  <form.Field name="name">
                    {(field) => (
                      <TextField
                        field={field}
                        label={m['common.sign.name_title']()}
                        type="text"
                        autoComplete="name"
                        required
                        placeholder={m['common.sign.name_placeholder']()}
                      />
                    )}
                  </form.Field>
                  <form.Field name="email">
                    {(field) => (
                      <TextField
                        field={field}
                        label={m['common.sign.email_title']()}
                        type="email"
                        autoComplete="email"
                        required
                        placeholder={m['common.sign.email_placeholder']()}
                      />
                    )}
                  </form.Field>
                  <form.Field name="password">
                    {(field) => (
                      <AuthPasswordField
                        showLabel={m['common.sign.gallery_show_password']()}
                        hideLabel={m['common.sign.gallery_hide_password']()}
                        field={field}
                        label={m['common.sign.password_title']()}
                        placeholder={m['common.sign.password_placeholder']()}
                      />
                    )}
                  </form.Field>
                  <form.Field name="confirmPassword">
                    {(field) => (
                      <AuthPasswordField
                        showLabel={m['common.sign.gallery_show_password']()}
                        hideLabel={m['common.sign.gallery_hide_password']()}
                        field={field}
                        label={m['common.sign.confirm_password_title']()}
                        placeholder={m[
                          'common.sign.confirm_password_placeholder'
                        ]()}
                      />
                    )}
                  </form.Field>
                  {inviteCodeRequired && (
                    <form.Field name="inviteCode">
                      {(field) => (
                        <TextField
                          field={field}
                          label={m['common.sign.invite_code_title']()}
                          type="text"
                          required
                          placeholder={m[
                            'common.sign.invite_code_placeholder'
                          ]()}
                        />
                      )}
                    </form.Field>
                  )}
                  {turnstileEnabled && turnstileSiteKey && (
                    <Field>
                      <TurnstileWidget
                        siteKey={turnstileSiteKey}
                        onTokenChange={handleCaptchaToken}
                        resetSignal={captchaResetSignal}
                      />
                    </Field>
                  )}
                  <Field>
                    <form.Subscribe selector={(s) => s.isSubmitting}>
                      {(isSubmitting) => (
                        <Button
                          type="submit"
                          disabled={
                            isSubmitting || (turnstileEnabled && !captchaToken)
                          }
                        >
                          {isSubmitting ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : (
                            m['common.sign.sign_up_title']()
                          )}
                        </Button>
                      )}
                    </form.Subscribe>
                    <FieldDescription className="text-center">
                      {m['common.sign.already_have_account']()}{' '}
                      <Link
                        href={`/sign-in${switchQuery}`}
                        className="underline underline-offset-4"
                      >
                        {m['common.sign.sign_in_title']()}
                      </Link>
                    </FieldDescription>
                  </Field>
                </>
              )}
            </FieldGroup>
          </form>
        )}
      </section>
    </AuthMarketingShell>
  );
}

export const Route = createFileRoute('/(auth)/sign-up')({
  validateSearch: validateAuthSearch,
  component: SignUpPage,
});
