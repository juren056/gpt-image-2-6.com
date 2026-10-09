import { useEffect } from 'react';
import { createFileRoute } from '@tanstack/react-router';

import { useSession } from '@/core/auth/client';
import { useRouter } from '@/core/i18n/navigation';
import { m } from '@/paraglide/messages.js';

export const Route = createFileRoute('/r/$code')({
  head: () => ({ meta: [{ name: 'robots', content: 'noindex,nofollow' }] }),
  component: ReferralLanding,
});

function ReferralLanding() {
  const { code } = Route.useParams();
  const router = useRouter();
  const { data: session, isPending } = useSession();
  useEffect(() => {
    if (isPending) return;
    if (/^[A-Za-z0-9_-]{6,24}$/.test(code)) {
      window.localStorage.setItem(
        'qwenimage3:referral-code',
        code.toUpperCase()
      );
      router.push(
        session?.user
          ? '/settings/referrals'
          : '/sign-up?callbackUrl=%2Fsettings%2Freferrals'
      );
      return;
    }
    router.push('/');
  }, [code, isPending, router, session?.user]);
  return (
    <main className="flex min-h-screen items-center justify-center">
      <p className="text-muted-foreground text-sm">
        {m['settings.referrals.preparing_referral']()}
      </p>
    </main>
  );
}
