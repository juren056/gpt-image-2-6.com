import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  ArrowRight,
  Clock3,
  Download,
  ImageIcon,
  Loader2,
  Sparkles,
  Upload,
} from 'lucide-react';
import { toast } from 'sonner';

import { useSession } from '@/core/auth/client';
import { Link } from '@/core/i18n/navigation';
import { CREATIVE_EXAMPLES } from '@/config/creative-examples';
import {
  CREATIVE_MODELS,
  type CreativeModelId,
} from '@/config/creative-studio';
import { GPT_IMAGE_RELATED } from '@/config/gpt-image-opportunities';
import { findPublicModel, PUBLIC_MODEL_PAGES } from '@/config/public-creative';
import { apiGet, apiPost } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import { ModelBrandTile } from '@/components/creative-visuals';
import { FirstGenerationFeedback } from '@/components/first-generation-feedback';
import {
  GeneratorGuideSections,
  GeneratorPageHero,
} from '@/components/generator-page-sections';
import {
  ImageUploader,
  type ImageUploaderValue,
} from '@/components/image-uploader';
import { SiteSelect } from '@/components/site-select';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

type Task = {
  id: string;
  status: string;
  images?: Array<{ imageUrl?: string }>;
  errorMessage?: string;
};

type Availability = {
  id: string;
  configured: boolean;
  enabled: boolean;
};

