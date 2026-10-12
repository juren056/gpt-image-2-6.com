import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowRight,
  CheckCircle2,
  Coins,
  Download,
  ImageIcon,
  Loader2,
  LockKeyhole,
  Sparkles,
  Upload,
  WandSparkles,
} from 'lucide-react';
import { toast } from 'sonner';

import { useSession } from '@/core/auth/client';
import { useRouter } from '@/core/i18n/navigation';
import {
  DEFAULT_IMAGE_MODEL_ID,
  IMAGE_GENERATION_COST,
  SIMPLE_TOOL_IMAGE_MODEL_ID,
} from '@/config/image-models';
import { apiGet, apiPost } from '@/lib/api-client';
import type { ScenarioToolKind } from '@/lib/tools';
import { cn } from '@/lib/utils';
import { FirstGenerationFeedback } from '@/components/first-generation-feedback';
import { SiteSelect } from '@/components/site-select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

type ImageTask = {
  id: string;
  status: string;
  prompt: string;
  images: Array<{ imageUrl?: string }>;
  errorMessage?: string;
  providerStatus?: string;
  queuePosition?: number;
};

type Option = {
  value: string;
  label: string;
  prompt: string;
};

export type ScenarioGeneratorCopy = {
  path: string;
  workspaceLabel: string;
  workspaceDescription: string;
  privateLabel: string;
  creditsLabel: string;
  creditsLoading: string;
  creditsSignIn: string;
  creditsUnavailable: string;
  getCredits: string;
  requiredLabel: string;
  optionalLabel: string;
  poster: {
    headlineLabel: string;
    headlinePlaceholder: string;
    supportingLabel: string;
    supportingPlaceholder: string;
    purposeLabel: string;
    purposeOptions: Option[];
    styleLabel: string;
    styleOptions: Option[];
    paletteLabel: string;
    palettePlaceholder: string;
  };
  productPhoto: {
    productLabel: string;
    productPlaceholder: string;
    detailsLabel: string;
    detailsPlaceholder: string;
    settingLabel: string;
    settingOptions: Option[];
    lightingLabel: string;
    lightingOptions: Option[];
    paletteLabel: string;
    palettePlaceholder: string;
  };
  aspectLabel: string;
  square: string;
  landscape: string;
  portrait: string;
  promptPreviewLabel: string;
  cost: string;
  generate: string;
  generating: string;
  signUpToGenerate: string;
  resultTitle: string;
  resultEmpty: string;
  resultReady: string;
  openStudio: string;
  originalImage: string;
  downloadPreview: string;
  error: string;
  success: string;
};

const ASPECT_VALUES = {
  square: 'square_hd',
  landscape: 'landscape_4_3',
  portrait: 'portrait_4_3',
} as const;

type Aspect = keyof typeof ASPECT_VALUES;

function firstPrompt(options: Option[]) {
  return options[0]?.prompt ?? '';
}

