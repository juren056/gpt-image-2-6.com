import {
  ArrowRight,
  Check,
  CircleDot,
  Film,
  Focus,
  MousePointer2,
  Scissors,
  ShieldCheck,
  Sparkles,
  Timer,
} from 'lucide-react';

import { Link } from '@/core/i18n/navigation';
import {
  BackgroundRemoverWorkspace,
  BeforeAfterReveal,
  VideoGeneratorWorkspace,
  YouTubeThumbnailWorkspace,
  type BackgroundWorkspaceCopy,
  type VideoWorkspaceCopy,
  type YouTubeWorkspaceCopy,
} from '@/components/special-tool-workspaces';

export type EditorialSection = {
  title: string;
  body: string;
  bullets?: string[];
};

export type FaqItem = {
  question: string;
  answer: string;
};

export type SpecialToolPageCopy = {
  breadcrumbHome: string;
  breadcrumbTools: string;
  eyebrow: string;
  title: string;
  description: string;
  primaryAction: string;
  disclosure: string;
  toolTitle: string;
  toolDescription: string;
  exampleTitle: string;
  exampleCaption: string;
  sections: EditorialSection[];
  faqTitle: string;
  faqs: FaqItem[];
  relatedTitle: string;
  related: Array<{ href: string; label: string }>;
};

function Breadcrumbs({
  copy,
}: {
  copy: Pick<
    SpecialToolPageCopy,
    'breadcrumbHome' | 'breadcrumbTools' | 'title'
  >;
}) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="text-muted-foreground flex flex-wrap items-center gap-2 text-xs"
    >
      <Link href="/" className="hover:text-foreground">
        {copy.breadcrumbHome}
      </Link>
      <span>/</span>
      <Link href="/tools" className="hover:text-foreground">
        {copy.breadcrumbTools}
      </Link>
      <span>/</span>
      <span className="text-foreground">{copy.title}</span>
    </nav>
  );
}

