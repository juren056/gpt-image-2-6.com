import { useEffect, useMemo, useState } from 'react';
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import {
  CalendarDays,
  CircleX,
  Coins,
  Copy,
  Download,
  Gauge,
  ImageIcon,
  LayoutGrid,
  List,
  RefreshCw,
  Search,
  ShieldAlert,
  Video,
} from 'lucide-react';
import { toast } from 'sonner';

import { Link } from '@/core/i18n/navigation';
import { apiGet, apiPatch } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import { m } from '@/paraglide/messages.js';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

type Generation = {
  id: string;
  providerTaskId: string | null;
  userId: string;
  userName: string | null;
  userEmail: string;
  mediaType: string;
  provider: string;
  model: string;
  prompt: string;
  status: string;
  costCredits: number;
  scene: string;
  createdAt: string;
  updatedAt: string;
  images: string[];
  videos: string[];
  inputAssets: string[];
  options: Record<string, unknown>;
  errorMessage: string | null;
  errorCategory: string | null;
  errorCode: string | null;
  providerStatus: string | null;
  inferenceTime: number | null;
  seed: number | null;
  safetyStatus: string;
  safetyCategory: string;
  safetySeverity: string;
  safetySource: string;
  safetyConfidence: number;
  safetyReviewStatus: string;
  safetyAction: string;
};

type GenerationResponse = {
  items: Generation[];
  total: number;
  models: string[];
  summary: {
    today: number;
    successRate: number;
    failed: number;
    credits: number;
    blocked: number;
  };
};

const PAGE_SIZE = 24;

