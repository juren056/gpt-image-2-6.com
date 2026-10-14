import {
  CHINESE_VERIFIED_EXAMPLES,
  VERIFIED_EXAMPLES,
} from '@/config/verified-examples';
import { m } from '@/paraglide/messages.js';
import { VerifiedExamples as Gallery } from '@/components/verified-examples';

export function VerifiedExamples({ chinese = false }: { chinese?: boolean }) {
  return (
    <Gallery
      examples={chinese ? CHINESE_VERIFIED_EXAMPLES : VERIFIED_EXAMPLES}
      inline={!chinese}
      copy={{
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
      }}
    />
  );
}
