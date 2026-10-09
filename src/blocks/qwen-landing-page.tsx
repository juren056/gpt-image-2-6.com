import { ArrowRight } from 'lucide-react';

import { Link } from '@/core/i18n/navigation';
import { stageGeneratorPrompt } from '@/lib/prompt-navigation';
import type { QwenLanding } from '@/content/qwen-landing-pages';

export function QwenLandingPage({ page }: { page: QwenLanding }) {
  return (
    <main>
      <section className="px-4 py-14 sm:py-24">
        <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-2">
          <div>
            <nav className="text-muted-foreground text-sm">
              <Link href="/">Home</Link> / {page.title}
            </nav>
            <h1 className="mt-6 font-serif text-4xl leading-tight tracking-tight sm:text-6xl">
              {page.title}
            </h1>
            <p className="text-muted-foreground mt-5 text-lg leading-8">
              {page.description}
            </p>
            <p className="mt-5 leading-7">{page.intent}</p>
            <Link
              href="/#generator"
              onClick={() => stageGeneratorPrompt(page.prompt)}
              className="bg-primary text-primary-foreground mt-7 inline-flex min-h-12 items-center gap-2 rounded-full px-6 text-sm font-semibold"
            >
              Try this prompt <ArrowRight className="size-4" />
            </Link>
          </div>
          <img
            src={page.image}
            alt={`${page.title} example`}
            width={1024}
            height={640}
            className="w-full rounded-3xl border object-cover"
          />
        </div>
      </section>
      <section className="border-border border-y px-4 py-14 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <h2 className="font-serif text-3xl tracking-tight sm:text-4xl">
            How to get a useful result
          </h2>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {page.sections.map((section) => (
              <article
                key={section.title}
                className="border-border bg-card rounded-2xl border p-6"
              >
                <h3 className="text-lg font-semibold">{section.title}</h3>
                <p className="text-muted-foreground mt-3 leading-7">
                  {section.body}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section className="px-4 py-14 sm:py-20">
        <div className="mx-auto max-w-4xl">
          <h2 className="font-serif text-3xl tracking-tight">Example prompt</h2>
          <pre className="bg-muted mt-5 rounded-2xl p-5 text-sm leading-6 whitespace-pre-wrap">
            {page.prompt}
          </pre>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/prompts"
              className="border-border rounded-full border px-5 py-3 text-sm font-semibold"
            >
              Browse prompts
            </Link>
            <Link
              href="/lab"
              className="border-border rounded-full border px-5 py-3 text-sm font-semibold"
            >
              See real tests
            </Link>
            <Link
              href="/qwen-image-editor"
              className="border-border rounded-full border px-5 py-3 text-sm font-semibold"
            >
              Edit an image
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
