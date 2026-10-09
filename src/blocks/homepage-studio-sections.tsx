import { ArrowRight, ImagePlus, Sparkles } from 'lucide-react';

import { Link } from '@/core/i18n/navigation';
import { stageGeneratorPrompt } from '@/lib/prompt-navigation';
import { STUDIO_PROMPTS } from '@/content/studio-prompts';

export function ImageEditingFeature() {
  return (
    <section className="border-border border-t px-4 py-16 sm:py-24">
      <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-2">
        <img
          src="/imgs/seo/ecommerce-campaign-board.webp"
          alt="AI Image reference editing workflow"
          width={1024}
          height={640}
          loading="lazy"
          className="w-full rounded-3xl border object-cover"
        />
        <div>
          <p className="text-primary text-xs font-semibold tracking-[.18em] uppercase">
            Image editing
          </p>
          <h2 className="mt-4 font-serif text-3xl tracking-tight sm:text-5xl">
            Change the scene, keep the subject
          </h2>
          <p className="text-muted-foreground mt-5 leading-7">
            Upload up to three references. Describe the exact edit, then name
            the product, text, crop and geometry that must remain unchanged.
          </p>
          <Link
            href="/ai-image-editor"
            className="bg-primary text-primary-foreground mt-7 inline-flex min-h-12 items-center gap-2 rounded-full px-6 text-sm font-semibold"
          >
            <ImagePlus className="size-4" />
            Edit an image
          </Link>
        </div>
      </div>
    </section>
  );
}

export function StudioPromptPreview() {
  return (
    <section
      id="prompts"
      className="bg-muted/30 border-border border-y px-4 py-16 sm:py-24"
    >
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="text-primary text-xs font-semibold tracking-[.18em] uppercase">
              Prompt library
            </p>
            <h2 className="mt-3 font-serif text-3xl tracking-tight sm:text-5xl">
              Prompts built for still images
            </h2>
            <p className="text-muted-foreground mt-4 max-w-2xl leading-7">
              Poster, typography, product, e-commerce, infographic and UI
              briefs—without camera movement or audio instructions.
            </p>
          </div>
          <Link
            href="/prompts"
            className="border-border bg-background inline-flex min-h-11 items-center gap-2 rounded-full border px-5 text-sm font-semibold"
          >
            Browse all prompts <ArrowRight className="size-4" />
          </Link>
        </div>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {STUDIO_PROMPTS.slice(0, 6).map((item) => (
            <article
              key={item.slug}
              className="border-border bg-card overflow-hidden rounded-2xl border"
            >
              <img
                src={item.image}
                alt={`${item.title} AI Image example`}
                width={640}
                height={400}
                loading="lazy"
                className="aspect-[16/10] w-full object-cover"
              />
              <div className="p-5">
                <p className="text-muted-foreground text-xs capitalize">
                  {item.category} · {item.ratio} · {item.resolution}
                </p>
                <h3 className="mt-2 text-lg font-semibold">{item.title}</h3>
                <Link
                  href="/#generator"
                  onClick={() => stageGeneratorPrompt(item.prompt)}
                  className="text-primary mt-4 inline-flex items-center gap-1 text-sm font-semibold"
                >
                  <Sparkles className="size-4" />
                  Use this prompt
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
