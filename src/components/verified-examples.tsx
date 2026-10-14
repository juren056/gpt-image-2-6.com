import { Link } from '@/core/i18n/navigation';
import { trackFunnelEvent } from '@/lib/analytics-events';
import { prepareBananaGenerator } from '@/lib/banana-generator-navigation';
import { publicRecipeHref } from '@/lib/generator-entry';

export type VerifiedExample = {
  caseId: string;
  prompt: string;
  model: string;
  credits: number;
  originalOutput: string;
  preview: string;
  inputs: string[];
  operation: string;
  options: { aspect_ratio?: string; resolution: string };
  dimensions: { width: number; height: number };
};
export function VerifiedExamples({
  examples,
  copy,
  inline = true,
}: {
  examples: VerifiedExample[];
  copy: Record<string, string>;
  inline?: boolean;
}) {
  return (
    <section
      className="border-border mt-8 border-t pt-6"
      aria-label={copy.title}
    >
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="text-xl font-semibold">{copy.title}</h2>
        <Link
          href="/evaluation-method"
          className="inline-flex min-h-10 items-center text-sm underline underline-offset-4"
        >
          {copy.all}
        </Link>
      </div>
      <p className="text-muted-foreground mb-5 max-w-3xl text-sm leading-6">
        {copy.note}
      </p>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {examples.map((item) => (
          <article key={item.caseId} className="min-w-0">
            <a
              href={item.originalOutput}
              onClick={() =>
                trackFunnelEvent('evidence_opened', {
                  case_id: item.caseId,
                  source: 'gallery',
                })
              }
              aria-label={`${copy.original} ${item.caseId}`}
            >
              <img
                src={item.preview}
                alt={`${copy[item.caseId]} — ${item.caseId}`}
                width={item.dimensions.width}
                height={item.dimensions.height}
                loading="lazy"
                className="bg-muted aspect-square w-full rounded-lg object-contain"
              />
            </a>
            <h3 className="mt-3 text-sm font-semibold">{copy[item.caseId]}</h3>
            <p className="text-muted-foreground mt-1 text-xs leading-5">
              {item.caseId} · Nano Banana 2.1 · {item.credits} {copy.credits}
              <br />
              {item.options.aspect_ratio || '1:1'} · {item.options.resolution} ·{' '}
              {item.dimensions.width} × {item.dimensions.height} · 2026-10-13
            </p>
            <div className="mt-2 flex flex-wrap gap-x-3 gap-y-2 text-sm">
              <a
                href={item.originalOutput}
                className="inline-flex min-h-10 items-center underline underline-offset-4"
              >
                {copy.original}
              </a>
              {inline ? (
                <button
                  type="button"
                  className="inline-flex min-h-10 items-center underline underline-offset-4"
                  onClick={() =>
                    prepareBananaGenerator({
                      model: 'nano-banana-2.1',
                      mode: item.operation === 'edit' ? 'edit' : 'generate',
                      prompt: item.prompt,
                      aspectRatio: item.options.aspect_ratio,
                      resolution: item.options.resolution,
                      outputCount: 1,
                      imageUrls: item.operation === 'edit' ? item.inputs : [],
                      scene: item.operation === 'edit' ? 'product' : 'poster',
                    })
                  }
                >
                  {copy.use}
                </button>
              ) : (
                <Link
                  href={publicRecipeHref(item.caseId)}
                  className="inline-flex min-h-10 items-center underline underline-offset-4"
                >
                  {copy.use}
                </Link>
              )}
            </div>
            {!inline && (
              <details className="mt-3 text-sm leading-6">
                <summary className="cursor-pointer">{copy.prompt}</summary>
                <p className="mt-2 break-words">{item.prompt}</p>
                <p className="text-muted-foreground mt-2">{copy.boundary}</p>
              </details>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
