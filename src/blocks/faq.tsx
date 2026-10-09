import { tDynamic } from '@/core/i18n/dynamic';
import { m } from '@/paraglide/messages.js';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const FAQ_KEYS = [
  'quality',
  'models',
  'account',
  'rewards',
  'credits',
  'commercial',
  'privacy',
] as const;

export function getHomepageFaqs(locale: string) {
  return FAQ_KEYS.map((key) => ({
    question: m[`landing.faq.${key}.question`]({}, { locale: locale as any }),
    answer: m[`landing.faq.${key}.answer`]({}, { locale: locale as any }),
  }));
}

export function FAQ({ compact = false }: { compact?: boolean }) {
  return (
    <section
      id="faq"
      className={
        compact ? 'border-border border-t px-1 py-10' : 'px-4 py-24 sm:py-32'
      }
    >
      <div className="mx-auto max-w-3xl">
        <div className={compact ? 'mb-6 text-center' : 'mb-16 text-center'}>
          <h2
            className={
              compact
                ? 'text-2xl font-semibold tracking-tight'
                : 'font-serif text-4xl font-medium tracking-tight sm:text-5xl'
            }
          >
            {m['landing.faq.title']()}
          </h2>
          <p className="text-muted-foreground mt-5">
            {m['landing.faq.description']()}
          </p>
        </div>
        <Accordion className="w-full">
          {FAQ_KEYS.map((key) => (
            <AccordionItem key={key} value={key}>
              <AccordionTrigger className="cursor-pointer py-6 text-left text-base font-medium hover:no-underline">
                {tDynamic(`landing.faq.${key}.question`)}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground pb-6 leading-relaxed">
                {tDynamic(`landing.faq.${key}.answer`)}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
