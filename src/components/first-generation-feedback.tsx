import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Gift, MessageCircleHeart } from 'lucide-react';
import { toast } from 'sonner';

import { useSession } from '@/core/auth/client';
import { apiGet, apiPost } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import { getLocale } from '@/paraglide/runtime.js';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

type Props = {
  taskId?: string | null;
  status?: string | null;
  modelId?: string | null;
};

type Eligibility = {
  eligible: boolean;
  rewardCredits: number;
  delayMs: number;
};

type Impression = { show: boolean; reason?: string };
type SubmitResult = {
  rewardCredits: number;
  balanceAfter?: number;
  alreadyRewarded: boolean;
};

const OPTIONS = [
  'great',
  'usable_with_edits',
  'prompt_mismatch',
  'detail_error',
  'too_slow',
  'credits_too_high',
  'moderation_issue',
  'other',
] as const;

const SCENES = [
  'product_photo',
  'poster',
  'teaching_material',
  'social_media',
  'personal_creative',
  'other',
] as const;

const copy = {
  en: {
    title: 'How did this generation feel?',
    description:
      'Your honest feedback helps us improve result quality and the generation experience.',
    scene: 'What are you creating?',
    feedback: 'How was this result?',
    comment: 'Anything else we should know? (optional)',
    placeholder: 'Tell us what worked or what could be better…',
    later: 'Maybe later',
    submitting: 'Submitting…',
    submit: (credits: number) => `Submit feedback · Get ${credits} credits`,
    success: (credits: number) =>
      `Thank you — ${credits} credits have been added to your account.`,
    scenes: {
      product_photo: 'Product photo',
      poster: 'Poster / design',
      teaching_material: 'Teaching material',
      social_media: 'Social media',
      personal_creative: 'Personal creative',
      other: 'Other',
    },
    options: {
      great: 'Great — ready to use',
      usable_with_edits: 'Useful with small edits',
      prompt_mismatch: 'Did not match my prompt',
      detail_error: 'Visual or text details were wrong',
      too_slow: 'Generation felt too slow',
      credits_too_high: 'Credits felt too expensive',
      moderation_issue: 'Safety check was inaccurate',
      other: 'Other',
    },
  },
  zh: {
    title: '这次生成体验怎么样？',
    description: '你的真实反馈会帮助我们改进图片质量和生成体验。',
    scene: '你主要在制作什么？',
    feedback: '这次结果如何？',
    comment: '还有什么想告诉我们？（选填）',
    placeholder: '告诉我们哪些地方做得好，或哪里需要改进…',
    later: '稍后再说',
    submitting: '正在提交…',
    submit: (credits: number) => `提交反馈 · 获得 ${credits} 积分`,
    success: (credits: number) => `感谢反馈，${credits} 积分已发放到你的账户。`,
    scenes: {
      product_photo: '商品图片',
      poster: '海报 / 设计',
      teaching_material: '教学素材',
      social_media: '社交媒体',
      personal_creative: '个人创作',
      other: '其他',
    },
    options: {
      great: '很好，可以直接使用',
      usable_with_edits: '稍作修改即可使用',
      prompt_mismatch: '与提示词不一致',
      detail_error: '画面或文字细节有误',
      too_slow: '生成速度太慢',
      credits_too_high: '积分消耗偏高',
      moderation_issue: '安全审核判断不准确',
      other: '其他',
    },
  },
};

