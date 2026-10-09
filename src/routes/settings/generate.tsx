import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import {
  Check,
  ChevronDown,
  ChevronUp,
  Columns3,
  Copy,
  Dices,
  Download,
  ImageIcon,
  Loader2,
  Maximize2,
  Pencil,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';

import {
  DEFAULT_IMAGE_MODEL_ID,
  IMAGE_MODELS,
  QWEN_IMAGE_3_MAX_PROMPT_LENGTH,
} from '@/config/image-models';
import { apiGet, apiPost } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import { m } from '@/paraglide/messages.js';
import { FirstGenerationFeedback } from '@/components/first-generation-feedback';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ZoomableImageDialog } from '@/components/zoomable-image-dialog';

type ImageTask = {
  id: string;
  prompt: string;
  model: string;
  provider: string;
  status: string;
  costCredits: number;
  createdAt: string;
  images: Array<{ imageUrl?: string }>;
  errorMessage?: string;
  providerStatus?: string;
  queuePosition?: number;
  inferenceTime?: number;
  seed?: number;
  options?: { image_size?: string; seed?: number };
};

const ASPECT_VALUES = {
  square: 'square_hd',
  landscape: 'landscape_4_3',
  portrait: 'portrait_4_3',
} as const;

type Aspect = keyof typeof ASPECT_VALUES;

function aspectFromImageSize(imageSize?: string): Aspect {
  const match = Object.entries(ASPECT_VALUES).find(
    ([, value]) => value === imageSize
  );
  return (match?.[0] as Aspect | undefined) ?? 'square';
}

function formatImageSize(imageSize?: string) {
  return (imageSize || 'square_hd').replaceAll('_', ' ');
}

