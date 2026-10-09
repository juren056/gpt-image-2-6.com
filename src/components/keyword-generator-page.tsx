import { useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Download,
  Loader2,
  Sparkles,
  Upload,
} from 'lucide-react';
import { toast } from 'sonner';

import { useSession } from '@/core/auth/client';
import { tDynamic } from '@/core/i18n/dynamic';
import { Link } from '@/core/i18n/navigation';
import { IMAGE_GENERATION_COST } from '@/config/image-models';
import { apiGet, apiGetBlob, apiPost } from '@/lib/api-client';
import {
  buildShirtMockupSvg,
  dominantPalette,
  hasRasterSignature,
  quantizePixels,
  type ShirtColor,
} from '@/lib/keyword-image-tools';
import { FirstGenerationFeedback } from '@/components/first-generation-feedback';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export type KeywordGeneratorKind = 'mockup' | 'pixel' | 'prompt';

const MAX_LOCAL_IMAGE_BYTES = 5_000_000;

async function readRaster(file: File): Promise<string> {
  if (
    !['image/png', 'image/jpeg', 'image/webp'].includes(file.type) ||
    file.size > MAX_LOCAL_IMAGE_BYTES
  ) {
    throw new Error('Use a PNG, JPEG, or WebP file under 5 MB.');
  }
  const header = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  if (!hasRasterSignature(file.type, header)) {
    throw new Error('The selected file is not a valid raster image.');
  }
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Could not read this image.'));
    reader.readAsDataURL(file);
  });
  await decodeImage(dataUrl);
  return dataUrl;
}

async function decodeImage(source: string): Promise<HTMLImageElement> {
  const image = new Image();
  image.src = source;
  await image.decode();
  if (image.naturalWidth > 8000 || image.naturalHeight > 8000) {
    throw new Error('Image dimensions are too large.');
  }
  return image;
}

function saveDataUrl(url: string, filename: string) {
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
}

function UploadField(props: {
  label: string;
  hint: string;
  onChange: (file: File) => void;
}) {
  return (
    <label className="border-border bg-muted/30 flex min-h-24 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed p-4 text-center">
      <Upload className="text-primary size-6" />
      <span className="font-semibold">{props.label}</span>
      <span className="text-muted-foreground text-xs">{props.hint}</span>
      <input
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) props.onChange(file);
          event.target.value = '';
        }}
      />
    </label>
  );
}

