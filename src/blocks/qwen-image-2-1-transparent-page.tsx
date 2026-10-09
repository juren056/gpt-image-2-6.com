import { useEffect, useState, type CSSProperties } from 'react';
import {
  ArrowRight,
  Check,
  CircleDashed,
  ExternalLink,
  ImagePlus,
  Layers3,
  LockKeyhole,
  PackageOpen,
  ShieldAlert,
  Sparkles,
  Upload,
  WandSparkles,
} from 'lucide-react';

import { Link } from '@/core/i18n/navigation';
import { cn } from '@/lib/utils';
import { m } from '@/paraglide/messages.js';
import { getLocale } from '@/paraglide/runtime.js';
import { Button, buttonVariants } from '@/components/ui/button';

type PreviewBackground = 'checker' | 'light' | 'dark' | 'violet';
type WorkspaceMode = 'prompt' | 'upload';

const PREVIEW_BACKGROUNDS: Record<PreviewBackground, CSSProperties> = {
  checker: {
    backgroundColor: '#f8fafc',
    backgroundImage:
      'linear-gradient(45deg, #dbe3ef 25%, transparent 25%), linear-gradient(-45deg, #dbe3ef 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #dbe3ef 75%), linear-gradient(-45deg, transparent 75%, #dbe3ef 75%)',
    backgroundPosition: '0 0, 0 12px, 12px -12px, -12px 0',
    backgroundSize: '24px 24px',
  },
  light: { backgroundColor: '#ffffff' },
  dark: { backgroundColor: '#101827' },
  violet: { backgroundColor: '#6d5dfc' },
};

export function getQwen21TransparentFaqs(locale: string) {
  const options = { locale: locale as any };
  return [
    {
      question: m['qwen21_transparent.faq_1_q']({}, options),
      answer: m['qwen21_transparent.faq_1_a']({}, options),
    },
    {
      question: m['qwen21_transparent.faq_2_q']({}, options),
      answer: m['qwen21_transparent.faq_2_a']({}, options),
    },
    {
      question: m['qwen21_transparent.faq_3_q']({}, options),
      answer: m['qwen21_transparent.faq_3_a']({}, options),
    },
    {
      question: m['qwen21_transparent.faq_4_q']({}, options),
      answer: m['qwen21_transparent.faq_4_a']({}, options),
    },
    {
      question: m['qwen21_transparent.faq_5_q']({}, options),
      answer: m['qwen21_transparent.faq_5_a']({}, options),
    },
    {
      question: m['qwen21_transparent.faq_6_q']({}, options),
      answer: m['qwen21_transparent.faq_6_a']({}, options),
    },
  ];
}

