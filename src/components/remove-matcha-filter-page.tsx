import {
  Check,
  ChevronDown,
  CircleCheck,
  Droplets,
  ScanFace,
  ShieldCheck,
  Sparkles,
  Upload,
} from 'lucide-react';

import { Link } from '@/core/i18n/navigation';
import {
  BeforeAfterReveal,
  MatchaFilterWorkspace,
  type MatchaWorkspaceCopy,
} from '@/components/special-tool-workspaces';

export type MatchaPageCopy = {
  breadcrumbHome: string;
  breadcrumbTools: string;
  eyebrow: string;
  title: string;
  description: string;
  primaryAction: string;
  trustItems: string[];
  exampleTitle: string;
  toolTitle: string;
  toolEyebrow: string;
  toolDescription: string;
  benefitsTitle: string;
  benefits: Array<{ title: string; body: string }>;
  howTitle: string;
  howDescription: string;
  steps: Array<{ title: string; body: string }>;
  faqTitle: string;
  faqs: Array<{ question: string; answer: string }>;
  ctaTitle: string;
  ctaBody: string;
  ctaAction: string;
};

export function RemoveMatchaFilterPage({
  copy,
  workspace,
}: {
  copy: MatchaPageCopy;
  workspace: MatchaWorkspaceCopy;
}) {
  return (
    <main className="flex-1 overflow-hidden bg-[#fbfcf8] text-[#142017] dark:bg-[#0b110c] dark:text-[#f3f7ee]">
      <section className="relative px-4 pt-8 pb-16 sm:pb-24">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[42rem] bg-[radial-gradient(circle_at_12%_18%,rgba(205,232,128,.42),transparent_32%),radial-gradient(circle_at_88%_8%,rgba(132,177,110,.22),transparent_30%)]" />
        <div className="relative mx-auto max-w-6xl">
          <nav
            className="text-muted-foreground flex flex-wrap items-center gap-2 text-xs"
            aria-label="Breadcrumb"
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

          <div className="mt-12 grid items-center gap-12 lg:grid-cols-[.86fr_1.14fr]">
            <div>
              <p className="inline-flex rounded-full border border-[#254d32]/15 bg-white/70 px-3 py-1.5 text-xs font-bold tracking-[.16em] text-[#3c6733] uppercase dark:bg-white/5 dark:text-lime-200">
                {copy.eyebrow}
              </p>
              <h1 className="mt-6 font-serif text-5xl leading-[.98] tracking-[-.045em] text-balance sm:text-7xl">
                {copy.title}
              </h1>
              <p className="text-muted-foreground mt-6 max-w-xl text-lg leading-8">
                {copy.description}
              </p>
              <a
                href="#tool"
                className="mt-8 inline-flex h-13 items-center gap-2 rounded-full bg-[#254d32] px-7 text-sm font-bold text-white shadow-lg shadow-[#254d32]/20 transition hover:-translate-y-0.5 hover:bg-[#326741]"
              >
                <Sparkles className="size-4" />
                {copy.primaryAction}
              </a>
              <ul className="mt-7 flex flex-wrap gap-x-5 gap-y-2">
                {copy.trustItems.map((item) => (
                  <li
                    key={item}
                    className="text-muted-foreground flex items-center gap-1.5 text-xs"
                  >
                    <CircleCheck className="size-3.5 text-[#5f8b45]" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <figure className="relative">
              <div className="absolute -inset-6 -z-10 rotate-2 rounded-[3rem] bg-[#dce9bd] dark:bg-[#1a2b1d]" />
              <div className="overflow-hidden rounded-[2rem] border border-[#254d32]/10 bg-white p-2 shadow-2xl shadow-[#254d32]/15 dark:bg-[#121a13]">
                <BeforeAfterReveal
                  beforeUrl="/imgs/tools/remove-matcha-filter/before.webp"
                  afterUrl="/imgs/tools/remove-matcha-filter/after.webp"
                  beforeAlt={workspace.beforeAlt}
                  afterAlt={workspace.afterAlt}
                  variant="photo"
                />
              </div>
              <figcaption className="text-muted-foreground mt-4 text-center text-xs">
                {copy.exampleTitle}
              </figcaption>
            </figure>
          </div>
        </div>
      </section>

      <section
        id="tool"
        className="scroll-mt-24 border-y border-[#254d32]/10 bg-[#f0f5e8] px-4 py-16 sm:py-24 dark:bg-[#101812]"
      >
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-bold tracking-[.18em] text-[#547844] uppercase">
              {copy.toolEyebrow}
            </p>
            <h2 className="mt-4 font-serif text-4xl tracking-tight sm:text-5xl">
              {copy.toolTitle}
            </h2>
            <p className="text-muted-foreground mt-4 text-lg leading-8">
              {copy.toolDescription}
            </p>
          </div>
          <div className="mt-10">
            <MatchaFilterWorkspace
              copy={workspace}
              path="/remove-matcha-filter"
            />
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-2xl">
            <h2 className="font-serif text-4xl tracking-tight sm:text-5xl">
              {copy.benefitsTitle}
            </h2>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {copy.benefits.map((benefit, index) => {
              const Icon = [Droplets, ScanFace, ShieldCheck][index] ?? Sparkles;
              return (
                <article
                  key={benefit.title}
                  className="rounded-[1.75rem] border border-[#254d32]/10 bg-white p-7 dark:bg-[#111812]"
                >
                  <span className="flex size-11 items-center justify-center rounded-2xl bg-[#e6efcc] text-[#315236] dark:bg-[#263525] dark:text-lime-200">
                    <Icon className="size-5" />
                  </span>
                  <h3 className="mt-6 text-xl font-semibold">
                    {benefit.title}
                  </h3>
                  <p className="text-muted-foreground mt-3 text-sm leading-7">
                    {benefit.body}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-[#1b3525] px-4 py-16 text-white sm:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-10 lg:grid-cols-[.72fr_1.28fr]">
            <div>
              <h2 className="font-serif text-4xl tracking-tight sm:text-5xl">
                {copy.howTitle}
              </h2>
              <p className="mt-5 leading-8 text-white/65">
                {copy.howDescription}
              </p>
            </div>
            <ol className="grid gap-4 sm:grid-cols-3">
              {copy.steps.map((step, index) => (
                <li
                  key={step.title}
                  className="rounded-[1.5rem] border border-white/12 bg-white/5 p-6"
                >
                  <span className="font-mono text-xs text-lime-200">
                    0{index + 1}
                  </span>
                  <h3 className="mt-5 text-lg font-semibold">{step.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-white/60">
                    {step.body}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center font-serif text-4xl tracking-tight sm:text-5xl">
            {copy.faqTitle}
          </h2>
          <div className="mt-10 divide-y divide-[#254d32]/10 border-y border-[#254d32]/10">
            {copy.faqs.map((faq) => (
              <details key={faq.question} className="group py-2">
                <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-4 font-semibold">
                  {faq.question}
                  <ChevronDown className="size-4 shrink-0 transition group-open:rotate-180" />
                </summary>
                <p className="text-muted-foreground max-w-3xl pb-6 text-sm leading-7">
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 pb-20 sm:pb-28">
        <div className="mx-auto flex max-w-6xl flex-col items-center rounded-[2.25rem] bg-[#dce9bd] px-6 py-14 text-center text-[#162318] sm:px-12">
          <Upload className="size-6" />
          <h2 className="mt-5 max-w-3xl font-serif text-4xl tracking-tight sm:text-5xl">
            {copy.ctaTitle}
          </h2>
          <p className="mt-4 max-w-2xl leading-7 text-[#34503a]">
            {copy.ctaBody}
          </p>
          <a
            href="#tool"
            className="mt-7 inline-flex h-12 items-center gap-2 rounded-full bg-[#254d32] px-6 text-sm font-bold text-white"
          >
            <Check className="size-4" />
            {copy.ctaAction}
          </a>
        </div>
      </section>
    </main>
  );
}
