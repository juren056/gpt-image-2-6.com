import { useEffect } from 'react';
import { ArrowRight, ImagePlus, ShieldCheck } from 'lucide-react';

import { Link } from '@/core/i18n/navigation';
import { trackFunnelEvent } from '@/lib/analytics-events';
import { cn } from '@/lib/utils';
import { m } from '@/paraglide/messages.js';
import { ToolMarketplace } from '@/blocks/tool-marketplace';
import { DotPattern } from '@/components/ui/dot-pattern';

export function Hero() {
  useEffect(() => {
    trackFunnelEvent('landing_view');
  }, []);

  const headline = m['landing.hero.headline']();
  const headlinePrefix = 'AI Image';
  const hasHeadlinePrefix = headline.startsWith(headlinePrefix);

  return (
    <section
      id="generator"
      className="relative isolate overflow-hidden px-3 pt-8 pb-12 sm:px-4 sm:pt-16 sm:pb-20"
    >
      <DotPattern
        className={cn(
          'mask-[radial-gradient(ellipse_at_top,white,transparent_72%)]',
          'text-primary/16'
        )}
      />
      <div className="bg-primary/8 absolute top-8 left-1/2 -z-10 h-80 w-80 -translate-x-1/2 rounded-full blur-3xl sm:h-[32rem] sm:w-[32rem]" />

      <div className="relative mx-auto max-w-[90rem]">
        <div className="mx-auto mb-8 max-w-4xl text-center sm:mb-10">
          <Link
            href="/ai-image-editor"
            aria-label={m['landing.hero.official_source']()}
            className="border-border bg-background/80 hover:border-primary/40 hover:text-primary mx-auto mb-5 inline-flex max-w-full items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-medium shadow-sm backdrop-blur transition-colors sm:text-xs"
          >
            <ImagePlus className="text-primary size-3.5 shrink-0" />
            <span className="bg-primary/10 text-primary rounded-full px-1.5 py-0.5 text-[10px] font-semibold tracking-wide uppercase">
              {m['landing.hero.announcement_badge']()}
            </span>
            <span className="min-w-0 text-balance">
              {m['landing.hero.eyebrow']()}
            </span>
            <ArrowRight className="size-3.5 shrink-0" aria-hidden="true" />
          </Link>
          <h1 className="text-foreground font-serif text-[2.2rem] leading-[1.08] font-normal tracking-[-0.035em] break-words sm:text-6xl sm:leading-[1.02] sm:tracking-[-0.04em] sm:text-balance lg:text-7xl">
            {hasHeadlinePrefix ? (
              <>
                <span className="block sm:inline">{headlinePrefix}</span>{' '}
                <span className="block sm:inline">
                  {headline.slice(headlinePrefix.length).trim()}
                </span>
              </>
            ) : (
              headline
            )}
          </h1>
          <p className="text-muted-foreground mx-auto mt-5 max-w-2xl text-base leading-relaxed text-balance sm:text-lg">
            {m['landing.hero.subheadline']()}
          </p>
          <p className="text-muted-foreground mx-auto mt-4 flex max-w-2xl items-center justify-center gap-2 text-xs leading-relaxed">
            <ShieldCheck className="text-primary size-4 shrink-0" />
            {m['landing.hero.disclaimer']()}
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <a
              href="#generator"
              className="bg-primary text-primary-foreground inline-flex min-h-11 items-center rounded-full px-5 text-sm font-semibold"
            >
              {m['tools.special.sign_in']()}
            </a>
            <Link
              href="/ai-image-editor"
              className="border-border bg-background inline-flex min-h-11 items-center rounded-full border px-5 text-sm font-semibold"
            >
              {m['editor.title']()}
            </Link>
          </div>
        </div>

        <ToolMarketplace />
      </div>
    </section>
  );
}
