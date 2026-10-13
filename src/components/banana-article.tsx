import { Children, type ReactNode } from 'react';
import { ArrowUpRight, Plus } from 'lucide-react';

import { Link } from '@/core/i18n/navigation';

export type NanoPageCopy = {
  path: string;
  heading: string;
  intro: string;
  title: string;
  description: string;
  sections: Array<{ id: string; title: string; paragraphs: string[] }>;
  faqs: Array<{ question: string; answer: string }>;
};

export function BananaArticle({
  page,
  copy,
  sources,
  related,
  children,
  sample,
  primaryHref,
}: {
  page: NanoPageCopy;
  copy: Record<string, string>;
  sources: readonly { label: string; href: string }[];
  related: Array<{ label: string; description: string; href: string }>;
  children?: ReactNode;
  sample?: string;
  primaryHref?: string;
}) {
  const hasContent = Children.toArray(children).length > 0;
  return (
    <main className="banana-container pb-20">
      <nav
        aria-label={copy.home}
        className="text-muted-foreground pt-6 text-sm"
      >
        <Link
          href="/"
          className="inline-flex min-h-10 items-center underline underline-offset-4"
        >
          {copy.home}
        </Link>
      </nav>
      <header className="mx-auto max-w-4xl pt-8 pb-12 text-center sm:pt-12 sm:pb-16">
        <h1 className="text-3xl leading-tight font-semibold tracking-tight whitespace-pre-line sm:text-4xl lg:text-[44px]">
          {page.heading}
        </h1>
        <p className="text-muted-foreground mx-auto mt-5 max-w-2xl text-base leading-7 sm:text-lg">
          {page.intro}
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Link
            href={
              primaryHref ?? (hasContent ? '#generator' : '/#tool-generator')
            }
            className="banana-button"
          >
            {copy.start}
          </Link>
          <Link
            href="/prompts"
            className="border-border inline-flex min-h-10 items-center rounded-lg border px-5 text-sm"
          >
            {copy.browse}
          </Link>
        </div>
      </header>
      {hasContent && (
        <div id="generator" className="scroll-mt-8">
          {children}
        </div>
      )}
      <article className="mx-auto mt-16 max-w-3xl">
        <nav
          aria-label={copy.contents}
          className="border-border mb-10 rounded-xl border p-5"
        >
          <h2 className="text-sm font-semibold">{copy.contents}</h2>
          <ul className="text-muted-foreground mt-3 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
            {page.sections.map((section) => (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  className="hover:text-foreground inline-flex min-h-10 items-center"
                >
                  {section.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <p className="text-muted-foreground mb-7 text-xs">{copy.updated}</p>
        {page.sections.map((section, index) => (
          <section
            id={section.id}
            key={section.id}
            className="border-border mb-10 scroll-mt-8 border-b pb-10"
          >
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              {section.title}
            </h2>
            {section.paragraphs.map((paragraph, i) => (
              <p
                key={i}
                className="text-muted-foreground mt-4 text-base leading-8"
              >
                {paragraph}
              </p>
            ))}
            {sample && index === 1 && (
              <pre className="bg-muted mt-6 max-w-full overflow-x-auto rounded-xl p-5 text-xs leading-6">
                <code>{sample}</code>
              </pre>
            )}
          </section>
        ))}
        <section id="questions" className="scroll-mt-8">
          <h2 className="mb-5 text-2xl font-semibold">{copy.faq}</h2>
          {page.faqs.map((faq) => (
            <details key={faq.question} className="banana-faq-item group">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 font-medium">
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
        </section>
        <section className="border-border mt-10 rounded-xl border p-5">
          <h2 className="text-sm font-semibold">{copy.sources}</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {sources.map((source) => (
              <li key={source.href}>
                <a
                  href={source.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-10 items-center gap-2 underline underline-offset-4"
                >
                  {source.label}
                  <ArrowUpRight
                    className="size-3.5 shrink-0"
                    aria-hidden="true"
                  />
                </a>
              </li>
            ))}
          </ul>
        </section>
      </article>
      <section className="border-border mt-16 border-t pt-10">
        <h2 className="text-2xl font-semibold">{copy.related}</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {related.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="border-border hover:border-primary rounded-xl border p-5 transition-colors"
            >
              <h3 className="font-semibold">{item.label}</h3>
              <p className="text-muted-foreground mt-3 text-sm leading-6">
                {item.description}
              </p>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