export function ScenarioGeneratorWorkspace({
  kind,
  copy,
}: {
  kind: ScenarioToolKind;
  copy: ScenarioGeneratorCopy;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const [mounted, setMounted] = useState(false);
  const [primary, setPrimary] = useState('');
  const [secondary, setSecondary] = useState('');
  const [palette, setPalette] = useState('');
  const [firstOption, setFirstOption] = useState(() =>
    kind === 'poster'
      ? firstPrompt(copy.poster.purposeOptions)
      : firstPrompt(copy.productPhoto.settingOptions)
  );
  const [secondOption, setSecondOption] = useState(() =>
    kind === 'poster'
      ? firstPrompt(copy.poster.styleOptions)
      : firstPrompt(copy.productPhoto.lightingOptions)
  );
  const [aspect, setAspect] = useState<Aspect>(
    kind === 'poster' ? 'portrait' : 'landscape'
  );
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [localProductPreview, setLocalProductPreview] = useState<string | null>(
    null
  );
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const generationModel =
    kind === 'poster' ? SIMPLE_TOOL_IMAGE_MODEL_ID : DEFAULT_IMAGE_MODEL_ID;
  const generationCost =
    kind === 'poster' ? IMAGE_GENERATION_COST : IMAGE_GENERATION_COST;

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (kind !== 'product_photo') return;
    try {
      const draft = JSON.parse(
        window.sessionStorage.getItem('image-studio:product-photo-draft') ||
          'null'
      ) as Record<string, unknown> | null;
      if (!draft) return;
      if (typeof draft.product === 'string') setPrimary(draft.product);
      if (typeof draft.details === 'string') setSecondary(draft.details);
      if (typeof draft.setting === 'string') setFirstOption(draft.setting);
      if (typeof draft.lighting === 'string') setSecondOption(draft.lighting);
      if (typeof draft.palette === 'string') setPalette(draft.palette);
      const restoredAspect = Object.entries(ASPECT_VALUES).find(
        ([, value]) => value === draft.aspect
      )?.[0] as Aspect | undefined;
      if (restoredAspect) setAspect(restoredAspect);
    } catch {
      window.sessionStorage.removeItem('image-studio:product-photo-draft');
    }
  }, [kind]);

  useEffect(
    () => () => {
      if (localProductPreview?.startsWith('blob:')) {
        URL.revokeObjectURL(localProductPreview);
      }
    },
    [localProductPreview]
  );

  const creditsQuery = useQuery({
    queryKey: ['user-credits'],
    queryFn: () => apiGet<{ balance: number }>('/api/credits'),
    enabled: mounted && Boolean(session?.user),
    staleTime: 30_000,
    retry: 2,
  });

  const activeTaskQuery = useQuery({
    queryKey: ['scenario-image-task', activeTaskId],
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

  const composedPrompt = useMemo(() => {
    if (!primary.trim()) return '';

    if (kind === 'poster') {
      return [
        `Create a polished ${firstOption} poster.`,
        `Main headline, rendered exactly as written: "${primary.trim()}".`,
        secondary.trim()
          ? `Supporting copy, rendered exactly as written: "${secondary.trim()}".`
          : '',
        `Visual direction: ${secondOption}.`,
        palette.trim() ? `Color palette: ${palette.trim()}.` : '',
        'Use a clear visual hierarchy, generous spacing, crisp typography, balanced composition, and production-ready details.',
        'Do not invent extra words, logos, dates, prices, or watermarks.',
      ]
        .filter(Boolean)
        .join(' ');
    }

    return [
      `Create a premium commercial product photograph of ${primary.trim()}.`,
      secondary.trim()
        ? `Product appearance and required details: ${secondary.trim()}.`
        : '',
      `Scene: ${firstOption}.`,
      `Lighting and mood: ${secondOption}.`,
      palette.trim() ? `Color direction: ${palette.trim()}.` : '',
      'Keep the product geometry plausible, the materials realistic, the composition clean, and the contact shadow physically grounded.',
      'Do not add people, unrelated props, invented brand marks, readable label copy, or watermarks.',
    ]
      .filter(Boolean)
      .join(' ');
  }, [firstOption, kind, palette, primary, secondOption, secondary]);

  const generateMutation = useMutation({
    mutationFn: () =>
      apiPost<{ id: string }>('/api/images/generate', {
        prompt: composedPrompt,
        model: generationModel,
        options: { image_size: ASPECT_VALUES[aspect] },
      }),
    onSuccess: (data) => {
      setElapsedSeconds(0);
      setActiveTaskId(data.id);
      queryClient.invalidateQueries({ queryKey: ['user-credits'] });
    },
    onError: (error: Error) => toast.error(error.message || copy.error),
  });

  const task = activeTaskQuery.data;
  const isGenerating =
    generateMutation.isPending ||
    (Boolean(activeTaskId) &&
      task?.status !== 'success' &&
      task?.status !== 'failed');
  const outputUrl = task?.images?.[0]?.imageUrl;

  useEffect(() => {
    if (!isGenerating) return;
    const timer = window.setInterval(
      () => setElapsedSeconds((value) => value + 1),
      1000
    );
    return () => window.clearInterval(timer);
  }, [isGenerating]);

  useEffect(() => {
    if (task?.status === 'success') {
      toast.success(copy.success);
      queryClient.invalidateQueries({ queryKey: ['user-credits'] });
      queryClient.invalidateQueries({ queryKey: ['user-image-usage'] });
    }
    if (task?.status === 'failed') {
      toast.error(task.errorMessage || copy.error);
      queryClient.invalidateQueries({ queryKey: ['user-credits'] });
    }
  }, [copy.error, copy.success, queryClient, task?.errorMessage, task?.status]);

  const progressLabel = `${copy.generating}${
    task?.providerStatus === 'IN_QUEUE' &&
    typeof task.queuePosition === 'number' &&
    task.queuePosition > 0
      ? ` · #${task.queuePosition}`
      : ''
  } · ${elapsedSeconds}s`;
  const creditBalance = creditsQuery.data?.balance;
  const hasInsufficientCredits =
    typeof creditBalance === 'number' && creditBalance < generationCost;
  const creditLabel = !mounted
    ? copy.creditsLoading
    : !session?.user
      ? copy.creditsSignIn
      : creditsQuery.isError
        ? copy.creditsUnavailable
        : typeof creditBalance === 'number'
          ? copy.creditsLabel.replace(
              '{credits}',
              creditBalance.toLocaleString()
            )
          : copy.creditsLoading;

  const firstOptions =
    kind === 'poster'
      ? copy.poster.purposeOptions
      : copy.productPhoto.settingOptions;
  const secondOptions =
    kind === 'poster'
      ? copy.poster.styleOptions
      : copy.productPhoto.lightingOptions;
  const productSettingIndex = Math.max(
    0,
    copy.productPhoto.settingOptions.findIndex(
      (option) => option.prompt === firstOption
    )
  );
  const productPreviewBackground = [
    'from-stone-50 to-slate-200 dark:from-stone-900 dark:to-slate-800',
    'from-emerald-50 to-amber-100 dark:from-emerald-950 dark:to-amber-950',
    'from-zinc-100 to-amber-200 dark:from-zinc-950 dark:to-amber-900',
    'from-fuchsia-100 to-cyan-100 dark:from-fuchsia-950 dark:to-cyan-950',
  ][productSettingIndex];

  useEffect(() => {
    if (kind !== 'product_photo' || !mounted) return;
    window.sessionStorage.setItem(
      'image-studio:product-photo-draft',
      JSON.stringify({
        product: primary,
        details: secondary,
        setting: firstOption,
        lighting: secondOption,
        palette,
        aspect: ASPECT_VALUES[aspect],
      })
    );
  }, [
    aspect,
    firstOption,
    kind,
    mounted,
    palette,
    primary,
    secondOption,
    secondary,
  ]);

  function handleGenerate() {
    if (!mounted || !session?.user) {
      router.push(
        `/sign-up?callbackUrl=${encodeURIComponent(`${copy.path}#generator`)}`
      );
      return;
    }
    if (!composedPrompt || hasInsufficientCredits) {
      if (hasInsufficientCredits) router.push('/pricing');
      return;
    }
    generateMutation.mutate();
  }

  function handleCredits() {
    if (!mounted) return;
    if (!session?.user) {
      router.push(
        `/sign-in?callbackUrl=${encodeURIComponent(`${copy.path}#generator`)}`
      );
      return;
    }
    router.push(hasInsufficientCredits ? '/pricing' : '/settings/credits');
  }

  function handleLocalProductFile(file?: File) {
    if (!file || !['image/jpeg', 'image/png', 'image/webp'].includes(file.type))
      return;
    if (file.size > 10 * 1024 * 1024) return;
    setLocalProductPreview((current) => {
      if (current?.startsWith('blob:')) URL.revokeObjectURL(current);
      return URL.createObjectURL(file);
    });
  }

  async function downloadLocalPreview() {
    if (!localProductPreview) return;
    const image = new Image();
    image.src = localProductPreview;
    await image.decode();
    const [width, height] =
      aspect === 'square'
        ? [1024, 1024]
        : aspect === 'landscape'
          ? [1200, 900]
          : [900, 1200];
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) return;
    const gradient = context.createLinearGradient(0, 0, width, height);
    const productPreviewColors = [
      ['#fafaf9', '#e2e8f0'],
      ['#ecfdf5', '#fef3c7'],
      ['#f4f4f5', '#fde68a'],
      ['#fae8ff', '#cffafe'],
    ][productSettingIndex] ?? ['#fafaf9', '#e2e8f0'];
    gradient.addColorStop(0, productPreviewColors[0]);
    gradient.addColorStop(1, productPreviewColors[1]);
    context.fillStyle = gradient;
    context.fillRect(0, 0, width, height);
    const scale = Math.min(
      (width * 0.72) / image.width,
      (height * 0.72) / image.height
    );
    const drawWidth = image.width * scale;
    const drawHeight = image.height * scale;
    context.drawImage(
      image,
      (width - drawWidth) / 2,
      (height - drawHeight) / 2,
      drawWidth,
      drawHeight
    );
    const anchor = document.createElement('a');
    anchor.download = `product-layout-${aspect}.png`;
    anchor.href = canvas.toDataURL('image/png');
    anchor.click();
  }

  return (
    <div className="border-border bg-card overflow-hidden rounded-[1.75rem] border shadow-xl">
      <div className="border-border flex flex-col gap-3 border-b px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
        <div className="flex items-center gap-3">
          <span className="bg-primary text-primary-foreground flex size-10 items-center justify-center rounded-xl">
            <WandSparkles className="size-4" />
          </span>
          <div>
            <p className="font-semibold">{copy.workspaceLabel}</p>
            <p className="text-muted-foreground text-xs">
              {copy.workspaceDescription}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleCredits}
          className={cn(
            'border-border bg-background hover:border-primary/40 flex h-10 items-center gap-2 self-start rounded-full border px-3 text-xs font-medium transition-colors sm:self-auto',
            hasInsufficientCredits &&
              'border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300'
          )}
        >
          {creditsQuery.isFetching && session?.user ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Coins className="size-3.5" />
          )}
          {creditLabel}
          {hasInsufficientCredits ? (
            <span className="border-l border-current/25 pl-2">
              {copy.getCredits}
            </span>
          ) : null}
        </button>
      </div>

      {kind === 'product_photo' ? (
        <div className="border-border bg-muted/20 grid gap-4 border-b p-5 sm:grid-cols-2 sm:p-7">
          <div>
            <p className="mb-3 text-sm font-semibold">{copy.originalImage}</p>
            <label className="border-border bg-background flex aspect-[4/3] cursor-pointer items-center justify-center overflow-hidden rounded-2xl border border-dashed">
              {localProductPreview ? (
                <img
                  src={localProductPreview}
                  alt={copy.originalImage}
                  className="size-full object-contain"
                />
              ) : (
                <span className="text-muted-foreground flex items-center gap-2 text-sm">
                  <Upload className="size-4" />
                  {copy.productPhoto.productLabel}
                </span>
              )}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                onChange={(event) =>
                  handleLocalProductFile(event.target.files?.[0])
                }
              />
            </label>
          </div>
          <div>
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-sm font-semibold">{copy.promptPreviewLabel}</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!localProductPreview}
                onClick={downloadLocalPreview}
                className="rounded-full"
              >
                <Download className="size-3.5" />
                {copy.downloadPreview}
              </Button>
            </div>
            <div
              className={cn(
                'border-border flex items-center justify-center overflow-hidden rounded-2xl border bg-gradient-to-br',
                productPreviewBackground,
                aspect === 'square'
                  ? 'aspect-square'
                  : aspect === 'landscape'
                    ? 'aspect-[4/3]'
                    : 'aspect-[3/4]'
              )}
            >
              {localProductPreview ? (
                <img
                  src={localProductPreview}
                  alt={copy.promptPreviewLabel}
                  className="max-h-[72%] max-w-[72%] object-contain drop-shadow-xl"
                />
              ) : (
                <ImageIcon className="text-muted-foreground/40 size-10" />
              )}
            </div>
          </div>
          <p className="text-muted-foreground text-xs leading-5 sm:col-span-2">
            {copy.productPhoto.detailsPlaceholder}
          </p>
        </div>
      ) : null}

      <div className="grid lg:grid-cols-[1.08fr_.92fr]">
        <div className="space-y-5 p-5 sm:p-7">
          <div>
            <Label htmlFor={`${kind}-primary`}>
              {kind === 'poster'
                ? copy.poster.headlineLabel
                : copy.productPhoto.productLabel}{' '}
              <span className="text-primary text-xs">{copy.requiredLabel}</span>
            </Label>
            <Input
              id={`${kind}-primary`}
              value={primary}
              onChange={(event) => setPrimary(event.target.value)}
              placeholder={
                kind === 'poster'
                  ? copy.poster.headlinePlaceholder
                  : copy.productPhoto.productPlaceholder
              }
              className="mt-2 h-11 rounded-xl"
              maxLength={80}
              disabled={isGenerating}
            />
          </div>

          <div>
            <Label htmlFor={`${kind}-secondary`}>
              {kind === 'poster'
                ? copy.poster.supportingLabel
                : copy.productPhoto.detailsLabel}{' '}
              <span className="text-muted-foreground text-xs font-normal">
                {copy.optionalLabel}
              </span>
            </Label>
            <Textarea
              id={`${kind}-secondary`}
              value={secondary}
              onChange={(event) => setSecondary(event.target.value)}
              placeholder={
                kind === 'poster'
                  ? copy.poster.supportingPlaceholder
                  : copy.productPhoto.detailsPlaceholder
              }
              className="mt-2 min-h-24 resize-none rounded-xl"
              maxLength={kind === 'poster' ? 160 : 130}
              disabled={isGenerating}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor={`${kind}-first-option`}>
                {kind === 'poster'
                  ? copy.poster.purposeLabel
                  : copy.productPhoto.settingLabel}
              </Label>
              <SiteSelect
                id={`${kind}-first-option`}
                value={firstOption}
                onChange={(event) => setFirstOption(event.target.value)}
                disabled={isGenerating}
                className="border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 mt-2 h-11 w-full rounded-xl border px-3 text-sm shadow-xs outline-none focus-visible:ring-[3px]"
              >
                {firstOptions.map((option) => (
                  <option key={option.value} value={option.prompt}>
                    {option.label}
                  </option>
                ))}
              </SiteSelect>
            </div>
            <div>
              <Label htmlFor={`${kind}-second-option`}>
                {kind === 'poster'
                  ? copy.poster.styleLabel
                  : copy.productPhoto.lightingLabel}
              </Label>
              <SiteSelect
                id={`${kind}-second-option`}
                value={secondOption}
                onChange={(event) => setSecondOption(event.target.value)}
                disabled={isGenerating}
                className="border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 mt-2 h-11 w-full rounded-xl border px-3 text-sm shadow-xs outline-none focus-visible:ring-[3px]"
              >
                {secondOptions.map((option) => (
                  <option key={option.value} value={option.prompt}>
                    {option.label}
                  </option>
                ))}
              </SiteSelect>
            </div>
          </div>

          <div>
            <Label htmlFor={`${kind}-palette`}>
              {kind === 'poster'
                ? copy.poster.paletteLabel
                : copy.productPhoto.paletteLabel}{' '}
              <span className="text-muted-foreground text-xs font-normal">
                {copy.optionalLabel}
              </span>
            </Label>
            <Input
              id={`${kind}-palette`}
              value={palette}
              onChange={(event) => setPalette(event.target.value)}
              placeholder={
                kind === 'poster'
                  ? copy.poster.palettePlaceholder
                  : copy.productPhoto.palettePlaceholder
              }
              className="mt-2 h-11 rounded-xl"
              maxLength={60}
              disabled={isGenerating}
            />
          </div>

          <fieldset>
            <legend className="text-sm font-medium">{copy.aspectLabel}</legend>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {(
                [
                  ['square', copy.square],
                  ['landscape', copy.landscape],
                  ['portrait', copy.portrait],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setAspect(value)}
                  aria-pressed={aspect === value}
                  className={cn(
                    'border-border min-h-10 rounded-xl border px-2 text-xs font-medium transition-colors',
                    aspect === value
                      ? 'border-primary bg-primary/8 text-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </fieldset>

          {composedPrompt ? (
            <details className="border-border bg-muted/35 rounded-xl border px-4 py-3">
              <summary className="flex min-h-10 cursor-pointer items-center text-xs font-semibold">
                {copy.promptPreviewLabel}
              </summary>
              <p className="text-muted-foreground mt-3 text-xs leading-5">
                {composedPrompt}
              </p>
            </details>
          ) : null}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
              <Sparkles className="size-3.5" />
              {copy.cost.replace('{credits}', String(generationCost))}
            </p>
            <Button
              size="lg"
              onClick={handleGenerate}
              disabled={
                isGenerating ||
                Boolean(mounted && session?.user && !composedPrompt)
              }
              className="h-12 rounded-full px-7"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  {progressLabel}
                </>
              ) : mounted && session?.user ? (
                <>
                  <Sparkles className="size-4" />
                  {copy.generate}
                </>
              ) : (
                <>
                  {copy.signUpToGenerate}
                  <ArrowRight className="size-4" />
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="border-border bg-muted/30 border-t p-5 sm:p-7 lg:border-t-0 lg:border-l">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold">{copy.resultTitle}</p>
            {outputUrl ? (
              <span className="text-primary flex items-center gap-1 text-xs font-medium">
                <CheckCircle2 className="size-3.5" />
                {copy.resultReady}
              </span>
            ) : null}
          </div>
          <div
            className={cn(
              'border-border bg-background flex min-h-72 items-center justify-center overflow-hidden rounded-2xl border',
              aspect === 'square'
                ? 'aspect-square'
                : aspect === 'landscape'
                  ? 'aspect-[4/3]'
                  : 'aspect-[3/4]'
            )}
          >
            {outputUrl ? (
              <img
                src={outputUrl}
                alt={task?.prompt || composedPrompt}
                className="size-full object-cover"
              />
            ) : isGenerating ? (
              <div className="space-y-4 text-center">
                <Loader2 className="text-primary mx-auto size-8 animate-spin" />
                <p className="text-muted-foreground text-sm">{progressLabel}</p>
              </div>
            ) : (
              <div className="max-w-64 px-6 text-center">
                <ImageIcon className="text-muted-foreground/50 mx-auto size-12" />
                <p className="text-muted-foreground mt-4 text-sm leading-6">
                  {copy.resultEmpty}
                </p>
              </div>
            )}
          </div>
          <div className="mt-4 flex items-center justify-between gap-3">
            <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
              <LockKeyhole className="size-3.5" />
              {copy.privateLabel}
            </p>
            {outputUrl ? (
              <Button
                variant="outline"
                size="sm"
                className="rounded-full"
                onClick={() => router.push('/settings/generate')}
              >
                {copy.openStudio}
                <ArrowRight className="size-3.5" />
              </Button>
            ) : null}
          </div>
        </div>
      </div>
      <FirstGenerationFeedback
        taskId={activeTaskId}
        status={task?.status}
        modelId={generationModel}
      />
    </div>
  );
}
