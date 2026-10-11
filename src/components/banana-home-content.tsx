import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  ArrowLeftRight,
  ArrowRight,
  ArrowUpRight,
  Download,
  ImagePlus,
  Layers,
  Pencil,
  Plus,
  Settings2,
  ShoppingBag,
  Sparkles,
  Type,
  Users,
  Zap,
} from 'lucide-react';

import { Link } from '@/core/i18n/navigation';
import {
  prepareBananaGenerator,
  type BananaGeneratorSelection,
} from '@/lib/banana-generator-navigation';

export type BananaCard = { title: string; body: string };
export type BananaModelCard = BananaCard & {
  id: string;
  name: string;
  references: string;
  outputSize: string;
  credits: string;
  href: string;
};

/** Content stays visible before hydration and when motion is reduced. */
function useCardReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [revealed, setRevealed] = useState(false);
  useEffect(() => {
    if (
      !ref.current ||
      !('IntersectionObserver' in window) ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    )
      return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setRevealed(true);
          observer.disconnect();
        }
      },
      { threshold: 0.08 }
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return { ref, revealed };
}

function CapabilitySketch({ kind }: { kind: number }) {
  return (
    <svg
      viewBox="0 0 120 100"
      fill="none"
      aria-hidden="true"
      className="banana-capability-sketch"
    >
      {kind === 0 && (
        <>
          <rect x="10" y="14" width="100" height="72" rx="9" />
          <text
            x="23"
            y="54"
            stroke="none"
            fill="currentColor"
            fontSize="30"
            fontWeight="600"
          >
            Aa
          </text>
          <path d="M24 66h55M24 74h32" />
          <path
            className="banana-sketch-accent"
            d="M88 32v24"
            strokeWidth="3"
          />
        </>
      )}
      {kind === 1 && (
        <>
          <rect x="8" y="18" width="54" height="61" rx="7" />
          <path d="m17 65 14-19 12 12 9-9" />
          <circle cx="44" cy="33" r="5" />
          <rect
            className="banana-sketch-accent"
            x="54"
            y="29"
            width="58"
            height="61"
            rx="7"
          />
          <path className="banana-sketch-accent" d="m64 77 14-19 12 12 12-15" />
          <path d="M81 10v9m-5-4h10" />
        </>
      )}
      {kind === 2 && (
        <>
          {[10, 45, 80].map((x) => (
            <g key={x}>
              <rect x={x} y="23" width="30" height="57" rx="7" />
              <circle
                className="banana-sketch-accent"
                cx={x + 15}
                cy="42"
                r="6"
              />
              <path
                className="banana-sketch-accent"
                d={`M${x + 6} 68v-7a9 9 0 0 1 18 0v7`}
              />
            </g>
          ))}
          <path d="M25 13h70" strokeDasharray="2 5" />
        </>
      )}
      {kind === 3 && (
        <>
          <rect x="10" y="17" width="100" height="69" rx="9" />
          <path
            className="banana-sketch-accent"
            d="M29 34h-8v11h9v-6h-4m27-5h-8v11h9v-6h-4"
            strokeWidth="2.5"
          />
          <path d="M24 60h70M24 69h48" />
          <path
            className="banana-sketch-accent"
            d="M24 77h70"
            strokeWidth="3"
          />
        </>
      )}
    </svg>
  );
}

export function BananaHero({
  badge,
  name,
  heading,
  intro,
  start,
}: {
  badge: string;
  name: string;
  heading: string;
  intro: string;
  start: string;
}) {
  return (
    <section className="banana-hero">
      <a className="banana-hero-badge" href="#tool-generator">
        {badge}
      </a>
      <h1>
        <span>{name}</span> {heading}
      </h1>
      <p>{intro}</p>
      <a href="#tool-generator" className="banana-button">
        {start}
      </a>
    </section>
  );
}

export function BananaIntro({
  title,
  body,
  tags,
  start,
}: {
  title: string;
  body: string;
  tags: string[];
  start: string;
}) {
  return (
    <section className="banana-acid banana-section banana-intro">
      <div className="banana-container">
        <div className="max-w-3xl">
          <ul className="mb-7 flex list-none flex-wrap gap-2">
            {tags.map((tag) => (
              <li
                key={tag}
                className="rounded-full border border-black/20 px-3 py-1 text-xs"
              >
                {tag}
              </li>
            ))}
          </ul>
          <h2 className="banana-section-heading">{title}</h2>
          <p className="mt-6 text-lg leading-8">{body}</p>
          <a
            className="banana-button banana-button-ink mt-8"
            href="#tool-generator"
          >
            {start}
          </a>
        </div>
      </div>
    </section>
  );
}

