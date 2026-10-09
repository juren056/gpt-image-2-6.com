import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Clapperboard,
  Coins,
  Download,
  ImageIcon,
  Loader2,
  Play,
  Scissors,
  SlidersHorizontal,
  Sparkles,
  Upload,
} from 'lucide-react';
import { toast } from 'sonner';

import { useSession } from '@/core/auth/client';
import { useRouter } from '@/core/i18n/navigation';
import {
  IMAGE_GENERATION_COST,
  SIMPLE_TOOL_IMAGE_MODEL_ID,
} from '@/config/image-models';
import {
  BACKGROUND_REMOVAL_COST,
  MATCHA_FILTER_REMOVAL_COST,
  VIDEO_GENERATION_COST,
  VIDEO_GENERATION_COST_LONG,
} from '@/config/media-tools';
import { apiGet, apiPost, type PageResult } from '@/lib/api-client';
import {
  DEFAULT_MATCHA_FILTER_STRENGTH,
  estimateMatchaFilterStrength,
} from '@/lib/matcha-filter';
import { consumeStagedVideoPrompt } from '@/lib/prompt-navigation';
import { cn } from '@/lib/utils';
import { FirstGenerationFeedback } from '@/components/first-generation-feedback';
import {
  ImageUploader,
  type ImageUploaderValue,
} from '@/components/image-uploader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

type MediaTask = {
  id: string;
  status: string;
  images: Array<{ imageUrl?: string }>;
  videos: Array<{ videoUrl?: string }>;
  errorMessage?: string;
  providerStatus?: string;
  queuePosition?: number;
};

type CommonCopy = {
  signIn: string;
  credits: string;
  creditsLoading: string;
  buyCredits: string;
  generating: string;
  ready: string;
  failed: string;
};

function useToolSession({
  activeTaskId,
  cost,
  taskBase = '/api/media-tools',
}: {
  activeTaskId: string | null;
  cost: number;
  taskBase?: string;
}) {
  const { data: session } = useSession();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const credits = useQuery({
    queryKey: ['user-credits'],
    queryFn: () => apiGet<{ balance: number }>('/api/credits'),
    enabled: mounted && Boolean(session?.user),
    staleTime: 30_000,
  });
  const task = useQuery({
    queryKey: ['media-tool-task', activeTaskId],
    queryFn: () => apiGet<MediaTask>(`${taskBase}/${activeTaskId}`),
    enabled: Boolean(activeTaskId),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === 'success' || status === 'failed' ? false : 1600;
    },
    retry: 5,
    refetchIntervalInBackground: true,
  });

  return {
    mounted,
    session,
    credits,
    task,
    insufficient:
      typeof credits.data?.balance === 'number' && credits.data.balance < cost,
  };
}

function CreditsPill({
  copy,
  balance,
  loading,
  insufficient,
  onClick,
  tone = 'default',
}: {
  copy: CommonCopy;
  balance?: number;
  loading: boolean;
  insufficient: boolean;
  onClick: () => void;
  tone?: 'default' | 'dark';
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'border-border bg-background inline-flex min-h-10 items-center gap-2 rounded-full border px-3 text-xs font-semibold',
        tone === 'dark' &&
          'border-white/20 bg-white text-slate-900 hover:bg-slate-100',
        insufficient && 'border-amber-400 text-amber-700 dark:text-amber-300'
      )}
    >
      {loading ? (
        <Loader2 className="size-3.5 animate-spin" />
      ) : (
        <Coins className="size-3.5" />
      )}
      {typeof balance === 'number'
        ? copy.credits.replace('{credits}', balance.toLocaleString())
        : copy.creditsLoading}
      {insufficient ? <span>· {copy.buyCredits}</span> : null}
    </button>
  );
}

function getTaskProgress(copy: CommonCopy, task?: MediaTask) {
  if (task?.providerStatus === 'IN_QUEUE' && task.queuePosition) {
    return `${copy.generating} · #${task.queuePosition}`;
  }
  return copy.generating;
}

export type YouTubeWorkspaceCopy = CommonCopy & {
  titleLabel: string;
  titlePlaceholder: string;
  subjectLabel: string;
  subjectPlaceholder: string;
  hookLabel: string;
  hookPlaceholder: string;
  moodLabel: string;
  moods: Array<{ label: string; prompt: string }>;
  generate: string;
  resultLabel: string;
  empty: string;
  cost: string;
};

