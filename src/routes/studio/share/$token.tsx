import { useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { Copy, ExternalLink, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Link } from '@/core/i18n/navigation';
import type { StudioProjectState } from '@/modules/creative-projects/service';
import { apiGet } from '@/lib/api-client';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

function SharedStudioProject() {
  const { token } = Route.useParams();
  const query = useQuery({
    queryKey: ['studio-share', token],
    queryFn: () =>
      apiGet<{ title?: string; image?: string; state: StudioProjectState }>(
        `/api/studio/shares/${token}`
      ),
  });
  if (query.isLoading)
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="animate-spin" />
      </div>
    );
  if (!query.data)
    return (
      <div className="p-8 text-center">
        This shared project is unavailable or has been revoked.
      </div>
    );
  const data = query.data;
  return (
    <main className="mx-auto max-w-5xl space-y-6 p-4 py-10 md:p-8">
      <div>
        <p className="text-primary text-sm font-semibold">
          Read-only Creative Studio snapshot
        </p>
        <h1 className="mt-2 text-3xl font-semibold">
          {data.title || 'Shared project'}
        </h1>
      </div>
      <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_320px]">
        <Card>
          <CardContent className="p-4">
            {data.image ? (
              <img
                src={data.image}
                alt={data.title || 'Shared project'}
                className="mx-auto max-h-[70vh] rounded-lg object-contain"
              />
            ) : (
              <div className="bg-muted flex aspect-square items-center justify-center rounded-lg">
                No preview
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Reusable recipe</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm whitespace-pre-wrap">
              {data.state.prompt || 'No prompt was included.'}
            </p>
            <p className="text-muted-foreground text-xs">
              Images are never imported automatically. Add your own references
              after opening Studio.
            </p>
            <Button
              className="w-full"
              variant="outline"
              onClick={() =>
                navigator.clipboard
                  .writeText(data.state.prompt || '')
                  .then(() => toast.success('Prompt copied.'))
              }
            >
              <Copy /> Copy prompt
            </Button>
            <Link
              href="/settings/studio"
              className={buttonVariants({ className: 'w-full' })}
            >
              <ExternalLink /> Open Creative Studio
            </Link>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

export const Route = createFileRoute('/studio/share/$token')({
  component: SharedStudioProject,
  head: () => ({
    meta: [
      { title: 'Shared Creative Studio project' },
      { name: 'robots', content: 'noindex,nofollow,noarchive' },
    ],
  }),
});
