import type { ReactNode } from 'react';

import { Link } from '@/core/i18n/navigation';
import {
  NANO_API_SAMPLE,
  NANO_PAGE_SOURCES,
  NANO_SITE_REVIEW_DATE,
  NANO_SITE_SOURCES,
  type NanoPageId,
} from '@/config/nano-site';
import { sitemapLastModified } from '@/config/sitemap-updates';
import { m } from '@/paraglide/messages.js';
import { BananaHome } from '@/blocks/banana-home';
import { AccountPromptLibrary } from '@/blocks/banana-prompt-library';
import { Footer } from '@/blocks/footer';
import { FreeExperience } from '@/blocks/free-experience';
import { Header } from '@/blocks/header';
import type { NanoSitePresentation } from '@/blocks/nano-site-content';
import { Pricing } from '@/blocks/pricing';
import { SeoEditorial } from '@/blocks/seo-editorial';
import { BananaArticle } from '@/components/banana-article';
import { BananaGenerator } from '@/components/banana-generator';

export function NanoSitePage({
  id,
  children,
  presentation,
}: {
  id: NanoPageId;
  children?: ReactNode;
  presentation: NanoSitePresentation;
}) {
  const { locale, copy, recipes, page, related, blogs } = presentation;
  const contentLocale = locale === 'zh' ? 'zh' : 'en';
  const hasWorkbench = [
    'home',
    'free',
    'science',
    'editor',
    'pro',
    'logo',
  ].includes(id);
  if (id === 'home')
    return <BananaHome page={page} copy={copy} recipes={recipes} />;
  return (
    <div className="nano-site bg-background text-foreground min-h-screen">
      <Header />
      <BananaArticle
        page={page}
        editorial={<SeoEditorial id={id} />}
        copy={{
          ...copy,
          updated: m['product.reviewed_date'](
            { date: sitemapLastModified(page.path, NANO_SITE_REVIEW_DATE)! },
            { locale: contentLocale }
          ),
        }}
        primaryHref={hasWorkbench ? '#generator' : '/#tool-generator'}
        sources={NANO_PAGE_SOURCES[id] || NANO_SITE_SOURCES}
        related={related}
        sample={id === 'api' ? NANO_API_SAMPLE : undefined}
      >
        {id === 'prompts' && <AccountPromptLibrary publicView />}
        {id === 'free' && <FreeExperience />}
        {hasWorkbench && (
          <BananaGenerator
            copy={copy}
            recipes={
              id === 'science' || id === 'logo'
                ? recipes.filter((recipe) => recipe.id === id)
                : recipes
            }
            initialModel={id === 'pro' ? 'nano-banana-pro' : 'nano-banana-2.1'}
            initialMode={id === 'editor' ? 'edit' : 'generate'}
            returnPath={page.path}
          />
        )}
        {id === 'pricing' && <Pricing />}
        {id === 'blog' && (
          <section className="mb-10">
            <h2 className="text-2xl font-semibold">{copy.tutorials}</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {blogs.map((item) => {
                return (
                  <Link
                    key={item.path}
                    href={item.path}
                    className="border-border hover:bg-muted rounded-xl border p-5"
                  >
                    <h3 className="font-semibold">{item.heading}</h3>
                    <p className="text-muted-foreground mt-3 text-sm leading-7">
                      {item.description}
                    </p>
                  </Link>
                );
              })}
            </div>
          </section>
        )}
        {id === 'prompts' && (
          <section className="mt-12">
            <h2 className="text-2xl font-semibold">{copy.recipes}</h2>
            <div className="mt-5 grid gap-6 md:grid-cols-2">
              {recipes.map((recipe) => (
                <article
                  key={recipe.id}
                  className="border-border rounded-xl border p-5"
                >
                  <h3 className="font-semibold">{recipe.title}</h3>
                  <p className="text-muted-foreground mt-3 text-sm leading-7">
                    {recipe.prompt}
                  </p>
                  <Link
                    href={`/?prompt=${encodeURIComponent(recipe.prompt)}#generator`}
                    className="mt-4 inline-flex min-h-11 items-center font-medium underline underline-offset-4"
                  >
                    {copy.use_prompt}
                  </Link>
                </article>
              ))}
            </div>
            <nav aria-label={copy.browse} className="mt-6 flex flex-wrap gap-4">
              {[
                'poster',
                'product',
                'typography',
                'infographic',
                'ecommerce',
                'illustration',
                'photography',
              ].map((category) => (
                <Link
                  key={category}
                  href={`/prompts/${category}`}
                  className="min-h-10 text-sm underline underline-offset-4"
                >
                  {presentation.categories[category]}
                </Link>
              ))}
            </nav>
          </section>
        )}
        {children}
      </BananaArticle>
      <Footer />
    </div>
  );
}
