import { useEffect, useId, useRef, useState } from 'react';
import { useForm } from '@tanstack/react-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  AccountCreditBalance,
  AccountImageTask,
} from '@/types/banana-account';
import { Combobox } from '@base-ui/react/combobox';
import {
  Check,
  ChevronDown,
  Copy,
  Download,
  Images,
  Loader2,
  Search,
  Sparkles,
  Type,
} from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';

import { useSession } from '@/core/auth/client';
import { Link } from '@/core/i18n/navigation';
import {
  CREATIVE_MODELS,
  type CreativeModelId,
} from '@/config/creative-studio';
import { trackFunnelEvent } from '@/lib/analytics-events';
import { apiGet, apiPost } from '@/lib/api-client';
import type { BananaGeneratorSelection } from '@/lib/banana-generator-navigation';
import {
  normalizeCreativeScene,
  parseActiveCreativeTask,
} from '@/lib/banana-task-resume';
import { FirstGenerationFeedback } from '@/components/first-generation-feedback';
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
};
export type NanoRecipe = { id: string; title: string; prompt: string };
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
}: {
  copy: Record<string, string>;
  recipes: NanoRecipe[];
  initialModel?: CreativeModelId;
  initialMode?: 'generate' | 'edit';
  returnPath?: string;
  allModels?: boolean;
}) {
  const { data: session } = useSession();
  const fieldId = useId();
  const [modelId, setModelId] = useState<CreativeModelId>(initialModel);
  const [mode, setMode] = useState(initialMode);
  const [ratio, setRatio] = useState('1:1');
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
  const restoringTask = useRef(false);
  const refreshedTask = useRef<string | undefined>(undefined);
  const previousUser = useRef(session?.user?.id);
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
  const cost = model.credits[mode];
  const balance = useQuery({
    queryKey: ['account-balance', session?.user?.id],
    queryFn: () => apiGet<AccountCreditBalance>('/api/credits'),
    enabled: Boolean(session?.user),
    staleTime: 15000,
  });
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
    mutationFn: (prompt: string) =>
      apiPost<{ id: string }>('/api/studio/run', {
        model: modelId,
        operation: mode,
        prompt,
        size: ratio,
        outputFormat: 'png',
        imageUrls:
          mode === 'edit'
            ? references
                .filter((item) => item.status === 'uploaded' && item.url)
                .map((item) => item.url)
            : [],
      }),
    onSuccess: (data) => {
      setSelectedHistory(undefined);
      setTaskId(data.id);
      setRequestContext({ model: modelId, mode, scene });
      trackFunnelEvent('generate_started', { model: modelId, mode, scene });
      try {
        sessionStorage.setItem(
          `banana:active-task:${session?.user?.id}`,
          JSON.stringify({ id: data.id, model: modelId, mode, scene, ratio })
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
      if (!ready || !session?.user || working || insufficient) return;
      if (
        mode === 'edit' &&
        !references.some((item) => item.status === 'uploaded' && item.url)
      )
        return;
      setTaskId(undefined);
      trackFunnelEvent('generate_clicked', { model: modelId, mode, scene });
      await run.mutateAsync(value.prompt.trim()).catch(() => undefined);
    },
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const query = params.get('prompt');
    setScene(normalizeCreativeScene(params.get('scene')));
    let saved = '';
    try {
      saved = window.sessionStorage.getItem('nano-site:prompt') || '';
      const serialized = window.sessionStorage.getItem('nano-site:draft:v2');
      if (serialized) {
        const draft: unknown = JSON.parse(serialized);
        if (
          draft &&
          typeof draft === 'object' &&
          'prompt' in draft &&
          typeof draft.prompt === 'string'
        ) {
          saved = draft.prompt;
          if ('imageUrls' in draft && Array.isArray(draft.imageUrls))
            setInitialReferenceUrls(
              draft.imageUrls
                .filter(
                  (url): url is string =>
                    typeof url === 'string' && url.startsWith('https://')
                )
                .slice(0, 14)
            );
          setDraftRestored(!query && Boolean(saved));
          if (
            !query &&
            returnPath !== '/editor' &&
            returnPath !== '/nano-banana-pro'
          ) {
            if (
              'model' in draft &&
              WORKBENCH_MODELS.some((id) => id === draft.model)
            ) {
              setModelId(draft.model as CreativeModelId);
            }
            if (
              'operation' in draft &&
              (draft.operation === 'generate' || draft.operation === 'edit')
            )
              setMode(draft.operation);
          }
          const restoredModel =
            'model' in draft &&
            typeof draft.model === 'string' &&
            returnPath !== '/nano-banana-pro'
              ? CREATIVE_MODELS.find(
                  (item) =>
                    item.id === draft.model &&
                    WORKBENCH_MODELS.some((id) => id === item.id)
                )
              : CREATIVE_MODELS.find((item) => item.id === initialModel);
          if (
            'aspectRatio' in draft &&
            typeof draft.aspectRatio === 'string' &&
            restoredModel?.sizes.includes(draft.aspectRatio)
          )
            setRatio(draft.aspectRatio);
        }
      }
    } catch {
      /* private browsing storage may be unavailable */
    }
    if (query || saved)
      form.setFieldValue('prompt', (query || saved).slice(0, 32000));
    const queryModel = CREATIVE_MODELS.find(
      (item) => item.id === params.get('model')
    );
    if (
      queryModel &&
      (allModels || WORKBENCH_MODELS.some((id) => id === queryModel.id))
    )
      setModelId(queryModel.id);
    if (params.get('mode') === 'edit') setMode('edit');
    const queryRatio = params.get('ratio');
    if (queryRatio && (queryModel || model).sizes.includes(queryRatio))
      setRatio(queryRatio);
    try {
      const serialized = window.sessionStorage.getItem(
        'banana-account:handoff:v1'
      );
      if (
        ['asset', 'recipe'].includes(params.get('resume') || '') &&
        serialized
      ) {
        const handoff = JSON.parse(serialized) as Record<string, unknown>;
        if (typeof handoff.prompt === 'string')
          form.setFieldValue('prompt', handoff.prompt.slice(0, 32000));
        const chosen = CREATIVE_MODELS.find(
          (item) => item.id === handoff.model
        );
        if (
          chosen &&
          (allModels || WORKBENCH_MODELS.some((id) => id === chosen.id))
        )
          setModelId(chosen.id);
        if (handoff.operation === 'edit' || handoff.operation === 'generate')
          setMode(handoff.operation);
        if (Array.isArray(handoff.imageUrls))
          setInitialReferenceUrls(
            handoff.imageUrls
              .filter(
                (url): url is string =>
                  typeof url === 'string' && url.startsWith('https://')
              )
              .slice(0, 14)
          );
        setDraftRestored(true);
        window.sessionStorage.removeItem('banana-account:handoff:v1');
      }
    } catch {
      /* A malformed continuation cannot prevent a fresh creation. */
    }
    setDraftLoaded(true);
  }, [form, initialModel, returnPath, allModels]);
  useEffect(() => {
    if (!draftLoaded) return;
    const save = () => {
      try {
        window.sessionStorage.setItem(
          'nano-site:draft:v2',
          JSON.stringify({
            prompt: form.state.values.prompt,
            model: modelId,
            operation: mode,
            aspectRatio: ratio,
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
  }, [draftLoaded, form, modelId, mode, ratio, references]);
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
  }, [modelId, mode, ratio]);
  useEffect(() => {
    if (previousUser.current === session?.user?.id) return;
    previousUser.current = session?.user?.id;
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
      const saved = parseActiveCreativeTask(raw);
      if (!saved) return;
      const selected = saved.model;
      if (!allModels && !WORKBENCH_MODELS.some((id) => id === selected.id))
        return;
      restoringTask.current =
        selected.id !== modelId || saved.mode !== mode || saved.ratio !== ratio;
      setModelId(selected.id);
      setMode(saved.mode);
      if (selected.sizes.includes(saved.ratio)) setRatio(saved.ratio);
      setTaskId(saved.id);
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
          prompt: form.state.values.prompt,
          model: modelId,
          operation: mode,
          aspectRatio: ratio,
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
  const rawResult =
    task.data?.status === 'success'
      ? task.data.images?.[0]?.imageUrl
      : !taskId && selectedHistory?.status === 'success'
        ? selectedHistory.images[0]?.imageUrl
        : undefined;
  const result = rawResult?.startsWith('https://') ? rawResult : undefined;
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
  useEffect(() => {
    const prepare = (event: Event) => {
      if (working) return;
      const detail = (event as CustomEvent<BananaGeneratorSelection>).detail;
      const selected = CREATIVE_MODELS.find((item) => item.id === detail.model);
      if (
        selected &&
        (allModels || WORKBENCH_MODELS.some((id) => id === selected.id))
      )
        setModelId(selected.id);
      if (detail.mode) setMode(detail.mode);
      if (
        detail.aspectRatio &&
        (selected || model).sizes.includes(detail.aspectRatio)
      )
        setRatio(detail.aspectRatio);
      if (detail.scene) setScene(normalizeCreativeScene(detail.scene));
      if (typeof detail.prompt === 'string')
        form.setFieldValue('prompt', detail.prompt.slice(0, 32000));
      setTaskId(undefined);
      const field = document.getElementById(
        detail.focus === 'shape' ? `${fieldId}-shape` : `${fieldId}-prompt`
      );
      field?.focus({ preventScroll: true });
    };
    window.addEventListener('banana:prepare-generator', prepare);
    return () =>
      window.removeEventListener('banana:prepare-generator', prepare);
  }, [allModels, working, form, fieldId, model]);
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
          <div className="banana-generator__studio" hidden>
            <h3>
              <Sparkles size={14} aria-hidden /> {copy.studio_title}
            </h3>
            <p>{copy.studio_description}</p>
            <Link href="/settings">
              {copy.studio_link} <span aria-hidden>↗</span>
            </Link>
          </div>
          <div className="banana-generator__field">
            <Combobox.Root
              items={modelOptions}
              value={model}
              onValueChange={(value) => {
                if (value) {
                  setModelId(value.id);
                  setInitialReferenceUrls([]);
                }
              }}
              itemToStringLabel={(item) => item.label}
              isItemEqualToValue={(item, selected) => item.id === selected.id}
              disabled={working}
              autoHighlight
            >
              <Combobox.Label>{copy.model}</Combobox.Label>
              <Combobox.Trigger className="banana-generator__model">
                <span className="banana-generator__brand" aria-hidden>
                  {model.id.startsWith('nano-banana') ? (
                    'G'
                  ) : (
                    <Sparkles size={20} />
                  )}
                </span>
                <span className="banana-generator__model-copy">
                  <strong>{model.label}</strong>
                  <small>{modelSummary(modelId)}</small>
                </span>
                <ChevronDown size={16} aria-hidden />
              </Combobox.Trigger>
              <Combobox.Portal>
                <Combobox.Positioner
                  sideOffset={6}
                  className="banana-generator__positioner"
                >
                  <Combobox.Popup className="banana-generator__model-menu">
                    <div className="banana-generator__search">
                      <Search size={16} aria-hidden />
                      <Combobox.Input
                        aria-label={copy.search_models}
                        placeholder={copy.search_models}
                      />
                    </div>
                    <Combobox.Empty className="banana-generator__no-models">
                      {copy.no_models}
                    </Combobox.Empty>
                    <Combobox.List>
                      {(option: (typeof modelOptions)[number]) => (
                        <Combobox.Item
                          key={option.id}
                          value={option}
                          className="banana-generator__model-option"
                        >
                          <span className="banana-generator__brand" aria-hidden>
                            {option.id.startsWith('nano-banana') ? (
                              'G'
                            ) : (
                              <Sparkles size={20} />
                            )}
                          </span>
                          <span className="banana-generator__model-copy">
                            <strong>{option.label}</strong>
                            <small>{modelSummary(option.id)}</small>
                          </span>
                          <Combobox.ItemIndicator>
                            <Check size={16} aria-hidden />
                          </Combobox.ItemIndicator>
                        </Combobox.Item>
                      )}
                    </Combobox.List>
                  </Combobox.Popup>
                </Combobox.Positioner>
              </Combobox.Portal>
            </Combobox.Root>
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
                <span className="banana-generator__character-count">
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
          <details className="banana-generator__advanced">
            <summary>{copy.flow_advanced}</summary>
            <div className="banana-generator__settings">
              <label className="banana-generator__field">
                <span>{copy.shape}</span>
                <select
                  id={`${fieldId}-shape`}
                  aria-label={copy.shape}
                  disabled={working}
                  value={ratio}
                  onChange={(e) => setRatio(e.target.value)}
                >
                  {model.sizes.map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </label>
              <label className="banana-generator__field">
                <span>{copy.resolution}</span>
                <select aria-label={copy.resolution} disabled value="default">
                  <option value="default">{copy.provider_default}</option>
                </select>
              </label>
            </div>
          </details>
          <div className="banana-generator__field">
            <span id={`${fieldId}-outputs`}>{copy.output_count}</span>
            <div
              className="banana-generator__outputs"
              role="group"
              aria-labelledby={`${fieldId}-outputs`}
            >
              {[1].map((count) => (
                <button
                  key={count}
                  type="button"
                  disabled={count !== 1 || working}
                  aria-pressed={count === 1}
                >
                  {count}
                </button>
              ))}
            </div>
            <small>{copy.outputs_hint}</small>
          </div>
          <section
            className="banana-generator__quote"
            aria-label={copy.flow_quote}
          >
            <dl>
              <div>
                <dt>{copy.flow_cost}</dt>
                <dd>
                  {ready && typeof cost === 'number'
                    ? `${cost} ${copy.credits}`
                    : copy.flow_unknown}
                </dd>
              </div>
              {session?.user && (
                <>
                  <div>
                    <dt>{copy.flow_balance}</dt>
                    <dd>{balance.data?.balance ?? '—'}</dd>
                  </div>
                  <div>
                    <dt>{copy.flow_after}</dt>
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
              <Link
                href={`/pricing?redirect=${encodeURIComponent(returnPath + '#generator')}`}
                onClick={() => {
                  remember();
                  trackFunnelEvent('credit_balance_low', {
                    model: modelId,
                    scene,
                  });
                }}
              >
                {copy.flow_credits_link}
              </Link>
            )}
          </section>
          <form.Subscribe selector={(s) => s.values.prompt}>
            {(prompt) => (
              <>
                {!session?.user ? (
                  <Link
                    href={`/sign-in?callbackUrl=${encodeURIComponent(returnPath + '#generator')}`}
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
                      insufficient ||
                      !prompt.trim() ||
                      working ||
                      (mode === 'edit' &&
                        !references.some(
                          (item) => item.status === 'uploaded' && item.url
                        ))
                    }
                  >
                    {working ? (
                      <Loader2 size={16} className="animate-spin" aria-hidden />
                    ) : (
                      <Sparkles size={16} aria-hidden />
                    )}
                    {working ? copy.working : copy.run}
                  </button>
                )}
                <p className="banana-generator__status" role="status">
                  {pendingCopy}
                  {ready && cost ? ` ${cost} ${copy.credits}.` : ''}
                </p>
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
          className="banana-generator__preview"
          aria-live="polite"
          aria-busy={working}
        >
          <h3>{copy.preview_heading}</h3>
          {result ? (
            <>
              <button
                type="button"
                onClick={() => setPreviewOpen(true)}
                aria-label={copy.preview}
                className="w-full"
              >
                <img
                  src={result}
                  alt={copy.result}
                  className="banana-generator__result-image"
                />
              </button>
              <a
                href={`/api/images/${encodeURIComponent(taskId || selectedHistory?.id || '')}/download`}
                className="banana-generator__download"
                onClick={() =>
                  trackFunnelEvent('image_download', { model: modelId, scene })
                }
              >
                {copy.download} <Download size={14} aria-hidden />
              </a>
              <div className="banana-result-actions">
                <button
                  type="button"
                  disabled={working || !model.operations.includes('edit')}
                  onClick={() => {
                    setMode('edit');
                    setInitialReferenceUrls([result]);
                    setTaskId(undefined);
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
              <p>{copy.flow_prompt_warning}</p>
            </>
          ) : (
            <div className="banana-generator__empty">
              {working && (
                <Loader2 size={16} className="animate-spin" aria-hidden />
              )}
              {working ? copy.working : copy.empty}
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
                            : copy.failed}
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
        title={copy.preview}
      />
      <FirstGenerationFeedback
        taskId={taskId}
        status={task.data?.status}
        modelId={modelId}
      />
    </section>
  );
}
