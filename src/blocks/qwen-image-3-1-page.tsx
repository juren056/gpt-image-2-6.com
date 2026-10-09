import {
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  CircleHelp,
  Clock3,
  ExternalLink,
  FileQuestion,
  Megaphone,
  ShieldCheck,
} from 'lucide-react';

import { Link } from '@/core/i18n/navigation';
import { m } from '@/paraglide/messages.js';
import { getLocale } from '@/paraglide/runtime.js';

const ANNOUNCEMENT_URL =
  'https://www.alibabacloud.com/en/press-room/alibaba-unveils-roadmap-on-full-stack-ai-strategy?_p_lc=1';
const MODEL_CATALOG_URL =
  'https://www.alibabacloud.com/help/en/model-studio/image-model';
const API_REFERENCE_URL =
  'https://docs.qwencloud.com/api-reference/image-generation/qwen-text-to-image';

export function getQwen31Faqs(locale: string) {
  return [
    {
      question: m['qwen31.faq_1_q']({}, { locale: locale as any }),
      answer: m['qwen31.faq_1_a']({}, { locale: locale as any }),
    },
    {
      question: m['qwen31.faq_2_q']({}, { locale: locale as any }),
      answer: m['qwen31.faq_2_a']({}, { locale: locale as any }),
    },
    {
      question: m['qwen31.faq_3_q']({}, { locale: locale as any }),
      answer: m['qwen31.faq_3_a']({}, { locale: locale as any }),
    },
    {
      question: m['qwen31.faq_4_q']({}, { locale: locale as any }),
      answer: m['qwen31.faq_4_a']({}, { locale: locale as any }),
    },
    {
      question: m['qwen31.faq_5_q']({}, { locale: locale as any }),
      answer: m['qwen31.faq_5_a']({}, { locale: locale as any }),
    },
  ];
}

