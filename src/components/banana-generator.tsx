import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react';
import { useForm } from '@tanstack/react-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  AccountCreditBalance,
  AccountImageTask,
} from '@/types/banana-account';
import type { CheckoutProduct } from '@/types/checkout';
import {
  ArrowUpRight,
  Check,
  ChevronDown,
  Copy,
  Download,
  ImagePlus,
  Images,
  Loader2,
  Maximize2,
  Search,
  Sparkles,
  Type,
} from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';

import { useSession } from '@/core/auth/client';
import { Link, useRouter } from '@/core/i18n/navigation';
import {
  CREATIVE_MODELS,
  getCreativeOutputLimit,
  getCreativeUnitCredits,
  type CreativeModelId,
} from '@/config/creative-studio';
import { trackFunnelEvent } from '@/lib/analytics-events';
import { apiGet, apiPost } from '@/lib/api-client';
import {
  prepareBananaGenerator,
  type BananaGeneratorSelection,
} from '@/lib/banana-generator-navigation';
import {
  normalizeCreativeScene,
  parseActiveCreativeTask,
} from '@/lib/banana-task-resume';
import {
  createGenerationPurchaseIntent,
  GENERATION_PURCHASE_INTENT_KEY,
  parseGenerationPurchaseIntent,
  recommendGenerationProduct,
} from '@/lib/generation-purchase';
import {
  generatorDraftFromSelection,
  markGeneratorDraftAccepted,
  normalizeGeneratorDraft,
  PREVIOUS_GENERATOR_DRAFT_KEY,
  resolveGeneratorEntry,
  savePreviousGeneratorDraft,
  type GeneratorDraft,
} from '@/lib/generator-entry';
import { ModelBrandTile } from '@/components/creative-visuals';
import { FirstGenerationFeedback } from '@/components/first-generation-feedback';
import { GenerationPurchaseDialog } from '@/components/generation-purchase-dialog';
import {
  ImageUploader,
  type ImageUploaderValue,
} from '@/components/image-uploader';
import { ZoomableImageDialog } from '@/components/zoomable-image-dialog';

type ModelState = { id: string; configured: boolean; enabled: boolean };
type Task = {
  id: string;
  status: string;
  images?: Array<{ imageUrl?: string }>;
  errorMessage?: string;
  model?: string;
  createdAt?: string;
  costCredits?: number;
  inferenceTime?: number;
  options?: Record<string, unknown>;
};
type GenerationPreflight = {
  credits: number;
  balance: number;
  shortfall: number;
  canGenerate: boolean;
};
export type NanoRecipe = { id: string; title: string; prompt: string };
export type GeneratorExample = {
  id: string;
  title: string;
  image: string;
  alt: string;
  selection: BananaGeneratorSelection;
};

function displayRatio(size: string) {
  return (
    (
      {
        square_hd: '1:1',
        square: '1:1',
        landscape_4_3: '4:3',
        landscape_16_9: '16:9',
        portrait_4_3: '3:4',
        portrait_16_9: '9:16',
      } as Record<string, string>
    )[size] || size
  );
}
function RatioIcon({ ratio }: { ratio: string }) {
  ratio = displayRatio(ratio);
  const [width, height] =
    ratio === 'auto' ? [1, 1] : ratio.split(':').map(Number);
  const longest = Math.max(width || 1, height || 1);
  return (
    <span
      className="banana-generator__ratio-icon"
      aria-hidden
      style={{
        width: (18 * (width || 1)) / longest,
        height: (18 * (height || 1)) / longest,
      }}
    />
  );
}

function moveChoice(
  event: KeyboardEvent<HTMLButtonElement>,
  values: readonly string[],
  current: string,
  choose: (value: string) => void
) {
  if (
    ![
      'ArrowLeft',
      'ArrowRight',
      'ArrowUp',
      'ArrowDown',
      'Home',
      'End',
    ].includes(event.key)
  )
    return;
  event.preventDefault();
  const index = values.indexOf(current);
  const next =
    event.key === 'Home'
      ? 0
      : event.key === 'End'
        ? values.length - 1
        : (index +
            (event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1 : 1) +
            values.length) %
          values.length;
  choose(values[next]);
  const buttons = event.currentTarget
    .closest('[role="radiogroup"]')
    ?.querySelectorAll<HTMLButtonElement>('[role="radio"]');
  [...(buttons || [])]
    .find((button) => button.dataset.value === values[next])
    ?.focus();
}
const WORKBENCH_MODELS = [
  'nano-banana-2.1',
  'nano-banana-2',
  'nano-banana-pro',
  'nano-banana-2-lite',
] as const;

