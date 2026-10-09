import { ArrowRight } from 'lucide-react';

import { Link } from '@/core/i18n/navigation';
import { cn } from '@/lib/utils';
import { m } from '@/paraglide/messages.js';
import { buttonVariants } from '@/components/ui/button';

const CTA_BG = '/imgs/generated/cta-bg-1783598744067.png';

export function CTA() {
  return (
    <section className="px-4 pb-24 sm:pb-24">
      <div className="relative mx-auto max-w-5xl overflow-hidden rounded-3xl">
        <img
          src={CTA_BG}
          alt=""
          width={1600}
          height={600}
          className="absolute inset-0 size-full object-cover"
        />
        <div className="relative bg-black/50 px-6 py-12 text-center sm:px-10 sm:py-16">
          <h2 className="mx-auto max-w-3xl font-serif text-4xl leading-[1.1] font-medium tracking-tight text-white sm:text-5xl">
            {m['landing.cta.headline']()}
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-white/80 sm:text-lg">
            {m['landing.cta.subheadline']()}
          </p>
          <div className="mt-8 flex justify-center">
            <Link
              href="/#generator"
              className={cn(
                buttonVariants({ size: 'lg' }),
                'h-12 gap-2 rounded-full bg-white px-8 text-black hover:bg-white/90'
              )}
            >
              {m['landing.cta.button']()}
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
