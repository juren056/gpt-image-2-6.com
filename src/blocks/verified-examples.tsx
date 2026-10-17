import {
  CHINESE_VERIFIED_EXAMPLES,
  VERIFIED_EXAMPLES,
} from '@/config/verified-examples';
import { m } from '@/paraglide/messages.js';
import { HomepageShowcaseCarousel } from '@/components/homepage-showcase-carousel';
import { VerifiedExamples as Gallery } from '@/components/verified-examples';

import '@/styles/homepage-showcase.css';

export function VerifiedExamples({ chinese = false }: { chinese?: boolean }) {
  const copy = {
    title: m['evidence.gallery.title'](),
    all: m['evidence.gallery.all'](),
    note: m['evidence.gallery.note'](),
    original: m['evidence.gallery.original'](),
    credits: m['evidence.gallery.credits'](),
    use: m['evidence.gallery.use'](),
    'NB-05': m['evidence.gallery.NB05'](),
    'NB-06': m['evidence.gallery.NB06'](),
    'NB-08': m['evidence.gallery.NB08'](),
    'NB-07': m['evidence.gallery.NB07'](),
    'NB-16': m['evidence.gallery.NB16'](),
    'NB-17': m['evidence.gallery.NB17'](),
    prompt: m['evidence.gallery.prompt'](),
    boundary: m['evidence.gallery.boundary'](),
  };

  if (!chinese)
    return (
      <HomepageShowcaseCarousel
        siteTests={VERIFIED_EXAMPLES.map((item) => ({
          id: item.caseId,
          title: copy[item.caseId as keyof typeof copy],
          image: item.preview,
          width: item.dimensions.width,
          height: item.dimensions.height,
          category: item.operation === 'edit' ? 'Image editing' : 'Generation',
          sourceModel: 'Nano Banana 2.1',
          kind: 'site-test' as const,
          originalOutput: item.originalOutput,
          prompt: item.prompt,
          operation: item.operation,
          aspectRatio: item.options.aspect_ratio,
          resolution: item.options.resolution,
          inputs: item.inputs,
        }))}
        copy={{
          title: m['homepage_showcase.title'](),
          body: m['homepage_showcase.body'](),
          pause: m['homepage_showcase.pause'](),
          play: m['homepage_showcase.play'](),
          previous: m['homepage_showcase.previous'](),
          next: m['homepage_showcase.next'](),
          details: m['homepage_showcase.details'](),
          all: m['homepage_showcase.all'](),
          use: copy.use,
          original: copy.original,
        }}
      />
    );

  return (
    <Gallery
      examples={chinese ? CHINESE_VERIFIED_EXAMPLES : VERIFIED_EXAMPLES}
      inline={!chinese}
      copy={copy}
    />
  );
}
