import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowRight,
  Check,
  Clapperboard,
  Coins,
  ExternalLink,
  Loader2,
  Play,
  ShieldCheck,
  Sparkles,
  Volume2,
} from 'lucide-react';
import { toast } from 'sonner';

import { useSession } from '@/core/auth/client';
import { Link, useRouter } from '@/core/i18n/navigation';
import { MINIMAX_H3_CREDITS_PER_SECOND } from '@/config/media-tools';
import { apiGet, apiPost } from '@/lib/api-client';
import { consumeStagedVideoPrompt } from '@/lib/prompt-navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

type H3Task = {
  id: string;
  status: string;
  videos: Array<{ videoUrl?: string }>;
  errorMessage?: string;
  providerStatus?: string;
  queuePosition?: number;
};

export type MinimaxH3PageCopy = {
  breadcrumbHome: string;
  breadcrumbTools: string;
  eyebrow: string;
  title: string;
  description: string;
  officialSource: string;
  disclosure: string;
  workspaceTitle: string;
  workspaceDescription: string;
  promptLabel: string;
  promptPlaceholder: string;
  promptHint: string;
  aspectLabel: string;
  durationLabel: string;
  cost: string;
  credits: string;
  creditsLoading: string;
  buyCredits: string;
  generate: string;
  generating: string;
  signUp: string;
  resultTitle: string;
  resultEmpty: string;
  ready: string;
  failed: string;
  facts: Array<{ title: string; description: string }>;
  useCasesTitle: string;
  useCasesDescription: string;
  useCases: Array<{ title: string; description: string }>;
  howTitle: string;
  steps: Array<{ title: string; description: string }>;
  faqTitle: string;
  faqs: Array<{ question: string; answer: string }>;
  relatedTitle: string;
  relatedVideo: string;
  relatedSeedance: string;
  relatedTools: string;
};

const ASPECTS = ['21:9', '16:9', '4:3', '1:1', '3:4', '9:16'] as const;
const DURATIONS = [5, 10, 15] as const;