function MockupWorkspace() {
  const [design, setDesign] = useState('');
  const [shirtColor, setShirtColor] = useState<ShirtColor>('#f8f7f2');
  const [printScale, setPrintScale] = useState(30);
  const [printY, setPrintY] = useState(360);
  const [busy, setBusy] = useState(false);
  const svg = design
    ? buildShirtMockupSvg({
        designDataUrl: design,
        shirtColor,
        printScale,
        printY,
      })
    : '';
  const preview = svg
    ? `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
    : '';
  const t = (key: string) => tDynamic(`keyword.mockup.${key}`);

  async function exportPng() {
    if (!preview) return;
    setBusy(true);
    try {
      const image = await decodeImage(preview);
      const canvas = document.createElement('canvas');
      canvas.width = 1800;
      canvas.height = 1800;
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Canvas is unavailable.');
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      saveDataUrl(canvas.toDataURL('image/png'), 'shirt-mockup.png');
    } catch {
      toast.error(t('export_error'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="border-border bg-card grid max-w-full overflow-hidden rounded-3xl border lg:grid-cols-[minmax(0,23rem)_1fr]">
      <div className="min-w-0 space-y-6 p-5 sm:p-7">
        <UploadField
          label={t('upload')}
          hint={t('upload_hint')}
          onChange={(file) =>
            void readRaster(file)
              .then(setDesign)
              .catch((error) => toast.error(error.message))
          }
        />
        <label className="block space-y-2 text-sm font-semibold">
          {t('color')}
          <select
            value={shirtColor}
            onChange={(event) =>
              setShirtColor(event.target.value as ShirtColor)
            }
            className="border-border bg-background min-h-11 w-full rounded-xl border px-3"
          >
            <option value="#f8f7f2">{t('color_cream')}</option>
            <option value="#1b2232">{t('color_navy')}</option>
            <option value="#d6d9df">{t('color_gray')}</option>
            <option value="#d94f45">{t('color_coral')}</option>
          </select>
        </label>
        <label className="block space-y-2 text-sm font-semibold">
          {t('scale')} · {printScale}%
          <input
            type="range"
            min="15"
            max="32"
            value={printScale}
            onChange={(event) => setPrintScale(Number(event.target.value))}
            className="w-full"
          />
        </label>
        <label className="block space-y-2 text-sm font-semibold">
          {t('position')}
          <input
            type="range"
            min="315"
            max="450"
            value={printY}
            onChange={(event) => setPrintY(Number(event.target.value))}
            className="w-full"
          />
        </label>
        <Button
          type="button"
          onClick={() => void exportPng()}
          disabled={!design || busy}
          className="min-h-11 w-full"
        >
          {busy ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Download className="size-4" />
          )}
          {t('download')}
        </Button>
        <p className="text-muted-foreground text-xs leading-5">
          {t('privacy')}
        </p>
      </div>
      <div className="bg-muted/35 flex min-h-96 min-w-0 items-center justify-center p-6">
        {preview ? (
          <img
            src={preview}
            alt={t('preview_alt')}
            width={900}
            height={900}
            className="max-h-[36rem] max-w-full rounded-2xl object-contain shadow-lg"
          />
        ) : (
          <div className="max-w-xl min-w-0 space-y-3 text-center">
            <img
              src="/imgs/keyword/shirt-mockup-example.webp"
              alt={t('sample_alt')}
              width={900}
              height={900}
              className="max-w-full rounded-2xl object-contain"
            />
            <p className="text-muted-foreground text-sm">{t('empty')}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function PixelWorkspace() {
  const { data: session } = useSession();
  const [mode, setMode] = useState<'upload' | 'text'>('upload');
  const [source, setSource] = useState('');
  const [description, setDescription] = useState('');
  const [paidTaskId, setPaidTaskId] = useState('');
  const [grid, setGrid] = useState(48);
  const [palette, setPalette] = useState<4 | 8 | 16 | 32>(16);
  const [result, setResult] = useState('');
  const [busy, setBusy] = useState(false);
  const t = (key: string) => tDynamic(`keyword.pixel.${key}`);

  async function pixelate(imageSource: string) {
    const image = await decodeImage(imageSource);
    const width =
      image.naturalWidth >= image.naturalHeight
        ? grid
        : Math.max(
            1,
            Math.round((grid * image.naturalWidth) / image.naturalHeight)
          );
    const height =
      image.naturalHeight > image.naturalWidth
        ? grid
        : Math.max(
            1,
            Math.round((grid * image.naturalHeight) / image.naturalWidth)
          );
    const small = document.createElement('canvas');
    small.width = width;
    small.height = height;
    const smallContext = small.getContext('2d');
    if (!smallContext) throw new Error('Canvas is unavailable.');
    smallContext.drawImage(image, 0, 0, width, height);
    const pixels = smallContext.getImageData(0, 0, width, height);
    pixels.data.set(quantizePixels(pixels.data, palette));
    smallContext.putImageData(pixels, 0, 0);
    const output = document.createElement('canvas');
    const size = Math.max(width, height);
    const multiplier = Math.max(1, Math.floor(1024 / size));
    output.width = width * multiplier;
    output.height = height * multiplier;
    const context = output.getContext('2d');
    if (!context) throw new Error('Canvas is unavailable.');
    context.imageSmoothingEnabled = false;
    context.drawImage(small, 0, 0, output.width, output.height);
    setResult(output.toDataURL('image/png'));
  }

  async function run() {
    if (mode === 'upload' && !source) return;
    if (mode === 'text' && (!description.trim() || !session?.user)) return;
    setBusy(true);
    setResult('');
    try {
      if (mode === 'upload') {
        await pixelate(source);
      } else {
        let taskId = paidTaskId;
        if (!taskId) {
          const task = await apiPost<{ id: string }>('/api/images/generate', {
            prompt: `Pixel art sprite with crisp square pixels and a limited color palette. ${description.trim()}`,
            options: { num_images: 1 },
          });
          taskId = task.id;
          setPaidTaskId(taskId);
        }
        let resultUrl = '';
        for (let attempt = 0; attempt < 90; attempt += 1) {
          const status = await apiGet<{
            status: string;
            errorMessage?: string;
          }>(`/api/images/${encodeURIComponent(taskId)}`);
          if (status.status === 'failed') {
            setPaidTaskId('');
            throw new Error(status.errorMessage || t('failed'));
          }
          if (status.status === 'success') {
            const blob = await apiGetBlob(
              `/api/images/${encodeURIComponent(taskId)}/download`
            );
            resultUrl = URL.createObjectURL(blob);
            break;
          }
          await new Promise((resolve) => window.setTimeout(resolve, 1500));
        }
        if (!resultUrl) throw new Error(t('pending'));
        try {
          await pixelate(resultUrl);
        } finally {
          URL.revokeObjectURL(resultUrl);
        }
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('failed'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="border-border bg-card grid max-w-full overflow-hidden rounded-3xl border lg:grid-cols-[minmax(0,23rem)_1fr]">
      <div className="min-w-0 space-y-5 p-5 sm:p-7">
        <div className="grid grid-cols-2 gap-2">
          {(['upload', 'text'] as const).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setMode(item)}
              className={`min-h-11 rounded-xl border text-sm font-semibold ${mode === item ? 'border-primary bg-primary/10' : 'border-border'}`}
            >
              {t(`mode_${item}`)}
            </button>
          ))}
        </div>
        {mode === 'upload' ? (
          <UploadField
            label={t('upload')}
            hint={t('upload_hint')}
            onChange={(file) =>
              void readRaster(file)
                .then((url) => {
                  setSource(url);
                  setResult('');
                })
                .catch((error) => toast.error(error.message))
            }
          />
        ) : (
          <>
            <label className="block text-sm font-semibold">
              {t('description')}
            </label>
            <Textarea
              value={description}
              onChange={(event) => {
                setDescription(event.target.value);
                setPaidTaskId('');
                setResult('');
              }}
              maxLength={1000}
              rows={4}
              placeholder={t('description_hint')}
            />
            <p className="text-muted-foreground text-xs">
              {t('text_cost').replace(
                '{credits}',
                String(IMAGE_GENERATION_COST)
              )}
            </p>
            {!session?.user ? (
              <Link
                href="/sign-up"
                className="text-primary text-sm font-semibold"
              >
                {t('sign_in')}
              </Link>
            ) : null}
          </>
        )}
        <label className="block space-y-2 text-sm font-semibold">
          {t('grid')} · {grid}
          <input
            type="range"
            min="16"
            max="128"
            step="8"
            value={grid}
            onChange={(event) => setGrid(Number(event.target.value))}
            className="w-full"
          />
        </label>
        <label className="block space-y-2 text-sm font-semibold">
          {t('palette')}
          <select
            value={palette}
            onChange={(event) =>
              setPalette(Number(event.target.value) as 4 | 8 | 16 | 32)
            }
            className="border-border bg-background min-h-11 w-full rounded-xl border px-3"
          >
            {[4, 8, 16, 32].map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
        <Button
          type="button"
          onClick={() => void run()}
          disabled={
            busy ||
            (mode === 'upload'
              ? !source
              : !description.trim() || !session?.user)
          }
          className="min-h-11 w-full"
        >
          {busy ? <Loader2 className="size-4 animate-spin" /> : null}
          {busy ? t('working') : t('generate')}
        </Button>
        {result ? (
          <Button
            type="button"
            variant="outline"
            onClick={() => saveDataUrl(result, 'pixel-art.png')}
            className="min-h-11 w-full"
          >
            <Download className="size-4" />
            {t('download')}
          </Button>
        ) : null}
      </div>
      <div className="bg-muted/35 flex min-h-96 min-w-0 items-center justify-center p-6">
        {result ? (
          <img
            src={result}
            alt={t('preview_alt')}
            width={1024}
            height={1024}
            className="max-h-[36rem] max-w-full object-contain [image-rendering:pixelated]"
          />
        ) : (
          <div className="max-w-xl space-y-3 text-center">
            <img
              src="/imgs/keyword/pixel-art-example.webp"
              alt={t('sample_alt')}
              width={1024}
              height={608}
              className="max-w-full rounded-2xl object-contain [image-rendering:pixelated]"
            />
            <p className="text-muted-foreground text-sm">{t('empty')}</p>
          </div>
        )}
      </div>
      <FirstGenerationFeedback
        taskId={mode === 'text' ? paidTaskId : null}
        status={mode === 'text' && paidTaskId && result ? 'success' : null}
        modelId="qwen-image-3"
      />
    </div>
  );
}

function PromptWorkspace() {
  const [source, setSource] = useState('');
  const [palette, setPalette] = useState<string[]>([]);
  const [ratio, setRatio] = useState('');
  const [subject, setSubject] = useState('');
  const [style, setStyle] = useState('');
  const [prompt, setPrompt] = useState('');
  const t = (key: string) => tDynamic(`keyword.prompt.${key}`);

  async function inspect(file: File) {
    try {
      const url = await readRaster(file);
      const image = await decodeImage(url);
      const canvas = document.createElement('canvas');
      canvas.width = 80;
      canvas.height = 80;
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Canvas is unavailable.');
      context.drawImage(image, 0, 0, 80, 80);
      setSource(url);
      setRatio(
        image.naturalWidth > image.naturalHeight
          ? tDynamic('tools.generator.landscape')
          : image.naturalWidth < image.naturalHeight
            ? tDynamic('tools.generator.portrait')
            : tDynamic('tools.generator.square')
      );
      setPalette(dominantPalette(context.getImageData(0, 0, 80, 80).data));
      setPrompt('');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('failed'));
    }
  }

  function createPrompt() {
    if (!source || !subject.trim()) return;
    setPrompt(
      t('output_template')
        .replace('{subject}', subject.trim())
        .replace('{style}', style.trim() || t('style_default'))
        .replace('{ratio}', ratio)
        .replace('{colors}', palette.join(', '))
    );
  }

  return (
    <div className="border-border bg-card grid max-w-full overflow-hidden rounded-3xl border lg:grid-cols-[minmax(0,23rem)_1fr]">
      <div className="min-w-0 space-y-5 p-5 sm:p-7">
        <UploadField
          label={t('upload')}
          hint={t('upload_hint')}
          onChange={(file) => void inspect(file)}
        />
        <label className="block space-y-2 text-sm font-semibold">
          {t('subject')}
          <Input
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
            maxLength={240}
            placeholder={t('subject_hint')}
          />
        </label>
        <label className="block space-y-2 text-sm font-semibold">
          {t('style')}
          <Input
            value={style}
            onChange={(event) => setStyle(event.target.value)}
            maxLength={120}
            placeholder={t('style_hint')}
          />
        </label>
        <Button
          type="button"
          onClick={createPrompt}
          disabled={!source || !subject.trim()}
          className="min-h-11 w-full"
        >
          {t('generate')}
        </Button>
        <p className="text-muted-foreground text-xs leading-5">{t('limit')}</p>
      </div>
      <div className="bg-muted/35 min-h-96 space-y-5 p-6">
        {source ? (
          <img
            src={source}
            alt={t('preview_alt')}
            width={600}
            height={400}
            className="max-h-64 max-w-full rounded-xl object-contain"
          />
        ) : (
          <p className="text-muted-foreground">{t('empty')}</p>
        )}
        {palette.length ? (
          <div className="flex gap-2">
            {palette.map((color) => (
              <span
                key={color}
                title={color}
                className="border-border size-9 rounded-full border"
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        ) : null}
        {prompt ? (
          <>
            <Textarea
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              rows={6}
              aria-label={t('result')}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                void navigator.clipboard
                  .writeText(prompt)
                  .then(() => toast.success(t('copied')))
                  .catch(() => toast.error(t('failed')))
              }
            >
              {t('copy')}
            </Button>
          </>
        ) : null}
      </div>
    </div>
  );
}

const RELATED: Record<KeywordGeneratorKind, string[]> = {
  mockup: ['/ai-product-photo-generator', '/image-background-remover'],
  pixel: ['/ai-image-generator', '/image-resizer'],
  prompt: ['/qwen-image-3-prompts', '/ai-image-generator'],
};

const KEYWORD_ASSET: Record<KeywordGeneratorKind, string> = {
  mockup: '/imgs/keyword/shirt-mockup-example.webp',
  pixel: '/imgs/keyword/pixel-art-example.webp',
  prompt: '/imgs/seo/prompt-case-board.webp',
};

const RELATED_ASSET: Record<string, string> = {
  '/ai-product-photo-generator': '/imgs/tools/ai-product-photo-showcase.webp',
  '/image-background-remover': '/imgs/tool-cards/background-remover.webp',
  '/ai-image-generator': '/imgs/tool-cards/ai-image-generator.webp',
  '/image-resizer': '/imgs/tool-cards/image-resizer.webp',
  '/qwen-image-3-prompts': '/imgs/seo/prompt-case-board.webp',
};

export function KeywordGeneratorPage({ kind }: { kind: KeywordGeneratorKind }) {
  const t = (key: string) => tDynamic(`keyword.${kind}.${key}`);
  return (
    <main className="min-w-0 flex-1 overflow-x-clip">
      <section className="border-border bg-primary/5 border-b px-4 py-10 sm:py-16">
        <div className="mx-auto max-w-7xl">
          <nav
            className="text-muted-foreground text-sm"
            aria-label="Breadcrumb"
          >
            <Link href="/">{tDynamic('keyword.common.home')}</Link> /{' '}
            <Link href="/tools">{tDynamic('keyword.common.tools')}</Link> /{' '}
            <span className="text-foreground">{t('title')}</span>
          </nav>
          <div className="mt-8 grid items-center gap-10 lg:grid-cols-[1fr_.82fr]">
            <div className="max-w-3xl">
              <p className="text-primary text-xs font-semibold tracking-[.18em] uppercase">
                {t('eyebrow')}
              </p>
              <h1 className="mt-4 font-serif text-4xl leading-[1.03] tracking-tight text-balance sm:text-6xl">
                {t('title')}
              </h1>
              <p className="text-muted-foreground mt-5 text-lg leading-8">
                {t('intro')}
              </p>
              <a
                href="#generator"
                className="bg-primary text-primary-foreground shadow-primary/15 mt-8 inline-flex min-h-12 items-center gap-2 rounded-full px-6 text-sm font-semibold shadow-lg"
              >
                {t('title')}
                <ArrowRight className="size-4" />
              </a>
            </div>
            <figure className="border-border bg-card overflow-hidden rounded-[2rem] border p-2 shadow-2xl">
              <div className="bg-muted relative aspect-[4/3] overflow-hidden rounded-[1.5rem]">
                <img
                  src={KEYWORD_ASSET[kind]}
                  alt={t('sample_alt')}
                  width={1200}
                  height={900}
                  fetchPriority="high"
                  className="size-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <figcaption className="absolute inset-x-0 bottom-0 p-5 text-sm font-medium text-white">
                  {t('empty')}
                </figcaption>
              </div>
            </figure>
          </div>
        </div>
      </section>

      <section id="generator" className="scroll-mt-24 px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mb-9 max-w-3xl">
            <p className="text-primary text-xs font-semibold tracking-[.18em] uppercase">
              {t('eyebrow')}
            </p>
            <h2 className="mt-4 font-serif text-3xl tracking-tight sm:text-5xl">
              {t('section_1_title')}
            </h2>
          </div>
          {kind === 'mockup' ? (
            <MockupWorkspace />
          ) : kind === 'pixel' ? (
            <PixelWorkspace />
          ) : (
            <PromptWorkspace />
          )}
        </div>
      </section>

      <section className="border-border bg-muted/25 border-y px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-5 md:grid-cols-3">
            {[1, 2, 3].map((index) => (
              <article
                key={index}
                className="border-border bg-background rounded-[1.6rem] border p-6 shadow-sm"
              >
                <CheckCircle2 className="text-primary size-5" />
                <h2 className="mt-5 text-xl font-semibold">
                  {t(`section_${index}_title`)}
                </h2>
                <p className="text-muted-foreground mt-3 text-sm leading-7">
                  {t(`section_${index}_body`)}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:py-24">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[.62fr_1.38fr]">
          <div>
            <Sparkles className="text-primary size-5" />
            <h2 className="mt-5 font-serif text-3xl tracking-tight sm:text-4xl">
              {tDynamic('keyword.common.faq')}
            </h2>
          </div>
          <div className="grid gap-3">
            {[1, 2, 3].map((index) => (
              <details
                key={index}
                className="border-border bg-card rounded-2xl border px-5 py-4"
              >
                <summary className="flex min-h-10 cursor-pointer list-none items-center font-semibold">
                  {t(`faq_${index}_question`)}
                </summary>
                <p className="text-muted-foreground pt-3 pb-2 text-sm leading-7">
                  {t(`faq_${index}_answer`)}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="border-border border-t px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <h2 className="font-serif text-3xl tracking-tight sm:text-4xl">
            {tDynamic('keyword.common.related')}
          </h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {RELATED[kind].map((href, index) => (
              <Link
                key={href}
                href={href}
                className="border-border bg-card group overflow-hidden rounded-2xl border transition hover:-translate-y-0.5 hover:shadow-lg"
              >
                <div className="bg-muted aspect-[16/7] overflow-hidden">
                  <img
                    src={RELATED_ASSET[href] || KEYWORD_ASSET[kind]}
                    alt=""
                    width={800}
                    height={350}
                    loading="lazy"
                    className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                </div>
                <div className="flex items-center justify-between gap-4 p-5 font-semibold">
                  {t(`related_${index + 1}`)}
                  <ArrowRight className="text-primary size-4" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