export function PublicModelGenerator({
  modelId,
  initialMode,
  initialPrompt = '',
}: {
  modelId: CreativeModelId;
  initialMode?: 'generate' | 'edit';
  initialPrompt?: string;
}) {
  const page = findPublicModel(modelId)!;
  const model = CREATIVE_MODELS.find((item) => item.id === modelId)!;
  const isPreview = page.availability === 'preview';
  const isUnavailable = !model.productionEnabled;
  const example = CREATIVE_EXAMPLES.find((item) => item.modelId === modelId);
  const { data: session } = useSession();
  const [mode, setMode] = useState<'generate' | 'edit'>(
    initialMode && model.operations.includes(initialMode)
      ? initialMode
      : model.operations.includes('generate')
        ? 'generate'
        : 'edit'
  );
  const [prompt, setPrompt] = useState(initialPrompt);
  const [size, setSize] = useState(model.sizes[0]);
  const [quality, setQuality] = useState(model.qualities[0] || '');
  const [references, setReferences] = useState<ImageUploaderValue[]>([]);
  const [taskId, setTaskId] = useState<string>();

  const availabilityQuery = useQuery({
    queryKey: ['creative-models'],
    queryFn: () => apiGet<Availability[]>('/api/studio/models'),
    enabled: !isUnavailable,
  });
  const taskQuery = useQuery({
    queryKey: ['public-model-task', taskId],
    queryFn: () => apiGet<Task>(`/api/images/${taskId}`),
    enabled: Boolean(taskId),
    refetchInterval: (query) =>
      ['success', 'failed'].includes(query.state.data?.status || '')
        ? false
        : 1500,
  });
  const readyUrls = useMemo(
    () =>
      references
        .filter((item) => item.status === 'uploaded' && item.url)
        .map((item) => item.url as string),
    [references]
  );
  const availability = availabilityQuery.data?.find(
    (item) => item.id === modelId
  );
  const cost = model.credits[mode];
  const resultUrl = taskQuery.data?.images?.[0]?.imageUrl;

  const runMutation = useMutation({
    mutationFn: () =>
      apiPost<{ id: string }>('/api/studio/run', {
        model: modelId,
        operation: mode,
        prompt,
        imageUrls: mode === 'edit' ? readyUrls : [],
        size,
        quality: quality || undefined,
        outputFormat: 'png',
      }),
    onSuccess: ({ id }) => setTaskId(id),
    onError: (error: Error) => toast.error(error.message),
  });
  const isWorking =
    runMutation.isPending ||
    (Boolean(taskId) &&
      !['success', 'failed'].includes(taskQuery.data?.status || ''));

  useEffect(() => {
    if (taskQuery.data?.status === 'failed') {
      toast.error(taskQuery.data.errorMessage || 'The image task failed.');
    }
  }, [taskQuery.data?.errorMessage, taskQuery.data?.status]);

  function submit() {
    if (!session?.user) {
      window.sessionStorage.setItem(
        'image-studio:public-generator-draft',
        JSON.stringify({ modelId, mode, prompt, size })
      );
      window.location.href = `/sign-up?callbackUrl=${encodeURIComponent(page.path)}`;
      return;
    }
    if (!prompt.trim() || (mode === 'edit' && !readyUrls.length)) return;
    setTaskId(undefined);
    runMutation.mutate();
  }

  return (
    <div className="border-border bg-card mt-8 grid max-w-full overflow-hidden rounded-[2rem] border shadow-[0_24px_80px_-36px_color-mix(in_oklab,var(--foreground)_24%,transparent)] lg:grid-cols-[minmax(0,25rem)_1fr]">
      <div className="min-w-0 space-y-5 p-4 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-muted-foreground text-xs font-semibold tracking-[.16em] uppercase">
              Step 01
            </p>
            <h2 className="mt-1 text-lg font-semibold">Configure the input</h2>
          </div>
          <span className="border-border bg-muted/45 rounded-full border px-3 py-1 text-xs font-medium">
            {mode === 'generate' ? 'Text to image' : 'Reference edit'}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <ModelBrandTile modelId={modelId} />
          <div>
            <p className="text-sm font-semibold">{page.name}</p>
            <p className="text-muted-foreground text-xs">
              Official provider identity
            </p>
          </div>
        </div>
        {isUnavailable ? (
          <div className="border-primary/25 bg-primary/5 rounded-2xl border p-4">
            <div className="flex items-start gap-3">
              <Clock3 className="text-primary mt-0.5 size-5 shrink-0" />
              <div>
                <p className="font-semibold">
                  {isPreview ? 'API preview' : 'API not available yet'}
                </p>
                <p className="text-muted-foreground mt-1 text-sm leading-6">
                  {isPreview
                    ? 'Try the prepared text and ordered-reference workflow locally. No file is uploaded and no generation request is sent until a hosted API contract and pricing are verified.'
                    : 'The generator and editor are prepared for launch. Endpoint, supported parameters, and credit pricing will be verified before generation is enabled.'}
                </p>
              </div>
            </div>
          </div>
        ) : null}
        {model.operations.includes('generate') &&
        model.operations.includes('edit') ? (
          <div className="bg-muted grid grid-cols-2 rounded-xl p-1">
            {(['generate', 'edit'] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setMode(value)}
                className={`min-h-11 rounded-lg text-sm font-semibold capitalize ${mode === value ? 'bg-background shadow-sm' : 'text-muted-foreground'}`}
              >
                {value}
              </button>
            ))}
          </div>
        ) : null}

        {mode === 'edit' ? (
          isUnavailable && !isPreview ? (
            <div className="border-border bg-muted/25 rounded-2xl border border-dashed p-5">
              <Upload className="text-primary size-5" />
              <p className="mt-3 text-sm font-semibold">
                Reference image upload prepared
              </p>
              <p className="text-muted-foreground mt-1 text-xs leading-5">
                Uploading remains off until the official reference-image limit
                and API contract are confirmed.
              </p>
            </div>
          ) : (
            <ImageUploader
              allowMultiple
              maxImages={model.maxReferences}
              maxSizeMB={10}
              title={`Reference images (up to ${model.maxReferences})`}
              emptyHint="Upload the image or references you want to change."
              uploadMode={isPreview ? 'local' : 'server'}
              reorderable={isPreview}
              onChange={setReferences}
            />
          )
        ) : null}

        <div>
          <label
            htmlFor={`${modelId}-prompt`}
            className="text-sm font-semibold"
          >
            {mode === 'generate'
              ? 'Describe your image'
              : 'Describe the change'}
          </label>
          <Textarea
            id={`${modelId}-prompt`}
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            maxLength={model.maxPromptLength}
            rows={5}
            placeholder={
              mode === 'generate'
                ? 'A polished product campaign on warm stone, soft studio light...'
                : 'Keep the subject and label unchanged. Replace the setting with...'
            }
            className="mt-2 min-h-28 resize-y"
          />
          <p className="text-muted-foreground mt-1 text-right text-xs">
            {prompt.length.toLocaleString()}/
            {model.maxPromptLength.toLocaleString()}
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-semibold">
            Shape
            <SiteSelect
              value={size}
              onChange={(event) => setSize(event.target.value)}
              className="border-border bg-background mt-2 min-h-11 w-full rounded-xl border px-3 text-sm"
            >
              {model.sizes.map((value) => (
                <option key={value} value={value}>
                  {value.replaceAll('_', ' ')}
                </option>
              ))}
            </SiteSelect>
          </label>
          {model.qualities.length ? (
            <label className="text-sm font-semibold">
              Quality
              <SiteSelect
                value={quality}
                onChange={(event) => setQuality(event.target.value)}
                className="border-border bg-background mt-2 min-h-11 w-full rounded-xl border px-3 text-sm"
              >
                {model.qualities.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </SiteSelect>
            </label>
          ) : null}
        </div>

        {isPreview ? (
          <details className="border-border bg-muted/25 rounded-2xl border p-4 text-sm">
            <summary className="cursor-pointer font-semibold">
              Prepared pipeline defaults
            </summary>
            <dl className="text-muted-foreground mt-3 grid grid-cols-2 gap-2 text-xs leading-5">
              <div>
                <dt className="text-foreground font-semibold">Output</dt>
                <dd>1024 px</dd>
              </div>
              <div>
                <dt className="text-foreground font-semibold">Steps</dt>
                <dd>40</dd>
              </div>
              <div>
                <dt className="text-foreground font-semibold">Guidance</dt>
                <dd>Off</dd>
              </div>
              <div>
                <dt className="text-foreground font-semibold">References</dt>
                <dd>Up to 3 in this preview</dd>
              </div>
            </dl>
            <p className="text-muted-foreground mt-3 text-xs leading-5">
              These are documented local Diffusers defaults. Hosted endpoint
              parameters and pricing remain pending verification.
            </p>
          </details>
        ) : null}

        <Button
          type="button"
          onClick={submit}
          disabled={
            isUnavailable ||
            isWorking ||
            !prompt.trim() ||
            (mode === 'edit' && Boolean(session?.user) && !readyUrls.length) ||
            availability?.enabled === false
          }
          className="min-h-12 w-full rounded-full"
        >
          {isWorking ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Sparkles className="size-4" />
          )}
          {isUnavailable
            ? isPreview
              ? 'The hosted API is being connected'
              : 'Generation opens when the API is verified'
            : session?.user
              ? `${mode === 'generate' ? 'Generate' : 'Edit'} · ${cost} credits`
              : 'Sign in to continue'}
        </Button>
        <p className="text-muted-foreground text-xs leading-5">
          {isUnavailable
            ? `${page.name} cannot upload files, create tasks, or charge credits while its production switch is off.`
            : `This page always submits to ${page.name}. It never substitutes another model. Availability and billing are verified by the server before a task starts.`}
        </p>
      </div>

      <div className="bg-muted/35 border-border min-h-80 min-w-0 border-t p-4 sm:p-7 lg:min-h-[36rem] lg:border-t-0 lg:border-l">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <p className="text-muted-foreground text-xs font-semibold tracking-[.16em] uppercase">
              Step 02
            </p>
            <h2 className="mt-1 text-lg font-semibold">Review the result</h2>
          </div>
          <span className="border-border bg-background rounded-full border px-3 py-1 text-xs font-medium">
            {resultUrl ? 'Ready to download' : 'Preview'}
          </span>
        </div>
        <div className="flex min-h-[calc(100%-4.5rem)] items-center justify-center">
          {resultUrl ? (
            <div className="w-full space-y-4 text-center">
              <img
                src={resultUrl}
                alt={`${page.name} result`}
                className="mx-auto max-h-[32rem] max-w-full rounded-2xl object-contain"
              />
              <a
                href={resultUrl}
                download
                className="border-border bg-background inline-flex min-h-11 items-center gap-2 rounded-full border px-5 text-sm font-semibold"
              >
                <Download className="size-4" /> Download result
              </a>
            </div>
          ) : (
            <div className="mx-auto max-w-2xl">
              <p className="text-muted-foreground mb-3 text-center text-xs font-semibold tracking-[.16em] uppercase">
                {isUnavailable
                  ? 'Workspace preview · not a model output'
                  : 'Example · site-owned workflow illustration'}
              </p>
              <img
                src={page.image}
                alt={`${page.useCase} example`}
                width={1024}
                height={640}
                className="max-h-[27rem] w-full rounded-2xl object-cover"
              />
              <div className="mt-4 flex items-start gap-3">
                {mode === 'edit' ? (
                  <Upload className="text-primary mt-0.5 size-5 shrink-0" />
                ) : (
                  <ImageIcon className="text-primary mt-0.5 size-5 shrink-0" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-muted-foreground text-sm leading-6">
                    {page.useCase}. This illustration is not presented as a live
                    output from this model.
                  </p>
                  {example ? (
                    <>
                      <p className="mt-3 text-sm leading-6">
                        <span className="font-semibold">Recipe:</span>{' '}
                        {example.promptOrRecipe}
                      </p>
                      <p className="text-muted-foreground mt-1 text-xs">
                        {Object.entries(example.parameters)
                          .map(([key, value]) => `${key}: ${value}`)
                          .join(' · ')}
                      </p>
                      <button
                        type="button"
                        onClick={() => setPrompt(example.promptOrRecipe)}
                        className="text-primary mt-3 min-h-10 text-sm font-semibold"
                      >
                        Use this example
                      </button>
                    </>
                  ) : null}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <FirstGenerationFeedback
        taskId={taskId}
        status={taskQuery.data?.status}
        modelId={modelId}
      />
    </div>
  );
}

export function PublicModelPage({ modelId }: { modelId: CreativeModelId }) {
  const page = findPublicModel(modelId)!;
  const model = CREATIVE_MODELS.find((item) => item.id === modelId)!;
  const isPreview = page.availability === 'preview';
  const isComingSoon = page.availability === 'coming-soon';
  const isUnavailable = Boolean(page.availability);
  const relatedModels = PUBLIC_MODEL_PAGES.filter(
    (candidate) => candidate.id !== modelId
  ).slice(0, 3);
  const gptImageTaskPages = modelId.startsWith('gpt-image-2.5')
    ? GPT_IMAGE_RELATED.slice(0, 3)
    : [];
  const operationLabel = model.operations
    .map((operation) => operation.replaceAll('-', ' '))
    .join(' + ');
  return (
    <main className="flex-1">
      <GeneratorPageHero
        breadcrumbs={[
          { href: '/', label: 'Home' },
          { href: '/models', label: 'Image models' },
          { label: page.name },
        ]}
        eyebrow={
          isPreview
            ? 'API preview'
            : isComingSoon
              ? 'Coming soon'
              : 'Dedicated model workspace'
        }
        title={`${page.name} Image Generator${model.operations.includes('edit') ? ' & Editor' : ''}`}
        description={page.summary}
        image={page.image}
        imageAlt={`${page.name} workflow example for ${page.useCase.toLowerCase()}`}
        icon={
          <ModelBrandTile
            modelId={modelId}
            className="size-10"
            markClassName="size-5"
          />
        }
        primaryLabel={
          isUnavailable ? 'Inspect prepared workflow' : 'Open generator'
        }
        note={
          isUnavailable
            ? 'No request is sent while the hosted API, commercial terms, and price remain unverified.'
            : 'The model identity and credit quote stay visible before submission.'
        }
        badges={[
          operationLabel || 'Image generation',
          `${model.sizes.length} output shape${model.sizes.length === 1 ? '' : 's'}`,
          model.maxReferences
            ? `Up to ${model.maxReferences} references`
            : 'Prompt-led workflow',
        ]}
        exampleLabel="Model workflow example"
      />

      <section id="generator" className="scroll-mt-24 px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-5 lg:grid-cols-[.72fr_1.28fr] lg:items-end">
            <div>
              <p className="text-primary text-xs font-semibold tracking-[.18em] uppercase">
                Model controls
              </p>
              <h2 className="mt-4 font-serif text-3xl tracking-tight sm:text-5xl">
                Build a deliberate request
              </h2>
            </div>
            <p className="text-muted-foreground max-w-3xl text-lg leading-8">
              Choose the supported operation, add only the references the task
              needs, and review the exact model settings before running.
            </p>
          </div>
          <PublicModelGenerator modelId={modelId} />
        </div>
      </section>

      <GeneratorGuideSections
        title={`Use ${page.name} for ${page.useCase.toLowerCase()}`}
        description={
          isUnavailable
            ? 'This page documents the intended workflow without pretending an unverified endpoint is live.'
            : 'The visible controls reflect the same model registry used by the server, so the page does not silently replace your model choice.'
        }
        outcomes={[
          {
            title: 'A model-specific brief',
            description: `Write for ${page.useCase.toLowerCase()} and keep required text, identity, product, and composition constraints explicit.`,
          },
          {
            title: 'Controlled references',
            description: model.maxReferences
              ? `Upload and order only the references that have a clear job. This configuration supports up to ${model.maxReferences}.`
              : 'This model is configured as a prompt-led workflow without reference uploads.',
          },
          {
            title: 'A traceable result',
            description: isUnavailable
              ? 'Use the prepared controls to understand the workflow; generation remains disabled until the production contract is verified.'
              : 'The submitted task keeps its model identity, status, and output together for review and download.',
          },
        ]}
        steps={[
          {
            title: 'Choose Generate or Edit',
            description: `Available operations: ${operationLabel || 'generation'}.`,
          },
          {
            title: 'Write the visual brief',
            description:
              'Lead with the subject and purpose, then add composition, light, style, and preservation requirements.',
          },
          {
            title: 'Set output and references',
            description: `Choose from ${model.sizes.join(', ')}${model.maxReferences ? ` and add no more than ${model.maxReferences} references` : ''}.`,
          },
          {
            title: isUnavailable
              ? 'Wait for verified execution'
              : 'Review and submit',
            description: isUnavailable
              ? 'Generation opens only after endpoint, parameters, commercial use, and pricing are contract-tested.'
              : 'Confirm the model and credit quote, run the task, then inspect the result at full size.',
          },
        ]}
        tips={[
          'Give each reference one purpose: subject, style, composition, or material.',
          'Put exact text in quotation marks and keep it short enough to inspect.',
          'Describe what must remain unchanged during an edit.',
          'Compare important faces, labels, product geometry, and fine edges against the source.',
        ]}
        limitation={
          isUnavailable
            ? 'The interface is a transparent preview, not a working claim. No public generation is enabled until the provider contract and commercial terms are verified.'
            : 'Generated output can contain visual errors or unintended changes. Review identity, typography, claims, logos, and product details before commercial use.'
        }
        faqs={[
          {
            question: `What is ${page.name} best suited to?`,
            answer: page.useCase,
          },
          {
            question: 'Can I use reference images?',
            answer: model.maxReferences
              ? `Yes. The configured workflow accepts up to ${model.maxReferences} reference images, subject to the active provider contract.`
              : 'This configured workflow does not accept reference images.',
          },
          {
            question: 'Will the site switch to another model?',
            answer:
              'No. Availability is checked for this model, and an unavailable model is shown as unavailable rather than silently replaced.',
          },
          {
            question: 'What should I verify in the output?',
            answer:
              'Check small text, hands, faces, logos, product geometry, material color, and any detail that must match a source image.',
          },
        ]}
        related={[
          ...gptImageTaskPages,
          ...relatedModels.map((item) => ({
            href: item.path,
            title: item.name,
            description: item.useCase,
            image: item.image,
          })),
        ].slice(0, 3)}
      />
    </main>
  );
}

export function ModelsDirectory() {
  return (
    <main className="flex-1 px-4 py-12 sm:py-20">
      <div className="mx-auto max-w-7xl">
        <p className="text-primary text-xs font-semibold tracking-[.18em] uppercase">
          Image models
        </p>
        <h1 className="mt-4 font-serif text-4xl tracking-tight sm:text-6xl">
          Choose a model for the job
        </h1>
        <p className="text-muted-foreground mt-5 max-w-3xl text-lg leading-8">
          Each model has its own public generator, verified capabilities, input
          limits, and server-side billing. Your choice is never silently
          replaced.
        </p>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {PUBLIC_MODEL_PAGES.map((item) => (
            <article
              key={item.id}
              className="border-border bg-card overflow-hidden rounded-3xl border"
            >
              <Link href={item.path} className="relative block">
                <img
                  src={item.image}
                  alt={`${item.useCase} illustration`}
                  width={640}
                  height={400}
                  className="aspect-[16/10] w-full object-cover"
                />
                {item.availability ? (
                  <span className="absolute top-3 left-3 rounded-full bg-amber-100 px-3 py-1 text-[10px] font-semibold text-amber-900">
                    {item.availability === 'preview'
                      ? 'API preview'
                      : 'Coming soon'}
                  </span>
                ) : null}
                <ModelBrandTile
                  modelId={item.id}
                  className="absolute right-3 bottom-3 shadow-sm"
                />
              </Link>
              <div className="p-5">
                <h2 className="text-lg font-semibold">{item.name}</h2>
                <p className="text-muted-foreground mt-2 text-sm leading-6">
                  {item.summary}
                </p>
                <Link
                  href={item.path}
                  className="text-primary mt-4 inline-flex min-h-10 items-center font-semibold"
                >
                  {item.availability
                    ? `Preview ${item.name}`
                    : `Try ${item.name}`}
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