export function FirstGenerationFeedback({ taskId, status, modelId }: Props) {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [scene, setScene] = useState<(typeof SCENES)[number] | ''>('');
  const [option, setOption] = useState<(typeof OPTIONS)[number] | ''>('');
  const [customText, setCustomText] = useState('');
  const attemptedTaskRef = useRef<string | null>(null);
  const submittedRef = useRef(false);
  const locale = getLocale();
  const c = locale === 'zh' ? copy.zh : copy.en;

  const eligibility = useQuery({
    queryKey: ['generation-feedback-eligibility', taskId],
    queryFn: () =>
      apiGet<Eligibility>(
        `/api/generation-feedback?taskId=${encodeURIComponent(taskId || '')}`
      ),
    enabled:
      Boolean(session?.user && taskId) &&
      status === 'success' &&
      attemptedTaskRef.current !== taskId,
    retry: false,
    staleTime: Infinity,
  });

  const claim = useMutation({
    mutationFn: () =>
      apiPost<Impression>('/api/generation-feedback', {
        action: 'impression',
        taskId,
        modelId,
        pagePath: window.location.pathname,
        locale,
      }),
    onSuccess: (result) => {
      if (result.show) setOpen(true);
    },
  });

  const dismiss = useMutation({
    mutationFn: () =>
      apiPost('/api/generation-feedback', { action: 'dismiss', taskId }),
  });

  const submit = useMutation({
    mutationFn: () =>
      apiPost<SubmitResult>('/api/generation-feedback', {
        action: 'submit',
        taskId,
        usageScene: scene,
        feedbackOption: option,
        customText,
      }),
    onSuccess: (result) => {
      submittedRef.current = true;
      setOpen(false);
      toast.success(c.success(result.rewardCredits));
      queryClient.invalidateQueries({ queryKey: ['user-credits'] });
      queryClient.invalidateQueries({ queryKey: ['credits'] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  useEffect(() => {
    if (!taskId || !eligibility.data?.eligible) return;
    if (attemptedTaskRef.current === taskId) return;
    let remaining = eligibility.data.delayMs;
    let startedAt = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const stop = () => {
      if (!timer) return;
      clearTimeout(timer);
      timer = undefined;
      remaining = Math.max(0, remaining - (Date.now() - startedAt));
    };
    const start = () => {
      if (document.visibilityState !== 'visible' || timer) return;
      startedAt = Date.now();
      timer = setTimeout(() => {
        timer = undefined;
        attemptedTaskRef.current = taskId;
        claim.mutate();
      }, remaining);
    };
    const onVisibility = () => {
      if (document.visibilityState === 'visible') start();
      else stop();
    };

    document.addEventListener('visibilitychange', onVisibility);
    start();
    return () => {
      stop();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [eligibility.data?.delayMs, eligibility.data?.eligible, taskId]);

  useEffect(() => {
    submittedRef.current = false;
    setOpen(false);
    setScene('');
    setOption('');
    setCustomText('');
  }, [taskId]);

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen && !submittedRef.current && taskId && open) dismiss.mutate();
  };

  const rewardCredits = eligibility.data?.rewardCredits ?? 10;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <div className="mb-1 flex items-center gap-3">
            <span className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-2xl">
              <MessageCircleHeart className="size-5" />
            </span>
            <div className="flex-1">
              <DialogTitle className="text-lg">{c.title}</DialogTitle>
              <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-1 text-xs font-medium text-amber-700 dark:text-amber-300">
                <Gift className="size-3.5" />+{rewardCredits} credits
              </div>
            </div>
          </div>
          <DialogDescription>{c.description}</DialogDescription>
        </DialogHeader>

        <fieldset className="space-y-2">
          <legend className="mb-2 text-sm font-semibold">{c.scene}</legend>
          <div className="flex flex-wrap gap-2">
            {SCENES.map((value) => (
              <button
                key={value}
                type="button"
                aria-pressed={scene === value}
                onClick={() => setScene(value)}
                className={cn(
                  'rounded-full border px-3 py-2 text-sm transition-colors',
                  scene === value
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'bg-background hover:bg-muted'
                )}
              >
                {c.scenes[value]}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="space-y-2">
          <legend className="mb-2 text-sm font-semibold">{c.feedback}</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {OPTIONS.map((value) => (
              <button
                key={value}
                type="button"
                aria-pressed={option === value}
                onClick={() => setOption(value)}
                className={cn(
                  'rounded-xl border px-3 py-2.5 text-left text-sm transition-colors',
                  option === value
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'bg-background hover:bg-muted'
                )}
              >
                {c.options[value]}
              </button>
            ))}
          </div>
        </fieldset>

        <label className="space-y-2">
          <span className="text-sm font-semibold">{c.comment}</span>
          <Textarea
            value={customText}
            onChange={(event) => setCustomText(event.target.value)}
            placeholder={c.placeholder}
            maxLength={2000}
            rows={3}
          />
        </label>

        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={() => handleOpenChange(false)}
            disabled={submit.isPending}
          >
            {c.later}
          </Button>
          <Button
            type="button"
            disabled={!scene || !option || submit.isPending}
            onClick={() => submit.mutate()}
          >
            {submit.isPending ? c.submitting : c.submit(rewardCredits)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