export function QwenImage31Page() {
  const locale = getLocale();
  const faqItems = getQwen31Faqs(locale);
  const availabilityRows = [
    [m['qwen31.status_announcement'](), m['qwen31.status_confirmed'](), true],
    [m['qwen31.status_release'](), m['qwen31.status_release_value'](), true],
    [m['qwen31.status_api'](), m['qwen31.status_unannounced'](), false],
    [m['qwen31.status_model_id'](), m['qwen31.status_unannounced'](), false],
    [m['qwen31.status_pricing'](), m['qwen31.status_unannounced'](), false],
    [m['qwen31.status_weights'](), m['qwen31.status_unannounced'](), false],
    [m['qwen31.status_license'](), m['qwen31.status_unannounced'](), false],
    [m['qwen31.status_generator'](), m['qwen31.status_not_available'](), false],
  ] as const;
  const comparisonRows = [
    [
      m['qwen31.compare_availability'](),
      m['qwen31.compare_31_availability'](),
      m['qwen31.compare_30_availability'](),
      m['qwen31.compare_21_availability'](),
    ],
    [
      m['qwen31.compare_positioning'](),
      m['qwen31.compare_31_positioning'](),
      m['qwen31.compare_30_positioning'](),
      m['qwen31.compare_21_positioning'](),
    ],
    [
      m['qwen31.compare_api'](),
      m['qwen31.compare_31_api'](),
      m['qwen31.compare_30_api'](),
      m['qwen31.compare_21_api'](),
    ],
    [
      m['qwen31.compare_use'](),
      m['qwen31.compare_31_use'](),
      m['qwen31.compare_30_use'](),
      m['qwen31.compare_21_use'](),
    ],
  ] as const;

  return (
    <main className="flex-1">
      <section className="relative overflow-hidden border-b px-4 py-16 sm:py-24">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,color-mix(in_oklab,var(--primary)_13%,transparent),transparent_35%),radial-gradient(circle_at_88%_15%,color-mix(in_oklab,var(--chart-2)_12%,transparent),transparent_30%)]" />
        <div className="relative mx-auto grid w-full max-w-7xl min-w-0 items-center gap-12 lg:grid-cols-[1.08fr_.92fr]">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-300/70 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-950 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-200">
              <Megaphone className="size-3.5" />
              {m['qwen31.status_badge']()}
            </div>
            <h1 className="mt-6 max-w-4xl font-serif text-4xl leading-[1.05] tracking-tight break-words sm:text-6xl lg:text-7xl">
              {m['qwen31.h1']()}
            </h1>
            <p className="text-muted-foreground mt-6 max-w-2xl text-lg leading-8 break-words">
              {m['qwen31.hero_description']()}
            </p>
            <p className="text-muted-foreground mt-4 flex items-center gap-2 text-sm">
              <Clock3 className="size-4" />
              {m['qwen31.last_verified']()}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/#generator"
                className="bg-primary text-primary-foreground inline-flex min-h-12 items-center gap-2 rounded-full px-6 text-sm font-semibold"
              >
                {m['qwen31.try_qwen3']()} <ArrowRight className="size-4" />
              </Link>
              <Link
                href="/models"
                className="border-border bg-background inline-flex min-h-12 items-center gap-2 rounded-full border px-6 text-sm font-semibold"
              >
                {m['qwen31.compare_models']()}
              </Link>
            </div>
          </div>

          <div className="border-border bg-card w-full min-w-0 overflow-hidden rounded-[2rem] border shadow-xl shadow-black/5">
            <div className="border-border flex items-center justify-between border-b px-6 py-5">
              <div>
                <p className="text-xs font-semibold tracking-[.16em] text-amber-700 uppercase dark:text-amber-300">
                  {m['qwen31.snapshot_eyebrow']()}
                </p>
                <h2 className="mt-1 text-xl font-semibold">
                  {m['qwen31.snapshot_title']()}
                </h2>
              </div>
              <CalendarClock className="text-primary size-7" />
            </div>
            <dl className="divide-border divide-y px-6">
              {availabilityRows.map(([label, value, confirmed]) => (
                <div
                  key={label}
                  className="grid grid-cols-1 gap-1.5 py-4 text-sm sm:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] sm:gap-5"
                >
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd className="flex items-start gap-2 font-medium">
                    {confirmed ? (
                      <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                    ) : (
                      <CircleHelp className="text-muted-foreground mt-0.5 size-4 shrink-0" />
                    )}
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-primary text-xs font-semibold tracking-[.18em] uppercase">
              {m['qwen31.confirmed_eyebrow']()}
            </p>
            <h2 className="mt-3 font-serif text-3xl tracking-tight sm:text-5xl">
              {m['qwen31.confirmed_title']()}
            </h2>
            <p className="text-muted-foreground mt-5 text-base leading-8">
              {m['qwen31.confirmed_text']()}
            </p>
          </div>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {[
              [
                ShieldCheck,
                m['qwen31.fact_1_title'](),
                m['qwen31.fact_1_text'](),
              ],
              [
                CalendarClock,
                m['qwen31.fact_2_title'](),
                m['qwen31.fact_2_text'](),
              ],
              [
                FileQuestion,
                m['qwen31.fact_3_title'](),
                m['qwen31.fact_3_text'](),
              ],
            ].map(([Icon, title, text]) => {
              const ItemIcon = Icon as typeof ShieldCheck;
              return (
                <article
                  key={String(title)}
                  className="border-border bg-card rounded-3xl border p-6"
                >
                  <ItemIcon className="text-primary size-6" />
                  <h3 className="mt-5 text-lg font-semibold">
                    {String(title)}
                  </h3>
                  <p className="text-muted-foreground mt-2 text-sm leading-6">
                    {String(text)}
                  </p>
                </article>
              );
            })}
          </div>
          <div className="mt-8 flex flex-wrap gap-3 text-sm">
            {[
              [ANNOUNCEMENT_URL, m['qwen31.source_announcement']()],
              [MODEL_CATALOG_URL, m['qwen31.source_catalog']()],
              [API_REFERENCE_URL, m['qwen31.source_api']()],
            ].map(([href, label]) => (
              <a
                key={href}
                href={href}
                target="_blank"
                rel="noreferrer"
                className="border-border inline-flex min-h-11 items-center gap-2 rounded-full border px-5 font-semibold"
              >
                {label} <ExternalLink className="size-4" />
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-muted/30 border-y px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-7xl">
          <h2 className="font-serif text-3xl tracking-tight sm:text-5xl">
            {m['qwen31.compare_title']()}
          </h2>
          <p className="text-muted-foreground mt-4 max-w-3xl leading-7">
            {m['qwen31.compare_text']()}
          </p>
          <div className="border-border bg-background mt-8 overflow-x-auto rounded-3xl border">
            <table className="w-full min-w-[760px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-border border-b">
                  <th className="p-5 font-semibold">
                    {m['qwen31.compare_field']()}
                  </th>
                  <th className="p-5 font-semibold">Qwen Image 3.1</th>
                  <th className="p-5 font-semibold">Qwen Image 3.0</th>
                  <th className="p-5 font-semibold">Qwen Image 2.1</th>
                </tr>
              </thead>
              <tbody className="divide-border divide-y">
                {comparisonRows.map((row) => (
                  <tr key={row[0]}>
                    {row.map((cell, index) => (
                      <td
                        key={`${row[0]}-${index}`}
                        className={
                          index === 0
                            ? 'p-5 font-semibold'
                            : 'text-muted-foreground p-5 leading-6'
                        }
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:py-24">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[.82fr_1.18fr]">
          <div>
            <p className="text-primary text-xs font-semibold tracking-[.18em] uppercase">
              {m['qwen31.test_eyebrow']()}
            </p>
            <h2 className="mt-3 font-serif text-3xl tracking-tight sm:text-5xl">
              {m['qwen31.test_title']()}
            </h2>
            <p className="text-muted-foreground mt-5 leading-8">
              {m['qwen31.test_text']()}
            </p>
          </div>
          <ol className="grid gap-4 sm:grid-cols-2">
            {[
              m['qwen31.test_1'](),
              m['qwen31.test_2'](),
              m['qwen31.test_3'](),
              m['qwen31.test_4'](),
              m['qwen31.test_5'](),
              m['qwen31.test_6'](),
            ].map((item, index) => (
              <li
                key={item}
                className="border-border bg-card flex gap-4 rounded-2xl border p-5 text-sm leading-6"
              >
                <span className="bg-primary/10 text-primary flex size-8 shrink-0 items-center justify-center rounded-full font-semibold">
                  {index + 1}
                </span>
                {item}
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="border-y px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-4xl">
          <h2 className="font-serif text-3xl tracking-tight sm:text-5xl">
            {m['qwen31.timeline_title']()}
          </h2>
          <div className="mt-8 border-l pl-7">
            <article className="relative pb-10">
              <span className="bg-primary ring-background absolute top-1 -left-[2.05rem] size-3 rounded-full ring-4" />
              <time className="text-primary text-xs font-semibold tracking-[.14em] uppercase">
                {m['qwen31.timeline_date']()}
              </time>
              <h3 className="mt-2 text-xl font-semibold">
                {m['qwen31.timeline_event_title']()}
              </h3>
              <p className="text-muted-foreground mt-2 leading-7">
                {m['qwen31.timeline_event_text']()}
              </p>
            </article>
            <article className="relative">
              <span className="border-muted-foreground bg-background ring-background absolute top-1 -left-[2.05rem] size-3 rounded-full border-2 ring-4" />
              <time className="text-muted-foreground text-xs font-semibold tracking-[.14em] uppercase">
                {m['qwen31.timeline_next_date']()}
              </time>
              <h3 className="mt-2 text-xl font-semibold">
                {m['qwen31.timeline_next_title']()}
              </h3>
              <p className="text-muted-foreground mt-2 leading-7">
                {m['qwen31.timeline_next_text']()}
              </p>
            </article>
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-4xl">
          <h2 className="font-serif text-3xl tracking-tight sm:text-5xl">
            {m['qwen31.faq_title']()}
          </h2>
          <div className="mt-8 divide-y rounded-3xl border px-6">
            {faqItems.map((item) => (
              <details key={item.question} className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-5 font-semibold">
                  {item.question}
                  <span className="text-muted-foreground text-xl transition-transform group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="text-muted-foreground mt-3 max-w-3xl leading-7">
                  {item.answer}
                </p>
              </details>
            ))}
          </div>
          <p className="text-muted-foreground mt-8 text-sm leading-6">
            {m['qwen31.disclaimer']()}
          </p>
        </div>
      </section>
    </main>
  );
}
