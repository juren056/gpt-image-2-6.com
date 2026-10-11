import type { ReactNode } from 'react';
import {
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
} from 'lucide-react';

import { Link } from '@/core/i18n/navigation';
import { prepareBananaGenerator } from '@/lib/banana-generator-navigation';

export type BananaCard = { title: string; body: string };
export type BananaModelCard = BananaCard & {
  id: string;
  name: string;
  references: string;
  credits: string;
  href: string;
};

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
  return (
    <section className="banana-paper banana-section">
      <div className="banana-container">
        <SectionHeading eyebrow={eyebrow} title={title} intro={intro} />
        <ol className="banana-step-grid mt-16">
          {steps.map((step, index) => {
            const Icon = icons[index];
            return (
              <li key={step.title} className="banana-step-card">
                <span className="banana-step-number">{index + 1}</span>
                <Icon aria-hidden="true" className="mx-auto mb-4 size-6" />
                <h3 className="text-lg font-semibold">{step.title}</h3>
                <p className="text-muted-foreground mt-3 text-sm leading-6">
                  {step.body}
                </p>
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
    credits: string;
    default: string;
  };
  select: string;
  comparison: { title: string; body: string; link: string };
}) {
  return (
    <section className="banana-section">
      <div className="banana-container">
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
                  <span className="sr-only">{labels.best}</span>
                </th>
                {models.map((model) => (
                  <th
                    key={model.name}
                    scope="col"
                    className={
                      model.id === 'nano-banana-pro'
                        ? 'banana-model-selected'
                        : ''
                    }
                  >
                    {model.id === 'nano-banana-pro' && (
                      <span className="mb-2 inline-block rounded-full bg-yellow-400 px-2 py-1 text-[10px] text-black">
                        {labels.default}
                      </span>
                    )}
                    <div className="text-lg font-semibold">{model.name}</div>
                    <p className="text-muted-foreground mt-2 text-xs leading-5 font-normal">
                      {model.title}
                    </p>
                    <button
                      type="button"
                      onClick={() =>
                        prepareBananaGenerator({ model: model.id })
                      }
                      className="mt-4 inline-flex min-h-10 items-center gap-1 text-xs font-medium underline underline-offset-4"
                    >
                      {select}
                      <ArrowUpRight className="size-3" />
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">{labels.best}</th>
                {models.map((model) => (
                  <td key={model.name}>{model.body}</td>
                ))}
              </tr>
              <tr>
                <th scope="row">{labels.references}</th>
                {models.map((model) => (
                  <td key={model.name}>{model.references}</td>
                ))}
              </tr>
              <tr>
                <th scope="row">{labels.credits}</th>
                {models.map((model) => (
                  <td key={model.name}>{model.credits}</td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
        <Link
          href="/vs-2"
          className="banana-comparison-link border-border mt-20 block rounded-xl border p-6 sm:p-10"
        >
          <span className="banana-eyebrow">2.1 / 2</span>
          <h2 className="mt-3 text-2xl font-semibold sm:text-3xl">
            {comparison.title}
          </h2>
          <p className="text-muted-foreground mt-4 max-w-2xl leading-7">
            {comparison.body}
          </p>
          <span className="text-primary mt-5 inline-flex min-h-10 items-center gap-2 text-sm">
            {comparison.link}
            <ArrowUpRight className="size-4" />
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
  return (
    <section className="banana-section banana-section-compact">
      <div className="banana-container">
        <SectionHeading eyebrow={eyebrow} title={title} intro={intro} />
        <ul className="mt-12 grid list-none gap-6 md:grid-cols-2">
          {items.map((item, index) => {
            const Icon = icons[index];
            return (
              <li
                key={item.title}
                className="border-border bg-card rounded-xl border p-6"
              >
                <Icon className="text-primary mb-5 size-6" aria-hidden="true" />
                <h3 className="text-lg font-semibold">{item.title}</h3>
                <p className="text-muted-foreground mt-3 text-sm leading-7">
                  {item.body}
                </p>
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
}: {
  eyebrow: string;
  title: string;
  intro: string;
  items: Array<BananaCard & { image: string; alt: string; href: string }>;
  caption: string;
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
                <Link
                  href={item.href}
                  className="banana-case-card border-border bg-card block h-full overflow-hidden rounded-xl border"
                >
                  <div className="overflow-hidden">
                    <img
                      src={item.image}
                      alt={item.alt}
                      width={800}
                      height={600}
                      loading="lazy"
                      decoding="async"
                      className="aspect-[4/3] h-auto w-full object-cover"
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
