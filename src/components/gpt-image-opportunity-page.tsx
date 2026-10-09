import { useState } from 'react';
import {
  ArrowRight,
  Gauge,
  Images,
  ReceiptText,
  ScanSearch,
} from 'lucide-react';

import { Link } from '@/core/i18n/navigation';
import type { CreativeModelId } from '@/config/creative-studio';
import {
  GPT_IMAGE_OPPORTUNITIES,
  GPT_IMAGE_RELATED,
  type GptImageOpportunityKind,
} from '@/config/gpt-image-opportunities';
import { ModelBrandTile } from '@/components/creative-visuals';
import {
  GeneratorGuideSections,
  GeneratorPageHero,
} from '@/components/generator-page-sections';
import { PublicModelGenerator } from '@/components/public-model-generator';

function ComparisonTable() {
  const rows = [
    [
      'Official position',
      'Fastest everyday model',
      'Most capable; precise edits',
    ],
    ['Use first for', 'Concepts and variations', 'Reference-led revisions'],
    ['Quality controls', 'low to max + auto', 'low to max + auto'],
    [
      'Official token rates',
      'Same current rate card',
      'Same current rate card',
    ],
  ];
  return (
    <div className="border-border bg-card mt-8 overflow-hidden rounded-3xl border">
      <div className="grid text-sm md:grid-cols-[.8fr_1fr_1fr]">
        <div className="bg-muted/35 p-5 font-semibold">Decision</div>
        <div className="border-border p-5 font-semibold md:border-l">Flare</div>
        <div className="border-border p-5 font-semibold md:border-l">
          Sunburst
        </div>
        {rows.flatMap(([label, flare, sunburst]) => [
          <div
            key={`${label}-label`}
            className="border-border bg-muted/20 border-t p-5 font-medium"
          >
            {label}
          </div>,
          <div
            key={`${label}-flare`}
            className="border-border border-t p-5 md:border-l"
          >
            {flare}
          </div>,
          <div
            key={`${label}-sunburst`}
            className="border-border border-t p-5 md:border-l"
          >
            {sunburst}
          </div>,
        ])}
      </div>
    </div>
  );
}

function PricingSnapshot() {
  const rates = [
    ['Text input', '$5 / 1M'],
    ['Cached text', '$1.25 / 1M'],
    ['Image input', '$8 / 1M'],
    ['Cached image', '$2 / 1M'],
    ['Image output', '$30 / 1M'],
  ];
  return (
    <div className="border-border bg-card mt-8 rounded-3xl border p-6">
      <div className="flex items-center gap-3">
        <ReceiptText className="text-primary size-5" />
        <h2 className="text-xl font-semibold">
          Official rate snapshot · September 29, 2026
        </h2>
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {rates.map(([label, value]) => (
          <div
            key={label}
            className="border-border bg-muted/25 rounded-2xl border p-4"
          >
            <p className="text-muted-foreground text-xs">{label}</p>
            <p className="mt-2 font-semibold">{value}</p>
          </div>
        ))}
      </div>
      <p className="text-muted-foreground mt-5 text-sm leading-6">
        Both official model pages list these rates. They are not an exact
        per-image quote.
      </p>
    </div>
  );
}

function FourKWorkflow() {
  const steps = [
    { icon: Images, title: '1. Generate', body: 'Solve the image first.' },
    { icon: ScanSearch, title: '2. Inspect', body: 'Reject source errors.' },
    { icon: Gauge, title: '3. Upscale', body: 'Reach and verify 4K pixels.' },
  ];
  return (
    <div className="border-border bg-card mt-8 grid gap-4 rounded-3xl border p-6 md:grid-cols-3">
      {steps.map(({ icon: Icon, title, body }) => (
        <div key={title} className="border-border rounded-2xl border p-5">
          <Icon className="text-primary size-5" />
          <h3 className="mt-4 font-semibold">{title}</h3>
          <p className="text-muted-foreground mt-2 text-sm leading-6">{body}</p>
        </div>
      ))}
      <Link
        href="/ai-image-upscaler"
        className="text-primary inline-flex items-center gap-2 text-sm font-semibold md:col-span-3"
      >
        Open the image upscaler <ArrowRight className="size-4" />
      </Link>
    </div>
  );
}

