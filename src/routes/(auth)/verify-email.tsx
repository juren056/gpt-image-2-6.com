import { useEffect, useMemo, useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { authClient } from '@/core/auth/client';
import { Link, useRouter } from '@/core/i18n/navigation';
import { envConfigs } from '@/config';
import { safeInternalAuthDestination } from '@/lib/auth-navigation';
import { m } from '@/paraglide/messages.js';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';

const RESEND_COOLDOWN_SECONDS = 60;

function VerifyEmailPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [callbackUrl, setCallbackUrl] = useState('/settings/generate');
  const [otp, setOtp] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const nextEmail = (params.get('email') || '').trim().toLowerCase();
    const nextCallback =
      safeInternalAuthDestination(params.get('callbackUrl') || undefined) ||
      '/settings/generate';
    setEmail(nextEmail);
    setCallbackUrl(nextCallback);
    if (params.get('sent') === '1') setCooldown(RESEND_COOLDOWN_SECONDS);
    if (params.get('sendFailed') === '1') {
      toast.error(m['common.sign.verify_email_send_failed']());
    }
    if (!nextEmail) router.replace('/sign-in');
  }, [router]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setTimeout(
      () => setCooldown((value) => value - 1),
      1000
    );
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  const signInPath = useMemo(() => {
    const query = new URLSearchParams({ callbackUrl });
    return `/sign-in?${query.toString()}`;
  }, [callbackUrl]);

  async function handleVerify() {
    if (!/^\d{6}$/.test(otp)) {
      toast.error(m['common.sign.verify_email_code_invalid']());
      return;
    }
    setSubmitting(true);
    try {
      const result = await authClient.emailOtp.verifyEmail({ email, otp });
      if (result.error) {
        toast.error(
          result.error.message || m['common.sign.verify_email_code_invalid']()
        );
        return;
      }
      toast.success(m['common.sign.verify_email_success']());
      router.replace(signInPath);
    } catch (error: any) {
      toast.error(
        error?.message || m['common.sign.verify_email_code_invalid']()
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResend() {
    if (!email || resending || cooldown > 0) return;
    setResending(true);
    try {
      const result = await authClient.emailOtp.sendVerificationOtp({
        email,
        type: 'email-verification',
      });
      if (result.error) {
        toast.error(
          result.error.message || m['common.sign.verify_email_send_failed']()
        );
        return;
      }
      setCooldown(RESEND_COOLDOWN_SECONDS);
      toast.success(m['common.sign.verify_email_code_resent']());
    } catch (error: any) {
      toast.error(
        error?.message || m['common.sign.verify_email_send_failed']()
      );
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <Link href="/" className="self-center font-serif text-lg italic">
          {envConfigs.app_name}
        </Link>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg md:text-xl">
              {m['common.sign.verify_email_page_title']()}
            </CardTitle>
            <CardDescription className="text-xs md:text-sm">
              {m['common.sign.verify_email_page_description']({ email })}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              value={otp}
              onChange={(event) =>
                setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))
              }
              onKeyDown={(event) => {
                if (event.key === 'Enter') void handleVerify();
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
              type="button"
              className="w-full"
              disabled={submitting || otp.length !== 6}
              onClick={handleVerify}
            >
              {submitting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                m['common.sign.verify_email_submit_code']()
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              disabled={resending || cooldown > 0}
              onClick={handleResend}
            >
              {resending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : cooldown > 0 ? (
                m['common.sign.resend_verification_countdown']({
                  seconds: cooldown,
                })
              ) : (
                m['common.sign.resend_verification']()
              )}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() => router.push(signInPath)}
            >
              {m['common.sign.back_to_sign_in']()}
            </Button>
          </CardContent>
          <CardFooter>
            <p className="text-muted-foreground w-full text-center text-xs">
              {m['common.sign.verify_email_tip']()}
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

export const Route = createFileRoute('/(auth)/verify-email')({
  component: VerifyEmailPage,
});
