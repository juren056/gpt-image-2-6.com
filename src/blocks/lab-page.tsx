import { ArrowRight, CheckCircle2, XCircle } from 'lucide-react';

import { Link } from '@/core/i18n/navigation';
import { trackFunnelEvent } from '@/lib/analytics-events';
import { stageGeneratorPrompt } from '@/lib/prompt-navigation';
import type { LabPage as LabPageContent } from '@/content/lab-pages';

export function LabPage({ page }: { page: LabPageContent }) {
  return (
    <main className="px-4 py-12 sm:py-20">
      <article className="mx-auto max-w-4xl">
        <nav className="text-muted-foreground text-sm">
          <Link href="/">Home</Link> / <Link href="/lab">Lab</Link> /{' '}
          {page.title}
        </nav>
        <h1 className="mt-6 font-serif text-4xl tracking-tight sm:text-6xl">
          {page.title}
        </h1>
        <p className="mt-5 text-lg leading-8">{page.shortAnswer}</p>
        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          <section className="border-border rounded-2xl border p-5">
            <h2 className="font-serif text-2xl">Test goal</h2>
            <p className="text-muted-foreground mt-3 leading-7">{page.goal}</p>
          </section>
          <section className="border-border rounded-2xl border p-5">
            <h2 className="font-serif text-2xl">Settings</h2>
            <p className="text-muted-foreground mt-3 leading-7">
              {page.settings}
            </p>
          </section>
        </div>
        <section className="mt-10">
          <h2 className="font-serif text-3xl">Prompt</h2>
          <pre className="bg-muted mt-4 overflow-x-auto rounded-2xl p-5 text-sm leading-6 whitespace-pre-wrap">
            {page.prompt}
          </pre>
        </section>
        <figure className="mt-10">
          <img
            src={page.image}
            alt={page.imageAlt}
            width={1024}
            height={576}
            className="w-full rounded-3xl border object-cover"
          />
          <figcaption className="text-muted-foreground mt-3 text-sm">
            Published site example used for qualitative inspection; it is not
            presented as a controlled benchmark score.
          </figcaption>
        </figure>
        <section className="mt-10">
          <h2 className="font-serif text-3xl">Observed result</h2>
          <p className="text-muted-foreground mt-4 leading-7">
            {page.observed}
          </p>
        </section>
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <section>
            <h2 className="font-serif text-2xl">What worked</h2>
            <ul className="mt-4 space-y-3">
              {page.worked.map((item) => (
                <li key={item} className="flex gap-2">
                  <CheckCircle2 className="mt-1 size-4 shrink-0 text-emerald-600" />
                  {item}
                </li>
              ))}
            </ul>
          </section>
          <section>
            <h2 className="font-serif text-2xl">What failed or needs review</h2>
            <ul className="mt-4 space-y-3">
              {page.failed.map((item) => (
                <li key={item} className="flex gap-2">
                  <XCircle className="text-destructive mt-1 size-4 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </section>
        </div>
        <section className="mt-10">
          <h2 className="font-serif text-3xl">Improved prompt</h2>
          <pre className="bg-muted mt-4 rounded-2xl p-5 text-sm leading-6 whitespace-pre-wrap">
            {page.improvedPrompt}
          </pre>
        </section>
        <section className="mt-10">
          <h2 className="font-serif text-3xl">Conclusion</h2>
          <p className="text-muted-foreground mt-4 leading-7">
            {page.conclusion}
          </p>
        </section>
        <Link
          href="/#generator"
          onClick={() => {
            stageGeneratorPrompt(page.improvedPrompt);

            trackFunnelEvent('lab_to_generator', { test: page.slug });
          }}
          className="bg-primary text-primary-foreground mt-10 inline-flex min-h-12 items-center gap-2 rounded-full px-6 text-sm font-semibold"
        >
          Try this in Qwen Image 3 <ArrowRight className="size-4" />
        </Link>
      </article>
    </main>
  );
}