export function Qwen21TransparentPage() {
  const [mode, setMode] = useState<WorkspaceMode>('prompt');
  const [prompt, setPrompt] = useState<string>(
    m['qwen21_transparent.default_prompt']()
  );
  const [sampleIndex, setSampleIndex] = useState(0);
  const [background, setBackground] = useState<PreviewBackground>('checker');
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [uploadedName, setUploadedName] = useState('');

  useEffect(
    () => () => {
      if (uploadedUrl) URL.revokeObjectURL(uploadedUrl);
    },
    [uploadedUrl]
  );

  const presets = [
    {
      label: m['qwen21_transparent.preset_product'](),
      prompt: m['qwen21_transparent.prompt_product'](),
      sample: 0,
    },
    {
      label: m['qwen21_transparent.preset_sticker'](),
      prompt: m['qwen21_transparent.prompt_sticker'](),
      sample: 1,
    },
    {
      label: m['qwen21_transparent.preset_layer'](),
      prompt: m['qwen21_transparent.prompt_layer'](),
      sample: 2,
    },
  ] as const;

  const samples = [
    {
      src: '/imgs/qwen-2-1/transparent-headphones.webp',
      title: m['qwen21_transparent.sample_1_title'](),
      alt: m['qwen21_transparent.sample_1_alt'](),
    },
    {
      src: '/imgs/qwen-2-1/transparent-red-panda-sticker.webp',
      title: m['qwen21_transparent.sample_2_title'](),
      alt: m['qwen21_transparent.sample_2_alt'](),
    },
    {
      src: '/imgs/qwen-2-1/transparent-desk-lamp.webp',
      title: m['qwen21_transparent.sample_3_title'](),
      alt: m['qwen21_transparent.sample_3_alt'](),
    },
  ] as const;

  const capabilityCards = [
    {
      icon: Layers3,
      title: m['qwen21_transparent.capability_1_title'](),
      text: m['qwen21_transparent.capability_1_text'](),
    },
    {
      icon: ImagePlus,
      title: m['qwen21_transparent.capability_2_title'](),
      text: m['qwen21_transparent.capability_2_text'](),
    },
    {
      icon: CircleDashed,
      title: m['qwen21_transparent.capability_3_title'](),
      text: m['qwen21_transparent.capability_3_text'](),
    },
    {
      icon: PackageOpen,
      title: m['qwen21_transparent.capability_4_title'](),
      text: m['qwen21_transparent.capability_4_text'](),
    },
  ] as const;

  const useCases = [
    m['qwen21_transparent.use_case_1'](),
    m['qwen21_transparent.use_case_2'](),
    m['qwen21_transparent.use_case_3'](),
    m['qwen21_transparent.use_case_4'](),
    m['qwen21_transparent.use_case_5'](),
    m['qwen21_transparent.use_case_6'](),
  ];

  const faqs = getQwen21TransparentFaqs(getLocale());
  const backgroundOptions: Array<{
    value: PreviewBackground;
    symbol: string;
    label: string;
  }> = [
    {
      value: 'checker',
      symbol: '◩',
      label: m['qwen21_transparent.background_checker'](),
    },
    {
      value: 'light',
      symbol: '○',
      label: m['qwen21_transparent.background_light'](),
    },
    {
      value: 'dark',
      symbol: '●',
      label: m['qwen21_transparent.background_dark'](),
    },
    {
      value: 'violet',
      symbol: '◆',
      label: m['qwen21_transparent.background_violet'](),
    },
  ];
  const comparisonRows = [
    {
      item: m['qwen21_transparent.compare_1_item'](),
      native: m['qwen21_transparent.compare_1_native'](),
      remover: m['qwen21_transparent.compare_1_remover'](),
    },
    {
      item: m['qwen21_transparent.compare_2_item'](),
      native: m['qwen21_transparent.compare_2_native'](),
      remover: m['qwen21_transparent.compare_2_remover'](),
    },
    {
      item: m['qwen21_transparent.compare_3_item'](),
      native: m['qwen21_transparent.compare_3_native'](),
      remover: m['qwen21_transparent.compare_3_remover'](),
    },
    {
      item: m['qwen21_transparent.compare_4_item'](),
      native: m['qwen21_transparent.compare_4_native'](),
      remover: m['qwen21_transparent.compare_4_remover'](),
    },
  ];

  function selectPreset(index: number) {
    const preset = presets[index];
    setPrompt(preset.prompt);
    setSampleIndex(preset.sample);
  }

  function selectUpload(file?: File) {
    if (!file) return;
    if (uploadedUrl) URL.revokeObjectURL(uploadedUrl);
    setUploadedUrl(URL.createObjectURL(file));
    setUploadedName(file.name);
  }

  return (
    <main className="flex-1">
      <section className="overflow-hidden px-4 pt-12 pb-10 sm:pt-20 sm:pb-16">
        <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[.92fr_1.08fr]">
          <div>
            <nav
              className="text-muted-foreground text-sm"
              aria-label="Breadcrumb"
            >
              <Link href="/">{m['qwen21_transparent.home']()}</Link>
              {' / '}
              <Link href="/qwen-image-2-1-generator">Qwen Image 2.1</Link>
              {' / '}
              <span className="text-foreground">Transparent PNG</span>
            </nav>
            <div className="mt-7 flex flex-wrap gap-2">
              <span className="border-primary/20 bg-primary/8 text-primary rounded-full border px-3 py-1.5 text-xs font-semibold">
                {m['qwen21_transparent.release_badge']()}
              </span>
              <span className="rounded-full border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800 dark:border-amber-800 dark:bg-amber-950/35 dark:text-amber-200">
                {m['qwen21_transparent.license_badge']()}
              </span>
            </div>
            <h1 className="mt-6 max-w-3xl font-serif text-4xl leading-[1.04] tracking-tight text-balance sm:text-6xl">
              {m['qwen21_transparent.title']()}
            </h1>
            <p className="text-muted-foreground mt-6 max-w-2xl text-lg leading-8">
              {m['qwen21_transparent.description']()}
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <a
                href="#workspace"
                className={cn(buttonVariants({ size: 'lg' }), 'rounded-full')}
              >
                <Sparkles className="size-4" />
                {m['qwen21_transparent.preview_cta']()}
              </a>
              <Link
                href="/image-background-remover"
                className={cn(
                  buttonVariants({ variant: 'outline', size: 'lg' }),
                  'rounded-full'
                )}
              >
                {m['qwen21_transparent.live_tool_cta']()}
              </Link>
            </div>
            <p className="text-muted-foreground mt-5 flex max-w-xl items-start gap-2 text-xs leading-5">
              <ShieldAlert className="mt-0.5 size-4 shrink-0 text-amber-600" />
              {m['qwen21_transparent.status_note']()}
            </p>
          </div>

          <div
            className="border-border relative overflow-hidden rounded-[2rem] border bg-slate-950 p-4 shadow-2xl sm:p-6"
            style={{
              backgroundImage:
                'radial-gradient(circle at 22% 18%, rgba(124,92,255,.28), transparent 34%), radial-gradient(circle at 88% 70%, rgba(27,207,183,.2), transparent 32%)',
            }}
          >
            <div className="grid grid-cols-3 gap-3">
              {samples.map((sample, index) => (
                <button
                  key={sample.src}
                  type="button"
                  onClick={() => setSampleIndex(index)}
                  aria-pressed={index === sampleIndex}
                  className={cn(
                    'relative aspect-[4/5] overflow-hidden rounded-2xl border transition',
                    index === sampleIndex
                      ? 'border-white shadow-[0_0_0_2px_rgba(255,255,255,.25)]'
                      : 'border-white/15 opacity-65 hover:opacity-100'
                  )}
                  style={PREVIEW_BACKGROUNDS.checker}
                >
                  <img
                    src={sample.src}
                    alt={sample.alt}
                    width={420}
                    height={520}
                    className="size-full object-contain p-3"
                  />
                </button>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between gap-3 text-white">
              <div>
                <p className="text-xs text-white/55">
                  {m['qwen21_transparent.site_owned_sample']()}
                </p>
                <p className="mt-1 font-semibold">
                  {samples[sampleIndex].title}
                </p>
              </div>
              <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold">
                RGBA · Alpha 0–255
              </span>
            </div>
          </div>
        </div>
      </section>

      <section
        id="workspace"
        className="border-border bg-muted/25 border-y px-4 py-12 sm:py-20"
      >
        <div className="bg-background mx-auto max-w-7xl overflow-hidden rounded-[2rem] border shadow-xl">
          <div className="border-border flex flex-wrap items-center justify-between gap-4 border-b px-5 py-4 sm:px-7">
            <div>
              <p className="font-semibold">
                {m['qwen21_transparent.workspace_title']()}
              </p>
              <p className="text-muted-foreground mt-1 text-xs">
                {m['qwen21_transparent.workspace_subtitle']()}
              </p>
            </div>
            <span className="rounded-full border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800 dark:border-amber-800 dark:bg-amber-950/35 dark:text-amber-200">
              {m['qwen21_transparent.api_pending']()}
            </span>
          </div>

          <div className="grid lg:grid-cols-2">
            <div className="space-y-6 p-5 sm:p-7">
              <div className="bg-muted grid grid-cols-2 rounded-2xl p-1">
                {(['prompt', 'upload'] as const).map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setMode(item)}
                    className={cn(
                      'min-h-11 rounded-xl px-3 text-sm font-semibold transition',
                      mode === item
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground'
                    )}
                  >
                    {item === 'prompt'
                      ? m['qwen21_transparent.mode_prompt']()
                      : m['qwen21_transparent.mode_upload']()}
                  </button>
                ))}
              </div>

              <div>
                <p className="mb-3 text-sm font-semibold">
                  {m['qwen21_transparent.presets_label']()}
                </p>
                <div className="flex flex-wrap gap-2">
                  {presets.map((preset, index) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => selectPreset(index)}
                      className="border-border hover:border-primary/45 hover:text-primary min-h-10 rounded-full border px-4 text-sm transition"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {mode === 'prompt' ? (
                <label className="block">
                  <span className="text-sm font-semibold">
                    {m['qwen21_transparent.prompt_label']()}
                  </span>
                  <textarea
                    value={prompt}
                    onChange={(event) => setPrompt(event.target.value)}
                    maxLength={5000}
                    className="border-border bg-background mt-3 min-h-40 w-full resize-y rounded-2xl border p-4 text-sm leading-6 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/15"
                  />
                  <span className="text-muted-foreground mt-1 block text-right text-xs">
                    {prompt.length}/5000
                  </span>
                </label>
              ) : (
                <div>
                  <p className="text-sm font-semibold">
                    {m['qwen21_transparent.upload_label']()}
                  </p>
                  <label className="border-border bg-muted/25 hover:border-primary/45 mt-3 flex min-h-44 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed p-5 text-center transition">
                    {uploadedUrl ? (
                      <img
                        src={uploadedUrl}
                        alt={uploadedName}
                        className="max-h-32 max-w-full rounded-xl object-contain"
                      />
                    ) : (
                      <Upload className="text-primary size-7" />
                    )}
                    <span className="mt-3 text-sm font-semibold">
                      {uploadedName || m['qwen21_transparent.upload_action']()}
                    </span>
                    <span className="text-muted-foreground mt-1 text-xs">
                      {m['qwen21_transparent.upload_hint']()}
                    </span>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="sr-only"
                      onChange={(event) =>
                        selectUpload(event.target.files?.[0])
                      }
                    />
                  </label>
                </div>
              )}

              <details className="border-border rounded-2xl border p-4">
                <summary className="cursor-pointer text-sm font-semibold">
                  {m['qwen21_transparent.advanced_title']()}
                </summary>
                <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-muted/45 rounded-xl p-3">
                    <dt className="text-muted-foreground text-xs">Output</dt>
                    <dd className="mt-1 font-semibold">Transparent PNG</dd>
                  </div>
                  <div className="bg-muted/45 rounded-xl p-3">
                    <dt className="text-muted-foreground text-xs">Color</dt>
                    <dd className="mt-1 font-semibold">RGBA</dd>
                  </div>
                  <div className="bg-muted/45 rounded-xl p-3">
                    <dt className="text-muted-foreground text-xs">
                      Resolution
                    </dt>
                    <dd className="mt-1 font-semibold">Native 2K</dd>
                  </div>
                  <div className="bg-muted/45 rounded-xl p-3">
                    <dt className="text-muted-foreground text-xs">
                      References
                    </dt>
                    <dd className="mt-1 font-semibold">Up to 10 documented</dd>
                  </div>
                </dl>
              </details>

              <Button
                type="button"
                disabled
                className="min-h-12 w-full rounded-full"
              >
                <LockKeyhole className="size-4" />
                {m['qwen21_transparent.generate_locked']()}
              </Button>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-muted-foreground max-w-md text-xs leading-5">
                  {m['qwen21_transparent.no_charge_note']()}
                </p>
                <Link
                  href="/image-background-remover"
                  className="text-primary inline-flex min-h-10 items-center gap-1 text-sm font-semibold"
                >
                  {m['qwen21_transparent.use_live_remover']()}
                  <ArrowRight className="size-4" />
                </Link>
              </div>
            </div>

            <div className="border-border bg-muted/30 border-t p-5 sm:p-7 lg:border-t-0 lg:border-l">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold">
                    {m['qwen21_transparent.result_title']()}
                  </p>
                  <p className="text-muted-foreground mt-1 text-xs">
                    {m['qwen21_transparent.result_disclaimer']()}
                  </p>
                </div>
                <div className="flex gap-2" aria-label="Preview background">
                  {backgroundOptions.map(({ value, symbol, label }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setBackground(value)}
                      aria-label={label}
                      aria-pressed={background === value}
                      className={cn(
                        'flex size-9 items-center justify-center rounded-full border text-xs transition',
                        background === value
                          ? 'border-primary ring-primary/20 ring-4'
                          : 'border-border bg-background'
                      )}
                    >
                      {symbol}
                    </button>
                  ))}
                </div>
              </div>

              <div
                data-alpha-preview
                className="mt-5 flex min-h-[28rem] items-center justify-center overflow-hidden rounded-3xl border p-6 sm:p-10"
                style={PREVIEW_BACKGROUNDS[background]}
              >
                <img
                  src={samples[sampleIndex].src}
                  alt={samples[sampleIndex].alt}
                  width={720}
                  height={720}
                  className="max-h-[25rem] max-w-full object-contain drop-shadow-2xl"
                />
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {samples.map((sample, index) => (
                  <button
                    key={sample.src}
                    type="button"
                    onClick={() => setSampleIndex(index)}
                    aria-pressed={sampleIndex === index}
                    className={cn(
                      'border-border bg-background rounded-2xl border p-3 text-left text-xs font-semibold transition',
                      sampleIndex === index && 'border-primary text-primary'
                    )}
                  >
                    {sample.title}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-7xl">
          <p className="text-primary text-xs font-semibold tracking-[.18em] uppercase">
            {m['qwen21_transparent.confirmed_eyebrow']()}
          </p>
          <h2 className="mt-3 max-w-3xl font-serif text-3xl tracking-tight sm:text-5xl">
            {m['qwen21_transparent.confirmed_title']()}
          </h2>
          <p className="text-muted-foreground mt-5 max-w-3xl leading-7">
            {m['qwen21_transparent.confirmed_description']()}
          </p>
          <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {capabilityCards.map(({ icon: Icon, title, text }) => (
              <article
                key={title}
                className="border-border rounded-3xl border p-6"
              >
                <div className="bg-primary/10 text-primary flex size-11 items-center justify-center rounded-2xl">
                  <Icon className="size-5" />
                </div>
                <h3 className="mt-5 font-semibold">{title}</h3>
                <p className="text-muted-foreground mt-2 text-sm leading-6">
                  {text}
                </p>
              </article>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap gap-4 text-sm font-semibold">
            <a
              href="https://github.com/QwenLM/Qwen-Image-2.1"
              target="_blank"
              rel="noreferrer"
              className="text-primary inline-flex items-center gap-1"
            >
              {m['qwen21_transparent.official_repository']()}
              <ExternalLink className="size-4" />
            </a>
            <a
              href="https://huggingface.co/Qwen/Qwen-Image-2.1"
              target="_blank"
              rel="noreferrer"
              className="text-primary inline-flex items-center gap-1"
            >
              Hugging Face <ExternalLink className="size-4" />
            </a>
          </div>
        </div>
      </section>

      <section className="border-border bg-muted/25 border-y px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <p className="text-primary text-xs font-semibold tracking-[.18em] uppercase">
            {m['qwen21_transparent.comparison_eyebrow']()}
          </p>
          <h2 className="mt-3 font-serif text-3xl tracking-tight sm:text-5xl">
            {m['qwen21_transparent.comparison_title']()}
          </h2>
          <div className="border-border bg-background mt-8 overflow-x-auto rounded-3xl border">
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead className="bg-muted/55">
                <tr>
                  <th className="px-5 py-4">
                    {m['qwen21_transparent.table_item']()}
                  </th>
                  <th className="px-5 py-4">
                    {m['qwen21_transparent.table_native']()}
                  </th>
                  <th className="px-5 py-4">
                    {m['qwen21_transparent.table_remover']()}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-border divide-y">
                {comparisonRows.map((row) => (
                  <tr key={row.item}>
                    <th className="px-5 py-4 font-semibold">{row.item}</th>
                    <td className="text-muted-foreground px-5 py-4 leading-6">
                      {row.native}
                    </td>
                    <td className="text-muted-foreground px-5 py-4 leading-6">
                      {row.remover}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:py-24">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[.9fr_1.1fr]">
          <div>
            <p className="text-primary text-xs font-semibold tracking-[.18em] uppercase">
              {m['qwen21_transparent.use_cases_eyebrow']()}
            </p>
            <h2 className="mt-3 font-serif text-3xl tracking-tight sm:text-5xl">
              {m['qwen21_transparent.use_cases_title']()}
            </h2>
            <p className="text-muted-foreground mt-5 leading-7">
              {m['qwen21_transparent.use_cases_description']()}
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {useCases.map((item) => (
              <div
                key={item}
                className="border-border bg-card flex items-start gap-3 rounded-2xl border p-4"
              >
                <Check className="text-primary mt-0.5 size-5 shrink-0" />
                <span className="text-sm leading-6">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 pb-16 sm:pb-24">
        <div className="mx-auto max-w-6xl rounded-[2rem] border border-amber-300 bg-amber-50 p-6 sm:p-9 dark:border-amber-800 dark:bg-amber-950/25">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            <ShieldAlert className="size-10 shrink-0 text-amber-700 dark:text-amber-300" />
            <div>
              <h2 className="text-2xl font-semibold">
                {m['qwen21_transparent.license_title']()}
              </h2>
              <p className="mt-3 max-w-4xl leading-7 text-amber-950/80 dark:text-amber-100/80">
                {m['qwen21_transparent.license_text']()}
              </p>
              <div className="mt-5 flex flex-wrap gap-4 text-sm font-semibold">
                <a
                  href="https://github.com/QwenLM/Qwen-Image-2.1/blob/main/LICENSE"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-amber-900 underline underline-offset-4 dark:text-amber-100"
                >
                  {m['qwen21_transparent.read_license']()}
                  <ExternalLink className="size-4" />
                </a>
                <a
                  href="mailto:model-business@notice.qwencloud.com"
                  className="inline-flex items-center gap-1 text-amber-900 underline underline-offset-4 dark:text-amber-100"
                >
                  {m['qwen21_transparent.commercial_contact']()}
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-border border-t px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-4xl">
          <p className="text-primary text-center text-xs font-semibold tracking-[.18em] uppercase">
            FAQ
          </p>
          <h2 className="mt-3 text-center font-serif text-3xl tracking-tight sm:text-5xl">
            {m['qwen21_transparent.faq_title']()}
          </h2>
          <div className="mt-9 space-y-3">
            {faqs.map((faq) => (
              <details
                key={faq.question}
                className="border-border rounded-2xl border p-5"
              >
                <summary className="cursor-pointer font-semibold">
                  {faq.question}
                </summary>
                <p className="text-muted-foreground mt-3 leading-7">
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-950 px-4 py-14 text-white sm:py-18">
        <div className="mx-auto flex max-w-6xl flex-col justify-between gap-7 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-semibold text-violet-300">
              {m['qwen21_transparent.next_title']()}
            </p>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/65">
              {m['qwen21_transparent.next_text']()}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/qwen-image-2-1-generator"
              className="inline-flex min-h-11 items-center gap-2 rounded-full bg-white px-5 text-sm font-semibold text-slate-950"
            >
              <WandSparkles className="size-4" />
              {m['qwen21_transparent.model_page_link']()}
            </Link>
            <Link
              href="/image-background-remover"
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/25 px-5 text-sm font-semibold"
            >
              {m['qwen21_transparent.remover_link']()}
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
