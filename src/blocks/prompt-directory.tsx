import { Link } from '@/core/i18n/navigation';
import { m } from '@/paraglide/messages.js';
import { PromptLibrary } from '@/blocks/prompt-library';
import {
  PROMPT_CATEGORIES,
  type PromptCategory,
} from '@/content/studio-prompts';

export function PromptDirectory({ category }: { category?: PromptCategory }) {
  return (
    <main className="min-w-0 overflow-x-hidden px-4 py-12 sm:py-20">
      <div className="mx-auto w-full max-w-7xl min-w-0">
        <div className="max-w-3xl">
          <p className="text-primary text-xs font-semibold tracking-[.18em] uppercase">
            {m['prompts.eyebrow']()}
          </p>
          <h1 className="mt-4 font-serif text-4xl tracking-tight sm:text-6xl">
            {category
              ? m['prompts.category_title']({ category })
              : m['prompts.title']()}
          </h1>
          <p className="text-muted-foreground mt-5 max-w-2xl leading-7">
            {m['prompts.description']()}
          </p>
          {!category ? (
            <nav
              className="mt-7 flex flex-wrap gap-2"
              aria-label="Image prompt categories"
            >
              {PROMPT_CATEGORIES.map((item) => (
                <Link
                  key={item}
                  href={'/prompts/' + item}
                  className="border-border bg-card hover:border-primary/40 hover:text-primary rounded-full border px-4 py-2 text-sm font-medium transition"
                >
                  {item
                    .split('-')
                    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
                    .join(' ')}
                </Link>
              ))}
            </nav>
          ) : null}
        </div>
      </div>
      <PromptLibrary showIntro={false} category={category} />
    </main>
  );
}