function DecisionPanel({ kind }: { kind: GptImageOpportunityKind }) {
  if (kind === 'comparison') return <ComparisonTable />;
  if (kind === 'api-pricing') return <PricingSnapshot />;
  if (kind === 'four-k') return <FourKWorkflow />;
  return null;
}

export function GptImageOpportunityPage({
  kind,
}: {
  kind: GptImageOpportunityKind;
}) {
  const config = GPT_IMAGE_OPPORTUNITIES[kind];
  const [modelId, setModelId] = useState<CreativeModelId>(config.defaultModel);
  const related = GPT_IMAGE_RELATED.filter(
    (item) => item.href !== config.path
  ).slice(0, 3);

  return (
    <main className="flex-1">
      <GeneratorPageHero
        breadcrumbs={[
          { href: '/', label: 'Home' },
          { href: '/models', label: 'Image models' },
          { label: config.title },
        ]}
        eyebrow={config.eyebrow}
        title={config.title}
        description={config.description}
        image={config.image}
        imageAlt={config.imageAlt}
        icon={
          <ModelBrandTile
            modelId={config.defaultModel}
            className="size-12 rounded-2xl"
            markClassName="size-6"
          />
        }
        primaryLabel="Open the workflow"
        note="Sign in is required before generation. The selected model and credit cost stay visible."
        badges={config.badges}
      />

      <section className="px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-5 lg:grid-cols-[.72fr_1.28fr] lg:items-end">
            <div>
              <p className="text-primary text-xs font-semibold tracking-[.18em] uppercase">
                Verified workflow
              </p>
              <h2 className="mt-4 font-serif text-3xl tracking-tight sm:text-5xl">
                Use the model, not a mock demo
              </h2>
            </div>
            <p className="text-muted-foreground max-w-3xl text-lg leading-8">
              The workspace submits to the named GPT Image 2.5 endpoint. It does
              not silently replace your selection with another model.
            </p>
          </div>

          <DecisionPanel kind={kind} />

          {kind === 'comparison' ? (
            <div
              className="mt-8 flex flex-wrap gap-3"
              aria-label="Choose GPT Image 2.5 model"
            >
              {(['gpt-image-2.5-flare', 'gpt-image-2.5-sunburst'] as const).map(
                (id) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setModelId(id)}
                    className={`border-border inline-flex min-h-12 items-center gap-3 rounded-full border px-5 text-sm font-semibold ${modelId === id ? 'bg-foreground text-background' : 'bg-card'}`}
                  >
                    <ModelBrandTile modelId={id} className="size-8" />
                    {id.endsWith('flare') ? 'Test Flare' : 'Test Sunburst'}
                  </button>
                )
              )}
            </div>
          ) : null}

          <div id="generator" className="scroll-mt-24">
            <PublicModelGenerator
              key={`${kind}-${modelId}`}
              modelId={modelId}
              initialMode={config.initialMode}
              initialPrompt={config.initialPrompt}
            />
          </div>

          <div className="border-border bg-muted/20 mt-8 grid gap-5 rounded-3xl border p-6 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <h2 className="font-semibold">
                Verified against primary sources
              </h2>
              <p className="text-muted-foreground mt-2 text-sm leading-6">
                Positioning, inputs, quality tiers, endpoints, and prices were
                checked against the official model pages.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <a
                href="https://developers.openai.com/api/docs/models/gpt-image-2.5-flare"
                target="_blank"
                rel="noreferrer"
                className="border-border bg-background inline-flex min-h-10 items-center rounded-full border px-4 text-sm font-semibold"
              >
                Flare docs
              </a>
              <a
                href="https://developers.openai.com/api/docs/models/gpt-image-2.5-sunburst"
                target="_blank"
                rel="noreferrer"
                className="border-border bg-background inline-flex min-h-10 items-center rounded-full border px-4 text-sm font-semibold"
              >
                Sunburst docs
              </a>
            </div>
          </div>
        </div>
      </section>

      <GeneratorGuideSections
        title={config.sectionTitle}
        description={config.sectionDescription}
        outcomes={config.outcomes}
        steps={config.steps}
        tips={config.tips}
        limitation={config.limitation}
        faqs={config.faqs}
        related={[...related]}
      />
    </main>
  );
}