function H3Workspace({ copy }: { copy: MinimaxH3PageCopy }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const [mounted, setMounted] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [aspect, setAspect] = useState<(typeof ASPECTS)[number]>('16:9');
  const [duration, setDuration] = useState<(typeof DURATIONS)[number]>(5);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    const params = new URLSearchParams(window.location.search);
    const incomingPrompt =
      params.get('prompt')?.trim() || consumeStagedVideoPrompt();
    const incomingAspect = params.get('aspect');
    if (incomingPrompt) setPrompt(incomingPrompt.slice(0, 2000));
    if (
      incomingAspect &&
      ASPECTS.includes(incomingAspect as (typeof ASPECTS)[number])
    ) {
      setAspect(incomingAspect as (typeof ASPECTS)[number]);
    }
  }, []);

  const cost = duration * MINIMAX_H3_CREDITS_PER_SECOND;
  const credits = useQuery({
    queryKey: ['user-credits'],
    queryFn: () => apiGet<{ balance: number }>('/api/credits'),
    enabled: mounted && Boolean(session?.user),
    staleTime: 30_000,
  });
  const taskQuery = useQuery({
    queryKey: ['minimax-h3-task', activeTaskId],
    queryFn: () => apiGet<H3Task>(`/api/media-tools/${activeTaskId}`),
    enabled: Boolean(activeTaskId),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === 'success' || status === 'failed' ? false : 1600;
    },
    retry: 5,
    refetchIntervalInBackground: true,
  });
  const generate = useMutation({
    mutationFn: () =>
      apiPost<{ id: string }>('/api/media-tools/minimax-h3', {
        prompt: prompt.trim(),
        options: { aspect_ratio: aspect, duration },
      }),
    onSuccess: ({ id }) => {
      setActiveTaskId(id);
      queryClient.invalidateQueries({ queryKey: ['user-credits'] });
    },
    onError: (error: Error) => toast.error(error.message || copy.failed),
  });

  const task = taskQuery.data;
  const output = task?.videos?.[0]?.videoUrl;
  const busy =
    generate.isPending ||
    (Boolean(activeTaskId) &&
      task?.status !== 'success' &&
      task?.status !== 'failed');
  const insufficient =
    typeof credits.data?.balance === 'number' && credits.data.balance < cost;

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
    if (!mounted || !session?.user) {
      router.push('/sign-up?callbackUrl=%2Fminimax-h3%23generator');
    } else if (insufficient) {
      router.push('/pricing');
    } else if (prompt.trim()) {
      generate.mutate();
    }
  }

  const progress =
    task?.providerStatus === 'IN_QUEUE' && task.queuePosition
      ? `${copy.generating} · #${task.queuePosition}`
      : copy.generating;

  return (
    <div
      id="generator"
      className="text-foreground bg-background scroll-mt-24 overflow-hidden rounded-[2rem] border border-violet-300/50 shadow-2xl shadow-violet-950/10 dark:border-violet-800"
    >
      <div className="grid lg:grid-cols-[1.04fr_.96fr]">
        <div className="p-5 sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex size-11 items-center justify-center rounded-2xl bg-violet-600 text-white">
                <Sparkles className="size-5" />
              </span>
              <div>
                <h2 className="font-semibold">{copy.workspaceTitle}</h2>
                <p className="text-muted-foreground mt-1 text-xs">
                  {copy.workspaceDescription}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() =>
                router.push(
                  session?.user
                    ? insufficient
                      ? '/pricing'
                      : '/settings/credits'
                    : '/sign-in?callbackUrl=%2Fminimax-h3%23generator'
                )
              }
              className={cn(
                'border-border inline-flex min-h-10 items-center gap-2 rounded-full border px-3 text-xs font-semibold',
                insufficient && 'border-amber-400 text-amber-700'
              )}
            >
              {credits.isFetching ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Coins className="size-3.5" />
              )}
              {typeof credits.data?.balance === 'number'
                ? copy.credits.replace(
                    '{credits}',
                    credits.data.balance.toLocaleString()
                  )
                : copy.creditsLoading}
              {insufficient ? ` · ${copy.buyCredits}` : ''}
            </button>
          </div>

          <div className="mt-7">
            <Label htmlFor="h3-prompt">{copy.promptLabel}</Label>
            <Textarea
              id="h3-prompt"
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder={copy.promptPlaceholder}
              maxLength={2000}
              disabled={busy}
              className="mt-2 min-h-40 resize-none rounded-2xl"
            />
            <p className="text-muted-foreground mt-2 text-xs">
              {copy.promptHint}
            </p>
          </div>

          <fieldset className="mt-5">
            <legend className="text-sm font-medium">{copy.aspectLabel}</legend>
            <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-6">
              {ASPECTS.map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setAspect(value)}
                  disabled={busy}
                  className={cn(
                    'h-10 rounded-xl border text-xs font-semibold',
                    aspect === value
                      ? 'border-violet-500 bg-violet-500/10 text-violet-700 dark:text-violet-300'
                      : 'border-border'
                  )}
                >
                  {value}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className="mt-5">
            <legend className="text-sm font-medium">
              {copy.durationLabel}
            </legend>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {DURATIONS.map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setDuration(value)}
                  disabled={busy}
                  className={cn(
                    'h-10 rounded-xl border text-xs font-semibold',
                    duration === value
                      ? 'border-violet-500 bg-violet-500/10 text-violet-700 dark:text-violet-300'
                      : 'border-border'
                  )}
                >
                  {value}s
                </button>
              ))}
            </div>
          </fieldset>

          <Button
            type="button"
            onClick={submit}
            disabled={busy || !prompt.trim()}
            className="mt-6 h-12 w-full rounded-xl bg-violet-600 text-white hover:bg-violet-500"
          >
            {busy ? (
              <Loader2 className="animate-spin" />
            ) : (
              <Clapperboard className="size-4" />
            )}
            {!mounted || !session?.user
              ? copy.signUp
              : insufficient
                ? copy.buyCredits
                : busy
                  ? progress
                  : copy.generate}
          </Button>
          <p className="text-muted-foreground mt-2 text-center text-xs">
            {copy.cost.replace('{credits}', String(cost))}
          </p>
        </div>

        <div className="flex min-h-[500px] flex-col border-t border-violet-950/30 bg-[#09070f] p-5 text-white sm:p-7 lg:border-t-0 lg:border-l">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold">{copy.resultTitle}</p>
            <span className="flex items-center gap-1.5 text-xs text-violet-200">
              <Volume2 className="size-3.5" /> 2K · Stereo audio
            </span>
          </div>
          {output ? (
            <video
              src={output}
              controls
              playsInline
              className="my-auto max-h-[520px] w-full rounded-2xl bg-black"
            />
          ) : (
            <div className="my-auto text-center">
              <span className="mx-auto flex size-24 items-center justify-center rounded-full border border-white/10 bg-white/5">
                {busy ? (
                  <Loader2 className="size-9 animate-spin text-violet-300" />
                ) : (
                  <Play className="size-9 fill-violet-300 text-violet-300" />
                )}
              </span>
              <p className="mx-auto mt-6 max-w-sm text-sm leading-7 text-white/55">
                {busy ? progress : copy.resultEmpty}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function MinimaxH3Page({ copy }: { copy: MinimaxH3PageCopy }) {
  return (
    <main className="flex-1">
      <section className="relative isolate overflow-hidden bg-[#0b0713] px-4 py-10 text-white sm:py-16">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_15%_10%,#7c3aed55,transparent_32%),radial-gradient(circle_at_85%_80%,#2563eb33,transparent_35%)]" />
        <div className="mx-auto max-w-6xl">
          <nav className="flex flex-wrap gap-2 text-xs text-white/50">
            <Link href="/" className="hover:text-white">
              {copy.breadcrumbHome}
            </Link>
            <span>/</span>
            <Link href="/tools" className="hover:text-white">
              {copy.breadcrumbTools}
            </Link>
            <span>/</span>
            <span className="text-white">MiniMax H3</span>
          </nav>
          <div className="mt-12 grid items-center gap-10 lg:grid-cols-[.72fr_1.28fr]">
            <div>
              <p className="text-xs font-semibold tracking-[.2em] text-violet-300 uppercase">
                {copy.eyebrow}
              </p>
              <h1 className="mt-5 font-serif text-4xl leading-[1.02] tracking-tight text-balance sm:text-6xl">
                {copy.title}
              </h1>
              <p className="mt-6 text-lg leading-8 text-white/65">
                {copy.description}
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <a
                  href="#generator"
                  className="inline-flex h-11 items-center gap-2 rounded-full bg-violet-500 px-5 text-sm font-semibold hover:bg-violet-400"
                >
                  {copy.generate}
                  <ArrowRight className="size-4" />
                </a>
                <a
                  href="https://www.minimax.io/blog/minimax-h3"
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex h-11 items-center gap-2 rounded-full border border-white/15 px-5 text-sm font-semibold hover:bg-white/5"
                >
                  {copy.officialSource}
                  <ExternalLink className="size-4" />
                </a>
              </div>
              <p className="mt-5 flex gap-2 text-xs leading-5 text-white/40">
                <ShieldCheck className="mt-0.5 size-4 shrink-0" />
                {copy.disclosure}
              </p>
            </div>
            <H3Workspace copy={copy} />
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:py-24">
        <div className="mx-auto grid max-w-6xl gap-5 md:grid-cols-3">
          {copy.facts.map((fact) => (
            <article
              key={fact.title}
              className="border-border bg-card rounded-[1.75rem] border p-6"
            >
              <Check className="size-5 text-violet-600" />
              <h2 className="mt-5 text-xl font-semibold">{fact.title}</h2>
              <p className="text-muted-foreground mt-3 text-sm leading-7">
                {fact.description}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-border bg-muted/25 border-y px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-3xl">
            <h2 className="font-serif text-4xl tracking-tight sm:text-5xl">
              {copy.useCasesTitle}
            </h2>
            <p className="text-muted-foreground mt-4 text-lg leading-8">
              {copy.useCasesDescription}
            </p>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {copy.useCases.map((useCase) => (
              <article
                key={useCase.title}
                className="border-border bg-background rounded-2xl border p-5"
              >
                <h3 className="font-semibold">{useCase.title}</h3>
                <p className="text-muted-foreground mt-2 text-sm leading-6">
                  {useCase.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <h2 className="font-serif text-3xl tracking-tight sm:text-4xl">
            {copy.howTitle}
          </h2>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {copy.steps.map((step, index) => (
              <article key={step.title} className="relative pl-14">
                <span className="absolute top-0 left-0 flex size-10 items-center justify-center rounded-full bg-violet-600 text-sm font-bold text-white">
                  {index + 1}
                </span>
                <h3 className="font-semibold">{step.title}</h3>
                <p className="text-muted-foreground mt-2 text-sm leading-7">
                  {step.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-border border-t px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <h2 className="font-serif text-3xl tracking-tight sm:text-4xl">
            {copy.faqTitle}
          </h2>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {copy.faqs.map((faq) => (
              <details
                key={faq.question}
                className="border-border bg-card rounded-2xl border p-5"
              >
                <summary className="flex min-h-10 cursor-pointer list-none items-center font-semibold">
                  {faq.question}
                </summary>
                <p className="text-muted-foreground mt-3 text-sm leading-7">
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>
          <h2 className="mt-14 font-serif text-3xl tracking-tight">
            {copy.relatedTitle}
          </h2>
          <nav className="mt-5 flex flex-wrap gap-3">
            {[
              ['/ai-video-generator', copy.relatedVideo],
              ['/seedance-2-5', copy.relatedSeedance],
              ['/tools', copy.relatedTools],
            ].map(([href, label]) => (
              <Link
                key={href}
                href={href}
                className="border-border hover:border-primary/40 hover:text-primary rounded-full border px-4 py-2 text-sm font-semibold"
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </section>
    </main>
  );
}