function statusVariant(status: string) {
  if (status === 'success') return 'default' as const;
  if (status === 'failed' || status === 'canceled') {
    return 'destructive' as const;
  }
  return 'secondary' as const;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function Preview({
  item,
  detail = false,
}: {
  item: Generation;
  detail?: boolean;
}) {
  const image = item.images[0];
  const video = item.videos[0];
  const className = detail
    ? 'max-h-[55vh] w-full rounded-xl object-contain'
    : 'size-full object-cover transition-transform duration-300 group-hover:scale-[1.02]';
  if (image) return <img src={image} alt={item.prompt} className={className} />;
  if (video) {
    return (
      <video
        src={video}
        controls={detail}
        muted={!detail}
        preload="metadata"
        className={className}
      />
    );
  }
  return (
    <div className="text-muted-foreground bg-muted/40 flex size-full flex-col items-center justify-center gap-2">
      {item.mediaType === 'video' ? (
        <Video className="size-10" />
      ) : (
        <ImageIcon className="size-10" />
      )}
      <span className="text-xs">{item.status}</span>
    </div>
  );
}

function FilterSelect({
  value,
  onChange,
  label,
  children,
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="min-w-36 flex-1 sm:flex-none">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm shadow-xs sm:w-44"
        aria-label={label}
      >
        {children}
      </select>
    </label>
  );
}

function GenerationDetail({ item }: { item: Generation }) {
  const queryClient = useQueryClient();
  const reviewMutation = useMutation({
    mutationFn: (action: 'confirm' | 'false_positive' | 'release_account') =>
      apiPatch(`/api/admin/safety/${item.id}`, { action }),
    onSuccess: () => {
      toast.success(m['admin.generations.safety_review_saved']());
      queryClient.invalidateQueries({ queryKey: ['admin-generations'] });
    },
    onError: (error: Error) => toast.error(error.message),
  });
  const outputs = [...item.images, ...item.videos];
  async function copyPrompt() {
    await navigator.clipboard.writeText(item.prompt);
    toast.success(m['admin.generations.prompt_copied']());
  }

  return (
    <div className="space-y-6 overflow-y-auto px-4 pb-8 sm:px-6">
      <div className="bg-muted/30 overflow-hidden rounded-xl border p-2">
        <Preview item={item} detail />
      </div>

      {outputs.length > 1 ? (
        <div className="grid grid-cols-4 gap-2">
          {outputs.map((url, index) => (
            <a
              key={url}
              href={url}
              target="_blank"
              rel="noreferrer"
              className="bg-muted aspect-square overflow-hidden rounded-lg border"
            >
              {index < item.images.length ? (
                <img src={url} alt="" className="size-full object-cover" />
              ) : (
                <video src={url} muted className="size-full object-cover" />
              )}
            </a>
          ))}
        </div>
      ) : null}

      <section className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-semibold">{m['admin.generations.prompt']()}</h3>
          <Button variant="outline" size="sm" onClick={copyPrompt}>
            <Copy className="size-4" />
            {m['admin.generations.copy_prompt']()}
          </Button>
        </div>
        <p className="bg-muted/40 rounded-lg border p-3 text-sm leading-6 whitespace-pre-wrap">
          {item.prompt}
        </p>
      </section>

      {item.inputAssets.length ? (
        <section className="space-y-2">
          <h3 className="font-semibold">{m['admin.generations.inputs']()}</h3>
          <div className="grid grid-cols-3 gap-2">
            {item.inputAssets.map((url) => (
              <a key={url} href={url} target="_blank" rel="noreferrer">
                <img
                  src={url}
                  alt=""
                  className="bg-muted aspect-square size-full rounded-lg border object-cover"
                />
              </a>
            ))}
          </div>
        </section>
      ) : null}

      <section className="grid grid-cols-2 gap-x-5 gap-y-4 text-sm">
        <div>
          <p className="text-muted-foreground">{m['admin.payments.user']()}</p>
          <GenerationUserLink item={item} />
        </div>
        <Detail label={m['admin.generations.model']()} value={item.model} />
        <Detail label={m['admin.payments.provider']()} value={item.provider} />
        <Detail label={m['admin.payments.status']()} value={item.status} />
        <Detail
          label={m['admin.generations.credits']()}
          value={String(item.costCredits)}
        />
        <Detail
          label={m['admin.payments.created_at']()}
          value={formatDate(item.createdAt)}
        />
        {item.inferenceTime !== null ? (
          <Detail
            label={m['admin.generations.inference_time']()}
            value={`${item.inferenceTime}s`}
          />
        ) : null}
        {item.seed !== null ? (
          <Detail label="Seed" value={String(item.seed)} />
        ) : null}
      </section>

      {item.safetyStatus !== 'unchecked' ? (
        <section
          className={cn(
            'space-y-3 rounded-lg border p-3 text-sm',
            item.safetyStatus === 'blocked'
              ? 'border-amber-500/40 bg-amber-500/10'
              : 'bg-muted/30'
          )}
        >
          <div className="flex items-center justify-between gap-3">
            <h3 className="flex items-center gap-2 font-semibold">
              <ShieldAlert className="size-4" />
              {m['admin.generations.safety_title']()}
            </h3>
            <Badge
              variant={
                item.safetyStatus === 'blocked' ? 'destructive' : 'secondary'
              }
            >
              {item.safetyStatus}
            </Badge>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Detail
              label={m['admin.generations.safety_category']()}
              value={item.safetyCategory || '—'}
            />
            <Detail
              label={m['admin.generations.safety_severity']()}
              value={item.safetySeverity || '—'}
            />
            <Detail
              label={m['admin.generations.safety_source']()}
              value={item.safetySource || '—'}
            />
            <Detail
              label={m['admin.generations.safety_confidence']()}
              value={`${item.safetyConfidence}%`}
            />
            <Detail
              label={m['admin.generations.safety_review_status']()}
              value={item.safetyReviewStatus}
            />
            <Detail
              label={m['admin.generations.safety_action']()}
              value={item.safetyAction || '—'}
            />
          </div>
          {item.safetyStatus === 'blocked' ? (
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={reviewMutation.isPending}
                onClick={() => reviewMutation.mutate('confirm')}
              >
                {m['admin.generations.safety_confirm']()}
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={reviewMutation.isPending}
                onClick={() => reviewMutation.mutate('false_positive')}
              >
                {m['admin.generations.safety_false_positive']()}
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={reviewMutation.isPending}
                onClick={() => reviewMutation.mutate('release_account')}
              >
                {m['admin.generations.safety_release_account']()}
              </Button>
            </div>
          ) : null}
        </section>
      ) : null}

      <section className="space-y-2">
        <h3 className="font-semibold">
          {m['admin.generations.task_details']()}
        </h3>
        <div className="bg-muted/40 space-y-2 rounded-lg border p-3 font-mono text-xs break-all">
          <p>ID: {item.id}</p>
          {item.providerTaskId ? (
            <p>Provider ID: {item.providerTaskId}</p>
          ) : null}
          {item.scene ? <p>Scene: {item.scene}</p> : null}
        </div>
      </section>

      {Object.keys(item.options).length ? (
        <section className="space-y-2">
          <h3 className="font-semibold">
            {m['admin.generations.parameters']()}
          </h3>
          <pre className="bg-muted/40 max-h-72 overflow-auto rounded-lg border p-3 text-xs whitespace-pre-wrap">
            {JSON.stringify(item.options, null, 2)}
          </pre>
        </section>
      ) : null}

      <section
        className={cn(
          'space-y-1 rounded-lg border p-3 text-sm',
          item.status === 'failed' || item.status === 'canceled'
            ? 'border-destructive/30 bg-destructive/5 text-destructive'
            : 'border-border bg-muted/30'
        )}
      >
        <h3 className="font-semibold">
          {m['admin.generations.failure_reason']()}
        </h3>
        {item.errorCategory ? (
          <p className="font-semibold">{item.errorCategory}</p>
        ) : null}
        {item.errorCode ? (
          <p className="font-mono text-xs">Code: {item.errorCode}</p>
        ) : null}
        <p className="break-words">
          {item.errorMessage ||
            (item.status === 'failed' || item.status === 'canceled'
              ? m['admin.generations.failure_unknown']()
              : m['admin.generations.no_failure']())}
        </p>
      </section>

      {outputs[0] ? (
        <a
          href={outputs[0]}
          target="_blank"
          rel="noreferrer"
          className="border-input bg-background hover:bg-accent flex h-9 items-center justify-center gap-2 rounded-md border px-4 text-sm font-medium shadow-xs"
        >
          <Download className="size-4" />
          {m['admin.generations.open_output']()}
        </a>
      ) : null}
    </div>
  );
}

function GenerationUserLink({ item }: { item: Generation }) {
  return (
    <Link
      href={`/admin/users?userId=${encodeURIComponent(item.userId)}`}
      className="text-primary block truncate rounded-sm underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2"
    >
      {item.userEmail}
    </Link>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="mt-1 truncate font-medium" title={value}>
        {value}
      </p>
    </div>
  );
}

function GenerationsPage() {
  const [page, setPage] = useState(1);
  const [view, setView] = useState<'gallery' | 'list'>('gallery');
  const [mediaType, setMediaType] = useState('');
  const [status, setStatus] = useState('');
  const [safetyStatus, setSafetyStatus] = useState('');
  const [model, setModel] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selected, setSelected] = useState<Generation | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(
    () => setPage(1),
    [debouncedSearch, mediaType, status, safetyStatus, model, from, to]
  );

  const query = useQuery({
    queryKey: [
      'admin-generations',
      page,
      debouncedSearch,
      mediaType,
      status,
      safetyStatus,
      model,
      from,
      to,
    ],
    queryFn: () => {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(PAGE_SIZE),
      });
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (mediaType) params.set('mediaType', mediaType);
      if (status) params.set('status', status);
      if (safetyStatus) params.set('safetyStatus', safetyStatus);
      if (model) params.set('model', model);
      if (from) params.set('from', from);
      if (to) params.set('to', to);
      return apiGet<GenerationResponse>(`/api/admin/generations?${params}`);
    },
    placeholderData: keepPreviousData,
  });

  const items = query.data?.items ?? [];
  const total = query.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const stats = useMemo(
    () => [
      {
        label: m['admin.generations.today'](),
        value: query.data?.summary.today ?? 0,
        icon: CalendarDays,
      },
      {
        label: m['admin.generations.success_rate'](),
        value: `${query.data?.summary.successRate ?? 0}%`,
        icon: Gauge,
      },
      {
        label: m['admin.generations.failed_today'](),
        value: query.data?.summary.failed ?? 0,
        icon: CircleX,
      },
      {
        label: m['admin.generations.credits_today'](),
        value: query.data?.summary.credits ?? 0,
        icon: Coins,
      },
      {
        label: m['admin.generations.blocked_today'](),
        value: query.data?.summary.blocked ?? 0,
        icon: ShieldAlert,
      },
    ],
    [query.data]
  );

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">
            {m['admin.generations.title']()}
          </h1>
          <p className="text-muted-foreground">
            {m['admin.generations.description']()}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => query.refetch()}
          disabled={query.isFetching}
        >
          <RefreshCw
            className={cn('size-4', query.isFetching && 'animate-spin')}
          />
          {m['common.table.refresh']()}
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="text-muted-foreground text-sm">{stat.label}</p>
                <p className="mt-1 text-2xl font-bold tabular-nums">
                  {stat.value}
                </p>
              </div>
              <div className="bg-primary/10 text-primary rounded-xl p-3">
                <stat.icon className="size-5" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="space-y-4 p-4">
          <div className="flex flex-wrap gap-2">
            <div className="relative min-w-64 flex-1">
              <Search className="text-muted-foreground absolute top-2.5 left-2.5 size-4" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={m['admin.generations.search_placeholder']()}
                className="h-9 pl-8"
              />
            </div>
            <FilterSelect
              value={status}
              onChange={setStatus}
              label={m['admin.payments.status']()}
            >
              <option value="">{m['admin.generations.all_statuses']()}</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="success">Success</option>
              <option value="failed">Failed</option>
              <option value="canceled">Canceled</option>
            </FilterSelect>
            <FilterSelect
              value={safetyStatus}
              onChange={setSafetyStatus}
              label={m['admin.generations.safety_title']()}
            >
              <option value="">
                {m['admin.generations.all_safety_statuses']()}
              </option>
              <option value="blocked">Blocked</option>
              <option value="allowed">Allowed</option>
              <option value="unchecked">Unchecked</option>
            </FilterSelect>
            <FilterSelect
              value={model}
              onChange={setModel}
              label={m['admin.generations.model']()}
            >
              <option value="">{m['admin.generations.all_models']()}</option>
              {(query.data?.models ?? []).map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </FilterSelect>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {[
              ['', m['admin.generations.all_media']()],
              ['image', m['admin.generations.images']()],
              ['video', m['admin.generations.videos']()],
            ].map(([value, label]) => (
              <Button
                key={value}
                variant={mediaType === value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setMediaType(value)}
              >
                {label}
              </Button>
            ))}
            <div className="ml-auto flex flex-wrap items-center gap-2">
              <Input
                type="date"
                value={from}
                onChange={(event) => setFrom(event.target.value)}
                aria-label={m['admin.generations.from_date']()}
                className="h-9 w-auto"
              />
              <span className="text-muted-foreground">–</span>
              <Input
                type="date"
                value={to}
                onChange={(event) => setTo(event.target.value)}
                aria-label={m['admin.generations.to_date']()}
                className="h-9 w-auto"
              />
              <div className="bg-muted flex rounded-md p-1">
                <Button
                  variant={view === 'gallery' ? 'secondary' : 'ghost'}
                  size="icon-sm"
                  onClick={() => setView('gallery')}
                  aria-label={m['admin.generations.gallery_view']()}
                >
                  <LayoutGrid className="size-4" />
                </Button>
                <Button
                  variant={view === 'list' ? 'secondary' : 'ghost'}
                  size="icon-sm"
                  onClick={() => setView('list')}
                  aria-label={m['admin.generations.list_view']()}
                >
                  <List className="size-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {query.isError ? (
        <Card>
          <CardContent className="text-destructive p-8 text-center">
            {query.error.message}
          </CardContent>
        </Card>
      ) : items.length === 0 && !query.isFetching ? (
        <Card>
          <CardContent className="text-muted-foreground p-12 text-center">
            {m['admin.generations.no_records']()}
          </CardContent>
        </Card>
      ) : view === 'gallery' ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="group bg-card overflow-hidden rounded-xl border text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <button
                type="button"
                onClick={() => setSelected(item)}
                className="bg-muted block aspect-[4/3] w-full overflow-hidden"
                aria-label={item.prompt}
              >
                <Preview item={item} />
              </button>
              <div className="space-y-3 p-4">
                <div className="flex items-center justify-between gap-2">
                  <Badge variant={statusVariant(item.status)}>
                    {item.status}
                  </Badge>
                  {item.safetyStatus === 'blocked' ? (
                    <Badge variant="destructive">
                      {m['admin.generations.safety_blocked']()}
                    </Badge>
                  ) : null}
                  <span className="text-muted-foreground text-xs">
                    {item.costCredits} {m['admin.generations.credits']()}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelected(item)}
                  className="line-clamp-2 min-h-10 w-full text-left text-sm font-medium"
                >
                  {item.prompt}
                </button>
                <div className="text-muted-foreground space-y-1 text-xs">
                  <GenerationUserLink item={item} />
                  <div className="flex justify-between gap-2">
                    <span className="truncate">{item.model}</span>
                    <span className="shrink-0">
                      {formatDate(item.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="overflow-x-auto p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{m['admin.generations.output']()}</TableHead>
                  <TableHead>{m['admin.generations.prompt']()}</TableHead>
                  <TableHead>{m['admin.payments.user']()}</TableHead>
                  <TableHead>{m['admin.generations.model']()}</TableHead>
                  <TableHead>{m['admin.payments.status']()}</TableHead>
                  <TableHead>{m['admin.generations.credits']()}</TableHead>
                  <TableHead>{m['admin.payments.created_at']()}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <button
                        type="button"
                        onClick={() => setSelected(item)}
                        className="bg-muted size-16 overflow-hidden rounded-md border"
                      >
                        <Preview item={item} />
                      </button>
                    </TableCell>
                    <TableCell className="max-w-80">
                      <button
                        type="button"
                        onClick={() => setSelected(item)}
                        className="line-clamp-2 text-left text-sm font-medium hover:underline"
                      >
                        {item.prompt}
                      </button>
                    </TableCell>
                    <TableCell>
                      <GenerationUserLink item={item} />
                    </TableCell>
                    <TableCell className="max-w-48 truncate">
                      {item.model}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(item.status)}>
                        {item.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{item.costCredits}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      {formatDate(item.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {query.isFetching ? (
        <p className="text-muted-foreground text-center text-sm">
          {m['admin.loading']()}
        </p>
      ) : null}

      <div className="flex items-center justify-between gap-4">
        <p className="text-muted-foreground text-sm">
          {m['common.table.total']({ count: total })}
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((value) => value - 1)}
          >
            {m['common.table.previous']()}
          </Button>
          <span className="text-muted-foreground min-w-20 text-center text-sm">
            {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((value) => value + 1)}
          >
            {m['common.table.next']()}
          </Button>
        </div>
      </div>

      <Sheet
        open={Boolean(selected)}
        onOpenChange={(open) => !open && setSelected(null)}
      >
        <SheetContent className="w-full gap-0 sm:max-w-2xl">
          {selected ? (
            <>
              <SheetHeader className="border-b px-4 py-4 sm:px-6">
                <SheetTitle>{m['admin.generations.details']()}</SheetTitle>
                <SheetDescription>
                  {selected.userEmail} · {formatDate(selected.createdAt)}
                </SheetDescription>
              </SheetHeader>
              <GenerationDetail item={selected} />
            </>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  );
}

export const Route = createFileRoute('/admin/generations')({
  component: GenerationsPage,
});
