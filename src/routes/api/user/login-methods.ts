import { createFileRoute } from '@tanstack/react-router';

import { getAuth } from '@/core/auth';
import { respData, respErr } from '@/lib/resp';

async function GET({ request }: { request: Request }) {
  try {
    const auth = getAuth();
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) return respErr('Unauthorized', { status: 401 });
    const accounts: Array<{ providerId: string }> =
      await auth.api.listUserAccounts({
        headers: request.headers,
      });
    return respData(
      {
        providers: [...new Set(accounts.map((account) => account.providerId))],
      },
      {
        headers: { 'Cache-Control': 'private, no-store' },
      }
    );
  } catch {
    return respErr('Unable to load login methods', { status: 500 });
  }
}

export const Route = createFileRoute('/api/user/login-methods')({
  server: { handlers: { GET } },
});