export function BananaSteps({
  eyebrow,
  title,
  intro,
  steps,
  start,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  steps: BananaCard[];
  start: string;
}) {
  const icons = [Pencil, ImagePlus, Settings2, Download];
  const reveal = useCardReveal();
  return (
    <section className="banana-paper banana-section banana-steps-section">
      <div
        className="banana-container banana-card-reveal"
        ref={reveal.ref}
        data-revealed={reveal.revealed}
      >
        <SectionHeading eyebrow={eyebrow} title={title} intro={intro} />
        <ol className="banana-step-grid">
          {steps.map((step, index) => {
            const Icon = icons[index];
            return (
              <li key={step.title} className="banana-step-card">
                <div className="banana-step-topline">
                  <span className="banana-step-icon">
                    <Icon aria-hidden="true" />
                  </span>
                  <span className="banana-step-number">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                </div>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
                {index < steps.length - 1 && (
                  <ArrowRight
                    className="banana-step-connector"
                    aria-hidden="true"
                  />
                )}
              </li>
            );
          })}
        </ol>
        <div className="mt-12 text-center">
          <a href="#tool-generator" className="banana-button">
            {start}
          </a>
        </div>
      </div>
    </section>
  );
}

export function BananaModelComparison({
  eyebrow,
  title,
  intro,
  models,
  labels,
  select,
  comparison,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  models: BananaModelCard[];
  labels: {
    best: string;
    references: string;
    outputSize: string;
    credits: string;
    default: string;
  };
  select: string;
  comparison: { title: string; body: string; link: string };
}) {
  const reveal = useCardReveal();
  const modelIcons = [Sparkles, ImagePlus, Layers, Zap];
  return (
    <section className="banana-section banana-model-section">
      <div
        className="banana-container banana-card-reveal"
        ref={reveal.ref}
        data-revealed={reveal.revealed}
      >
        <SectionHeading eyebrow={eyebrow} title={title} intro={intro} />
        <div
          className="banana-model-table-wrap mt-12"
          role="region"
          aria-label={title}
          tabIndex={0}
        >
          <table className="banana-model-table">
            <thead>
              <tr>
                <th scope="col">
                  <span className="banana-model-axis">{labels.best}</span>
                </th>
                {models.map((model, index) => {
                  const Icon = modelIcons[index] || Sparkles;
                  return (
                    <th
                      key={model.name}
                      scope="col"
                      data-model={model.id}
                      className={
                        model.id === 'nano-banana-2.1'
                          ? 'banana-model-selected'
                          : ''
                      }
                    >
                      <div className="banana-model-topline">
                        <span className="banana-model-icon">
                          <Icon aria-hidden="true" />
                        </span>
                        {model.id === 'nano-banana-2.1' && (
                          <span className="banana-model-default">
                            {labels.default}
                          </span>
                        )}
                      </div>
                      <div className="text-lg font-semibold">{model.name}</div>
                      <p className="text-muted-foreground mt-2 text-xs leading-5 font-normal">
                        {model.title}
                      </p>
                      <button
                        type="button"
                        onClick={() =>
                          prepareBananaGenerator({ model: model.id })
                        }
                        className="banana-model-pick mt-4 inline-flex min-h-10 items-center gap-1 text-xs font-medium"
                      >
                        {select}
                        <ArrowUpRight className="size-3" />
                      </button>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">{labels.best}</th>
                {models.map((model) => (
                  <td
                    key={model.name}
                    data-model={model.id}
                    className={
                      model.id === 'nano-banana-2.1'
                        ? 'banana-model-selected'
                        : ''
                    }
                  >
                    {model.body}
                  </td>
                ))}
              </tr>
              <tr>
                <th scope="row">{labels.references}</th>
                {models.map((model) => (
                  <td
                    key={model.name}
                    data-model={model.id}
                    className={
                      model.id === 'nano-banana-2.1'
                        ? 'banana-model-selected'
                        : ''
                    }
                  >
                    {model.references}
                  </td>
                ))}
              </tr>
              <tr>
                <th scope="row">{labels.credits}</th>
                {models.map((model) => (
                  <td
                    key={model.name}
                    data-model={model.id}
                    className={
                      model.id === 'nano-banana-2.1'
                        ? 'banana-model-selected'
                        : ''
                    }
                  >
                    {model.credits}
                  </td>
                ))}
              </tr>
              <tr>
                <th scope="row">{labels.outputSize}</th>
                {models.map((model) => (
                  <td
                    key={model.name}
                    data-model={model.id}
                    className={
                      model.id === 'nano-banana-2.1'
                        ? 'banana-model-selected'
                        : ''
                    }
                  >
                    {model.outputSize}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
        <Link href="/vs-2" className="banana-comparison-link">
          <div className="banana-comparison-visual" aria-hidden="true">
            <span>2.1</span>
            <ArrowLeftRight />
            <span>2</span>
          </div>
          <div className="banana-comparison-content">
            <h2>{comparison.title}</h2>
            <p className="text-muted-foreground mt-4 max-w-2xl leading-7">
              {comparison.body}
            </p>
            <span className="text-primary mt-5 inline-flex min-h-10 items-center gap-2 text-sm">
              {comparison.link}
              <ArrowUpRight className="size-4" />
            </span>
          </div>
          <span className="banana-comparison-arrow" aria-hidden="true">
            <ArrowUpRight />
          </span>
        </Link>
      </div>
    </section>
  );
}

export function BananaCapabilities({
  eyebrow,
  title,
  intro,
  items,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  items: BananaCard[];
}) {
  const icons = [Type, ImagePlus, Users, Layers];
  const reveal = useCardReveal();
  return (
    <section className="banana-section banana-section-compact banana-capabilities-section">
      <div
        className="banana-container banana-card-reveal"
        ref={reveal.ref}
        data-revealed={reveal.revealed}
      >
        <SectionHeading eyebrow={eyebrow} title={title} intro={intro} />
        <ul className="banana-capability-grid">
          {items.map((item, index) => {
            const Icon = icons[index];
            return (
              <li
                key={item.title}
                className={`banana-capability-card banana-capability-card-${index}`}
              >
                <div className="banana-capability-content">
                  <span className="banana-capability-icon">
                    <Icon aria-hidden="true" />
                  </span>
                  <h3>{item.title}</h3>
                  <p>{item.body}</p>
                </div>
                <CapabilitySketch kind={index} />
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

export function BananaUseCases({
  eyebrow,
  title,
  intro,
  items,
  caption,
  usePromptLabel,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  items: Array<
    BananaCard & {
      image: string;
      alt: string;
      href: string;
      selection: BananaGeneratorSelection;
    }
  >;
  caption: string;
  usePromptLabel: string;
}) {
  const icons = [ShoppingBag, Users, Type, Sparkles];
  return (
    <section className="banana-paper banana-section">
      <div className="banana-container">
        <SectionHeading eyebrow={eyebrow} title={title} intro={intro} />
        <ul className="mt-12 grid list-none gap-6 lg:grid-cols-2">
          {items.map((item, index) => {
            const Icon = icons[index];
            return (
              <li key={item.title}>
                <article className="banana-case-card border-border bg-card h-full overflow-hidden rounded-xl border">
                  <Link href={item.href} className="block">
                    <div className="overflow-hidden">
                      <img
                        src={item.image}
                        alt={item.alt}
                        width={1280}
                        height={720}
                        loading="lazy"
                        decoding="async"
                        className="aspect-video h-auto w-full object-cover"
                      />
                    </div>
                    <div className="p-6">
                      <Icon className="mb-4 size-6" aria-hidden="true" />
                      <h3 className="text-lg font-semibold">{item.title}</h3>
                      <p className="text-muted-foreground mt-3 text-sm leading-6">
                        {item.body}
                      </p>
                    </div>
                  </Link>
                  <div className="px-6 pb-6">
                    <button
                      type="button"
                      className="banana-button"
                      onClick={() => prepareBananaGenerator(item.selection)}
                    >
                      {usePromptLabel} <span aria-hidden>↗</span>
                    </button>
                  </div>
                </article>
              </li>
            );
          })}
        </ul>
        <p className="text-muted-foreground mt-5 text-xs leading-6">
          {caption}
        </p>
      </div>
    </section>
  );
}

export function BananaFaq({
  title,
  faqs,
}: {
  title: string;
  faqs: Array<{ question: string; answer: string }>;
}) {
  return (
    <section id="faq" className="banana-section">
      <div className="banana-container banana-faq-grid">
        <div>
          <span className="banana-eyebrow">FAQ</span>
          <h2 className="banana-section-heading mt-3">{title}</h2>
        </div>
        <div>
          {faqs.map((faq) => (
            <details key={faq.question} className="banana-faq-item group">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 text-base font-medium md:text-lg">
                <span>{faq.question}</span>
                <Plus
                  aria-hidden="true"
                  className="size-5 shrink-0 transition-transform group-open:rotate-45"
                />
              </summary>
              <p className="text-muted-foreground pb-5 text-sm leading-7">
                {faq.answer}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

export function BananaClosing({
  eyebrow,
  title,
  intro,
  start,
  links,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  start: string;
  links: Array<{ href: string; label: string }>;
}) {
  return (
    <section className="banana-acid banana-section text-center">
      <div className="banana-container flex flex-col items-center">
        <span className="text-sm font-medium">{eyebrow}</span>
        <h2 className="banana-section-heading mt-4 max-w-3xl">{title}</h2>
        <p className="mt-6 max-w-xl text-lg leading-8">{intro}</p>
        <a
          href="#tool-generator"
          className="banana-button banana-button-ink mt-8"
        >
          {start}
        </a>
        <nav className="mt-9 flex flex-wrap justify-center gap-x-6 gap-y-3">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="inline-flex min-h-10 items-center text-sm underline underline-offset-4"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </section>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  intro,
  children,
}: {
  eyebrow: string;
  title: string;
  intro?: string;
  children?: ReactNode;
}) {
  return (
    <div>
      <h2 className="banana-section-heading mt-3 max-w-4xl">{title}</h2>
      {intro && (
        <p className="text-muted-foreground mt-5 max-w-2xl text-base leading-7 md:text-lg">
          {intro}
        </p>
      )}
      {children}
    </div>
  );
}
