import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowRight,
  Bot,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Coins,
  Columns3,
  Download,
  LayoutGrid,
  Loader2,
  LockKeyhole,
  Maximize2,
  PackageOpen,
  PanelTop,
  Save,
  ScanLine,
  Sparkles,
  WandSparkles,
  ZoomIn,
} from 'lucide-react';
import { toast } from 'sonner';

import { signIn, useSession } from '@/core/auth/client';
import { Link, useRouter } from '@/core/i18n/navigation';
import type { CreativeModelDefinition } from '@/config/creative-studio';
import {
  DEFAULT_IMAGE_MODEL_ID,
  IMAGE_MAX_PROMPT_LENGTH,
  IMAGE_MODELS,
} from '@/config/image-models';
import { trackFunnelEvent } from '@/lib/analytics-events';
import { apiGet, apiPost } from '@/lib/api-client';
import { toAbsoluteAuthCallbackURL } from '@/lib/auth-navigation';
import {
  APPLY_GENERATOR_PROMPT_EVENT,
  OPEN_GENERATOR_GUIDE_EVENT,
} from '@/lib/homepage-events';
import { TOOL_CATALOG, type ToolKind } from '@/lib/tools';
import { cn } from '@/lib/utils';
import { usePublicConfig } from '@/hooks/use-public-config';
import { CreditContinuationPanel } from '@/components/credit-continuation-panel';
import { FirstGenerationFeedback } from '@/components/first-generation-feedback';
import { ModelPicker } from '@/components/model-picker';
import { TOOL_ICONS } from '@/components/tool-icon';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { ZoomableImageDialog } from '@/components/zoomable-image-dialog';

type ImageTask = {
  id: string;
  status: string;
  prompt?: string;
  images: Array<{ imageUrl?: string }>;
  errorMessage?: string;
  providerStatus?: string;
  queuePosition?: number;
};

type CreativeModelView = CreativeModelDefinition & {
  configured: boolean;
  enabled: boolean;
};

type HomepageModel = {
  id: string;
  label: string;
  credits: number;
  kind: 'legacy' | 'studio';
  sizeParameter: 'image_size' | 'aspect_ratio';
};

type GeneratorAspect = keyof typeof ASPECT_VALUES;

type SessionResult = {
  id: string;
  imageUrl: string;
  prompt: string;
  model: string;
  aspect: GeneratorAspect;
  createdAt: number;
};

export type GeneratorWorkspaceCopy = {
  label: string;
  title: string;
  description: string;
  status: string;
  statusDetail: string;
  promptLabel: string;
  promptHint: string;
  promptPlaceholder: string;
  examplesLabel: string;
  promptExamples: string[];
  showcaseSlides: Array<{
    title: string;
    description: string;
    alt: string;
  }>;
  openGuide: string;
  modelLabel: string;
  modelSearch?: string;
  modelEmpty?: string;
  modelName: string;
  creditUnit: string;
  aspectLabel: string;
  square: string;
  landscape: string;
  portrait: string;
  cost: string;
  generate: string;
  generating: string;
  signUpToGenerate: string;
  anonymousTrialUsedAction: string;
  resultTitle: string;
  resultEmpty: string;
  resultReady: string;
  sessionTitle: string;
  sessionCount: string;
  compareStart: string;
  compareCancel: string;
  compareAction: string;
  compareLimit: string;
  compareTitle: string;
  compareDescription: string;
  compareUse: string;
  compareSelected: string;
  viewOriginal: string;
  previewTitle: string;
  openStudio: string;
  privateLabel: string;
  error: string;
  success: string;
  saveHintTitle: string;
  saveHintDesktop: string;
  saveHintMobile: string;
  balance: string;
  balanceLoading: string;
  balanceSignIn: string;
  balanceUnavailable: string;
  balanceGetCredits: string;
  switchTool: string;
  switchToolHint: string;
  currentTool: string;
  toolImage: string;
  toolPoster: string;
  toolProductPhoto: string;
  toolYoutubeThumbnail: string;
  toolWan3: string;
  toolSeedance25: string;
  toolVideo: string;
  toolMinimaxH3: string;
  toolBackgroundRemover: string;
  toolMatchaFilter: string;
  allTools: string;
  continueTitle: string;
  continueDescription: string;
  continueEdit: string;
  continueRemoveBackground: string;
  continueUpscale: string;
  continueAddText: string;
  continuePoster: string;
  continueProduct: string;
  creditsUsedTitle: string;
  creditsUsedDescription: string;
  creditsBuy: string;
  creditsCheckIn: string;
  creditsInvite: string;
  creditsExplore: string;
  creditsContinueAction: string;
};

const ASPECT_VALUES = {
  square: 'square_hd',
  landscape: 'landscape_4_3',
  widescreen: 'landscape_16_9',
  portrait: 'portrait_4_3',
  story: 'portrait_16_9',
} as const;

const ASPECT_RATIO_VALUES: Record<GeneratorAspect, string> = {
  square: '1:1',
  landscape: '4:3',
  widescreen: '16:9',
  portrait: '3:4',
  story: '9:16',
};

const GENERATOR_DRAFT_KEY = 'image-studio:generator-draft';
const SESSION_RESULTS_KEY_PREFIX = 'image-studio:generator-session-results:';
const MAX_SESSION_RESULTS = 6;
const MAX_COMPARE_RESULTS = 4;

const RESULT_SHOWCASE_SLIDES = [
  '/imgs/showcase/generator-sneaker-workflow.webp',
  '/imgs/showcase/generator-relight-workflow.webp',
  '/imgs/showcase/generator-food-workflow.webp',
  '/imgs/showcase/generator-concept-workflow.webp',
] as const;

type SignupIntent = 'generate' | 'edit' | 'save' | 'download';

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4">
      <path
        fill="currentColor"
        d="M21.35 12.23c0-.71-.06-1.4-.18-2.07H12v3.91h5.24a4.48 4.48 0 0 1-1.94 2.94v2.54h3.14c1.84-1.69 2.91-4.18 2.91-7.32ZM12 21.75c2.63 0 4.84-.87 6.45-2.36l-3.14-2.54c-.87.58-1.98.93-3.31.93-3.23 0-5.77-2.6-5.77-5.78S8.77 6.22 12 6.22c1.43 0 2.71.49 3.72 1.45l2.79-2.79A9.35 9.35 0 0 0 12 2.25 9.75 9.75 0 0 0 2.25 12 9.75 9.75 0 0 0 12 21.75Z"
      />
    </svg>
  );
}