function GeneratePage() {
  const queryClient = useQueryClient();
  const [prompt, setPrompt] = useState('');
  const [model, setModel] = useState<string>(DEFAULT_IMAGE_MODEL_ID);
  const [aspect, setAspect] = useState<Aspect>('square');
  const [seed, setSeed] = useState('');
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [downloadingTaskId, setDownloadingTaskId] = useState<string | null>(
    null
  );
  const [copiedPromptId, setCopiedPromptId] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [compareOpen, setCompareOpen] = useState(false);
  const [expandedPromptIds, setExpandedPromptIds] = useState<string[]>([]);
  const [previewItem, setPreviewItem] = useState<ImageTask | null>(null);

  const { data: creditsData } = useQuery({
    queryKey: ['user-credits'],
    queryFn: () => apiGet<{ balance: number }>('/api/credits'),
  });

  const { data: galleryData, isFetching: galleryLoading } = useQuery({
    queryKey: ['user-images'],
    queryFn: () =>
      apiGet<{ items: ImageTask[] }>('/api/images/?page=1&limit=24'),
    refetchInterval: (query) => {
      const hasActiveTask = query.state.data?.items.some(
        (item) => item.status === 'processing' || item.status === 'pending'
      );
      return hasActiveTask ? 5000 : false;
    },
  });

  const activeTaskQuery = useQuery({
    queryKey: ['image-task', activeTaskId],
    queryFn: () => apiGet<ImageTask>(`/api/images/${activeTaskId}`),
    enabled: Boolean(activeTaskId),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === 'success' || status === 'failed') return false;
      return query.state.error ? 5000 : 1000;
    },
    retry: 5,
    retryDelay: (attempt) => Math.min(750 * 2 ** attempt, 5000),
    refetchIntervalInBackground: true,
  });
  const activeTask = activeTaskQuery.data;

  useEffect(() => {
    if (activeTask?.status === 'success') {
      toast.success(m['settings.generate.success']());
      queryClient.invalidateQueries({ queryKey: ['user-images'] });
      queryClient.invalidateQueries({ queryKey: ['user-credits'] });
      queryClient.invalidateQueries({ queryKey: ['user-image-usage'] });
    } else if (activeTask?.status === 'failed') {
      toast.error(activeTask.errorMessage || m['settings.generate.failed']());
      setActiveTaskId(null);
    }
  }, [activeTask?.errorMessage, activeTask?.status, queryClient]);

  useEffect(() => {
    if (activeTaskQuery.failureCount !== 5 || !activeTaskId) return;
    toast.error(
      activeTaskQuery.error?.message || m['settings.generate.failed']()
    );
  }, [activeTaskId, activeTaskQuery.error, activeTaskQuery.failureCount]);

  const generateMutation = useMutation({
    mutationFn: () =>
      apiPost<{ id: string; status: string }>('/api/images/generate', {
        prompt,
        model,
        options: {
          image_size: ASPECT_VALUES[aspect],
          ...(seed === '' ? {} : { seed: Number(seed) }),
        },
      }),
    onSuccess: (data) => {
      setElapsedSeconds(0);
      setActiveTaskId(data.id);
      queryClient.invalidateQueries({ queryKey: ['user-images'] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const isGenerating =
    generateMutation.isPending ||
    (activeTaskId !== null &&
      activeTask?.status !== 'success' &&
      activeTask?.status !== 'failed');

  const gallery = galleryData?.items ?? [];
  const compareItems = compareIds
    .map((id) => gallery.find((item) => item.id === id))
    .filter((item): item is ImageTask => Boolean(item));
  const enabledModels = IMAGE_MODELS.filter((candidate) => candidate.enabled);

  async function downloadImage(item: ImageTask) {
    if (downloadingTaskId) return;
    setDownloadingTaskId(item.id);

    try {
      const response = await fetch(
        `/api/images/${encodeURIComponent(item.id)}/download`
      );
      const contentType = response.headers.get('content-type') || '';
      if (!response.ok || !contentType.toLowerCase().startsWith('image/')) {
        throw new Error('Download failed');
      }

      const blob = await response.blob();
      const contentDisposition =
        response.headers.get('content-disposition') || '';
      const filenameMatch = contentDisposition.match(/filename="([^"]+)"/i);
      const filename =
        filenameMatch?.[1] || `qwen-image-${item.id.slice(0, 36)}.png`;
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = objectUrl;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
      toast.success(m['settings.generate.download_success']());
    } catch {
      toast.error(m['settings.generate.download_failed']());
    } finally {
      setDownloadingTaskId(null);
    }
  }

  async function copyPrompt(item: ImageTask) {
    try {
      await navigator.clipboard.writeText(item.prompt);
      setCopiedPromptId(item.id);
      toast.success(m['settings.generate.prompt_copied']());
      window.setTimeout(() => {
        setCopiedPromptId((currentId) =>
          currentId === item.id ? null : currentId
        );
      }, 2000);
    } catch {
      toast.error(m['settings.generate.prompt_copy_failed']());
    }
  }

  function editImage(item: ImageTask) {
    const imageUrl = item.images[0]?.imageUrl;
    if (!imageUrl) return;
    window.sessionStorage.setItem(
      'qwenimage3:editor-source',
      JSON.stringify({
        url: imageUrl,
        prompt: `Edit this image while preserving the main subject: ${item.prompt}`,
      })
    );
    window.location.href = '/qwen-image-editor';
  }

  function toggleCompare(item: ImageTask) {
    setCompareIds((current) => {
      if (current.includes(item.id)) {
        return current.filter((id) => id !== item.id);
      }
      if (current.length >= 4) {
        toast.info(m['settings.generate.compare_limit']());
        return current;
      }
      return [...current, item.id];
    });
  }

  function reuseSettings(item: ImageTask) {
    setPrompt(item.prompt);
    if (enabledModels.some((candidate) => candidate.id === item.model)) {
      setModel(item.model);
    }
    setAspect(aspectFromImageSize(item.options?.image_size));
    setSeed(
      typeof item.seed === 'number'
        ? String(item.seed)
        : typeof item.options?.seed === 'number'
          ? String(item.options.seed)
          : ''
    );
    setCompareOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    toast.success(m['settings.generate.settings_reused']());
  }

  function comparisonDiffers(
    value: (item: ImageTask) => string | number | undefined
  ) {
    return (
      new Set(compareItems.map((item) => String(value(item) ?? '—'))).size > 1
    );
  }

  function toggleExpandedPrompt(itemId: string) {
    setExpandedPromptIds((current) =>
      current.includes(itemId)
        ? current.filter((id) => id !== itemId)
        : [...current, itemId]
    );
  }

  const selectedModel =
    enabledModels.find((candidate) => candidate.id === model) ??
    enabledModels[0];
  const progressLabel = `${m['settings.generate.generating']()} - ${elapsedSeconds}s`;
  const seedIsValid =
    seed === '' ||
    (/^\d+$/.test(seed) && Number(seed) >= 0 && Number(seed) <= 2_147_483_647);

  useEffect(() => {
    if (!isGenerating) return;
    const timer = window.setInterval(
      () => setElapsedSeconds((value) => value + 1),
      1000
    );
    return () => window.clearInterval(timer);
  }, [isGenerating]);

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {m['settings.generate.title']()}
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {m['settings.generate.description']()}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="size-4" />
              {m['settings.generate.prompt_title']()}
            </CardTitle>
            <CardDescription>
              {m['settings.generate.prompt_description']()}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={m['settings.generate.prompt_placeholder']()}
              rows={5}
              maxLength={QWEN_IMAGE_3_MAX_PROMPT_LENGTH}
              disabled={isGenerating}
            />
            <p className="text-muted-foreground text-right text-xs tabular-nums">
              {prompt.length}/{QWEN_IMAGE_3_MAX_PROMPT_LENGTH}
            </p>
            <div>
              <p className="mb-2 text-sm font-medium">
                {m['landing.generator.model_label']()}
              </p>
              <div className="grid gap-2 sm:grid-cols-3">
                {enabledModels.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setModel(option.id)}
                    disabled={isGenerating}
                    aria-pressed={model === option.id}
                    className={cn(
                      'border-border bg-background min-h-14 rounded-xl border px-3 py-2 text-left text-xs transition-colors',
                      model === option.id
                        ? 'border-primary bg-primary/8 text-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <span className="block font-semibold">{option.label}</span>
                    <span>
                      {option.credits} {m['landing.generator.credit_unit']()}
                    </span>
                  </button>
                ))}
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-[1fr_220px]">
              <div>
                <p className="mb-2 text-sm font-medium">
                  {m['landing.generator.aspect_label']()}
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      ['square', m['landing.generator.square']()],
                      ['landscape', m['landing.generator.landscape']()],
                      ['portrait', m['landing.generator.portrait']()],
                    ] as const
                  ).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setAspect(value)}
                      disabled={isGenerating}
                      aria-pressed={aspect === value}
                      className={cn(
                        'border-border bg-background min-h-11 rounded-xl border px-3 py-2 text-xs font-medium transition-colors',
                        aspect === value
                          ? 'border-primary bg-primary/8 text-foreground'
                          : 'text-muted-foreground hover:text-foreground'
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label
                  htmlFor="generation-seed"
                  className="mb-2 block text-sm font-medium"
                >
                  {m['settings.generate.seed_label']()}
                </label>
                <div className="flex gap-2">
                  <Input
                    id="generation-seed"
                    inputMode="numeric"
                    value={seed}
                    onChange={(event) => setSeed(event.target.value.trim())}
                    placeholder={m['settings.generate.seed_random']()}
                    aria-invalid={!seedIsValid}
                    disabled={isGenerating}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setSeed('')}
                    disabled={isGenerating || seed === ''}
                    title={m['settings.generate.seed_random']()}
                  >
                    <Dices className="size-4" />
                  </Button>
                </div>
                <p
                  className={cn(
                    'mt-1 text-xs',
                    seedIsValid ? 'text-muted-foreground' : 'text-destructive'
                  )}
                >
                  {seedIsValid
                    ? m['settings.generate.seed_hint']()
                    : m['settings.generate.seed_invalid']()}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-muted-foreground text-xs">
                {m['settings.generate.cost_hint']({
                  credits: selectedModel?.credits ?? 0,
                })}
              </p>
              <Button
                onClick={() => generateMutation.mutate()}
                disabled={isGenerating || !prompt.trim() || !seedIsValid}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    {progressLabel}
                  </>
                ) : (
                  <>
                    <Sparkles className="size-4" />
                    {m['settings.generate.submit']()}
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              {m['settings.credits.title']()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tabular-nums">
              {creditsData?.balance ?? '—'}
            </div>
            <p className="text-muted-foreground mt-1 text-xs">
              {m['settings.generate.credits_note']()}
            </p>
          </CardContent>
        </Card>
      </div>

      <div>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-medium">
            {m['settings.generate.gallery_title']()}
          </h2>
          <div className="flex items-center gap-2">
            {compareIds.length > 0 ? (
              <>
                <span className="text-muted-foreground text-xs">
                  {m['settings.generate.compare_selected']({
                    count: compareIds.length,
                  })}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setCompareIds([])}
                >
                  {m['settings.generate.compare_clear']()}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => setCompareOpen(true)}
                  disabled={compareIds.length < 2}
                >
                  <Columns3 className="size-4" />
                  {m['settings.generate.compare_action']()}
                </Button>
              </>
            ) : null}
            {galleryLoading && (
              <Loader2 className="text-muted-foreground size-4 animate-spin" />
            )}
          </div>
        </div>

        {gallery.length === 0 ? (
          <div className="border-border text-muted-foreground flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed p-12 text-center">
            <ImageIcon className="size-10 opacity-40" />
            <p className="text-sm">{m['settings.generate.empty']()}</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {gallery.map((item) => {
              const imageUrl = item.images[0]?.imageUrl;
              const isSelected = compareIds.includes(item.id);
              return (
                <Card
                  key={item.id}
                  className={cn(
                    'overflow-hidden pt-0 transition-shadow',
                    isSelected && 'ring-primary ring-2'
                  )}
                >
                  <div className="bg-muted relative aspect-square">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={item.prompt}
                        className="size-full object-cover"
                      />
                    ) : (
                      <div className="text-muted-foreground flex size-full items-center justify-center gap-2 text-sm">
                        {item.status === 'processing' ||
                        item.status === 'pending' ? (
                          <>
                            <Loader2 className="size-4 animate-spin" />
                            {item.providerStatus === 'IN_QUEUE' &&
                            typeof item.queuePosition === 'number' &&
                            item.queuePosition > 0
                              ? `${m['settings.generate.generating']()} - #${item.queuePosition}`
                              : m['settings.generate.generating']()}
                          </>
                        ) : (
                          <span className="px-4 text-center">
                            {item.errorMessage ||
                              m['settings.generate.failed']()}
                          </span>
                        )}
                      </div>
                    )}
                    {imageUrl ? (
                      <button
                        type="button"
                        onClick={() => toggleCompare(item)}
                        aria-pressed={isSelected}
                        aria-label={m['settings.generate.compare_select']()}
                        className={cn(
                          'absolute top-3 right-3 flex size-9 items-center justify-center rounded-full border shadow-sm backdrop-blur transition-colors',
                          isSelected
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-white/70 bg-black/45 text-white hover:bg-black/65'
                        )}
                      >
                        {isSelected ? (
                          <Check className="size-4" />
                        ) : (
                          <Columns3 className="size-4" />
                        )}
                      </button>
                    ) : null}
                  </div>
                  <CardContent className="space-y-2 p-4">
                    <p className="line-clamp-2 text-sm">{item.prompt}</p>
                    <p className="text-muted-foreground text-xs capitalize">
                      {IMAGE_MODELS.find(
                        (candidate) => candidate.id === item.model
                      )?.label ?? item.model}{' '}
                      · {formatImageSize(item.options?.image_size)}
                      {typeof item.seed === 'number'
                        ? ` · Seed ${item.seed}`
                        : ''}
                    </p>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                      <button
                        type="button"
                        onClick={() => copyPrompt(item)}
                        className="text-primary inline-flex items-center gap-1 text-xs hover:underline"
                      >
                        {copiedPromptId === item.id ? (
                          <Check className="size-3" />
                        ) : (
                          <Copy className="size-3" />
                        )}
                        {copiedPromptId === item.id
                          ? m['settings.generate.prompt_copied']()
                          : m['settings.generate.copy_prompt']()}
                      </button>
                      {imageUrl && (
                        <button
                          type="button"
                          onClick={() => downloadImage(item)}
                          disabled={downloadingTaskId === item.id}
                          className="text-primary inline-flex items-center gap-1 text-xs hover:underline"
                        >
                          {downloadingTaskId === item.id ? (
                            <Loader2 className="size-3 animate-spin" />
                          ) : (
                            <Download className="size-3" />
                          )}
                          {downloadingTaskId === item.id
                            ? m['settings.generate.downloading']()
                            : m['settings.generate.download']()}
                        </button>
                      )}
                      {imageUrl && (
                        <button
                          type="button"
                          onClick={() => editImage(item)}
                          className="text-primary inline-flex items-center gap-1 text-xs hover:underline"
                        >
                          <Pencil className="size-3" />
                          Edit
                        </button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={compareOpen} onOpenChange={setCompareOpen}>
        <DialogContent className="h-[100dvh] max-h-[100dvh] max-w-none grid-rows-[auto_minmax(0,1fr)] gap-0 overflow-hidden rounded-none p-0 sm:h-[min(88vh,760px)] sm:max-w-6xl sm:rounded-2xl">
          <DialogHeader className="border-border bg-popover z-10 border-b px-4 py-4 pr-12 sm:px-6 sm:py-5">
            <DialogTitle className="flex items-center gap-2">
              <Columns3 className="size-5" />
              {m['settings.generate.compare_title']()}
            </DialogTitle>
            <DialogDescription>
              {m['settings.generate.compare_description']()}
            </DialogDescription>
          </DialogHeader>

          <div className="min-h-0 overflow-x-auto overflow-y-auto overscroll-contain p-3 sm:p-5">
            <div className="grid min-w-max snap-x snap-mandatory auto-cols-[84vw] grid-flow-col gap-3 sm:min-w-full sm:auto-cols-[minmax(260px,1fr)] sm:gap-4">
              {compareItems.map((item, index) => {
                const imageUrl = item.images[0]?.imageUrl;
                const promptExpanded = expandedPromptIds.includes(item.id);
                const canExpandPrompt = item.prompt.length > 180;
                const modelLabel =
                  IMAGE_MODELS.find((candidate) => candidate.id === item.model)
                    ?.label ?? item.model;
                const parameterRows = [
                  {
                    label: m['settings.generate.compare_model'](),
                    value: modelLabel,
                    differs: comparisonDiffers((candidate) => candidate.model),
                  },
                  {
                    label: m['settings.generate.compare_size'](),
                    value: formatImageSize(item.options?.image_size),
                    differs: comparisonDiffers(
                      (candidate) => candidate.options?.image_size
                    ),
                  },
                  {
                    label: m['settings.generate.seed_label'](),
                    value: item.seed ?? item.options?.seed ?? '—',
                    differs: comparisonDiffers(
                      (candidate) => candidate.seed ?? candidate.options?.seed
                    ),
                  },
                  {
                    label: m['settings.generate.compare_cost'](),
                    value: item.costCredits,
                    differs: comparisonDiffers(
                      (candidate) => candidate.costCredits
                    ),
                  },
                  {
                    label: m['settings.generate.compare_created'](),
                    value: new Date(item.createdAt).toLocaleString(),
                    differs: false,
                  },
                ];

                return (
                  <div
                    key={item.id}
                    className="border-border bg-card flex min-w-0 snap-start flex-col overflow-hidden rounded-2xl border"
                  >
                    <button
                      type="button"
                      onClick={() => setPreviewItem(item)}
                      disabled={!imageUrl}
                      aria-label={m[
                        'settings.generate.compare_view_original'
                      ]()}
                      className="bg-muted group relative flex h-[min(40dvh,300px)] w-full items-center justify-center overflow-hidden disabled:cursor-default sm:h-[clamp(220px,32vh,320px)]"
                    >
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={item.prompt}
                          className="size-full object-contain"
                        />
                      ) : null}
                      <span className="bg-background/90 absolute top-3 left-3 rounded-full px-2.5 py-1 text-xs font-semibold shadow-sm backdrop-blur">
                        {m['settings.generate.compare_version']({
                          number: index + 1,
                        })}
                      </span>
                      {imageUrl ? (
                        <span className="bg-background/90 text-foreground absolute right-3 bottom-3 flex min-h-9 items-center gap-1.5 rounded-full px-3 text-[11px] font-semibold opacity-100 shadow-sm backdrop-blur transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-visible:opacity-100">
                          <Maximize2 className="size-3.5" />
                          {m['settings.generate.compare_view_original']()}
                        </span>
                      ) : null}
                    </button>

                    <div className="flex flex-1 flex-col gap-3 p-3 sm:p-4">
                      <div
                        className={cn(
                          'rounded-xl p-3',
                          comparisonDiffers((candidate) => candidate.prompt)
                            ? 'bg-amber-500/10 ring-1 ring-amber-500/25'
                            : 'bg-muted/60'
                        )}
                      >
                        <p className="text-muted-foreground mb-1 text-[11px] font-semibold tracking-wide uppercase">
                          {m['settings.generate.compare_prompt']()}
                        </p>
                        <p
                          className={cn(
                            'text-sm leading-relaxed break-words',
                            !promptExpanded && 'line-clamp-3'
                          )}
                        >
                          {item.prompt}
                        </p>
                        {canExpandPrompt ? (
                          <button
                            type="button"
                            onClick={() => toggleExpandedPrompt(item.id)}
                            className="text-primary mt-2 inline-flex min-h-8 items-center gap-1 text-xs font-semibold"
                            aria-expanded={promptExpanded}
                          >
                            {promptExpanded ? (
                              <ChevronUp className="size-3.5" />
                            ) : (
                              <ChevronDown className="size-3.5" />
                            )}
                            {promptExpanded
                              ? m['settings.generate.compare_collapse_prompt']()
                              : m['settings.generate.compare_expand_prompt']()}
                          </button>
                        ) : null}
                      </div>

                      <dl className="space-y-1.5 text-xs">
                        {parameterRows.map((row) => (
                          <div
                            key={row.label}
                            className={cn(
                              'flex items-start justify-between gap-4 rounded-lg px-2.5 py-2',
                              row.differs
                                ? 'bg-amber-500/10 ring-1 ring-amber-500/25'
                                : 'bg-muted/50'
                            )}
                          >
                            <dt className="text-muted-foreground">
                              {row.label}
                            </dt>
                            <dd className="max-w-[65%] text-right font-medium capitalize">
                              {row.value}
                            </dd>
                          </div>
                        ))}
                      </dl>

                      <Button
                        type="button"
                        variant="outline"
                        className="mt-auto min-h-11 w-full"
                        onClick={() => reuseSettings(item)}
                      >
                        <RotateCcw className="size-4" />
                        {m['settings.generate.reuse_settings']()}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ZoomableImageDialog
        open={Boolean(previewItem)}
        onOpenChange={(open) => {
          if (!open) setPreviewItem(null);
        }}
        imageUrl={previewItem?.images[0]?.imageUrl}
        alt={
          previewItem?.prompt || m['settings.generate.compare_original_title']()
        }
        title={m['settings.generate.compare_original_title']()}
      />
      <FirstGenerationFeedback
        taskId={activeTaskId}
        status={activeTask?.status}
        modelId={model}
      />
    </div>
  );
}

export const Route = createFileRoute('/settings/generate')({
  component: GeneratePage,
});