function FaqAndRelated({
  copy,
}: {
  copy: Pick<
    SpecialToolPageCopy,
    'faqTitle' | 'faqs' | 'relatedTitle' | 'related'
  >;
}) {
  return (
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
          {copy.related.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="border-border hover:border-primary/40 hover:text-primary rounded-full border px-4 py-2 text-sm font-semibold"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </section>
  );
}

export function YouTubeThumbnailPage({
  copy,
  workspace,
}: {
  copy: SpecialToolPageCopy;
  workspace: YouTubeWorkspaceCopy;
}) {
  return (
    <main className="flex-1">
      <section className="overflow-hidden bg-[#090b0f] px-4 py-8 text-white sm:py-12">
        <div className="mx-auto max-w-6xl">
          <Breadcrumbs copy={copy} />
          <div className="mt-10 grid items-center gap-10 lg:grid-cols-[.85fr_1.15fr]">
            <div>
              <p className="text-xs font-semibold tracking-[0.2em] text-red-400 uppercase">
                {copy.eyebrow}
              </p>
              <h1 className="mt-5 font-serif text-4xl leading-[1.02] tracking-tight text-balance sm:text-6xl">
                {copy.title}
              </h1>
              <p className="mt-6 text-lg leading-8 text-white/65">
                {copy.description}
              </p>
              <a
                href="#tool"
                className="mt-8 inline-flex h-12 items-center gap-2 rounded-full bg-red-500 px-6 text-sm font-semibold text-white hover:bg-red-400"
              >
                {copy.primaryAction}
                <ArrowRight className="size-4" />
              </a>
              <p className="mt-5 text-xs leading-5 text-white/40">
                {copy.disclosure}
              </p>
            </div>
            <figure className="relative overflow-hidden rounded-[2rem] border border-white/10 shadow-2xl">
              <img
                src="/imgs/tools/ai-youtube-thumbnail-showcase.webp"
                alt={copy.exampleTitle}
                width={1280}
                height={720}
                fetchPriority="high"
                className="aspect-video w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/10 to-transparent" />
              <div className="absolute inset-y-0 left-0 flex w-[48%] flex-col justify-center p-6 sm:p-10">
                <span className="text-xs font-bold tracking-[.2em] text-cyan-300 uppercase">
                  7 minutes
                </span>
                <span className="mt-2 text-3xl leading-[.92] font-black tracking-[-.06em] text-white uppercase drop-shadow-xl sm:text-5xl">
                  The city that bends time
                </span>
              </div>
              <figcaption className="absolute right-3 bottom-3 rounded-full bg-black/65 px-3 py-1.5 text-[10px] text-white/75 backdrop-blur">
                {copy.exampleCaption}
              </figcaption>
            </figure>
          </div>
        </div>
      </section>

      <section id="tool" className="scroll-mt-24 px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-3xl">
            <h2 className="font-serif text-4xl tracking-tight sm:text-5xl">
              {copy.toolTitle}
            </h2>
            <p className="text-muted-foreground mt-4 text-lg leading-8">
              {copy.toolDescription}
            </p>
          </div>
          <div className="mt-10">
            <YouTubeThumbnailWorkspace
              copy={workspace}
              path="/ai-youtube-thumbnail-generator"
            />
          </div>
        </div>
      </section>

      <section className="border-border bg-muted/25 border-y px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-5 lg:grid-cols-3">
            {copy.sections.slice(0, 3).map((section, index) => {
              const icons = [Focus, CircleDot, ShieldCheck];
              const Icon = icons[index] ?? Focus;
              return (
                <article
                  key={section.title}
                  className="border-border bg-background rounded-[1.75rem] border p-6"
                >
                  <Icon className="size-5 text-red-500" />
                  <h2 className="mt-5 text-xl font-semibold">
                    {section.title}
                  </h2>
                  <p className="text-muted-foreground mt-3 text-sm leading-7">
                    {section.body}
                  </p>
                  {section.bullets ? (
                    <ul className="mt-5 space-y-2">
                      {section.bullets.map((bullet) => (
                        <li
                          key={bullet}
                          className="flex gap-2 text-sm leading-6"
                        >
                          <Check className="mt-1 size-3.5 shrink-0 text-red-500" />
                          {bullet}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </article>
              );
            })}
          </div>
          {copy.sections.slice(3).map((section) => (
            <article
              key={section.title}
              className="mt-8 grid gap-6 rounded-[2rem] bg-[#111318] p-7 text-white sm:p-10 lg:grid-cols-[.7fr_1.3fr]"
            >
              <h2 className="font-serif text-3xl tracking-tight">
                {section.title}
              </h2>
              <div>
                <p className="leading-8 text-white/65">{section.body}</p>
                {section.bullets ? (
                  <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                    {section.bullets.map((bullet) => (
                      <li
                        key={bullet}
                        className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm leading-6"
                      >
                        {bullet}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      </section>
      <FaqAndRelated copy={copy} />
    </main>
  );
}

export function AiVideoPage({
  copy,
  workspace,
}: {
  copy: SpecialToolPageCopy;
  workspace: VideoWorkspaceCopy;
}) {
  return (
    <main className="flex-1">
      <section className="px-4 py-8 sm:py-12">
        <div className="mx-auto max-w-6xl">
          <Breadcrumbs copy={copy} />
          <div className="mt-10 max-w-5xl">
            <p className="text-primary text-xs font-semibold tracking-[.2em] uppercase">
              {copy.eyebrow}
            </p>
            <h1 className="mt-5 font-serif text-4xl leading-[1.02] tracking-tight text-balance sm:text-7xl">
              {copy.title}
            </h1>
            <div className="mt-7 grid gap-6 md:grid-cols-[1fr_auto] md:items-end">
              <p className="text-muted-foreground max-w-3xl text-lg leading-8">
                {copy.description}
              </p>
              <a
                href="#tool"
                className="bg-foreground text-background inline-flex h-12 items-center gap-2 rounded-full px-6 text-sm font-semibold"
              >
                {copy.primaryAction}
                <Film className="size-4" />
              </a>
            </div>
          </div>
          <figure className="mt-12 overflow-hidden rounded-[2rem] bg-[#0d0d13] p-2 shadow-2xl sm:p-3">
            <img
              src="/imgs/tools/ai-video-storyboard-showcase.webp"
              alt={copy.exampleTitle}
              width={1536}
              height={864}
              fetchPriority="high"
              className="aspect-video w-full rounded-[1.4rem] object-cover"
            />
            <figcaption className="flex flex-col gap-2 px-4 py-4 text-white sm:flex-row sm:items-center sm:justify-between">
              <span className="font-semibold">{copy.exampleTitle}</span>
              <span className="text-xs text-white/50">
                {copy.exampleCaption}
              </span>
            </figcaption>
          </figure>
          <p className="text-muted-foreground mt-4 max-w-3xl text-xs leading-5">
            {copy.disclosure}
          </p>
        </div>
      </section>

      <section id="tool" className="scroll-mt-24 px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-6 lg:grid-cols-[.72fr_1.28fr] lg:items-end">
            <h2 className="font-serif text-4xl tracking-tight sm:text-5xl">
              {copy.toolTitle}
            </h2>
            <p className="text-muted-foreground text-lg leading-8">
              {copy.toolDescription}
            </p>
          </div>
          <div className="mt-10">
            <VideoGeneratorWorkspace
              copy={workspace}
              path="/ai-video-generator"
            />
          </div>
        </div>
      </section>

      <section className="border-border border-y px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-x-10 gap-y-12 md:grid-cols-2">
            {copy.sections.map((section, index) => (
              <article key={section.title} className="relative pl-14">
                <span className="border-border bg-card absolute top-0 left-0 flex size-10 items-center justify-center rounded-full border font-mono text-xs">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <h2 className="text-2xl font-semibold">{section.title}</h2>
                <p className="text-muted-foreground mt-4 leading-8">
                  {section.body}
                </p>
                {section.bullets ? (
                  <ul className="mt-5 space-y-3">
                    {section.bullets.map((bullet) => (
                      <li
                        key={bullet}
                        className="border-border flex items-start gap-3 border-t pt-3 text-sm leading-6"
                      >
                        <Timer className="mt-0.5 size-4 shrink-0 text-indigo-500" />
                        {bullet}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </article>
            ))}
          </div>
        </div>
      </section>
      <FaqAndRelated copy={copy} />
    </main>
  );
}

export function BackgroundRemoverPage({
  copy,
  workspace,
}: {
  copy: SpecialToolPageCopy;
  workspace: BackgroundWorkspaceCopy;
}) {
  return (
    <main className="flex-1">
      <section className="px-4 py-8 sm:py-12">
        <div className="mx-auto max-w-6xl">
          <Breadcrumbs copy={copy} />
          <div className="mt-10 grid items-center gap-12 lg:grid-cols-[.82fr_1.18fr]">
            <div>
              <p className="text-xs font-semibold tracking-[.2em] text-emerald-600 uppercase">
                {copy.eyebrow}
              </p>
              <h1 className="mt-5 font-serif text-4xl leading-[1.02] tracking-tight text-balance sm:text-6xl">
                {copy.title}
              </h1>
              <p className="text-muted-foreground mt-6 text-lg leading-8">
                {copy.description}
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <a
                  href="#tool"
                  className="inline-flex h-12 items-center gap-2 rounded-full bg-emerald-600 px-6 text-sm font-semibold text-white hover:bg-emerald-500"
                >
                  {copy.primaryAction}
                  <Scissors className="size-4" />
                </a>
                <span className="text-muted-foreground inline-flex items-center gap-2 text-xs">
                  <MousePointer2 className="size-4" />
                  {copy.exampleCaption}
                </span>
              </div>
              <p className="text-muted-foreground mt-5 text-xs leading-5">
                {copy.disclosure}
              </p>
            </div>
            <figure>
              <BeforeAfterReveal
                beforeUrl="/imgs/tools/background-remover-robot-cutout.png"
                afterUrl="/imgs/tools/background-remover-robot-cutout.png"
                beforeAlt={workspace.beforeAlt}
                afterAlt={workspace.afterAlt}
              />
              <figcaption className="text-muted-foreground mt-3 text-center text-xs">
                {copy.exampleTitle}
              </figcaption>
            </figure>
          </div>
        </div>
      </section>

      <section
        id="tool"
        className="scroll-mt-24 border-y border-emerald-100 bg-emerald-50/50 px-4 py-16 sm:py-24 dark:border-emerald-950 dark:bg-emerald-950/10"
      >
        <div className="mx-auto max-w-6xl">
          <div className="max-w-3xl">
            <h2 className="font-serif text-4xl tracking-tight sm:text-5xl">
              {copy.toolTitle}
            </h2>
            <p className="text-muted-foreground mt-4 text-lg leading-8">
              {copy.toolDescription}
            </p>
          </div>
          <div className="mt-10">
            <BackgroundRemoverWorkspace
              copy={workspace}
              path="/image-background-remover"
            />
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-5 sm:grid-cols-2">
            {copy.sections.map((section, index) => {
              const icons = [Scissors, Sparkles, ShieldCheck, MousePointer2];
              const Icon = icons[index] ?? Scissors;
              return (
                <article key={section.title} className={cnByIndex(index)}>
                  <Icon className="size-5 text-emerald-600" />
                  <h2 className="mt-5 text-2xl font-semibold">
                    {section.title}
                  </h2>
                  <p className="text-muted-foreground mt-4 leading-8">
                    {section.body}
                  </p>
                  {section.bullets ? (
                    <ul className="mt-5 space-y-2">
                      {section.bullets.map((bullet) => (
                        <li
                          key={bullet}
                          className="flex gap-2 text-sm leading-6"
                        >
                          <Check className="mt-1 size-3.5 shrink-0 text-emerald-600" />
                          {bullet}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </article>
              );
            })}
          </div>
        </div>
      </section>
      <FaqAndRelated copy={copy} />
    </main>
  );
}

function cnByIndex(index: number) {
  return [
    'border-border rounded-[2rem] border p-6 sm:p-8',
    index === 1 ? 'sm:translate-y-8' : '',
    index === 2 ? 'sm:-translate-y-8' : '',
  ]
    .filter(Boolean)
    .join(' ');
}