export function YouTubeThumbnailWorkspace({
  copy,
  path,
}: {
  copy: YouTubeWorkspaceCopy;
  path: string;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [hook, setHook] = useState('');
  const [mood, setMood] = useState(copy.moods[0]?.prompt ?? '');
  const state = useToolSession({
    activeTaskId,
    cost: IMAGE_GENERATION_COST,
    taskBase: '/api/images',
  });

  const prompt = useMemo(
    () =>
      [
        `Create a high-impact 16:9 YouTube thumbnail for a video titled "${title.trim()}".`,
        `Main visual subject: ${subject.trim()}.`,
        hook.trim() ? `Curiosity hook: ${hook.trim()}.` : '',
        `Visual direction: ${mood}.`,
        `Render the title exactly as "${title.trim()}" using no more than two short lines, large enough to read on a phone.`,
        'Build one dominant focal point, strong foreground-background separation, deliberate negative space, expressive lighting and a clear visual question.',
        'Do not add logos, platform UI, watermarks, fake view counts, extra captions or unrelated faces.',
      ]
        .filter(Boolean)
        .join(' '),
    [hook, mood, subject, title]
  );

  const generate = useMutation({
    mutationFn: () =>
      apiPost<{ id: string }>('/api/images/generate', {
        prompt,
        model: SIMPLE_TOOL_IMAGE_MODEL_ID,
        options: { image_size: 'landscape_16_9' },
      }),
    onSuccess: ({ id }) => {
      setActiveTaskId(id);
      queryClient.invalidateQueries({ queryKey: ['user-credits'] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const task: MediaTask | undefined = activeTaskId
    ? state.task.data
    : undefined;
  const output = task?.images?.[0]?.imageUrl;
  const busy =
    generate.isPending ||
    (Boolean(activeTaskId) &&
      task?.status !== 'success' &&
      task?.status !== 'failed');

  useEffect(() => {
    if (task?.status === 'success') {
      toast.success(copy.ready);
      queryClient.invalidateQueries({ queryKey: ['user-credits'] });
    } else if (task?.status === 'failed') {
      toast.error(task.errorMessage || copy.failed);
      queryClient.invalidateQueries({ queryKey: ['user-credits'] });
    }
  }, [copy.failed, copy.ready, queryClient, task?.errorMessage, task?.status]);

  function submit() {
    if (!state.mounted || !state.session?.user) {
      router.push(`/sign-up?callbackUrl=${encodeURIComponent(`${path}#tool`)}`);
    } else if (state.insufficient) {
      router.push('/pricing');
    } else if (title.trim() && subject.trim()) {
      generate.mutate();
    }
  }

  return (
    <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-[#101318] text-white shadow-2xl">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-4 sm:px-7">
        <div className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-lg bg-red-500">
            <Play className="size-4 fill-current" />
          </span>
          <span className="font-semibold">Thumbnail control room</span>
        </div>
        <CreditsPill
          copy={copy}
          balance={state.credits.data?.balance}
          loading={state.credits.isFetching}
          insufficient={state.insufficient}
          tone="dark"
          onClick={() =>
            router.push(state.session?.user ? '/settings/credits' : '/sign-in')
          }
        />
      </div>
      <div className="grid lg:grid-cols-[.86fr_1.14fr]">
        <div className="space-y-5 border-white/10 p-5 sm:p-7 lg:border-r">
          <div>
            <Label htmlFor="youtube-title">{copy.titleLabel}</Label>
            <Input
              id="youtube-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder={copy.titlePlaceholder}
              maxLength={60}
              disabled={busy}
              className="mt-2 min-h-10 border-white/15 bg-white/5"
            />
          </div>
          <div>
            <Label htmlFor="youtube-subject">{copy.subjectLabel}</Label>
            <Textarea
              id="youtube-subject"
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              placeholder={copy.subjectPlaceholder}
              maxLength={180}
              disabled={busy}
              className="mt-2 min-h-24 border-white/15 bg-white/5"
            />
          </div>
          <div>
            <Label htmlFor="youtube-hook">{copy.hookLabel}</Label>
            <Input
              id="youtube-hook"
              value={hook}
              onChange={(event) => setHook(event.target.value)}
              placeholder={copy.hookPlaceholder}
              maxLength={90}
              disabled={busy}
              className="mt-2 min-h-10 border-white/15 bg-white/5"
            />
          </div>
          <fieldset>
            <legend className="text-sm font-medium">{copy.moodLabel}</legend>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {copy.moods.map((option) => (
                <button
                  key={option.label}
                  type="button"
                  onClick={() => setMood(option.prompt)}
                  className={cn(
                    'min-h-10 rounded-xl border px-3 text-xs font-semibold transition',
                    mood === option.prompt
                      ? 'border-red-400 bg-red-500/15 text-red-200'
                      : 'border-white/10 bg-white/5 text-white/70'
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </fieldset>
          <Button
            type="button"
            onClick={submit}
            disabled={busy || !title.trim() || !subject.trim()}
            className="h-12 w-full rounded-xl bg-red-500 text-white hover:bg-red-400"
          >
            {busy ? (
              <Loader2 className="animate-spin" />
            ) : (
              <Sparkles className="size-4" />
            )}
            {!state.session?.user
              ? copy.signIn
              : busy
                ? getTaskProgress(copy, task)
                : copy.generate}
          </Button>
          <p className="text-center text-xs text-white/45">{copy.cost}</p>
        </div>
        <div className="flex min-h-[390px] flex-col bg-black p-5 sm:p-7">
          <p className="mb-3 text-xs font-semibold tracking-[0.18em] text-white/50 uppercase">
            {copy.resultLabel}
          </p>
          <div className="relative my-auto aspect-video overflow-hidden rounded-2xl border border-white/10 bg-[radial-gradient(circle_at_70%_35%,#332b55,#11131a_55%,#08090c)]">
            {output ? (
              <img
                src={output}
                alt={copy.resultLabel}
                className="size-full object-cover"
              />
            ) : (
              <div className="flex size-full flex-col items-center justify-center gap-3 px-8 text-center text-white/45">
                <ImageIcon className="size-8" />
                <p className="max-w-sm text-sm leading-6">{copy.empty}</p>
              </div>
            )}
          </div>
        </div>
      </div>
      <FirstGenerationFeedback
        taskId={activeTaskId}
        status={task?.status}
        modelId={SIMPLE_TOOL_IMAGE_MODEL_ID}
      />
    </div>
  );
}

export type VideoWorkspaceCopy = CommonCopy & {
  sceneLabel: string;
  scenePlaceholder: string;
  cameraLabel: string;
  cameras: Array<{ label: string; prompt: string }>;
  rhythmLabel: string;
  rhythms: Array<{ label: string; prompt: string }>;
  formatLabel: string;
  durationLabel: string;
  generate: string;
  emptyTitle: string;
  emptyBody: string;
  cost: string;
  subscribe: string;
};

type VideoSubscription = {
  status: string;
};

export function VideoGeneratorWorkspace({
  copy,
  path,
  endpoint = '/api/media-tools/video',
  durationOptions = [5, 8],
  aspectOptions = ['16:9', '9:16', '1:1'],
  costForDuration,
  workspaceLabel = 'Scene composer',
  promptMaxLength = 700,
}: {
  copy: VideoWorkspaceCopy;
  path: string;
  endpoint?: string;
  durationOptions?: number[];
  aspectOptions?: string[];
  costForDuration?: (duration: number) => number;
  workspaceLabel?: string;
  promptMaxLength?: number;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [scene, setScene] = useState('');
  const [camera, setCamera] = useState(copy.cameras[0]?.prompt ?? '');
  const [rhythm, setRhythm] = useState(copy.rhythms[0]?.prompt ?? '');
  const [aspect, setAspect] = useState('16:9');
  const [duration, setDuration] = useState(durationOptions[0] ?? 5);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const incomingPrompt =
      params.get('prompt')?.trim() || consumeStagedVideoPrompt();
    const incomingAspect = params.get('aspect');
    const incomingDuration = Number(params.get('duration'));

    if (incomingPrompt) setScene(incomingPrompt.slice(0, promptMaxLength));
    if (incomingAspect && aspectOptions.includes(incomingAspect)) {
      setAspect(incomingAspect);
    }
    if (durationOptions.includes(incomingDuration)) {
      setDuration(incomingDuration);
    }
    // URL input is an initial hand-off. User edits must not be overwritten.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const videoCost = costForDuration
    ? costForDuration(duration)
    : duration === 8
      ? VIDEO_GENERATION_COST_LONG
      : VIDEO_GENERATION_COST;
  const state = useToolSession({ activeTaskId, cost: videoCost });
  const subscriptions = useQuery({
    queryKey: ['video-membership'],
    queryFn: () =>
      apiGet<PageResult<VideoSubscription>>(
        '/api/user/subscriptions/?page=1&pageSize=20'
      ),
    enabled: state.mounted && Boolean(state.session?.user),
    staleTime: 30_000,
  });
  const hasPaidMembership = Boolean(
    subscriptions.data?.items.some((subscription) =>
      ['active', 'pending_cancel'].includes(subscription.status)
    )
  );

  const prompt = [
    scene.trim(),
    `Camera language: ${camera}.`,
    `Motion rhythm: ${rhythm}.`,
    'Maintain consistent subject identity, geometry, lighting direction and spatial continuity.',
    'Use intentional motion with a readable beginning, development and final beat. No captions, logos or watermarks.',
  ].join(' ');

  const generate = useMutation({
    mutationFn: () =>
      apiPost<{ id: string }>(endpoint, {
        prompt,
        options: { aspect_ratio: aspect, duration },
      }),
    onSuccess: ({ id }) => {
      setActiveTaskId(id);
      queryClient.invalidateQueries({ queryKey: ['user-credits'] });
    },
    onError: (error: Error) => toast.error(error.message),
  });
  const task = state.task.data;
  const output = task?.videos?.[0]?.videoUrl;
  const busy =
    generate.isPending ||
    (Boolean(activeTaskId) &&
      task?.status !== 'success' &&
      task?.status !== 'failed');
  const membershipLoading =
    Boolean(state.session?.user) &&
    (subscriptions.isPending || subscriptions.isFetching);

  useEffect(() => {
    if (task?.status === 'success') {
      toast.success(copy.ready);
      queryClient.invalidateQueries({ queryKey: ['user-credits'] });
    } else if (task?.status === 'failed') {
      toast.error(task.errorMessage || copy.failed);
      queryClient.invalidateQueries({ queryKey: ['user-credits'] });
    }
  }, [copy.failed, copy.ready, queryClient, task?.errorMessage, task?.status]);

  function submit() {
    if (!state.mounted || !state.session?.user) {
      router.push(`/sign-up?callbackUrl=${encodeURIComponent(`${path}#tool`)}`);
    } else if (!hasPaidMembership) {
      router.push('/pricing');
    } else if (state.insufficient) {
      router.push('/pricing');
    } else if (scene.trim()) {
      generate.mutate();
    }
  }

  return (
    <div className="rounded-[2rem] border border-indigo-200/70 bg-[#f3f0ff] p-3 shadow-xl dark:border-indigo-900 dark:bg-[#151226]">
      <div className="bg-background grid overflow-hidden rounded-[1.35rem] lg:grid-cols-[1.05fr_.95fr]">
        <div className="p-5 sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-full bg-indigo-600 text-white">
                <Clapperboard className="size-4" />
              </span>
              <div>
                <p className="font-semibold">{workspaceLabel}</p>
                <div className="mt-1 flex gap-1">
                  {[1, 2, 3].map((number) => (
                    <span
                      key={number}
                      className="h-1 w-8 rounded-full bg-indigo-500/30 first:bg-indigo-500"
                    />
                  ))}
                </div>
              </div>
            </div>
            <CreditsPill
              copy={copy}
              balance={state.credits.data?.balance}
              loading={state.credits.isFetching}
              insufficient={state.insufficient}
              onClick={() =>
                router.push(
                  state.session?.user ? '/settings/credits' : '/sign-in'
                )
              }
            />
          </div>
          <div className="mt-7">
            <Label htmlFor="video-scene">{copy.sceneLabel}</Label>
            <Textarea
              id="video-scene"
              value={scene}
              onChange={(event) => setScene(event.target.value)}
              placeholder={copy.scenePlaceholder}
              maxLength={promptMaxLength}
              disabled={busy}
              className="mt-2 min-h-36 rounded-2xl"
            />
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="video-camera">{copy.cameraLabel}</Label>
              <select
                id="video-camera"
                value={camera}
                onChange={(event) => setCamera(event.target.value)}
                className="border-input bg-background mt-2 h-11 w-full rounded-xl border px-3 text-sm"
                disabled={busy}
              >
                {copy.cameras.map((option) => (
                  <option key={option.label} value={option.prompt}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="video-rhythm">{copy.rhythmLabel}</Label>
              <select
                id="video-rhythm"
                value={rhythm}
                onChange={(event) => setRhythm(event.target.value)}
                className="border-input bg-background mt-2 h-11 w-full rounded-xl border px-3 text-sm"
                disabled={busy}
              >
                {copy.rhythms.map((option) => (
                  <option key={option.label} value={option.prompt}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <fieldset>
              <legend className="text-sm font-medium">
                {copy.formatLabel}
              </legend>
              <div className="mt-2 flex gap-2">
                {aspectOptions.map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setAspect(value)}
                    className={cn(
                      'h-10 flex-1 rounded-xl border text-xs font-semibold',
                      aspect === value
                        ? 'border-indigo-500 bg-indigo-500/10 text-indigo-600'
                        : 'border-border'
                    )}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </fieldset>
            <fieldset>
              <legend className="text-sm font-medium">
                {copy.durationLabel}
              </legend>
              <div className="mt-2 flex gap-2">
                {durationOptions.map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setDuration(value)}
                    className={cn(
                      'h-10 flex-1 rounded-xl border text-xs font-semibold',
                      duration === value
                        ? 'border-indigo-500 bg-indigo-500/10 text-indigo-600'
                        : 'border-border'
                    )}
                  >
                    {value}s
                  </button>
                ))}
              </div>
            </fieldset>
          </div>
          <Button
            type="button"
            onClick={submit}
            disabled={busy || !scene.trim()}
            className="mt-6 h-12 w-full rounded-xl bg-indigo-600 text-white hover:bg-indigo-500"
          >
            {busy ? (
              <Loader2 className="animate-spin" />
            ) : (
              <Clapperboard className="size-4" />
            )}
            {!state.session?.user
              ? copy.signIn
              : membershipLoading
                ? copy.creditsLoading
                : !hasPaidMembership
                  ? copy.subscribe
                  : busy
                    ? getTaskProgress(copy, task)
                    : copy.generate}
          </Button>
          <p className="text-muted-foreground mt-2 text-center text-xs">
            {copy.cost
              .replace('{credits}', videoCost.toLocaleString())
              .replace('{duration}', String(duration))}
          </p>
        </div>
        <div className="border-border flex min-h-[460px] flex-col border-t bg-[#0d0d13] p-5 text-white sm:p-7 lg:border-t-0 lg:border-l">
          {output ? (
            <video
              src={output}
              controls
              playsInline
              className="my-auto max-h-[520px] w-full rounded-2xl bg-black"
            />
          ) : (
            <div className="my-auto text-center">
              <div className="mx-auto flex size-24 items-center justify-center rounded-full border border-white/10 bg-white/5">
                {busy ? (
                  <Loader2 className="size-9 animate-spin text-indigo-300" />
                ) : (
                  <Play className="size-9 fill-indigo-300 text-indigo-300" />
                )}
              </div>
              <h3 className="mt-6 text-xl font-semibold">
                {busy ? getTaskProgress(copy, task) : copy.emptyTitle}
              </h3>
              <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-white/55">
                {copy.emptyBody}
              </p>
            </div>
          )}
        </div>
      </div>
      <FirstGenerationFeedback
        taskId={activeTaskId}
        status={task?.status}
        modelId={endpoint}
      />
    </div>
  );
}

function Checkerboard({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'absolute inset-0 bg-white bg-[linear-gradient(45deg,#e8e8ec_25%,transparent_25%),linear-gradient(-45deg,#e8e8ec_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#e8e8ec_75%),linear-gradient(-45deg,transparent_75%,#e8e8ec_75%)] bg-[length:28px_28px] bg-[position:0_0,0_14px,14px_-14px,-14px_0px] dark:bg-[#16161c] dark:bg-[linear-gradient(45deg,#292932_25%,transparent_25%),linear-gradient(-45deg,#292932_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#292932_75%),linear-gradient(-45deg,transparent_75%,#292932_75%)]',
        className
      )}
    />
  );
}

export function BeforeAfterReveal({
  beforeUrl,
  afterUrl,
  beforeAlt,
  afterAlt,
  autoSweep = true,
  variant = 'cutout',
}: {
  beforeUrl: string;
  afterUrl: string;
  beforeAlt: string;
  afterAlt: string;
  autoSweep?: boolean;
  variant?: 'cutout' | 'photo';
}) {
  const [position, setPosition] = useState(52);
  const interacted = useRef(false);

  useEffect(() => {
    if (!autoSweep || interacted.current) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let frame = 0;
    const started = performance.now();
    const animate = (now: number) => {
      if (interacted.current) return;
      const elapsed = now - started;
      setPosition(50 + Math.sin(elapsed / 850) * 34);
      if (elapsed < 7600) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [autoSweep]);

  return (
    <div
      className={cn(
        'relative isolate touch-none overflow-hidden rounded-[1.75rem] bg-[#f1cbd8]',
        variant === 'photo' ? 'aspect-[3/2]' : 'aspect-square'
      )}
    >
      <div
        className={cn(
          'absolute inset-0 isolate z-0 overflow-hidden',
          variant === 'cutout' &&
            'bg-[radial-gradient(circle_at_24%_22%,#fff6_0_8%,transparent_9%),linear-gradient(145deg,#321a42,#e86d70_58%,#f7c65c)]'
        )}
      >
        {variant === 'cutout' ? (
          <>
            <span className="absolute top-10 left-8 size-24 rounded-full border border-white/30" />
            <span className="absolute right-8 bottom-10 h-20 w-36 rotate-12 rounded-full bg-[#16152a]/25" />
          </>
        ) : null}
        <img
          src={beforeUrl}
          alt={beforeAlt}
          className={cn(
            'relative z-10 size-full',
            variant === 'photo' ? 'object-cover' : 'object-contain p-[8%]'
          )}
        />
      </div>
      <div
        className="absolute inset-0 isolate z-10 overflow-hidden"
        style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
      >
        {variant === 'cutout' ? <Checkerboard className="z-0" /> : null}
        <img
          src={afterUrl}
          alt={afterAlt}
          className={cn(
            'relative z-10 size-full',
            variant === 'photo' ? 'object-cover' : 'object-contain p-[8%]'
          )}
        />
      </div>
      <div
        className="pointer-events-none absolute inset-y-0 z-20 w-0.5 bg-white shadow-[0_0_0_1px_#0003,0_0_18px_#0008]"
        style={{ left: `${position}%` }}
      >
        <span className="absolute top-1/2 left-1/2 flex size-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-sm font-black text-slate-900 shadow-xl">
          ↔
        </span>
      </div>
      <input
        type="range"
        min="0"
        max="100"
        value={position}
        onPointerDown={() => {
          interacted.current = true;
        }}
        onChange={(event) => {
          interacted.current = true;
          setPosition(Number(event.target.value));
        }}
        aria-label={`${beforeAlt} / ${afterAlt}`}
        className="absolute inset-0 z-30 size-full cursor-ew-resize opacity-0"
      />
    </div>
  );
}

export type BackgroundWorkspaceCopy = CommonCopy & {
  uploadTitle: string;
  uploadHint: string;
  remove: string;
  resultTitle: string;
  resultHint: string;
  download: string;
  beforeAlt: string;
  afterAlt: string;
  cost: string;
};

export type MatchaWorkspaceCopy = CommonCopy & {
  uploadTitle: string;
  uploadHint: string;
  remove: string;
  resultTitle: string;
  resultHint: string;
  download: string;
  beforeAlt: string;
  afterAlt: string;
  cost: string;
  uploaderPreviewAlt: string;
  uploaderReplace: string;
  uploaderUploading: string;
  uploaderFailed: string;
  uploaderRemove: string;
  uploaderUpload: string;
  uploaderMaxSize: (sizeMB: number) => string;
};

async function detectMatchaFilterStrength(file: File) {
  if (!file.type.startsWith('image/')) {
    return DEFAULT_MATCHA_FILTER_STRENGTH;
  }

  let bitmap: ImageBitmap | undefined;
  try {
    bitmap = await createImageBitmap(file);
    const maxSide = 160;
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) return DEFAULT_MATCHA_FILTER_STRENGTH;

    context.drawImage(bitmap, 0, 0, width, height);
    return estimateMatchaFilterStrength(
      context.getImageData(0, 0, width, height).data
    );
  } catch {
    return DEFAULT_MATCHA_FILTER_STRENGTH;
  } finally {
    bitmap?.close();
  }
}

export function MatchaFilterWorkspace({
  copy,
  path,
}: {
  copy: MatchaWorkspaceCopy;
  path: string;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const analysisIdRef = useRef(0);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [items, setItems] = useState<ImageUploaderValue[]>([]);
  const [matchaStrength, setMatchaStrength] = useState<number | null>(null);
  const state = useToolSession({
    activeTaskId,
    cost: MATCHA_FILTER_REMOVAL_COST,
  });
  const uploaded = items.find((item) => item.status === 'uploaded' && item.url);
  const task = state.task.data;
  const output = task?.images?.[0]?.imageUrl;
  const busy =
    Boolean(activeTaskId) &&
    task?.status !== 'success' &&
    task?.status !== 'failed';

  const remove = useMutation({
    mutationFn: () =>
      apiPost<{ id: string }>('/api/media-tools/matcha-filter-removal', {
        imageUrl: uploaded?.url,
        strength: matchaStrength,
      }),
    onMutate: () => setActiveTaskId(null),
    onSuccess: ({ id }) => {
      setActiveTaskId(id);
      queryClient.invalidateQueries({ queryKey: ['user-credits'] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  useEffect(() => {
    if (task?.status === 'success') {
      toast.success(copy.ready);
      queryClient.invalidateQueries({ queryKey: ['user-credits'] });
    } else if (task?.status === 'failed') {
      toast.error(task.errorMessage || copy.failed);
      queryClient.invalidateQueries({ queryKey: ['user-credits'] });
    }
  }, [copy.failed, copy.ready, queryClient, task?.errorMessage, task?.status]);

  function submit() {
    if (!state.mounted || !state.session?.user) {
      router.push(`/sign-up?callbackUrl=${encodeURIComponent(`${path}#tool`)}`);
    } else if (state.insufficient) {
      router.push('/pricing');
    } else if (uploaded?.url) {
      remove.mutate();
    }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <div className="rounded-[1.75rem] border border-lime-950/10 bg-white p-5 shadow-sm sm:p-7 dark:border-lime-100/10 dark:bg-[#172018]">
        <div className="flex items-center justify-between gap-3">
          <span className="flex size-11 items-center justify-center rounded-2xl bg-lime-200 text-lime-950">
            <Upload className="size-5" />
          </span>
          <CreditsPill
            copy={copy}
            balance={state.credits.data?.balance}
            loading={state.credits.isFetching}
            insufficient={state.insufficient}
            onClick={() =>
              router.push(
                state.session?.user ? '/settings/credits' : '/sign-in'
              )
            }
          />
        </div>
        <h3 className="mt-6 text-xl font-semibold">{copy.uploadTitle}</h3>
        <p className="text-muted-foreground mt-2 text-sm leading-6">
          {copy.uploadHint}
        </p>
        <ImageUploader
          className="mt-6"
          allowMultiple={false}
          maxSizeMB={10}
          defaultPreviews={items
            .map((item) => item.url)
            .filter((url): url is string => Boolean(url))}
          onChange={(nextItems) => {
            setItems(nextItems);
            setActiveTaskId(null);
          }}
          onFilesSelected={(files) => {
            const file = files.find((candidate) =>
              candidate.type.startsWith('image/')
            );
            const analysisId = ++analysisIdRef.current;
            setMatchaStrength(null);
            if (!file) {
              setMatchaStrength(DEFAULT_MATCHA_FILTER_STRENGTH);
              return;
            }
            void detectMatchaFilterStrength(file).then((strength) => {
              if (analysisId === analysisIdRef.current) {
                setMatchaStrength(strength);
              }
            });
          }}
          emptyHint={copy.uploadHint}
          copy={{
            previewAlt: copy.uploaderPreviewAlt,
            replaceImage: copy.uploaderReplace,
            uploading: copy.uploaderUploading,
            failed: copy.uploaderFailed,
            removeImage: copy.uploaderRemove,
            upload: copy.uploaderUpload,
            maxSize: copy.uploaderMaxSize,
          }}
        />
        <Button
          type="button"
          onClick={submit}
          disabled={
            !uploaded?.url ||
            matchaStrength === null ||
            busy ||
            remove.isPending
          }
          className="mt-6 h-12 w-full rounded-xl bg-[#254d32] text-white hover:bg-[#326741]"
        >
          {busy || remove.isPending ? (
            <Loader2 className="animate-spin" />
          ) : (
            <SlidersHorizontal className="size-4" />
          )}
          {!state.session?.user
            ? copy.signIn
            : busy || remove.isPending
              ? getTaskProgress(copy, task)
              : copy.remove}
        </Button>
        <p className="text-muted-foreground mt-2 text-center text-xs">
          {copy.cost}
        </p>
      </div>
      <div className="rounded-[1.75rem] border border-lime-950/10 bg-[#e9f0df] p-4 sm:p-6 dark:border-lime-100/10 dark:bg-[#111812]">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h3 className="font-semibold">{copy.resultTitle}</h3>
            <p className="text-muted-foreground mt-1 text-xs">
              {copy.resultHint}
            </p>
          </div>
          {output ? (
            <a
              href={`/api/images/${encodeURIComponent(activeTaskId!)}/download`}
              download
              className="inline-flex h-10 items-center gap-2 rounded-full border border-lime-950/15 bg-white px-3 text-xs font-semibold text-lime-950"
            >
              <Download className="size-3.5" />
              {copy.download}
            </a>
          ) : null}
        </div>
        {uploaded?.preview && output ? (
          <BeforeAfterReveal
            beforeUrl={uploaded.preview}
            afterUrl={output}
            beforeAlt={copy.beforeAlt}
            afterAlt={copy.afterAlt}
            variant="photo"
          />
        ) : (
          <div className="flex aspect-square flex-col items-center justify-center rounded-[1.5rem] border border-dashed border-lime-950/20 bg-white/60 px-8 text-center dark:bg-black/20">
            {busy ? (
              <Loader2 className="size-9 animate-spin text-[#4d733d]" />
            ) : (
              <ImageIcon className="size-9 text-[#668257]" />
            )}
            <p className="text-muted-foreground mt-4 max-w-sm text-sm leading-6">
              {busy ? getTaskProgress(copy, task) : copy.resultHint}
            </p>
          </div>
        )}
      </div>
      <FirstGenerationFeedback
        taskId={activeTaskId}
        status={task?.status}
        modelId="matcha-filter-removal"
      />
    </div>
  );
}

export function BackgroundRemoverWorkspace({
  copy,
  path,
}: {
  copy: BackgroundWorkspaceCopy;
  path: string;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [items, setItems] = useState<ImageUploaderValue[]>([]);
  const state = useToolSession({
    activeTaskId,
    cost: BACKGROUND_REMOVAL_COST,
  });
  const uploaded = items.find((item) => item.status === 'uploaded' && item.url);
  const task = state.task.data;
  const output = task?.images?.[0]?.imageUrl;
  const busy =
    Boolean(activeTaskId) &&
    task?.status !== 'success' &&
    task?.status !== 'failed';

  useEffect(() => {
    if (
      new URLSearchParams(window.location.search).get('source') !==
      'last-output'
    )
      return;
    try {
      const saved = JSON.parse(
        window.sessionStorage.getItem('image-studio:last-output') || 'null'
      ) as { imageUrl?: string; createdAt?: number } | null;
      if (
        !saved?.imageUrl ||
        !/^https?:\/\//.test(saved.imageUrl) ||
        Date.now() - (saved.createdAt || 0) > 86_400_000
      )
        return;
      setItems([
        {
          id: 'last-output',
          preview: saved.imageUrl,
          url: saved.imageUrl,
          status: 'uploaded',
        },
      ]);
    } catch {
      // Ignore stale or malformed session handoff data.
    }
  }, []);

  const remove = useMutation({
    mutationFn: () =>
      apiPost<{ id: string }>('/api/media-tools/background-removal', {
        imageUrl: uploaded?.url,
      }),
    onMutate: () => setActiveTaskId(null),
    onSuccess: ({ id }) => {
      setActiveTaskId(id);
      queryClient.invalidateQueries({ queryKey: ['user-credits'] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  useEffect(() => {
    if (task?.status === 'success') {
      toast.success(copy.ready);
      queryClient.invalidateQueries({ queryKey: ['user-credits'] });
    } else if (task?.status === 'failed') {
      toast.error(task.errorMessage || copy.failed);
      queryClient.invalidateQueries({ queryKey: ['user-credits'] });
    }
  }, [copy.failed, copy.ready, queryClient, task?.errorMessage, task?.status]);

  function submit() {
    if (!state.mounted || !state.session?.user) {
      router.push(`/sign-up?callbackUrl=${encodeURIComponent(`${path}#tool`)}`);
    } else if (state.insufficient) {
      router.push('/pricing');
    } else if (uploaded?.url) {
      remove.mutate();
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[.72fr_1.28fr]">
      <div className="border-border bg-card rounded-[2rem] border p-5 sm:p-7">
        <div className="flex items-center justify-between gap-3">
          <span className="flex size-11 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600">
            <Upload className="size-5" />
          </span>
          <CreditsPill
            copy={copy}
            balance={state.credits.data?.balance}
            loading={state.credits.isFetching}
            insufficient={state.insufficient}
            onClick={() =>
              router.push(
                state.session?.user ? '/settings/credits' : '/sign-in'
              )
            }
          />
        </div>
        <h3 className="mt-6 text-xl font-semibold">{copy.uploadTitle}</h3>
        <p className="text-muted-foreground mt-2 text-sm leading-6">
          {copy.uploadHint}
        </p>
        <ImageUploader
          className="mt-6"
          allowMultiple={false}
          maxSizeMB={10}
          defaultPreviews={items
            .map((item) => item.url)
            .filter((url): url is string => Boolean(url))}
          onChange={(nextItems) => {
            setItems(nextItems);
            setActiveTaskId(null);
          }}
          emptyHint={copy.uploadHint}
        />
        <Button
          type="button"
          onClick={submit}
          disabled={!uploaded?.url || busy || remove.isPending}
          className="mt-6 h-12 w-full rounded-xl bg-emerald-600 text-white hover:bg-emerald-500"
        >
          {busy || remove.isPending ? (
            <Loader2 className="animate-spin" />
          ) : (
            <Scissors className="size-4" />
          )}
          {!state.session?.user
            ? copy.signIn
            : busy || remove.isPending
              ? getTaskProgress(copy, task)
              : copy.remove}
        </Button>
        <p className="text-muted-foreground mt-2 text-center text-xs">
          {copy.cost}
        </p>
      </div>
      <div className="border-border bg-card rounded-[2rem] border p-4 sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h3 className="font-semibold">{copy.resultTitle}</h3>
            <p className="text-muted-foreground mt-1 text-xs">
              {copy.resultHint}
            </p>
          </div>
          {output ? (
            <a
              href={`/api/images/${encodeURIComponent(activeTaskId!)}/download`}
              download
              className="border-border hover:bg-muted inline-flex h-10 items-center gap-2 rounded-full border px-3 text-xs font-semibold"
            >
              <Download className="size-3.5" />
              {copy.download}
            </a>
          ) : null}
        </div>
        {uploaded?.preview && output ? (
          <BeforeAfterReveal
            beforeUrl={uploaded.preview}
            afterUrl={output}
            beforeAlt={copy.beforeAlt}
            afterAlt={copy.afterAlt}
          />
        ) : (
          <div className="relative aspect-square overflow-hidden rounded-[1.75rem]">
            <Checkerboard />
            <div className="relative z-10 flex size-full flex-col items-center justify-center gap-3 px-8 text-center">
              {busy ? (
                <Loader2 className="size-9 animate-spin text-emerald-600" />
              ) : (
                <Scissors className="text-muted-foreground size-9" />
              )}
              <p className="text-muted-foreground max-w-sm text-sm leading-6">
                {busy ? getTaskProgress(copy, task) : copy.resultHint}
              </p>
            </div>
          </div>
        )}
      </div>
      <FirstGenerationFeedback
        taskId={activeTaskId}
        status={task?.status}
        modelId="background-removal"
      />
    </div>
  );
}