export function ImageGeneratorWorkspace({
  copy,
}: {
  copy: GeneratorWorkspaceCopy;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const publicConfigQuery = usePublicConfig();
  const creativeModelsQuery = useQuery({
    queryKey: ['creative-models'],
    queryFn: () => apiGet<CreativeModelView[]>('/api/studio/models'),
  });
  const [mounted, setMounted] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [model, setModel] = useState<string>(DEFAULT_IMAGE_MODEL_ID);
  const [aspect, setAspect] = useState<GeneratorAspect>('square');
  const [seed, setSeed] = useState('');
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [anonymousTaskToken, setAnonymousTaskToken] = useState<string | null>(
    null
  );
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [showToolNudge, setShowToolNudge] = useState(false);
  const [sessionResults, setSessionResults] = useState<SessionResult[]>([]);
  const [selectedResultId, setSelectedResultId] = useState<string | null>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [compareOpen, setCompareOpen] = useState(false);
  const [previewResult, setPreviewResult] = useState<SessionResult | null>(
    null
  );
  const [signupIntent, setSignupIntent] = useState<SignupIntent | null>(null);
  const [socialPending, setSocialPending] = useState(false);
  const [showcaseIndex, setShowcaseIndex] = useState(0);
  const [showcasePaused, setShowcasePaused] = useState(false);
  const successNotifiedTaskIdRef = useRef<string | null>(null);
  const promptStartedRef = useRef(false);
  const lowCreditTrackedRef = useRef(false);
  const saveHintTimerRef = useRef<number | null>(null);
  const pendingGenerationRef = useRef<{
    prompt: string;
    model: string;
    aspect: GeneratorAspect;
  } | null>(null);
  const hydratedSessionOwnerRef = useRef<string | null>(null);

  const activeTaskQuery = useQuery({
    queryKey: ['homepage-image-task', activeTaskId, anonymousTaskToken],
    queryFn: () =>
      apiGet<ImageTask>(
        anonymousTaskToken
          ? `/api/images/anonymous?token=${encodeURIComponent(anonymousTaskToken)}`
          : `/api/images/${activeTaskId}`
      ),
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

  const creditsQuery = useQuery({
    queryKey: ['user-credits'],
    queryFn: () => apiGet<{ balance: number }>('/api/credits'),
    enabled: mounted && Boolean(session?.user),
    staleTime: 30_000,
    retry: 2,
  });

  const generateMutation = useMutation({
    mutationFn: () => {
      if (!session?.user) {
        throw new Error(copy.signUpToGenerate);
      }
      if (session?.user && selectedModel?.kind === 'studio') {
        return apiPost<{ id: string; token?: string }>('/api/studio/run', {
          model,
          operation: 'generate',
          prompt,
          imageUrls: [],
          size:
            selectedModel.sizeParameter === 'aspect_ratio'
              ? ASPECT_RATIO_VALUES[aspect]
              : ASPECT_VALUES[aspect],
          outputFormat: 'png',
        });
      }
      return apiPost<{ id: string; token?: string }>('/api/images/generate', {
        prompt,
        model,
        options: {
          image_size: ASPECT_VALUES[aspect],
          num_images: 1,
          ...(seed ? { seed: Number(seed) } : {}),
        },
      });
    },
    onSuccess: (data) => {
      window.sessionStorage.removeItem(GENERATOR_DRAFT_KEY);
      setElapsedSeconds(0);
      setActiveTaskId(data.id);
      setAnonymousTaskToken(data.token || null);
      if (data.token) {
        trackFunnelEvent('anonymous_generation');
      }
      queryClient.invalidateQueries({ queryKey: ['user-credits'] });
    },
    onError: (error: Error) => {
      trackFunnelEvent('generate_failed', {
        anonymous: !session?.user,
      });
      if (!session?.user) trackFunnelEvent('anonymous_generate_failed');
      toast.error(error.message || copy.error);
    },
  });

  useEffect(() => {
    setMounted(true);
    const params = new URLSearchParams(window.location.search);
    const incomingPrompt = params.get('prompt')?.trim();
    const incomingAspect = params.get('aspect');
    let savedDraft: {
      prompt?: string;
      model?: string;
      aspect?: keyof typeof ASPECT_VALUES;
    } | null = null;
    try {
      savedDraft = JSON.parse(
        window.sessionStorage.getItem(GENERATOR_DRAFT_KEY) || 'null'
      );
    } catch {
      window.sessionStorage.removeItem(GENERATOR_DRAFT_KEY);
    }
    if (incomingPrompt) {
      setPrompt(incomingPrompt.slice(0, IMAGE_MAX_PROMPT_LENGTH));
      window.setTimeout(
        () =>
          document
            .querySelector<HTMLTextAreaElement>('#homepage-prompt')
            ?.focus(),
        0
      );
    } else if (savedDraft?.prompt) {
      setPrompt(savedDraft.prompt.slice(0, IMAGE_MAX_PROMPT_LENGTH));
    }
    if (incomingAspect && incomingAspect in ASPECT_VALUES) {
      setAspect(incomingAspect as keyof typeof ASPECT_VALUES);
    } else if (savedDraft?.aspect && savedDraft.aspect in ASPECT_VALUES) {
      setAspect(savedDraft.aspect);
    }
    if (
      savedDraft?.model &&
      IMAGE_MODELS.some((candidate) => candidate.id === savedDraft?.model)
    ) {
      setModel(savedDraft.model);
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const ownerId = session?.user?.id;
    if (!ownerId) {
      hydratedSessionOwnerRef.current = null;
      setSessionResults([]);
      setSelectedResultId(null);
      return;
    }

    let restored: SessionResult[] = [];
    try {
      const raw = JSON.parse(
        window.sessionStorage.getItem(
          `${SESSION_RESULTS_KEY_PREFIX}${ownerId}`
        ) || '[]'
      );
      if (Array.isArray(raw)) {
        restored = raw
          .filter((item): item is SessionResult =>
            Boolean(
              item &&
              typeof item.id === 'string' &&
              typeof item.imageUrl === 'string' &&
              typeof item.prompt === 'string' &&
              typeof item.model === 'string' &&
              typeof item.createdAt === 'number' &&
              item.aspect in ASPECT_VALUES
            )
          )
          .slice(0, MAX_SESSION_RESULTS);
      }
    } catch {
      window.sessionStorage.removeItem(
        `${SESSION_RESULTS_KEY_PREFIX}${ownerId}`
      );
    }
    hydratedSessionOwnerRef.current = ownerId;
    setSessionResults(restored);
    setSelectedResultId(restored[0]?.id ?? null);
    setCompareIds([]);
    setCompareMode(false);
  }, [mounted, session?.user?.id]);

  useEffect(() => {
    const ownerId = session?.user?.id;
    if (!ownerId || hydratedSessionOwnerRef.current !== ownerId) return;
    window.sessionStorage.setItem(
      `${SESSION_RESULTS_KEY_PREFIX}${ownerId}`,
      JSON.stringify(sessionResults)
    );
  }, [session?.user?.id, sessionResults]);

  useEffect(() => {
    function applyPrompt(event: Event) {
      const nextPrompt = (event as CustomEvent<{ prompt?: string }>).detail
        ?.prompt;
      if (!nextPrompt?.trim()) return;

      setPrompt(nextPrompt.trim().slice(0, IMAGE_MAX_PROMPT_LENGTH));
      window.setTimeout(
        () =>
          document
            .querySelector<HTMLTextAreaElement>('#homepage-prompt')
            ?.focus(),
        0
      );
    }

    window.addEventListener(APPLY_GENERATOR_PROMPT_EVENT, applyPrompt);
    return () =>
      window.removeEventListener(APPLY_GENERATOR_PROMPT_EVENT, applyPrompt);
  }, []);

  useEffect(() => {
    if (window.localStorage.getItem('homepage-tool-switcher-seen')) return;

    const showTimer = window.setTimeout(() => {
      setShowToolNudge(true);
      window.localStorage.setItem('homepage-tool-switcher-seen', '1');
    }, 900);
    const hideTimer = window.setTimeout(() => setShowToolNudge(false), 7200);

    return () => {
      window.clearTimeout(showTimer);
      window.clearTimeout(hideTimer);
    };
  }, []);

  useEffect(() => {
    const task = activeTaskQuery.data;

    if (
      task?.status === 'success' &&
      task.id !== successNotifiedTaskIdRef.current
    ) {
      successNotifiedTaskIdRef.current = task.id;
      const imageUrl = task.images?.[0]?.imageUrl;
      if (imageUrl) {
        const snapshot = pendingGenerationRef.current;
        const result: SessionResult = {
          id: task.id,
          imageUrl,
          prompt: task.prompt || snapshot?.prompt || prompt,
          model: snapshot?.model || model,
          aspect: snapshot?.aspect || aspect,
          createdAt: Date.now(),
        };
        setSessionResults((current) =>
          [result, ...current.filter((item) => item.id !== task.id)].slice(
            0,
            MAX_SESSION_RESULTS
          )
        );
        setSelectedResultId(task.id);
        setCompareMode(false);
        setCompareIds([]);
        window.sessionStorage.setItem(
          'image-studio:last-output',
          JSON.stringify({
            imageUrl,
            prompt: task.prompt,
            taskId: task.id,
            createdAt: Date.now(),
          })
        );
        if (anonymousTaskToken) {
          window.sessionStorage.setItem(
            'image-studio:completed-first-anonymous',
            '1'
          );
          window.sessionStorage.setItem(
            'image-studio:anonymous-claim',
            JSON.stringify({
              token: anonymousTaskToken,
              prompt: task.prompt || snapshot?.prompt || prompt,
            })
          );
        }
      }
      toast.success(copy.success, { duration: 1800 });
      trackFunnelEvent('generate_success', {
        anonymous: Boolean(anonymousTaskToken),
      });
      if (anonymousTaskToken) {
        trackFunnelEvent('anonymous_generate_success');
      } else if (
        session?.user &&
        window.sessionStorage.getItem('image-studio:completed-first-anonymous')
      ) {
        trackFunnelEvent('second_generation');
        window.sessionStorage.removeItem(
          'image-studio:completed-first-anonymous'
        );
      }
      queryClient.invalidateQueries({ queryKey: ['user-image-usage'] });
      queryClient.invalidateQueries({ queryKey: ['user-credits'] });

      if (saveHintTimerRef.current !== null) {
        window.clearTimeout(saveHintTimerRef.current);
      }
      saveHintTimerRef.current = window.setTimeout(() => {
        toast.info(copy.saveHintTitle, {
          description: (
            <div className="space-y-1">
              <p>{copy.saveHintDesktop}</p>
              <p>{copy.saveHintMobile}</p>
            </div>
          ),
          duration: 5000,
        });
        saveHintTimerRef.current = null;
      }, 1900);
    }
    if (task?.status === 'failed') {
      if (anonymousTaskToken) trackFunnelEvent('anonymous_generate_failed');
      toast.error(task.errorMessage || copy.error);
      queryClient.invalidateQueries({ queryKey: ['user-credits'] });
    }
  }, [
    activeTaskQuery.data?.errorMessage,
    activeTaskQuery.data?.id,
    activeTaskQuery.data?.status,
    copy.error,
    copy.saveHintDesktop,
    copy.saveHintMobile,
    copy.saveHintTitle,
    copy.success,
    aspect,
    model,
    prompt,
    queryClient,
    session?.user,
  ]);

  useEffect(
    () => () => {
      if (saveHintTimerRef.current !== null) {
        window.clearTimeout(saveHintTimerRef.current);
      }
    },
    []
  );

  useEffect(() => {
    if (!session?.user) return;
    if (window.sessionStorage.getItem('image-studio:signup-pending')) {
      trackFunnelEvent('signup_success');
      window.sessionStorage.removeItem('image-studio:signup-pending');
    }
    const raw = window.sessionStorage.getItem('image-studio:anonymous-claim');
    if (!raw) return;
    try {
      const claim = JSON.parse(raw);
      if (typeof claim?.token !== 'string') return;
      apiPost('/api/images/anonymous', {
        claim: true,
        token: claim.token,
        prompt: typeof claim.prompt === 'string' ? claim.prompt : '',
      })
        .then(() => {
          window.sessionStorage.removeItem('image-studio:anonymous-claim');
          queryClient.invalidateQueries({ queryKey: ['user-images'] });
        })
        .catch(() => undefined);
    } catch {
      window.sessionStorage.removeItem('image-studio:anonymous-claim');
    }
  }, [queryClient, session?.user]);

  useEffect(() => {
    if (activeTaskQuery.failureCount !== 5 || !activeTaskId) return;
    toast.error(activeTaskQuery.error?.message || copy.error);
  }, [
    activeTaskId,
    activeTaskQuery.error,
    activeTaskQuery.failureCount,
    copy.error,
  ]);

  const isGenerating =
    generateMutation.isPending ||
    (Boolean(activeTaskId) &&
      activeTaskQuery.data?.status !== 'success' &&
      activeTaskQuery.data?.status !== 'failed');
  const selectedResult =
    sessionResults.find((item) => item.id === selectedResultId) ??
    sessionResults[0];
  const outputUrl = isGenerating ? undefined : selectedResult?.imageUrl;
  const displayedAspect = selectedResult?.aspect ?? aspect;

  useEffect(() => {
    if (outputUrl || isGenerating || showcasePaused) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const timer = window.setInterval(() => {
      setShowcaseIndex(
        (current) => (current + 1) % RESULT_SHOWCASE_SLIDES.length
      );
    }, 4200);

    return () => window.clearInterval(timer);
  }, [isGenerating, outputUrl, showcasePaused]);
  const comparedResults = compareIds
    .map((id) => sessionResults.find((item) => item.id === id))
    .filter((item): item is SessionResult => Boolean(item));
  const progressLabel = `${copy.generating}${
    activeTaskQuery.data?.providerStatus === 'IN_QUEUE' &&
    typeof activeTaskQuery.data.queuePosition === 'number' &&
    activeTaskQuery.data.queuePosition > 0
      ? ` - #${activeTaskQuery.data.queuePosition}`
      : ''
  } - ${elapsedSeconds}s`;
  const enabledModels = useMemo<HomepageModel[]>(() => {
    const legacy = IMAGE_MODELS.filter((candidate) => candidate.enabled).map(
      (candidate) => ({
        id: candidate.id,
        label: candidate.label,
        credits: candidate.credits || 0,
        kind: 'legacy' as const,
        sizeParameter: 'image_size' as const,
      })
    );
    if (!session?.user) return legacy;
    const studio = (creativeModelsQuery.data || [])
      .filter(
        (candidate) =>
          candidate.configured &&
          candidate.enabled &&
          Boolean(candidate.endpoints.generate) &&
          Boolean(candidate.credits.generate)
      )
      .map((candidate) => ({
        id: candidate.id,
        label: candidate.label,
        credits: candidate.credits.generate || 0,
        kind: 'studio' as const,
        sizeParameter: candidate.sizeParameter,
      }));
    return [...legacy, ...studio];
  }, [creativeModelsQuery.data, session?.user]);
  const selectedModel =
    enabledModels.find((candidate) => candidate.id === model) ??
    enabledModels[0];
  const creditCost = selectedModel?.credits ?? 0;

  const creditBalance = creditsQuery.data?.balance;
  const hasInsufficientCredits =
    typeof creditBalance === 'number' && creditBalance < creditCost;
  const seedIsValid =
    !seed ||
    (Number.isInteger(Number(seed)) &&
      Number(seed) >= 0 &&
      Number(seed) <= 2_147_483_647);
  const isCreditBalanceLoading =
    mounted &&
    Boolean(session?.user) &&
    typeof creditBalance !== 'number' &&
    creditsQuery.isFetching;
  const creditBalanceLabel = !mounted
    ? copy.balanceLoading
    : !session?.user
      ? copy.balanceSignIn
      : creditsQuery.isError
        ? copy.balanceUnavailable
        : typeof creditBalance === 'number'
          ? copy.balance.replace('{credits}', creditBalance.toLocaleString())
          : copy.balanceLoading;

  useEffect(() => {
    if (
      !session?.user ||
      !hasInsufficientCredits ||
      lowCreditTrackedRef.current
    )
      return;
    lowCreditTrackedRef.current = true;
    trackFunnelEvent('credit_balance_low', { required: creditCost });
  }, [creditCost, hasInsufficientCredits, session?.user]);

  useEffect(() => {
    if (!isGenerating) return;
    const timer = window.setInterval(
      () => setElapsedSeconds((value) => value + 1),
      1000
    );
    return () => window.clearInterval(timer);
  }, [isGenerating]);

  const aspectOptions = useMemo(
    () => [
      { key: 'square' as const, label: copy.square, ratio: 'aspect-square' },
      {
        key: 'landscape' as const,
        label: '4:3',
        ratio: 'aspect-[4/3]',
      },
      {
        key: 'widescreen' as const,
        label: '16:9',
        ratio: 'aspect-video',
      },
      {
        key: 'portrait' as const,
        label: '3:4',
        ratio: 'aspect-[3/4]',
      },
      {
        key: 'story' as const,
        label: '9:16',
        ratio: 'aspect-[9/16]',
      },
    ],
    [copy.square]
  );

  const toolOptions = useMemo(() => {
    const labels: Record<ToolKind, string> = {
      image: copy.toolImage,
      creative_studio: copy.openStudio,
      poster: copy.toolPoster,
      product_photo: copy.toolProductPhoto,
      youtube_thumbnail: copy.toolYoutubeThumbnail,
      wan3: copy.toolWan3,
      seedance25: copy.toolSeedance25,
      video: copy.toolVideo,
      minimax_h3: copy.toolMinimaxH3,
      background_remover: copy.toolBackgroundRemover,
      matcha_filter: copy.toolMatchaFilter,
    };
    return TOOL_CATALOG.map((tool) => ({
      href: tool.href,
      label: labels[tool.kind],
      icon: TOOL_ICONS[tool.icon],
      current: tool.kind === 'image',
    }));
  }, [
    copy.toolBackgroundRemover,
    copy.openStudio,
    copy.toolImage,
    copy.toolMatchaFilter,
    copy.toolMinimaxH3,
    copy.toolPoster,
    copy.toolProductPhoto,
    copy.toolSeedance25,
    copy.toolVideo,
    copy.toolWan3,
    copy.toolYoutubeThumbnail,
  ]);

  function handleGenerate() {
    if (!mounted) return;
    if (!prompt.trim()) return;
    if (!session?.user) {
      window.sessionStorage.setItem(
        GENERATOR_DRAFT_KEY,
        JSON.stringify({ prompt: prompt.trim(), model, aspect })
      );
      router.push('/sign-up?callbackUrl=%2F%23generator');
      return;
    }
    if (hasInsufficientCredits) {
      document
        .getElementById('credit-continuation-panel')
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    pendingGenerationRef.current = {
      prompt: prompt.trim(),
      model,
      aspect,
    };
    setSelectedResultId(null);
    setAnonymousTaskToken(null);
    trackFunnelEvent('generate_clicked', {
      anonymous: !session?.user,
      aspect,
      model,
    });
    trackFunnelEvent('generate_started', {
      anonymous: !session?.user,
      aspect,
      model,
    });
    if (!session?.user) trackFunnelEvent('anonymous_generate_started');
    generateMutation.mutate();
  }

  function toggleCompareResult(resultId: string) {
    setCompareIds((current) => {
      if (current.includes(resultId)) {
        return current.filter((id) => id !== resultId);
      }
      if (current.length >= MAX_COMPARE_RESULTS) {
        toast.info(copy.compareLimit);
        return current;
      }
      return [...current, resultId];
    });
  }

  function continueWithResult(result: SessionResult) {
    setPrompt(result.prompt.slice(0, IMAGE_MAX_PROMPT_LENGTH));
    if (enabledModels.some((candidate) => candidate.id === result.model)) {
      setModel(result.model);
    }
    setAspect(result.aspect);
    setSelectedResultId(result.id);
    setActiveTaskId(null);
    setCompareOpen(false);
    setCompareMode(false);
    setCompareIds([]);
    window.sessionStorage.setItem(
      'image-studio:last-output',
      JSON.stringify({
        imageUrl: result.imageUrl,
        prompt: result.prompt,
        taskId: result.id,
        createdAt: result.createdAt,
      })
    );
    window.setTimeout(() => {
      const promptField =
        document.querySelector<HTMLTextAreaElement>('#homepage-prompt');
      promptField?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      promptField?.focus();
    }, 0);
  }

  function stageResultForTool(result: SessionResult, tool: string) {
    window.sessionStorage.setItem(
      'image-studio:last-output',
      JSON.stringify({
        imageUrl: result.imageUrl,
        prompt: result.prompt,
        taskId: result.id,
        createdAt: result.createdAt,
      })
    );
    trackFunnelEvent('result_next_step', {
      tool,
      model: result.model,
    });
  }

  function storeEditorSource(result: SessionResult) {
    window.sessionStorage.setItem(
      'image-studio:editor-source',
      JSON.stringify({
        url: result.imageUrl,
        prompt: `Edit this image while preserving the main subject: ${result.prompt}`,
      })
    );
  }

  function openSignup(result: SessionResult, intent: SignupIntent) {
    if (intent === 'edit') storeEditorSource(result);
    window.sessionStorage.setItem(
      'image-studio:post-auth-intent',
      JSON.stringify({ intent, taskId: result.id, createdAt: Date.now() })
    );
    setSignupIntent(intent);
    trackFunnelEvent('signup_modal_shown', { intent });
    trackFunnelEvent('signup_after_generation', { intent });
  }

  function authDestination() {
    return signupIntent === 'edit' ? '/ai-image-editor' : '/#generator';
  }

  async function continueWithGoogle() {
    if (socialPending) return;
    setSocialPending(true);
    window.sessionStorage.setItem('image-studio:signup-pending', '1');
    trackFunnelEvent('google_signup_clicked', {
      source: 'post_generation_modal',
    });
    try {
      const callbackURL = toAbsoluteAuthCallbackURL(
        authDestination(),
        window.location.origin
      );
      const result = await signIn.social({
        provider: 'google',
        callbackURL,
        errorCallbackURL: `/sign-in?authError=oauth&callbackUrl=${encodeURIComponent(authDestination())}`,
      });
      if (result?.error) {
        toast.error('Google sign-in is unavailable. Try email instead.');
        setSocialPending(false);
      }
    } catch {
      toast.error('Google sign-in is unavailable. Try email instead.');
      setSocialPending(false);
    }
  }

  function goToEditor(result: SessionResult) {
    storeEditorSource(result);
    window.location.href = '/ai-image-editor';
  }

  function handleCreditBalanceClick() {
    if (!mounted || isCreditBalanceLoading) return;
    if (!session?.user) {
      router.push('/sign-in?callbackUrl=%2F%23generator');
      return;
    }
    if (creditsQuery.isError) {
      creditsQuery.refetch();
      return;
    }
    router.push(hasInsufficientCredits ? '/pricing' : '/settings/credits');
  }

  return (
    <div className="border-border bg-card overflow-hidden rounded-2xl border shadow-sm">
      <div className="border-border flex flex-col gap-3 border-b px-4 py-4 sm:px-5 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex min-w-0 flex-wrap items-center gap-2.5">
          <span className="bg-primary/10 text-primary flex size-8 items-center justify-center rounded-lg">
            <WandSparkles className="size-4" />
          </span>
          <div data-tour="generator-prompt">
            <p className="text-sm font-semibold">{copy.label}</p>
            <p className="text-muted-foreground text-[11px]">
              {copy.privateLabel}
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              window.dispatchEvent(new Event(OPEN_GENERATOR_GUIDE_EVENT))
            }
            className="text-muted-foreground hover:bg-muted hover:text-foreground flex min-h-9 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium transition-colors"
          >
            <CircleHelp className="size-3.5" aria-hidden="true" />
            {copy.openGuide}
          </button>

          <details className="group relative">
            <summary
              onClick={() => setShowToolNudge(false)}
              className="border-border bg-background hover:border-primary/40 hover:bg-primary/5 focus-visible:ring-ring flex min-h-9 cursor-pointer list-none items-center gap-2 rounded-lg border pr-2.5 pl-1.5 text-xs font-medium transition-colors select-none focus-visible:ring-2 focus-visible:outline-none [&::-webkit-details-marker]:hidden"
            >
              <span className="bg-primary/10 text-primary relative flex size-6 items-center justify-center rounded-md">
                <Bot className="size-3.5" aria-hidden="true" />
                {showToolNudge ? (
                  <span className="ring-background absolute -top-0.5 -right-0.5 size-2 rounded-full bg-amber-400 ring-2" />
                ) : null}
              </span>
              <span>{copy.switchTool}</span>
              <ChevronDown className="size-3.5 transition-transform group-open:rotate-180" />
            </summary>

            {showToolNudge ? (
              <div
                role="status"
                className="border-primary/20 bg-popover text-popover-foreground motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-top-1 absolute top-11 left-0 z-40 w-max max-w-52 rounded-xl border px-3 py-2 text-xs font-medium shadow-lg"
              >
                {copy.switchToolHint}
                <span className="border-r-popover border-primary/20 bg-popover absolute -top-1.5 left-5 size-3 rotate-45 border-t border-l" />
              </div>
            ) : null}

            <div className="border-border bg-popover text-popover-foreground absolute top-11 left-0 z-50 hidden w-72 overflow-hidden rounded-2xl border p-2 shadow-xl group-open:block">
              <div className="space-y-1">
                {toolOptions.map((option) => {
                  const ToolIcon = option.icon;
                  return (
                    <Link
                      key={option.href}
                      href={option.href}
                      className={cn(
                        'hover:bg-muted flex min-h-11 items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors',
                        option.current && 'bg-primary/8 text-primary'
                      )}
                    >
                      <ToolIcon
                        className="size-4 shrink-0"
                        aria-hidden="true"
                      />
                      <span className="flex-1">{option.label}</span>
                      {option.current ? (
                        <span className="text-[10px] font-medium uppercase opacity-70">
                          {copy.currentTool}
                        </span>
                      ) : (
                        <ArrowRight
                          className="size-3.5 opacity-45"
                          aria-hidden="true"
                        />
                      )}
                    </Link>
                  );
                })}
              </div>
              <div className="border-border mt-2 border-t pt-2">
                <Link
                  href="/tools"
                  className="hover:bg-muted flex min-h-11 items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold transition-colors"
                >
                  <LayoutGrid className="size-4" aria-hidden="true" />
                  <span className="flex-1">{copy.allTools}</span>
                  <ArrowRight className="size-3.5" aria-hidden="true" />
                </Link>
              </div>
            </div>
          </details>
        </div>
        <div className="flex w-full min-w-0 flex-wrap items-center gap-2 xl:w-auto xl:justify-end">
          <button
            type="button"
            onClick={handleCreditBalanceClick}
            disabled={isCreditBalanceLoading}
            className={cn(
              'border-border bg-background hover:border-primary/40 hover:text-primary flex h-9 shrink-0 items-center gap-1.5 rounded-lg border px-2.5 text-[11px] font-medium transition-colors disabled:cursor-wait disabled:opacity-70 sm:px-3 sm:text-xs',
              hasInsufficientCredits &&
                'border-amber-300 bg-amber-50 text-amber-800 hover:border-amber-400 hover:text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300'
            )}
          >
            {isCreditBalanceLoading ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Coins className="size-3.5" />
            )}
            <span className="whitespace-nowrap">{creditBalanceLabel}</span>
            {hasInsufficientCredits ? (
              <span className="ml-0.5 border-l border-current/25 pl-1.5 whitespace-nowrap">
                {copy.balanceGetCredits}
              </span>
            ) : null}
          </button>

          <div className="text-muted-foreground flex h-8 min-w-0 flex-1 items-center gap-2 px-1 text-[11px] sm:w-fit sm:flex-none sm:px-2 sm:text-xs">
            <span className="relative flex size-2 shrink-0">
              <span className="relative inline-flex size-2 rounded-full bg-amber-500" />
            </span>
            <span className="truncate font-medium">
              {selectedModel?.label ?? copy.status}
            </span>
            <span className="text-muted-foreground hidden whitespace-nowrap sm:inline">
              · {copy.statusDetail}
            </span>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <div className="flex min-w-0 flex-col gap-5 p-4 sm:p-5">
          <div
            className="bg-muted/60 order-1 grid grid-cols-2 rounded-xl p-1"
            aria-label="Creation mode"
          >
            <button
              type="button"
              aria-current="page"
              className="bg-background text-foreground min-h-10 rounded-lg px-4 text-sm font-semibold shadow-sm"
            >
              Generate
            </button>
            <Link
              href="/ai-image-editor"
              className="text-muted-foreground hover:text-foreground flex min-h-10 items-center justify-center rounded-lg px-4 text-sm font-semibold"
            >
              Edit
            </Link>
          </div>
          <div className="order-2">
            <label htmlFor="homepage-prompt" className="text-sm font-medium">
              {copy.promptLabel}
            </label>
            <p className="text-muted-foreground mt-1 text-xs">
              {copy.promptHint}
            </p>
            <Textarea
              id="homepage-prompt"
              value={prompt}
              onChange={(event) => {
                setPrompt(event.target.value);
                if (event.target.value.trim() && !promptStartedRef.current) {
                  promptStartedRef.current = true;
                  trackFunnelEvent('prompt_started');
                }
              }}
              placeholder={copy.promptPlaceholder}
              className="border-border bg-background focus-visible:border-primary/50 mt-3 min-h-44 resize-y rounded-xl p-4 text-sm leading-6 shadow-none"
              maxLength={IMAGE_MAX_PROMPT_LENGTH}
              disabled={isGenerating}
            />
            <p className="text-muted-foreground mt-1.5 text-right text-[11px] tabular-nums">
              {prompt.length}/{IMAGE_MAX_PROMPT_LENGTH}
            </p>
          </div>

          <div className="order-3">
            <p className="text-muted-foreground mb-2 text-xs font-medium">
              {copy.examplesLabel}
            </p>
            <div className="-mx-4 flex snap-x gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0 [&::-webkit-scrollbar]:hidden">
              {copy.promptExamples.map((example, index) => (
                <button
                  key={example}
                  type="button"
                  onClick={() => setPrompt(example)}
                  title={example}
                  className="border-border bg-muted/30 hover:border-primary/40 hover:bg-primary/5 hover:text-primary min-h-9 shrink-0 snap-start rounded-lg border px-3 py-1.5 text-left text-xs transition-colors"
                >
                  {index + 1}. {example.slice(0, 31)}…
                </button>
              ))}
            </div>
          </div>

          <div
            data-tour="generator-options"
            className="order-4 grid min-w-0 gap-4 sm:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]"
          >
            <div>
              <p className="mb-2 text-xs font-medium">{copy.modelLabel}</p>
              <ModelPicker
                value={selectedModel?.id}
                options={enabledModels}
                onChange={setModel}
                disabled={isGenerating}
                ariaLabel={copy.modelLabel}
                searchLabel={copy.modelSearch}
                emptyLabel={copy.modelEmpty}
                creditUnit={copy.creditUnit}
              />
              <a
                href="/models"
                className="text-primary mt-2 inline-flex min-h-8 items-center text-xs font-semibold"
              >
                Compare image models
              </a>
            </div>
            <div>
              <p className="mb-2 text-xs font-medium">{copy.aspectLabel}</p>
              <div className="flex gap-2">
                {aspectOptions.map((option) => (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => setAspect(option.key)}
                    disabled={isGenerating}
                    aria-label={option.label}
                    aria-pressed={aspect === option.key}
                    title={option.label}
                    className={cn(
                      'border-border flex h-10 min-w-0 flex-1 items-center justify-center rounded-lg border transition-colors',
                      aspect === option.key
                        ? 'border-primary bg-primary/8 text-primary'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <span
                      className={cn(
                        'border border-current',
                        option.ratio,
                        option.key === 'portrait' || option.key === 'story'
                          ? 'h-5'
                          : 'w-5'
                      )}
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <details className="border-border order-5 rounded-xl border px-3.5 py-3">
            <summary className="text-muted-foreground cursor-pointer text-xs font-medium">
              Advanced settings
            </summary>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="text-sm">
                <span className="font-medium">Seed</span>
                <input
                  value={seed}
                  inputMode="numeric"
                  onChange={(event) => setSeed(event.target.value.trim())}
                  placeholder="Random"
                  aria-invalid={!seedIsValid}
                  disabled={isGenerating}
                  className="border-border bg-background mt-2 min-h-11 w-full rounded-xl border px-3"
                />
              </label>
            </div>
          </details>

          <div
            data-tour="generator-submit"
            className="border-border order-6 flex flex-col gap-3 border-t pt-4"
          >
            <p className="text-muted-foreground flex items-center justify-between gap-1.5 text-xs">
              <Sparkles className="size-3.5" />
              {copy.cost.replace('{credits}', String(creditCost))}
            </p>
            <Button
              size="lg"
              onClick={handleGenerate}
              disabled={
                isGenerating ||
                Boolean(mounted && (!prompt.trim() || !seedIsValid))
              }
              className="h-14 w-full rounded-xl px-5 text-sm font-semibold shadow-sm"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  {progressLabel}
                </>
              ) : mounted && session?.user ? (
                <>
                  {hasInsufficientCredits ? (
                    <Coins className="size-4" />
                  ) : (
                    <Sparkles className="size-4" />
                  )}
                  {hasInsufficientCredits
                    ? copy.creditsContinueAction
                    : copy.generate}
                </>
              ) : (
                <>
                  <Sparkles className="size-4" />
                  {copy.signUpToGenerate}
                </>
              )}
            </Button>
          </div>

          {mounted && session?.user && hasInsufficientCredits ? (
            <div className="order-7">
              <CreditContinuationPanel
                title={copy.creditsUsedTitle}
                description={copy.creditsUsedDescription}
                actions={[
                  {
                    href: '/pricing',
                    label: copy.creditsBuy,
                    icon: 'credits',
                    primary: true,
                  },
                  {
                    href: '/#rewards',
                    label: copy.creditsCheckIn,
                    icon: 'checkin',
                  },
                  {
                    href: '/settings/referrals',
                    label: copy.creditsInvite,
                    icon: 'invite',
                  },
                  {
                    href: '/tools',
                    label: copy.creditsExplore,
                    icon: 'tools',
                  },
                ]}
              />
            </div>
          ) : null}
        </div>

        <div className="border-border bg-muted/20 min-w-0 border-t p-4 sm:p-5 lg:border-t-0 lg:border-l">
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-sm font-medium">{copy.resultTitle}</p>
            {outputUrl ? (
              <span className="text-primary flex items-center gap-1 text-xs font-medium">
                <CheckCircle2 className="size-3.5" />
                {copy.resultReady}
              </span>
            ) : null}
          </div>
          <div
            onDoubleClick={() => {
              if (selectedResult && !isGenerating) {
                setPreviewResult(selectedResult);
              }
            }}
            className={cn(
              'border-border bg-background group relative flex min-h-60 w-full items-center justify-center overflow-hidden rounded-xl border',
              outputUrl && 'cursor-zoom-in',
              displayedAspect === 'square'
                ? 'aspect-[4/3] sm:aspect-square'
                : displayedAspect === 'landscape'
                  ? 'aspect-[4/3]'
                  : 'aspect-[4/3] sm:aspect-[3/4]'
            )}
          >
            {outputUrl ? (
              <img
                src={outputUrl}
                alt={selectedResult?.prompt || prompt}
                width={
                  displayedAspect === 'landscape' ||
                  displayedAspect === 'widescreen'
                    ? 1200
                    : displayedAspect === 'portrait' ||
                        displayedAspect === 'story'
                      ? 900
                      : 1024
                }
                height={
                  displayedAspect === 'landscape'
                    ? 900
                    : displayedAspect === 'widescreen'
                      ? 675
                      : displayedAspect === 'portrait'
                        ? 1200
                        : displayedAspect === 'story'
                          ? 1600
                          : 1024
                }
                className="size-full object-contain"
              />
            ) : isGenerating ? (
              <div className="space-y-4 text-center">
                <div className="bg-primary/10 text-primary mx-auto flex size-14 items-center justify-center rounded-2xl">
                  <Loader2 className="size-6 animate-spin" />
                </div>
                <p className="text-muted-foreground text-sm">{progressLabel}</p>
              </div>
            ) : (
              <div
                data-result-showcase
                aria-label={copy.resultEmpty}
                onMouseEnter={() => setShowcasePaused(true)}
                onMouseLeave={() => setShowcasePaused(false)}
                onFocusCapture={() => setShowcasePaused(true)}
                onBlurCapture={(event) => {
                  if (!event.currentTarget.contains(event.relatedTarget)) {
                    setShowcasePaused(false);
                  }
                }}
                className="relative isolate size-full overflow-hidden"
              >
                {RESULT_SHOWCASE_SLIDES.map((src, index) => (
                  <img
                    key={src}
                    data-showcase-slide={index}
                    src={src}
                    alt={
                      index === showcaseIndex
                        ? (copy.showcaseSlides[index]?.alt ?? copy.resultEmpty)
                        : ''
                    }
                    aria-hidden={index !== showcaseIndex}
                    width={1536}
                    height={1024}
                    className={cn(
                      'absolute inset-0 size-full object-cover transition-[opacity,transform] duration-700 motion-reduce:transition-none',
                      index === showcaseIndex
                        ? 'scale-100 opacity-100'
                        : 'pointer-events-none scale-[1.025] opacity-0'
                    )}
                  />
                ))}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/5 to-black/20" />
                <div className="absolute inset-x-0 top-0 flex items-center justify-between gap-3 p-4">
                  <span className="max-w-[70%] truncate rounded-full border border-white/20 bg-black/35 px-3 py-1.5 text-[11px] font-semibold text-white shadow-sm backdrop-blur-md">
                    {copy.showcaseSlides[showcaseIndex]?.title ??
                      copy.examplesLabel}
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setShowcaseIndex(
                          (current) =>
                            (current - 1 + RESULT_SHOWCASE_SLIDES.length) %
                            RESULT_SHOWCASE_SLIDES.length
                        )
                      }
                      aria-label={`${copy.examplesLabel} ${showcaseIndex || RESULT_SHOWCASE_SLIDES.length}`}
                      className="flex size-10 items-center justify-center rounded-full border border-white/25 bg-black/35 text-white shadow-sm backdrop-blur-md transition hover:bg-black/55 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
                    >
                      <ChevronLeft className="size-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setShowcaseIndex(
                          (current) =>
                            (current + 1) % RESULT_SHOWCASE_SLIDES.length
                        )
                      }
                      aria-label={`${copy.examplesLabel} ${(showcaseIndex + 2) % RESULT_SHOWCASE_SLIDES.length || RESULT_SHOWCASE_SLIDES.length}`}
                      className="flex size-10 items-center justify-center rounded-full border border-white/25 bg-black/35 text-white shadow-sm backdrop-blur-md transition hover:bg-black/55 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
                    >
                      <ChevronRight className="size-4" />
                    </button>
                  </div>
                </div>
                <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
                  <p className="max-w-md text-sm leading-6 font-medium text-white drop-shadow-sm">
                    {copy.showcaseSlides[showcaseIndex]?.description ??
                      copy.resultEmpty}
                  </p>
                  <div className="mt-3 flex items-center gap-2" role="group">
                    {RESULT_SHOWCASE_SLIDES.map((src, index) => (
                      <button
                        key={src}
                        type="button"
                        onClick={() => setShowcaseIndex(index)}
                        aria-label={`${copy.examplesLabel} ${index + 1}`}
                        aria-current={
                          index === showcaseIndex ? 'true' : undefined
                        }
                        className={cn(
                          'h-1.5 rounded-full bg-white/55 shadow-sm transition-[width,background-color] motion-reduce:transition-none',
                          index === showcaseIndex
                            ? 'w-8 bg-white'
                            : 'w-2.5 hover:bg-white/80'
                        )}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
            {selectedResult && outputUrl ? (
              <button
                type="button"
                onClick={() => setPreviewResult(selectedResult)}
                aria-label={copy.viewOriginal}
                title={copy.viewOriginal}
                className="bg-background/90 text-foreground focus-visible:ring-ring absolute top-3 right-3 z-10 flex size-10 items-center justify-center rounded-full border border-white/60 opacity-100 shadow-md backdrop-blur transition focus-visible:ring-2 focus-visible:outline-none sm:opacity-0 sm:group-focus-within:opacity-100 sm:group-hover:opacity-100"
              >
                <Maximize2 className="size-4" />
              </button>
            ) : null}
          </div>
          {sessionResults.length ? (
            <section className="mt-4" aria-label={copy.sessionTitle}>
              <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-semibold">{copy.sessionTitle}</p>
                  <span className="bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-[10px] font-medium tabular-nums">
                    {copy.sessionCount
                      .replace('{count}', String(sessionResults.length))
                      .replace('{max}', String(MAX_SESSION_RESULTS))}
                  </span>
                </div>
                {sessionResults.length > 1 ? (
                  compareMode ? (
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setCompareMode(false);
                          setCompareIds([]);
                        }}
                        className="text-muted-foreground hover:text-foreground min-h-9 rounded-full px-2.5 text-xs font-medium"
                      >
                        {copy.compareCancel}
                      </button>
                      <Button
                        type="button"
                        size="sm"
                        className="min-h-9 rounded-full px-3"
                        disabled={compareIds.length < 2}
                        onClick={() => setCompareOpen(true)}
                      >
                        <Columns3 className="size-3.5" />
                        {copy.compareAction.replace(
                          '{count}',
                          String(compareIds.length)
                        )}
                      </Button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setCompareMode(true);
                        setCompareIds(
                          sessionResults.slice(0, 2).map((item) => item.id)
                        );
                      }}
                      className="border-border bg-background hover:border-primary/40 hover:text-primary flex min-h-9 items-center gap-1.5 rounded-full border px-3 text-xs font-semibold transition-colors"
                    >
                      <Columns3 className="size-3.5" />
                      {copy.compareStart}
                    </button>
                  )
                ) : null}
              </div>
              <div className="-mx-1 flex snap-x gap-2 overflow-x-auto px-1 pb-2 [scrollbar-width:thin]">
                {sessionResults.map((result, index) => {
                  const isSelected = result.id === selectedResult?.id;
                  const isCompared = compareIds.includes(result.id);
                  return (
                    <div
                      key={result.id}
                      className="group relative w-[4.75rem] shrink-0 snap-start sm:w-24"
                    >
                      <button
                        type="button"
                        aria-pressed={compareMode ? isCompared : isSelected}
                        onDoubleClick={() => setPreviewResult(result)}
                        onClick={() => {
                          if (compareMode) {
                            toggleCompareResult(result.id);
                          } else {
                            setSelectedResultId(result.id);
                            setActiveTaskId(null);
                          }
                        }}
                        className={cn(
                          'border-border bg-background focus-visible:ring-ring w-full cursor-pointer overflow-hidden rounded-xl border p-1 text-left transition focus-visible:ring-2 focus-visible:outline-none',
                          isSelected &&
                            !compareMode &&
                            'border-primary ring-primary/20 ring-2',
                          isCompared &&
                            compareMode &&
                            'border-primary bg-primary/5 ring-primary/20 ring-2'
                        )}
                      >
                        <span className="bg-muted relative block aspect-square overflow-hidden rounded-lg">
                          <img
                            src={result.imageUrl}
                            alt={result.prompt}
                            width={160}
                            height={160}
                            className="size-full object-cover"
                          />
                          <span className="absolute right-1 bottom-1 rounded-full bg-black/65 px-1.5 py-0.5 text-[9px] font-semibold text-white">
                            {sessionResults.length - index}
                          </span>
                          {compareMode ? (
                            <span
                              className={cn(
                                'absolute top-1 left-1 flex size-6 items-center justify-center rounded-full border shadow-sm',
                                isCompared
                                  ? 'border-primary bg-primary text-primary-foreground'
                                  : 'border-white/70 bg-black/45 text-transparent'
                              )}
                            >
                              <Check className="size-3.5" />
                            </span>
                          ) : null}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewResult(result)}
                        aria-label={copy.viewOriginal}
                        title={copy.viewOriginal}
                        className="bg-background/90 text-foreground focus-visible:ring-ring absolute top-1.5 right-1.5 z-10 flex size-7 items-center justify-center rounded-full border border-white/60 opacity-100 shadow-sm backdrop-blur transition focus-visible:ring-2 focus-visible:outline-none sm:opacity-0 sm:group-focus-within:opacity-100 sm:group-hover:opacity-100"
                      >
                        <Maximize2 className="size-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
              {compareMode ? (
                <p className="text-muted-foreground mt-1 text-[11px]">
                  {copy.compareSelected.replace(
                    '{count}',
                    String(compareIds.length)
                  )}
                </p>
              ) : null}
            </section>
          ) : null}
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
          {selectedResult && !isGenerating ? (
            !session?.user ? (
              <div className="border-primary/20 bg-primary/5 mt-4 rounded-2xl border p-4">
                <p className="text-base font-semibold">
                  Your first AI Image image is ready.
                </p>
                <p className="text-muted-foreground mt-1 text-sm leading-6">
                  Download the preview now, or create a free account to save it,
                  keep generating, and edit the result.
                </p>
                <div className="mt-4 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                  <a
                    href={selectedResult.imageUrl}
                    download
                    onClick={() => trackFunnelEvent('image_download')}
                    className="border-border bg-background inline-flex min-h-11 items-center justify-center gap-2 rounded-full border px-4 text-sm font-semibold"
                  >
                    <Download className="size-4" />
                    Download preview
                  </a>
                  <button
                    type="button"
                    onClick={() => openSignup(selectedResult, 'edit')}
                    className="border-border bg-background inline-flex min-h-11 items-center justify-center rounded-full border px-4 text-sm font-semibold"
                  >
                    Edit this image
                  </button>
                  <button
                    type="button"
                    onClick={() => openSignup(selectedResult, 'generate')}
                    className="bg-primary text-primary-foreground inline-flex min-h-11 items-center justify-center rounded-full px-4 text-sm font-semibold"
                  >
                    Generate another
                  </button>
                  <button
                    type="button"
                    onClick={() => openSignup(selectedResult, 'save')}
                    className="border-border bg-background inline-flex min-h-11 items-center justify-center gap-2 rounded-full border px-4 text-sm font-semibold"
                  >
                    <Save className="size-4" />
                    Save image
                  </button>
                  <button
                    type="button"
                    onClick={() => openSignup(selectedResult, 'download')}
                    className="border-border bg-background inline-flex min-h-11 items-center justify-center gap-2 rounded-full border px-4 text-sm font-semibold"
                  >
                    <Download className="size-4" />
                    HD download
                  </button>
                </div>
              </div>
            ) : (
              <div className="border-border bg-card mt-4 overflow-hidden rounded-xl border p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-base leading-tight font-semibold">
                      {copy.continueTitle}
                    </p>
                    <p className="text-muted-foreground mt-1 text-xs leading-5">
                      {copy.continueDescription}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => goToEditor(selectedResult)}
                    className="border-border bg-background/70 hover:bg-background shrink-0 rounded-full border px-3 py-2 text-xs font-semibold"
                  >
                    Edit this image
                  </button>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => continueWithResult(selectedResult)}
                    className="border-border bg-background/70 hover:border-primary/35 flex min-h-12 items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold"
                  >
                    <Sparkles className="text-primary size-4 shrink-0" />
                    Generate again / variation
                  </button>
                  <a
                    href={`/api/images/${encodeURIComponent(selectedResult.id)}/download`}
                    onClick={() => trackFunnelEvent('image_download')}
                    className="border-border bg-background/70 hover:border-primary/35 flex min-h-12 items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold"
                  >
                    <Download className="text-primary size-4 shrink-0" />
                    Download
                  </a>
                  <Link
                    href="/image-background-remover?source=last-output#tool"
                    onClick={() =>
                      stageResultForTool(selectedResult, 'background-remover')
                    }
                    className="border-border bg-background/70 hover:border-primary/35 flex min-h-12 items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold"
                  >
                    <ScanLine className="text-primary size-4 shrink-0" />
                    {copy.continueRemoveBackground}
                  </Link>
                  <Link
                    href="/ai-image-upscaler?source=last-output#tool"
                    onClick={() =>
                      stageResultForTool(selectedResult, 'image-upscaler')
                    }
                    className="border-border bg-background/70 hover:border-primary/35 flex min-h-12 items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold"
                  >
                    <ZoomIn className="text-primary size-4 shrink-0" />
                    {copy.continueUpscale}
                  </Link>
                  <Link
                    href={
                      /product|packaging|bottle|shoe|watch|cosmetic|furniture/i.test(
                        selectedResult.prompt
                      )
                        ? '/product-image-set-generator?source=last-output#tool'
                        : '/add-text-to-image?source=last-output#tool'
                    }
                    onClick={() =>
                      stageResultForTool(
                        selectedResult,
                        /product|packaging|bottle|shoe|watch|cosmetic|furniture/i.test(
                          selectedResult.prompt
                        )
                          ? 'product-image-set'
                          : 'add-text-to-image'
                      )
                    }
                    className="border-border bg-background/70 hover:border-primary/35 flex min-h-12 items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold"
                  >
                    {/product|packaging|bottle|shoe|watch|cosmetic|furniture/i.test(
                      selectedResult.prompt
                    ) ? (
                      <PackageOpen className="text-primary size-4 shrink-0" />
                    ) : (
                      <PanelTop className="text-primary size-4 shrink-0" />
                    )}
                    {/product|packaging|bottle|shoe|watch|cosmetic|furniture/i.test(
                      selectedResult.prompt
                    )
                      ? copy.continueProduct
                      : copy.continueAddText}
                  </Link>
                </div>
              </div>
            )
          ) : null}
        </div>
      </div>

      <Dialog open={compareOpen} onOpenChange={setCompareOpen}>
        <DialogContent className="h-[100dvh] max-h-[100dvh] max-w-none grid-rows-[auto_minmax(0,1fr)] gap-0 rounded-none p-0 sm:h-[min(92vh,56rem)] sm:max-w-6xl sm:rounded-2xl">
          <DialogHeader className="border-border border-b px-4 py-4 pr-12 sm:px-6 sm:py-5">
            <DialogTitle>{copy.compareTitle}</DialogTitle>
            <DialogDescription>{copy.compareDescription}</DialogDescription>
          </DialogHeader>
          <div className="min-h-0 flex-1 overflow-x-auto overflow-y-auto p-4 sm:p-6">
            <div className="grid min-w-max auto-cols-[82vw] grid-flow-col gap-3 sm:min-w-full sm:auto-cols-[minmax(260px,1fr)] sm:gap-4">
              {comparedResults.map((result, index) => {
                const resultModel = enabledModels.find(
                  (candidate) => candidate.id === result.model
                );
                const resultAspect = aspectOptions.find(
                  (option) => option.key === result.aspect
                );
                return (
                  <article
                    key={result.id}
                    className="border-border bg-background flex min-w-0 flex-col overflow-hidden rounded-2xl border"
                  >
                    <div
                      onDoubleClick={() => setPreviewResult(result)}
                      className={cn(
                        'bg-muted group relative flex max-h-[52vh] min-h-64 cursor-zoom-in items-center justify-center overflow-hidden',
                        result.aspect === 'portrait'
                          ? 'aspect-[3/4]'
                          : result.aspect === 'landscape'
                            ? 'aspect-[4/3]'
                            : 'aspect-square'
                      )}
                    >
                      <img
                        src={result.imageUrl}
                        alt={result.prompt}
                        width={
                          result.aspect === 'landscape' ||
                          result.aspect === 'widescreen'
                            ? 1200
                            : result.aspect === 'portrait' ||
                                result.aspect === 'story'
                              ? 900
                              : 1024
                        }
                        height={
                          result.aspect === 'landscape'
                            ? 900
                            : result.aspect === 'widescreen'
                              ? 675
                              : result.aspect === 'portrait'
                                ? 1200
                                : result.aspect === 'story'
                                  ? 1600
                                  : 1024
                        }
                        className="size-full object-contain"
                      />
                      <button
                        type="button"
                        onClick={() => setPreviewResult(result)}
                        aria-label={copy.viewOriginal}
                        title={copy.viewOriginal}
                        className="bg-background/90 text-foreground focus-visible:ring-ring absolute top-3 right-3 z-10 flex size-10 items-center justify-center rounded-full border border-white/60 opacity-100 shadow-md backdrop-blur transition focus-visible:ring-2 focus-visible:outline-none sm:opacity-0 sm:group-focus-within:opacity-100 sm:group-hover:opacity-100"
                      >
                        <Maximize2 className="size-4" />
                      </button>
                    </div>
                    <div className="flex flex-1 flex-col p-3.5 sm:p-4">
                      <div className="mb-2 flex flex-wrap items-center gap-1.5">
                        <span className="bg-primary/10 text-primary rounded-full px-2 py-1 text-[10px] font-semibold">
                          #{index + 1}
                        </span>
                        <span className="bg-muted text-muted-foreground rounded-full px-2 py-1 text-[10px] font-medium">
                          {resultModel?.label || result.model}
                        </span>
                        <span className="bg-muted text-muted-foreground rounded-full px-2 py-1 text-[10px] font-medium">
                          {resultAspect?.label}
                        </span>
                      </div>
                      <p className="text-muted-foreground line-clamp-3 text-xs leading-5">
                        {result.prompt}
                      </p>
                      <Button
                        type="button"
                        className="mt-4 min-h-11 w-full rounded-full"
                        onClick={() => continueWithResult(result)}
                      >
                        {copy.compareUse}
                        <ArrowRight className="size-4" />
                      </Button>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={signupIntent !== null}
        onOpenChange={(open) => {
          if (!open) {
            setSignupIntent(null);
            setSocialPending(false);
          }
        }}
      >
        <DialogContent className="top-auto bottom-0 max-h-[92dvh] w-full max-w-none translate-y-0 rounded-t-3xl rounded-b-none p-5 sm:top-1/2 sm:bottom-auto sm:max-w-md sm:-translate-y-1/2 sm:rounded-2xl sm:p-6">
          <DialogHeader className="text-left">
            <DialogTitle>Your first AI Image image is ready.</DialogTitle>
            <DialogDescription className="leading-6">
              Create a free account to save your image, keep generating and edit
              your result.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-2 space-y-3">
            {publicConfigQuery.data?.google_auth_enabled === 'true' ? (
              <Button
                type="button"
                className="min-h-12 w-full rounded-full"
                disabled={socialPending}
                onClick={continueWithGoogle}
              >
                {socialPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <GoogleIcon />
                )}
                Continue with Google
              </Button>
            ) : null}
            <Link
              href={`/sign-in?callbackUrl=${encodeURIComponent(authDestination())}`}
              onClick={() => {
                window.sessionStorage.setItem(
                  'image-studio:signup-pending',
                  '1'
                );
                trackFunnelEvent('email_signup_clicked', {
                  source: 'post_generation_modal',
                });
              }}
              className="border-border bg-background hover:bg-muted flex min-h-12 w-full items-center justify-center rounded-full border px-5 text-sm font-semibold"
            >
              Continue with Email
            </Link>
            <p className="text-muted-foreground text-center text-xs">
              Closing this dialog keeps your generated result on this page.
            </p>
          </div>
        </DialogContent>
      </Dialog>

      <ZoomableImageDialog
        open={Boolean(previewResult)}
        onOpenChange={(open) => {
          if (!open) setPreviewResult(null);
        }}
        imageUrl={previewResult?.imageUrl}
        alt={previewResult?.prompt || copy.previewTitle}
        title={copy.previewTitle}
      />
      <FirstGenerationFeedback
        taskId={anonymousTaskToken ? null : activeTaskId}
        status={activeTaskQuery.data?.status}
        modelId={model}
      />
    </div>
  );
}