export function BananaGenerator({
  copy,
  recipes,
  initialModel = 'nano-banana-2.1',
  initialMode = 'generate',
  returnPath = '/',
  allModels = false,
  examples = [],
}: {
  copy: Record<string, string>;
  recipes: NanoRecipe[];
  initialModel?: CreativeModelId;
  initialMode?: 'generate' | 'edit';
  returnPath?: string;
  allModels?: boolean;
  examples?: GeneratorExample[];
}) {
  const { data: session } = useSession();
  const router = useRouter();
  const fieldId = useId();
  const [modelId, setModelId] = useState<CreativeModelId>(initialModel);
  const [mode, setMode] = useState(initialMode);
  const [ratio, setRatio] = useState(
    () =>
      CREATIVE_MODELS.find((item) => item.id === initialModel)?.sizes[0] ||
      '1:1'
  );
  const [outputCount, setOutputCount] = useState(1);
  const [resolution, setResolution] = useState(
    CREATIVE_MODELS.find((item) => item.id === initialModel)?.resolutions?.[0]
  );
  const [showAllRatios, setShowAllRatios] = useState(false);
  const [modelPickerOpen, setModelPickerOpen] = useState(false);
  const [modelSearch, setModelSearch] = useState('');
  const [resultIndex, setResultIndex] = useState(0);
  const [resultDimensions, setResultDimensions] = useState<{
    url: string;
    width: number;
    height: number;
  }>();
  const [references, setReferences] = useState<ImageUploaderValue[]>([]);
  const [taskId, setTaskId] = useState<string>();
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [draftRestored, setDraftRestored] = useState(false);
  const [initialReferenceUrls, setInitialReferenceUrls] = useState<string[]>(
    []
  );
  const [selectedHistory, setSelectedHistory] = useState<AccountImageTask>();
  const [previewOpen, setPreviewOpen] = useState(false);
  const [scene, setScene] = useState('general');
  const [requestContext, setRequestContext] = useState<{
    model: CreativeModelId;
    mode: typeof mode;
    scene: string;
  }>();
  const explicitSelection = useRef(false);
  const applyingDraft = useRef(false);
  const [previousDraft, setPreviousDraft] =
    useState<ReturnType<typeof normalizeGeneratorDraft>>(null);
  const restoringTask = useRef(false);
  const refreshedTask = useRef<string | undefined>(undefined);
  const previousUser = useRef(session?.user?.id);
  const resumeAttempted = useRef(false);
  const [purchaseOpen, setPurchaseOpen] = useState(false);
  const [purchaseDraft, setPurchaseDraft] = useState<GeneratorDraft>();
  const [purchaseQuote, setPurchaseQuote] = useState<GenerationPreflight>();
  const [selectedProductId, setSelectedProductId] = useState<string>();
  const queryClient = useQueryClient();
  const model = CREATIVE_MODELS.find((item) => item.id === modelId)!;
  const availability = useQuery({
    queryKey: ['creative-models'],
    queryFn: () => apiGet<ModelState[]>('/api/studio/models'),
    staleTime: 30_000,
  });
  const state = availability.data?.find((item) => item.id === modelId);
  const ready =
    model.productionEnabled && Boolean(state?.configured && state.enabled);
  const supportsBatch = getCreativeOutputLimit(modelId) > 1;
  const count = supportsBatch ? outputCount : 1;
  const selectedResolution = model.resolutions?.includes(resolution || '')
    ? resolution
    : model.resolutions?.[0];
  const unitCost = getCreativeUnitCredits(model, mode, selectedResolution);
  const cost = unitCost ? unitCost * count : undefined;
  const commonRatios = model.sizes.filter((size) =>
    ['auto', '1:1', '16:9', '9:16'].includes(displayRatio(size))
  );
  const visibleRatios = showAllRatios
    ? model.sizes
    : [
        ...new Set([
          ...commonRatios,
          ...(commonRatios.includes(ratio) ? [] : [ratio]),
        ]),
      ];
  const balance = useQuery({
    queryKey: ['account-balance', session?.user?.id],
    queryFn: () => apiGet<AccountCreditBalance>('/api/credits'),
    enabled: Boolean(session?.user),
    staleTime: 15000,
  });
  const checkoutProducts = useQuery({
    queryKey: ['checkout-products'],
    queryFn: () => apiGet<CheckoutProduct[]>('/api/payment/products'),
    enabled: Boolean(session?.user),
    staleTime: 60_000,
  });
  const creditProducts = (checkoutProducts.data || []).filter((product) =>
    ['credits_boost', 'credits_flex', 'credits_power'].includes(
      product.productId
    )
  );
  const insufficient =
    typeof cost === 'number' &&
    typeof balance.data?.balance === 'number' &&
    balance.data.balance < cost;
  const history = useQuery({
    queryKey: ['banana-recent-images', session?.user?.id],
    queryFn: () => apiGet<{ items: AccountImageTask[] }>('/api/images?limit=8'),
    enabled: Boolean(session?.user),
    staleTime: 15_000,
    refetchInterval: (query) =>
      query.state.data?.items.some((item) =>
        ['pending', 'processing'].includes(item.status)
      )
        ? 5000
        : false,
  });
  const task = useQuery({
    queryKey: ['nano-site-task', session?.user?.id, taskId],
    queryFn: () => apiGet<Task>(`/api/images/${taskId}`),
    enabled: Boolean(taskId && session?.user),
    retry: 2,
    refetchOnWindowFocus: false,
    refetchInterval: (query) =>
      query.state.status === 'error' ||
      ['success', 'failed', 'canceled'].includes(query.state.data?.status || '')
        ? false
        : typeof document !== 'undefined' &&
            document.visibilityState === 'visible'
          ? 2500
          : false,
  });
  const run = useMutation({
    mutationFn: (draft: GeneratorDraft) =>
      apiPost<{ id: string }>('/api/studio/run', {
        model: draft.model,
        operation: draft.operation,
        prompt: draft.prompt,
        size: draft.aspectRatio,
        resolution: draft.resolution,
        outputFormat: 'png',
        outputCount: draft.outputCount,
        imageUrls: draft.imageUrls,
      }),
    onSuccess: (data, submitted) => {
      explicitSelection.current = false;
      try {
        markGeneratorDraftAccepted(sessionStorage, submitted);
      } catch {
        /* History remains available without optional browser storage. */
      }
      setSelectedHistory(undefined);
      setTaskId(data.id);
      if (window.matchMedia('(max-width: 1023px)').matches)
        document.getElementById(`${fieldId}-preview`)?.scrollIntoView({
          behavior: window.matchMedia('(prefers-reduced-motion: reduce)')
            .matches
            ? 'instant'
            : 'smooth',
          block: 'start',
        });
      setRequestContext({
        model: submitted.model as CreativeModelId,
        mode: submitted.operation,
        scene,
      });
      trackFunnelEvent('generate_started', {
        model: submitted.model,
        mode: submitted.operation,
        scene,
      });
      try {
        sessionStorage.setItem(
          `banana:active-task:${session?.user?.id}`,
          JSON.stringify({
            id: data.id,
            model: submitted.model,
            mode: submitted.operation,
            scene,
            ratio: submitted.aspectRatio,
            resolution: submitted.resolution,
            outputCount: submitted.outputCount,
          })
        );
      } catch {
        /* Resume remains available in history. */
      }
    },
    onError: (error: Error) => {
      toast.error(error.message);
      trackFunnelEvent('generate_failed', {
        model: modelId,
        scene,
        stage: 'submission',
      });
    },
  });
  const preflight = useMutation({
    mutationFn: (draft: GeneratorDraft) =>
      apiPost<GenerationPreflight>('/api/studio/preflight', {
        model: draft.model,
        operation: draft.operation,
        prompt: draft.prompt,
        size: draft.aspectRatio,
        resolution: draft.resolution,
        outputFormat: 'png',
        outputCount: draft.outputCount,
        imageUrls: draft.imageUrls,
      }),
    onError: (error: Error) => {
      toast.error(error.message);
      trackFunnelEvent('generate_failed', {
        model: modelId,
        scene,
        stage: 'preflight',
      });
    },
  });
  const working =
    run.isPending ||
    Boolean(
      taskId &&
      !task.isError &&
      !['success', 'failed', 'canceled'].includes(task.data?.status || '')
    );
  const form = useForm({
    defaultValues: { prompt: '' },
    validators: {
      onSubmit: z.object({ prompt: z.string().trim().min(1).max(32000) }),
    },
    onSubmit: async ({ value }) => {
      if (!ready || !session?.user || working || preflight.isPending) return;
      if (
        mode === 'edit' &&
        !references.some((item) => item.status === 'uploaded' && item.url)
      )
        return;
      remember();
      setTaskId(undefined);
      trackFunnelEvent('generate_clicked', { model: modelId, mode, scene });
      const submitted = normalizeGeneratorDraft(
        {
          prompt: value.prompt.trim(),
          model: modelId,
          operation: mode,
          aspectRatio: ratio,
          resolution: selectedResolution,
          outputCount: count,
          imageUrls:
            mode === 'edit'
              ? references
                  .filter((item) => item.status === 'uploaded' && item.url)
                  .map((item) => item.url)
              : [],
        },
        modelId,
        true
      );
      if (!submitted) return;
      const quote = await preflight
        .mutateAsync(submitted)
        .catch(() => undefined);
      if (!quote) return;
      queryClient.setQueryData<AccountCreditBalance>(
        ['account-balance', session.user.id],
        (current) =>
          current ? { ...current, balance: quote.balance } : current
      );
      trackFunnelEvent('generation_preflight_passed', {
        model: modelId,
        credits: quote.credits,
        can_generate: quote.canGenerate,
      });
      if (quote.canGenerate) {
        await run.mutateAsync(submitted).catch(() => undefined);
        return;
      }
      const recommended = recommendGenerationProduct(
        creditProducts,
        quote.shortfall
      );
      setPurchaseDraft(submitted);
      setPurchaseQuote(quote);
      setSelectedProductId(recommended?.productId);
      setPurchaseOpen(true);
      trackFunnelEvent('generation_paywall_shown', {
        model: modelId,
        credits: quote.credits,
        shortfall: quote.shortfall,
      });
      trackFunnelEvent('credit_balance_low', { model: modelId, scene });
    },
  });

  const applyGeneratorDraft = useCallback(
    (
      draft: GeneratorDraft,
      options: { backupCurrent?: boolean; track?: boolean } = {}
    ) => {
      if (working) {
        toast.info(copy.active_preserved);
        return false;
      }
      const { backupCurrent = true, track = true } = options;
      if (backupCurrent) {
        try {
          savePreviousGeneratorDraft(sessionStorage);
          const raw = sessionStorage.getItem(PREVIOUS_GENERATOR_DRAFT_KEY);
          setPreviousDraft(
            raw
              ? normalizeGeneratorDraft(
                  JSON.parse(raw),
                  initialModel,
                  allModels
                )
              : null
          );
        } catch {
          /* Preparation still works without storage. */
        }
      }

      applyingDraft.current = true;
      explicitSelection.current = true;
      form.setFieldValue('prompt', draft.prompt);
      setModelId(draft.model as CreativeModelId);
      setMode(draft.operation);
      setRatio(draft.aspectRatio);
      setResolution(draft.resolution);
      setOutputCount(draft.outputCount);
      setInitialReferenceUrls(draft.imageUrls);
      setReferences(
        draft.operation === 'edit'
          ? draft.imageUrls.map((url, index) => ({
              id: `reference-${index}`,
              preview: url,
              url,
              status: 'uploaded' as const,
            }))
          : []
      );
      setTaskId(undefined);
      setSelectedHistory(undefined);
      try {
        sessionStorage.setItem(
          'nano-site:draft:v2',
          JSON.stringify({ ...draft, pendingSelection: true })
        );
      } catch {
        /* Preparation still works without storage. */
      } finally {
        applyingDraft.current = false;
      }
      if (track)
        trackFunnelEvent('recipe_prefilled', {
          source: 'inline-selection',
          model: draft.model,
        });
      return true;
    },
    [allModels, copy.active_preserved, form, initialModel, working]
  );

  useEffect(() => {
    if (
      !draftLoaded ||
      !session?.user ||
      !ready ||
      working ||
      resumeAttempted.current ||
      new URLSearchParams(window.location.search).get('generation') !== 'resume'
    ) {
      return;
    }
    resumeAttempted.current = true;
    void (async () => {
      let intent;
      try {
        const raw = sessionStorage.getItem(GENERATION_PURCHASE_INTENT_KEY);
        intent = parseGenerationPurchaseIntent(raw ? JSON.parse(raw) : null);
      } catch {
        intent = null;
      }
      const cleanUrl = new URL(window.location.href);
      cleanUrl.searchParams.delete('generation');
      window.history.replaceState(
        window.history.state,
        '',
        cleanUrl.pathname + cleanUrl.search + cleanUrl.hash
      );
      if (!intent) {
        try {
          sessionStorage.removeItem(GENERATION_PURCHASE_INTENT_KEY);
        } catch {
          /* Optional storage cannot block the restored draft. */
        }
        return;
      }
      applyGeneratorDraft(intent.draft, { backupCurrent: false, track: false });
      const refreshed = await balance.refetch();
      const available = refreshed.data?.balance ?? 0;
      if (available < intent.credits) {
        const quote = {
          credits: intent.credits,
          balance: available,
          shortfall: intent.credits - available,
          canGenerate: false,
        };
        const recommended = recommendGenerationProduct(
          creditProducts,
          quote.shortfall
        );
        setPurchaseDraft(intent.draft);
        setPurchaseQuote(quote);
        setSelectedProductId(recommended?.productId);
        setPurchaseOpen(true);
        return;
      }
      try {
        sessionStorage.removeItem(GENERATION_PURCHASE_INTENT_KEY);
      } catch {
        /* The URL is already consumed, preventing an automatic retry loop. */
      }
      trackFunnelEvent('generation_resumed', {
        model: intent.draft.model,
        credits: intent.credits,
      });
      await run.mutateAsync(intent.draft).catch(() => undefined);
    })();
  }, [
    applyGeneratorDraft,
    balance.refetch,
    creditProducts,
    draftLoaded,
    ready,
    run,
    session?.user,
    working,
  ]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setScene(normalizeCreativeScene(params.get('scene')));
    const read = (key: string): unknown => {
      try {
        const raw = sessionStorage.getItem(key);
        return raw ? JSON.parse(raw) : null;
      } catch {
        return null;
      }
    };
    const stored = read('nano-site:draft:v2');
    const saved =
      stored &&
      typeof stored === 'object' &&
      ['/editor', '/nano-banana-pro'].includes(returnPath)
        ? { ...stored, model: initialModel, operation: initialMode }
        : stored;
    const entry = resolveGeneratorEntry(
      params,
      saved,
      read('banana-account:handoff:v1'),
      initialModel,
      allModels
    );
    explicitSelection.current = entry.explicit;
    if (entry.explicit && entry.source !== 'saved-selection') {
      try {
        savePreviousGeneratorDraft(sessionStorage);
      } catch {
        /* Public recipes work without browser storage. */
      }
    }
    setPreviousDraft(
      normalizeGeneratorDraft(
        read(PREVIOUS_GENERATOR_DRAFT_KEY),
        initialModel,
        allModels
      )
    );
    const draft = entry.draft;
    if (draft) {
      form.setFieldValue('prompt', draft.prompt);
      setModelId(draft.model as CreativeModelId);
      setMode(draft.operation);
      setRatio(draft.aspectRatio);
      setResolution(draft.resolution);
      setOutputCount(draft.outputCount);
      setInitialReferenceUrls(draft.imageUrls);
      setDraftRestored(!entry.explicit && Boolean(draft.prompt));
      if (entry.explicit && entry.source !== 'saved-selection')
        trackFunnelEvent('recipe_prefilled', {
          source: entry.source,
          model: draft.model,
          recipe_id: params.get('recipe') || 'account',
        });
    } else if (entry.missing) {
      toast.error(copy.prefill_failed);
      trackFunnelEvent('recipe_prefill_failed', { source: entry.source });
    } else {
      try {
        const oldPrompt = sessionStorage.getItem('nano-site:prompt');
        if (oldPrompt) form.setFieldValue('prompt', oldPrompt.slice(0, 32000));
      } catch {
        /* Optional legacy draft. */
      }
    }
    if (entry.explicit && draft) {
      try {
        sessionStorage.setItem(
          'nano-site:draft:v2',
          JSON.stringify({ ...draft, pendingSelection: true })
        );
        const clean = new URL(window.location.href);
        for (const key of [
          'recipe',
          'resume',
          'prompt',
          'model',
          'mode',
          'ratio',
          'resolution',
          'outputCount',
        ])
          clean.searchParams.delete(key);
        window.history.replaceState(
          window.history.state,
          '',
          clean.pathname + clean.search + clean.hash
        );
      } catch {
        /* Keep public recipe URL usable when storage is unavailable. */
      }
    }
    if (entry.source === 'account-handoff' && draft) {
      try {
        sessionStorage.removeItem('banana-account:handoff:v1');
      } catch {
        /* Optional storage. */
      }
    }
    setDraftLoaded(true);
  }, [form, initialModel, returnPath, allModels]);
  useEffect(() => {
    if (!draftLoaded) return;
    const save = () => {
      if (applyingDraft.current) return;
      try {
        window.sessionStorage.setItem(
          'nano-site:draft:v2',
          JSON.stringify({
            pendingSelection: explicitSelection.current,
            prompt: form.state.values.prompt,
            model: modelId,
            operation: mode,
            aspectRatio: ratio,
            resolution: selectedResolution,
            outputCount: count,
            imageUrls: references
              .filter(
                (item) =>
                  item.status === 'uploaded' && item.url?.startsWith('https://')
              )
              .map((item) => item.url),
          })
        );
      } catch {
        /* draft downloads remain available without storage */
      }
    };
    save();
    const subscription = form.store.subscribe(save);
    return () => subscription.unsubscribe();
  }, [
    draftLoaded,
    form,
    modelId,
    mode,
    ratio,
    selectedResolution,
    count,
    references,
  ]);
  useEffect(() => {
    if (resolution !== selectedResolution) setResolution(selectedResolution);
  }, [resolution, selectedResolution]);
  useEffect(() => {
    if (!model.sizes.includes(ratio)) setRatio(model.sizes[0] || '1:1');
  }, [model, ratio]);
  useEffect(() => {
    const resume = () => {
      if (
        document.visibilityState === 'visible' &&
        taskId &&
        !task.isError &&
        !['success', 'failed', 'canceled'].includes(task.data?.status || '')
      )
        void task.refetch();
    };
    document.addEventListener('visibilitychange', resume);
    return () => document.removeEventListener('visibilitychange', resume);
  }, [taskId, task.isError, task.data?.status, task.refetch]);
  useEffect(() => {
    setReferences(
      mode === 'edit'
        ? initialReferenceUrls
            .slice(0, model.maxReferences)
            .map((url, index) => ({
              id: `reference-${index}`,
              preview: url,
              url,
              status: 'uploaded',
            }))
        : []
    );
  }, [modelId, ready, mode, initialReferenceUrls, model.maxReferences]);
  useEffect(() => {
    if (!restoringTask.current) setTaskId(undefined);
    restoringTask.current = false;
  }, [modelId, mode, ratio, selectedResolution]);
  useEffect(() => {
    if (previousUser.current === session?.user?.id) return;
    const signingIn = !previousUser.current && Boolean(session?.user?.id);
    previousUser.current = session?.user?.id;
    if (signingIn) return;
    setTaskId(undefined);
    setSelectedHistory(undefined);
    setInitialReferenceUrls([]);
  }, [session?.user?.id]);
  useEffect(() => {
    if (!session?.user || !draftLoaded) return;
    try {
      const raw = sessionStorage.getItem(
        `banana:active-task:${session.user.id}`
      );
      if (!raw) return;
      if (explicitSelection.current) {
        toast.info(copy.active_preserved);
        return;
      }
      const saved = parseActiveCreativeTask(raw);
      if (!saved) return;
      const selected = saved.model;
      if (!allModels && !WORKBENCH_MODELS.some((id) => id === selected.id))
        return;
      restoringTask.current =
        selected.id !== modelId ||
        saved.mode !== mode ||
        saved.ratio !== ratio ||
        saved.resolution !== selectedResolution;
      setModelId(selected.id);
      setMode(saved.mode);
      if (selected.sizes.includes(saved.ratio)) setRatio(saved.ratio);
      setTaskId(saved.id);
      setOutputCount(saved.outputCount);
      setResolution(saved.resolution);
      setRequestContext({
        model: selected.id,
        mode: saved.mode,
        scene: saved.scene,
      });
    } catch {
      /* Invalid saved state cannot block new work. */
    }
  }, [session?.user?.id, draftLoaded, allModels]);
  useEffect(() => {
    if (
      !taskId ||
      !['success', 'failed', 'canceled'].includes(task.data?.status || '') ||
      refreshedTask.current === taskId
    )
      return;
    refreshedTask.current = taskId;
    trackFunnelEvent(
      task.data?.status === 'success' ? 'generate_success' : 'generate_failed',
      {
        model: requestContext?.model || modelId,
        scene: requestContext?.scene || scene,
      }
    );
    if (task.data?.status === 'success' && requestContext?.mode === 'edit')
      trackFunnelEvent('image_edit_success', { model: requestContext.model });
    try {
      sessionStorage.removeItem(`banana:active-task:${session?.user?.id}`);
    } catch {
      /* Optional storage. */
    }
    void queryClient.invalidateQueries({ queryKey: ['banana-recent-images'] });
    void queryClient.invalidateQueries({ queryKey: ['user-credits'] });
    void queryClient.invalidateQueries({ queryKey: ['account-balance'] });
  }, [taskId, task.data?.status, queryClient]);

  function remember() {
    try {
      window.sessionStorage.setItem(
        'nano-site:prompt',
        form.state.values.prompt
      );
      window.sessionStorage.setItem(
        'nano-site:draft:v2',
        JSON.stringify({
          pendingSelection: explicitSelection.current,
          prompt: form.state.values.prompt,
          model: modelId,
          operation: mode,
          aspectRatio: ratio,
          resolution: selectedResolution,
          outputCount: count,
          imageUrls: references
            .filter(
              (item) =>
                item.status === 'uploaded' && item.url?.startsWith('https://')
            )
            .map((item) => item.url),
        })
      );
    } catch {
      /* the brief can still be downloaded */
    }
  }
  function savePurchaseIntent() {
    if (!purchaseDraft || !purchaseQuote) return false;
    remember();
    try {
      sessionStorage.setItem(
        GENERATION_PURCHASE_INTENT_KEY,
        JSON.stringify(
          createGenerationPurchaseIntent(purchaseDraft, purchaseQuote.credits)
        )
      );
      return true;
    } catch {
      toast.error(copy.purchase_storage_failed);
      return false;
    }
  }
  function continueToCheckout() {
    if (!selectedProductId || !savePurchaseIntent()) return;
    setPurchaseOpen(false);
    trackFunnelEvent('recommended_product_selected', {
      product: selectedProductId,
      source: 'generation_paywall',
    });
    router.push(
      `/checkout?product=${encodeURIComponent(selectedProductId)}&redirect=${encodeURIComponent('/?generation=resume#generator')}`
    );
  }
  function compareMonthlyPlans() {
    if (!savePurchaseIntent()) return;
    setPurchaseOpen(false);
    router.push(
      `/pricing?redirect=${encodeURIComponent('/?generation=resume#generator')}`
    );
  }
  async function copyPrompt() {
    remember();
    try {
      await navigator.clipboard.writeText(form.state.values.prompt);
      toast.success(copy.copied);
    } catch {
      toast.error(copy.copy_failed);
    }
  }
  function downloadBrief() {
    remember();
    const brief = {
      model: modelId,
      operation: mode,
      prompt: form.state.values.prompt,
      aspectRatio: ratio,
      resolution: selectedResolution,
      outputCount: count,
    };
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(brief, null, 2)], { type: 'application/json' })
    );
    const link = document.createElement('a');
    link.href = url;
    link.download = 'nano-banana-creative-brief.json';
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  const resultImages =
    task.data?.status === 'success'
      ? task.data.images || []
      : !taskId && selectedHistory?.status === 'success'
        ? selectedHistory.images
        : [];
  const rawResult = (resultImages[resultIndex] || resultImages[0])?.imageUrl;
  const result = rawResult?.startsWith('https://') ? rawResult : undefined;
  const resultTask =
    task.data?.status === 'success' ? task.data : selectedHistory;
  const resultSettings = Object.entries(resultTask?.options ?? {}).filter(
    ([key, value]) =>
      [
        'image_size',
        'aspect_ratio',
        'resolution',
        'quality',
        'output_format',
        'num_images',
        'seed',
      ].includes(key) && ['string', 'number'].includes(typeof value)
  );
  useEffect(() => setResultIndex(0), [taskId, selectedHistory?.id]);
  const pendingCopy = availability.isPending
    ? copy.checking
    : availability.isError
      ? copy.check_failed
      : ready
        ? copy.ready
        : copy.pending;
  const modelOptions = allModels
    ? CREATIVE_MODELS.filter(
        (item) => item.productionEnabled && item.commercialUse === 'approved'
      )
    : WORKBENCH_MODELS.map(
        (id) => CREATIVE_MODELS.find((item) => item.id === id)!
      );
  const filteredModelOptions = modelOptions.filter((option) =>
    option.label.toLowerCase().includes(modelSearch.toLowerCase())
  );
  const recommendedProduct = purchaseQuote
    ? recommendGenerationProduct(creditProducts, purchaseQuote.shortfall)
    : undefined;
  useEffect(() => {
    if (
      purchaseOpen &&
      recommendedProduct &&
      !creditProducts.some((product) => product.productId === selectedProductId)
    ) {
      setSelectedProductId(recommendedProduct.productId);
    }
  }, [creditProducts, purchaseOpen, recommendedProduct, selectedProductId]);
  useEffect(() => {
    const prepare = (event: Event) => {
      const detail = (event as CustomEvent<BananaGeneratorSelection>).detail;
      if (!detail) return;
      const promptSelection = typeof detail.prompt === 'string';
      const current = normalizeGeneratorDraft(
        {
          prompt: form.state.values.prompt,
          model: modelId,
          operation: mode,
          aspectRatio: ratio,
          resolution: selectedResolution,
          outputCount: count,
          imageUrls: references
            .filter((item) => item.status === 'uploaded' && item.url)
            .map((item) => item.url),
        },
        modelId,
        true
      );
      if (!current) return;
      const draft = generatorDraftFromSelection(
        current,
        detail,
        detail.model || modelId,
        allModels
      );
      if (!draft) return;
      if (
        !applyGeneratorDraft(draft, {
          backupCurrent: promptSelection,
          track: promptSelection,
        })
      )
        return;
      if (detail.scene) setScene(normalizeCreativeScene(detail.scene));
      const field = document.getElementById(
        detail.focus === 'shape' ? `${fieldId}-shape` : `${fieldId}-prompt`
      );
      field?.focus({ preventScroll: true });
    };
    window.addEventListener('banana:prepare-generator', prepare);
    return () =>
      window.removeEventListener('banana:prepare-generator', prepare);
  }, [
    allModels,
    applyGeneratorDraft,
    count,
    fieldId,
    form,
    mode,
    modelId,
    ratio,
    references,
    selectedResolution,
  ]);
  function modelSummary(id: CreativeModelId) {
    if (!id.startsWith('nano-banana'))
      return (
        CREATIVE_MODELS.find(
          (item) => item.id === id
        )?.provider.toUpperCase() || ''
      );
    const key =
      id === 'nano-banana-2.1'
        ? 'model_21_summary'
        : id === 'nano-banana-pro'
          ? 'model_pro_summary'
          : id === 'nano-banana-2-lite'
            ? 'model_lite_summary'
            : 'model_2_summary';
    return copy[key];
  }
  return (
    <section aria-label={copy.workbench} className="banana-generator">
      <GenerationPurchaseDialog
        open={purchaseOpen}
        onOpenChange={setPurchaseOpen}
        products={creditProducts}
        recommendedProductId={recommendedProduct?.productId}
        selectedProductId={selectedProductId}
        requiredCredits={purchaseQuote?.credits ?? 0}
        balance={purchaseQuote?.balance ?? 0}
        copy={copy}
        onSelect={setSelectedProductId}
        onCheckout={continueToCheckout}
        onComparePlans={compareMonthlyPlans}
      />
      <div
        className="banana-generator__tabs"
        role="tablist"
        aria-label={copy.operation}
      >
        {(['generate', 'edit'] as const).map((value) => (
          <button
            key={value}
            type="button"
            role="tab"
            id={`${fieldId}-${value}-tab`}
            aria-selected={mode === value}
            aria-controls={`${fieldId}-panel`}
            tabIndex={mode === value ? 0 : -1}
            disabled={working}
            onClick={() => setMode(value)}
            onKeyDown={(event) => {
              if (
                !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)
              )
                return;
              event.preventDefault();
              const next =
                event.key === 'Home'
                  ? 'generate'
                  : event.key === 'End'
                    ? 'edit'
                    : value === 'generate'
                      ? 'edit'
                      : 'generate';
              setMode(next);
              const tabs =
                event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>(
                  '[role="tab"]'
                );
              tabs?.[next === 'generate' ? 0 : 1]?.focus();
            }}
          >
            {value === 'generate' ? (
              <Type size={16} aria-hidden />
            ) : (
              <Images size={16} aria-hidden />
            )}
            {copy[value === 'generate' ? 'generate_mode' : 'edit_mode']}
          </button>
        ))}
      </div>
      <div
        className="banana-generator__panel"
        id={`${fieldId}-panel`}
        role="tabpanel"
        aria-labelledby={`${fieldId}-${mode}-tab`}
      >
        <form
          className="banana-generator__form"
          onSubmit={(e) => {
            e.preventDefault();
            void form.handleSubmit();
          }}
        >
          <div className="banana-generator__studio">
            <Link href="/settings" title={copy.studio_description}>
              <Sparkles size={16} aria-hidden /> {copy.studio_title}
              <ArrowUpRight size={16} aria-hidden />
            </Link>
          </div>
          <div className="banana-generator__field">
            <span id={`${fieldId}-model-label`}>{copy.model}</span>
            <button
              type="button"
              id={`${fieldId}-model-trigger`}
              className="banana-generator__model"
              aria-label={copy.model}
              aria-expanded={modelPickerOpen}
              aria-controls={`${fieldId}-model-options`}
              disabled={working}
              onClick={() => {
                setModelPickerOpen((value) => !value);
                setModelSearch('');
              }}
            >
              <ModelBrandTile modelId={model.id} className="size-8" />
              <span className="banana-generator__model-copy">
                <strong>{model.label}</strong>
                <small>{modelSummary(modelId)}</small>
              </span>
              <ChevronDown size={16} aria-hidden />
            </button>
            {modelPickerOpen && (
              <fieldset
                id={`${fieldId}-model-options`}
                className="banana-generator__inline-models"
                disabled={working}
                onKeyDown={(event) => {
                  if (event.key === 'Escape') {
                    event.preventDefault();
                    setModelPickerOpen(false);
                    document
                      .getElementById(`${fieldId}-model-trigger`)
                      ?.focus();
                  }
                }}
              >
                <div className="banana-generator__search">
                  <Search size={16} aria-hidden />
                  <input
                    autoFocus
                    type="search"
                    value={modelSearch}
                    onChange={(event) => setModelSearch(event.target.value)}
                    aria-label={copy.search_models}
                    placeholder={copy.search_models}
                    onKeyDown={(event) => {
                      if (
                        event.key === 'ArrowDown' ||
                        event.key === 'ArrowUp'
                      ) {
                        event.preventDefault();
                        const items = document
                          .getElementById(`${fieldId}-model-options`)
                          ?.querySelectorAll<HTMLButtonElement>(
                            '[role="radio"]'
                          );
                        if (items?.length)
                          items[
                            event.key === 'ArrowDown' ? 0 : items.length - 1
                          ]?.focus();
                      }
                    }}
                  />
                </div>
                <div
                  role="radiogroup"
                  aria-labelledby={`${fieldId}-model-label`}
                >
                  {filteredModelOptions.map((option, index) => (
                    <button
                      key={option.id}
                      type="button"
                      role="radio"
                      data-value={option.id}
                      aria-label={option.label}
                      aria-checked={modelId === option.id}
                      tabIndex={
                        modelId === option.id ||
                        (!filteredModelOptions.some(
                          (item) => item.id === modelId
                        ) &&
                          index === 0)
                          ? 0
                          : -1
                      }
                      className="banana-generator__model-option"
                      onClick={() => {
                        setModelId(option.id);
                        setResolution(option.resolutions?.[0]);
                        setInitialReferenceUrls([]);
                        setModelPickerOpen(false);
                        document
                          .getElementById(`${fieldId}-model-trigger`)
                          ?.focus();
                      }}
                      onKeyDown={(event) =>
                        moveChoice(
                          event,
                          modelOptions
                            .filter((item) =>
                              item.label
                                .toLowerCase()
                                .includes(modelSearch.toLowerCase())
                            )
                            .map((item) => item.id),
                          option.id,
                          (id) => {
                            const next = modelOptions.find(
                              (item) => item.id === id
                            )!;
                            setModelId(next.id);
                            setResolution(next.resolutions?.[0]);
                            setInitialReferenceUrls([]);
                          }
                        )
                      }
                    >
                      <ModelBrandTile modelId={option.id} />
                      <span className="banana-generator__model-copy">
                        <strong>{option.label}</strong>
                        <small>{modelSummary(option.id)}</small>
                      </span>
                      {modelId === option.id && <Check size={16} aria-hidden />}
                    </button>
                  ))}
                </div>
                {!modelOptions.some((option) =>
                  option.label.toLowerCase().includes(modelSearch.toLowerCase())
                ) && (
                  <p className="banana-generator__no-models" role="status">
                    {copy.no_models}
                  </p>
                )}
              </fieldset>
            )}
          </div>
          {mode === 'edit' && (
            <div className="banana-generator__uploader">
              <ImageUploader
                key={`${modelId}:${ready}`}
                allowMultiple
                maxImages={model.maxReferences}
                maxSizeMB={10}
                uploadMode={ready && session?.user ? 'server' : 'local'}
                defaultPreviews={initialReferenceUrls}
                onChange={setReferences}
                title={copy.reference}
                emptyHint={copy.reference_hint}
                copy={{
                  previewAlt: copy.preview,
                  replaceImage: copy.replace,
                  uploading: copy.uploading,
                  failed: copy.failed,
                  removeImage: copy.remove,
                  upload: copy.upload,
                  maxSize: () => copy.max_size,
                }}
              />
            </div>
          )}
          {(previousDraft || (returnPath === '/free' && draftRestored)) && (
            <div
              className="border-border bg-muted/30 rounded-lg border p-3 text-sm"
              role="status"
            >
              <p>{previousDraft ? copy.previous_saved : copy.free_saved}</p>
              <div className="mt-2 flex flex-wrap gap-3">
                {previousDraft && (
                  <button
                    type="button"
                    disabled={working}
                    className="underline underline-offset-4"
                    onClick={() => {
                      const draft = previousDraft;
                      if (
                        applyGeneratorDraft(draft, {
                          backupCurrent: false,
                          track: false,
                        })
                      )
                        setPreviousDraft(null);
                    }}
                  >
                    {copy.restore_previous}
                  </button>
                )}
                {returnPath === '/free' && (
                  <button
                    type="button"
                    disabled={working}
                    className="underline underline-offset-4"
                    onClick={() => {
                      prepareBananaGenerator({
                        prompt: '',
                        model: 'nano-banana-2.1',
                        mode: 'generate',
                        aspectRatio: '1:1',
                        resolution: '1K',
                        outputCount: 1,
                        imageUrls: [],
                      });
                      setDraftRestored(false);
                    }}
                  >
                    {copy.free_start}
                  </button>
                )}
              </div>
            </div>
          )}
          <form.Field name="prompt">
            {(field) => (
              <label
                className="banana-generator__field"
                htmlFor={`${fieldId}-prompt`}
              >
                <span>
                  {copy.prompt}
                  <span className="banana-generator__required" aria-hidden>
                    *
                  </span>
                </span>
                <textarea
                  id={`${fieldId}-prompt`}
                  aria-label={copy.prompt}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder={copy.placeholder}
                  maxLength={model.maxPromptLength}
                  rows={6}
                  disabled={working}
                  aria-required="true"
                  aria-invalid={field.state.meta.errors.length > 0}
                />
                <span
                  className="banana-generator__character-count"
                  hidden={!field.state.value.length}
                >
                  {field.state.value.length}/{model.maxPromptLength}
                </span>
                {field.state.meta.errors.length > 0 && (
                  <span role="alert" className="banana-generator__error">
                    {copy.prompt_required}
                  </span>
                )}
              </label>
            )}
          </form.Field>
          <div
            className="banana-generator__starters"
            aria-label={copy.starter_title}
          >
            {recipes
              .filter((recipe) => recipe.id !== 'edit')
              .slice(0, 6)
              .map((recipe) => (
                <button
                  key={recipe.id}
                  type="button"
                  disabled={working}
                  onClick={() => {
                    form.setFieldValue('prompt', recipe.prompt);
                    setScene(
                      normalizeCreativeScene(
                        recipe.id === 'portrait'
                          ? 'character'
                          : recipe.id === 'story'
                            ? 'social'
                            : recipe.id
                      )
                    );
                    document
                      .getElementById(`${fieldId}-prompt`)
                      ?.focus({ preventScroll: true });
                  }}
                >
                  {recipe.title}
                </button>
              ))}
          </div>
          <div className="banana-generator__settings banana-generator__settings--choices">
            <fieldset
              className="banana-generator__choice-field"
              disabled={working}
            >
              <legend id={`${fieldId}-shape-label`}>{copy.shape}</legend>
              <div
                role="radiogroup"
                aria-labelledby={`${fieldId}-shape-label`}
                className="banana-generator__ratio-grid"
              >
                {visibleRatios.map((size) => (
                  <button
                    key={size}
                    id={ratio === size ? `${fieldId}-shape` : undefined}
                    type="button"
                    role="radio"
                    data-value={size}
                    aria-label={
                      size === 'auto' ? copy.auto_label : displayRatio(size)
                    }
                    aria-checked={ratio === size}
                    tabIndex={ratio === size ? 0 : -1}
                    onClick={() => setRatio(size)}
                    onKeyDown={(event) =>
                      moveChoice(event, visibleRatios, size, setRatio)
                    }
                  >
                    <span className="banana-generator__ratio-drawing">
                      <RatioIcon ratio={size} />
                    </span>
                    <span>
                      {size === 'auto' ? copy.auto_label : displayRatio(size)}
                    </span>
                  </button>
                ))}
              </div>
              {model.sizes.length > commonRatios.length && (
                <button
                  type="button"
                  className="banana-generator__more-ratios"
                  aria-expanded={showAllRatios}
                  onClick={() => setShowAllRatios((value) => !value)}
                >
                  {showAllRatios ? copy.fewer_ratios : copy.more_ratios}
                  <ChevronDown size={14} aria-hidden />
                </button>
              )}
            </fieldset>
            <fieldset
              className="banana-generator__choice-field"
              disabled={working}
            >
              <legend id={`${fieldId}-resolution-label`}>
                {copy.resolution}
              </legend>
              {model.resolutions?.length ? (
                <div
                  role="radiogroup"
                  aria-labelledby={`${fieldId}-resolution-label`}
                  className="banana-generator__resolution-grid"
                >
                  {model.resolutions.map((value) => (
                    <button
                      key={value}
                      type="button"
                      role="radio"
                      data-value={value}
                      aria-label={value}
                      aria-checked={selectedResolution === value}
                      tabIndex={selectedResolution === value ? 0 : -1}
                      onClick={() => setResolution(value)}
                      onKeyDown={(event) =>
                        moveChoice(
                          event,
                          model.resolutions!,
                          value,
                          setResolution
                        )
                      }
                    >
                      <strong>{value}</strong>
                      <small>
                        {getCreativeUnitCredits(model, mode, value)}{' '}
                        {copy.credits}
                      </small>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="banana-generator__fixed-resolution">
                  {copy.provider_default}
                </div>
              )}
              <p className="banana-generator__option-hint">
                {model.resolutions?.length
                  ? copy.resolution_hint
                  : copy.resolution_fixed}
              </p>
            </fieldset>
          </div>
          <div className="banana-generator__field banana-generator__output-card">
            <span id={`${fieldId}-outputs`}>{copy.output_count}</span>
            <div
              className="banana-generator__outputs"
              role="radiogroup"
              aria-labelledby={`${fieldId}-outputs`}
            >
              {[1, 2, 3, 4].map((number) => (
                <button
                  key={number}
                  type="button"
                  role="radio"
                  aria-label={`×${number}`}
                  disabled={working || (!supportsBatch && number !== 1)}
                  aria-checked={count === number}
                  tabIndex={count === number ? 0 : -1}
                  onClick={() => setOutputCount(number)}
                  onKeyDown={(event) => {
                    if (
                      !supportsBatch ||
                      !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(
                        event.key
                      )
                    )
                      return;
                    event.preventDefault();
                    const next =
                      event.key === 'Home'
                        ? 1
                        : event.key === 'End'
                          ? 4
                          : event.key === 'ArrowRight'
                            ? (number % 4) + 1
                            : ((number + 2) % 4) + 1;
                    setOutputCount(next);
                    event.currentTarget.parentElement
                      ?.querySelectorAll<HTMLButtonElement>('[role="radio"]')
                      [next - 1]?.focus();
                  }}
                >
                  ×{number}
                </button>
              ))}
            </div>
          </div>
          <section
            className="banana-generator__quote"
            aria-label={copy.flow_quote}
          >
            <dl>
              <div>
                <dt>{copy.cost_label || copy.flow_cost}</dt>
                <dd>
                  {ready && typeof cost === 'number'
                    ? `${cost} ${copy.credits}`
                    : copy.flow_unknown}
                </dd>
              </div>
              {session?.user && (
                <>
                  <div>
                    <dt>{copy.balance_label || copy.flow_balance}</dt>
                    <dd>{balance.data?.balance ?? '—'}</dd>
                  </div>
                  <div>
                    <dt>{copy.after_label || copy.flow_after}</dt>
                    <dd>
                      {ready && typeof cost === 'number' && balance.data
                        ? Math.max(0, balance.data.balance - cost)
                        : '—'}
                    </dd>
                  </div>
                </>
              )}
            </dl>
            {insufficient && (
              <p className="banana-generator__status" role="status">
                {copy.purchase_final_step}
              </p>
            )}
          </section>
          <form.Subscribe selector={(s) => s.values.prompt}>
            {(prompt) => (
              <>
                {!session?.user && prompt.trim() ? (
                  <Link
                    href={`/sign-in?callbackUrl=${encodeURIComponent(returnPath + (typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('recipe') ? '?recipe=' + encodeURIComponent(new URLSearchParams(window.location.search).get('recipe')!) : '') + '#generator')}`}
                    onClick={remember}
                    className="banana-generator__submit"
                  >
                    <Sparkles size={16} aria-hidden />
                    {copy.signin}
                  </Link>
                ) : (
                  <button
                    type="submit"
                    className="banana-generator__submit"
                    disabled={
                      !ready ||
                      !prompt.trim() ||
                      working ||
                      preflight.isPending ||
                      (mode === 'edit' &&
                        !references.some(
                          (item) => item.status === 'uploaded' && item.url
                        ))
                    }
                  >
                    {working || preflight.isPending ? (
                      <Loader2 size={16} className="animate-spin" aria-hidden />
                    ) : (
                      prompt.trim() && <Sparkles size={16} aria-hidden />
                    )}
                    {working
                      ? copy.working
                      : preflight.isPending
                        ? copy.purchase_preflight
                        : mode === 'edit' &&
                            !references.some(
                              (item) => item.status === 'uploaded' && item.url
                            )
                          ? copy.upload_first
                          : !prompt.trim()
                            ? copy.prompt_first
                            : copy.run}
                  </button>
                )}
                {(availability.isError || !ready || working) && (
                  <p className="banana-generator__status" role="status">
                    {pendingCopy}
                    {ready && cost ? ` ${cost} ${copy.credits}.` : ''}
                  </p>
                )}
                <details className="banana-generator__extras">
                  <summary>{copy.prompt_tools}</summary>
                  <p className="banana-generator__draft">
                    {draftRestored ? copy.draft_restored : copy.draft_saved}
                  </p>
                  <div className="banana-generator__utilities">
                    <button
                      type="button"
                      onClick={copyPrompt}
                      disabled={!prompt.trim()}
                    >
                      <Copy size={13} aria-hidden />
                      {copy.copy}
                    </button>
                    <button
                      type="button"
                      onClick={downloadBrief}
                      disabled={!prompt.trim()}
                    >
                      <Download size={13} aria-hidden />
                      {copy.save}
                    </button>
                  </div>
                </details>
              </>
            )}
          </form.Subscribe>
          {(run.error || task.isError || task.data?.status === 'failed') && (
            <p role="alert" className="banana-generator__error">
              {run.error?.message || task.data?.errorMessage || copy.error}{' '}
              {copy.flow_failed}
            </p>
          )}
          {task.isError && (
            <button
              type="button"
              className="banana-generator__retry"
              onClick={() => void task.refetch()}
            >
              {copy.retry}
            </button>
          )}
          {recipes.length > 0 && (
            <details className="banana-generator__recipes">
              <summary>{copy.recipes}</summary>
              <p>{copy.prompt_note}</p>
              <div>
                {recipes.map((recipe) => (
                  <button
                    key={recipe.id}
                    type="button"
                    disabled={working}
                    onClick={() => {
                      form.setFieldValue('prompt', recipe.prompt);
                      if (recipe.id === 'edit') setMode('edit');
                    }}
                  >
                    {recipe.title}
                  </button>
                ))}
              </div>
            </details>
          )}
        </form>
        <div
          id={`${fieldId}-preview`}
          className="banana-generator__preview"
          aria-live="polite"
          aria-busy={working}
        >
          <div className="banana-generator__preview-heading">
            <h3>{copy.preview_heading}</h3>
            <span className="banana-generator__state" data-ready={ready}>
              {working ? copy.working : pendingCopy}
            </span>
          </div>
          {result ? (
            <>
              <button
                type="button"
                onClick={() => setPreviewOpen(true)}
                aria-label={copy.view_result}
                className="banana-generator__result-canvas"
              >
                <img
                  src={result}
                  alt={copy.result}
                  className="banana-generator__result-image"
                  onLoad={(event) =>
                    setResultDimensions({
                      url: event.currentTarget.currentSrc,
                      width: event.currentTarget.naturalWidth,
                      height: event.currentTarget.naturalHeight,
                    })
                  }
                />
                <span className="banana-generator__zoom">
                  <Maximize2 size={16} aria-hidden />
                  {copy.view_result}
                </span>
              </button>
              <a
                href={`/api/images/${encodeURIComponent(taskId || selectedHistory?.id || '')}/download?index=${resultIndex}`}
                className="banana-generator__download"
                onClick={() =>
                  trackFunnelEvent('image_download', { model: modelId, scene })
                }
              >
                {copy.download_image} <Download size={14} aria-hidden />
              </a>
              <details className="banana-generator__extras">
                <summary>{copy.result_details}</summary>
                <dl className="text-xs leading-6 break-words">
                  <dt>{copy.result_endpoint}</dt>
                  <dd>{resultTask?.model ?? '—'}</dd>
                  <dt>{copy.result_submitted}</dt>
                  <dd>
                    {resultTask?.createdAt
                      ? new Date(resultTask.createdAt).toISOString()
                      : '—'}
                  </dd>
                  <dt>{copy.result_dimensions}</dt>
                  <dd>
                    {resultDimensions?.url === result
                      ? `${resultDimensions.width} × ${resultDimensions.height} px`
                      : '—'}
                  </dd>
                  <dt>{copy.cost_label}</dt>
                  <dd>
                    {resultTask?.costCredits ?? '—'} {copy.credits}
                  </dd>
                  {resultSettings.map(([key, value]) => (
                    <div key={key}>
                      <dt>{key}</dt>
                      <dd>{String(value)}</dd>
                    </div>
                  ))}
                </dl>
              </details>
              {resultImages.length > 1 && (
                <div
                  className="banana-generator__batch-results"
                  aria-label={copy.batch_results}
                >
                  {resultImages.map(
                    (image, index) =>
                      image.imageUrl?.startsWith('https://') && (
                        <button
                          key={`${index}:${image.imageUrl}`}
                          type="button"
                          aria-label={`${copy.result} ${index + 1}`}
                          aria-pressed={resultIndex === index}
                          onClick={() => setResultIndex(index)}
                        >
                          <img
                            src={image.imageUrl}
                            alt={`${copy.result} ${index + 1}`}
                          />
                        </button>
                      )
                  )}
                </div>
              )}
              <div className="banana-result-actions">
                <button
                  type="button"
                  disabled={working || !model.operations.includes('edit')}
                  onClick={() => {
                    setMode('edit');
                    setInitialReferenceUrls([result]);
                    setTaskId(undefined);
                    setSelectedHistory(undefined);
                    form.setFieldValue('prompt', '');
                    trackFunnelEvent('image_edit_started', {
                      model: modelId,
                      scene,
                    });
                  }}
                >
                  {copy.flow_edit}
                </button>
                <button
                  type="button"
                  disabled={working}
                  onClick={() => {
                    setTaskId(undefined);
                    setSelectedHistory(undefined);
                    trackFunnelEvent('result_next_step', {
                      action: 'variation',
                      scene,
                    });
                    document.getElementById(`${fieldId}-prompt`)?.focus();
                  }}
                >
                  {copy.flow_variation}
                </button>
                <Link href="/settings/assets">{copy.flow_assets}</Link>
              </div>
              <p className="banana-generator__result-hint">
                {copy.flow_prompt_warning}
              </p>
            </>
          ) : working ? (
            <div className="banana-generator__processing" role="status">
              <div className="banana-generator__processing-icon">
                <Loader2 size={28} className="animate-spin" aria-hidden />
              </div>
              <h4>{copy.preview_working}</h4>
              <p>{copy.preview_working_hint}</p>
              <div className="banana-generator__request-details">
                <span>{model.label}</span>
                <span>{ratio === 'auto' ? copy.auto_label : ratio}</span>
                <span>×{count}</span>
              </div>
            </div>
          ) : task.data?.status === 'failed' ||
            selectedHistory?.status === 'failed' ? (
            <div className="banana-generator__processing" role="alert">
              <ImagePlus size={28} aria-hidden />
              <h4>{copy.preview_failed_title}</h4>
              <p>
                {task.data?.errorMessage ||
                  selectedHistory?.errorMessage ||
                  copy.preview_failed}
              </p>
              <button
                type="button"
                className="banana-generator__retry"
                onClick={() => {
                  setTaskId(undefined);
                  setSelectedHistory(undefined);
                  document.getElementById(`${fieldId}-prompt`)?.focus();
                }}
              >
                {copy.reuse_prompt}
              </button>
            </div>
          ) : (
            <div className="banana-generator__showcase">
              <div className="banana-generator__showcase-intro">
                <span className="banana-generator__eyebrow">
                  {copy.example_label}
                </span>
                <h4>{copy.starter_title}</h4>
                <p>{copy.preview_hint}</p>
              </div>
              {examples.length > 0 ? (
                <div className="banana-generator__example-grid">
                  {examples.slice(0, 4).map((example) => (
                    <button
                      type="button"
                      key={example.id}
                      className="banana-generator__example"
                      onClick={() => prepareBananaGenerator(example.selection)}
                    >
                      <img
                        src={example.image}
                        alt={example.alt}
                        width={1280}
                        height={720}
                        loading="lazy"
                        decoding="async"
                      />
                      <span>
                        <strong>{example.title}</strong>
                        <ArrowUpRight size={16} aria-hidden />
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="banana-generator__empty">
                  <ImagePlus size={28} aria-hidden />
                  <span>{copy.empty}</span>
                </div>
              )}
              <p className="banana-generator__example-note">
                {copy.example_note}
              </p>
            </div>
          )}
          {session?.user && (
            <section className="banana-generator__recent">
              <div className="banana-generator__recent-heading">
                <h3>{copy.recent}</h3>
                <Link href="/settings/assets">{copy.view_history}</Link>
              </div>
              {history.isPending ? (
                <p role="status">{copy.checking}</p>
              ) : history.isError ? (
                <div role="alert">
                  <p>{copy.history_failed}</p>
                  <button type="button" onClick={() => void history.refetch()}>
                    {copy.retry}
                  </button>
                </div>
              ) : history.data?.items.length ? (
                <div className="banana-generator__recent-grid">
                  {history.data.items.map((item) => (
                    <button
                      type="button"
                      key={item.id}
                      disabled={working}
                      aria-pressed={selectedHistory?.id === item.id}
                      onClick={() => {
                        setSelectedHistory(item);
                        setTaskId(undefined);
                        form.setFieldValue('prompt', item.prompt);
                      }}
                      aria-label={item.prompt || copy.result}
                      title={item.prompt}
                    >
                      {item.status === 'success' &&
                      item.images[0]?.imageUrl?.startsWith('https://') ? (
                        <img
                          src={item.images[0].imageUrl}
                          alt={item.prompt}
                          loading="lazy"
                        />
                      ) : (
                        <span>
                          {['pending', 'processing'].includes(item.status)
                            ? copy.working
                            : copy.preview_failed_title}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <p>{copy.no_history}</p>
              )}
              {selectedHistory && (
                <div className="banana-generator__history-detail">
                  <p>{selectedHistory.prompt}</p>
                  <small>
                    {selectedHistory.model} · {selectedHistory.costCredits}{' '}
                    {copy.credits}
                  </small>
                  <div>
                    <button
                      type="button"
                      onClick={() => {
                        const chosen = CREATIVE_MODELS.find(
                          (model) => model.id === selectedHistory.model
                        );
                        if (
                          chosen &&
                          modelOptions.some((model) => model.id === chosen.id)
                        )
                          setModelId(chosen.id);
                        form.setFieldValue('prompt', selectedHistory.prompt);
                        setMode('generate');
                        setTaskId(undefined);
                      }}
                    >
                      {copy.reuse_prompt}
                    </button>
                    <Link href="/settings/assets">{copy.manage_assets}</Link>
                  </div>
                </div>
              )}
            </section>
          )}
        </div>
      </div>
      <ZoomableImageDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        imageUrl={result}
        alt={copy.result}
        title={copy.view_result}
      />
      <FirstGenerationFeedback
        taskId={taskId}
        status={task.data?.status}
        modelId={modelId}
      />
    </section>
  );
}
