import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';

export function AuthConfigFeedback({
  failed,
  pending,
  message,
  retryLabel,
  loadingLabel,
  onRetry,
}: {
  failed: boolean;
  pending: boolean;
  message: string;
  retryLabel: string;
  loadingLabel: string;
  onRetry: () => void;
}) {
  if (!failed) {
    return (
      <div
        role="status"
        aria-label={loadingLabel}
        className="flex min-h-32 items-center justify-center"
      >
        <Loader2
          aria-hidden="true"
          className="text-muted-foreground size-5 animate-spin"
        />
      </div>
    );
  }

  return (
    <div className="auth-config-feedback space-y-4" aria-busy={pending}>
      <p role="alert" className="text-muted-foreground">
        {message}
      </p>
      <Button type="button" disabled={pending} onClick={onRetry}>
        {pending && (
          <Loader2 aria-hidden="true" className="size-4 animate-spin" />
        )}
        {retryLabel}
      </Button>
    </div>
  );
}
