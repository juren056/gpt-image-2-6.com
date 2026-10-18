import { Link } from '@/core/i18n/navigation';
import { VERIFIED_OUTPUTS } from '@/config/verified-examples';
import { evidencePreviewSrcSet } from '@/lib/evidence-preview';
import { m } from '@/paraglide/messages.js';

export function SeoEditorial({ id }: { id: string }) {
  const reviews: Record<string, string> = {
    'NB-05': m['seo_editorial.nb05'](),
    'NB-06': m['seo_editorial.nb06'](),
    'NB-07': m['seo_editorial.nb07'](),
    'NB-08': m['seo_editorial.nb08'](),
    'NB-16': m['seo_editorial.nb16'](),
    'NB-17': m['seo_editorial.nb17'](),
    'NB-18': m['seo_editorial.nb18'](),
    'NB-19': m['seo_editorial.nb19'](),
  };
  const comparison = id === 'comparison' || id === 'versus2';
  const text = id === 'blogText' || id === 'chinese';
  const home = id === 'home';
  const selected = home
    ? ['NB-05', 'NB-07', 'NB-16', 'NB-17']
    : id === 'comparison'
      ? ['NB-17', 'NB-19']
      : id === 'versus2'
        ? ['NB-17', 'NB-18']
        : id === 'blogText'
          ? ['NB-05', 'NB-06', 'NB-07', 'NB-08']
          : [];
  if (
    ![
      'home',
      'comparison',
      'versus2',
      'blogText',
      'chinese',
      'mcp',
      'free',
      'pricing',
    ].includes(id)
  )
    return null;
  return (
    <section
      className="mx-auto my-12 max-w-5xl space-y-6 px-4 leading-8"
      aria-labelledby={`editorial-${id}`}
    >
      <h2 id={`editorial-${id}`} className="text-2xl font-semibold">
        {home
          ? m['seo_editorial.home_title']()
          : id === 'mcp'
            ? m['seo_editorial.mcp_title']()
            : text
              ? m['seo_editorial.fix_title']()
              : m['seo_editorial.evidence_title']()}
      </h2>
      {home && <p>{m['seo_editorial.home_body']()}</p>}
      {id === 'free' && <p>{m['seo_editorial.free_body']()}</p>}
      {id === 'pricing' && <p>{m['seo_editorial.pricing_body']()}</p>}
      {comparison && (
        <>
          <p>{m['seo_editorial.comparison_body']()}</p>
          <p>{m['seo_editorial.comparison_cost']()}</p>
        </>
      )}
      {id === 'versus2' && <p>{m['seo_editorial.updates']()}</p>}
      {text && <p>{m['seo_editorial.chinese_steps']()}</p>}
      {!!selected.length && (
        <>
          <p>{m['seo_editorial.evidence_note']()}</p>
          <div
            className={
              home
                ? 'grid gap-6 sm:grid-cols-2 lg:grid-cols-4'
                : 'grid gap-8 md:grid-cols-2'
            }
          >
            {VERIFIED_OUTPUTS.filter((item) =>
              selected.includes(item.caseId)
            ).map((item) => (
              <figure
                key={item.caseId}
                id={`case-${item.caseId}`}
                className="min-w-0 scroll-mt-8 space-y-3"
              >
                <a href={item.originalOutput}>
                  <img
                    src={item.preview}
                    srcSet={evidencePreviewSrcSet(item.preview)}
                    sizes={
                      home
                        ? '(min-width: 1024px) 240px, (min-width: 640px) 50vw, 100vw'
                        : '(min-width: 1024px) 480px, (min-width: 768px) 50vw, 100vw'
                    }
                    alt={`${item.caseId}: ${reviews[item.caseId]}`}
                    width={item.dimensions.width}
                    height={item.dimensions.height}
                    loading="lazy"
                    decoding="async"
                    className="bg-muted aspect-square w-full rounded-lg object-contain"
                  />
                </a>
                <figcaption className="text-sm leading-6">
                  <strong>{item.caseId}</strong> · {item.date} ·{' '}
                  {item.dimensions.width} × {item.dimensions.height}
                  <br />
                  {item.options.aspect_ratio} · {item.options.resolution} ·{' '}
                  {item.credits} {m['seo_editorial.credits']()}
                  <p className="mt-2">{reviews[item.caseId]}</p>
                </figcaption>
                <a
                  className="break-words underline underline-offset-4"
                  href={item.originalOutput}
                >
                  {m['seo_editorial.original']()}
                </a>
                {!home && (
                  <>
                    <p className="text-sm break-all">
                      {m['seo_editorial.endpoint']()}: <code>{item.model}</code>
                    </p>
                    <h3 className="text-base font-semibold">
                      {m['seo_editorial.prompt']()}
                    </h3>
                    <pre className="bg-muted max-w-full rounded-lg p-4 text-sm leading-6 break-words whitespace-pre-wrap">
                      <code>{item.prompt}</code>
                    </pre>
                    {!!item.inputs.length && (
                      <div>
                        <h3 className="font-semibold">
                          {m['seo_editorial.inputs']()}
                        </h3>
                        <ol className="list-inside list-decimal">
                          {item.inputs.map((url, index) => (
                            <li key={url}>
                              <a className="break-all underline" href={url}>
                                {index + 1}: {url.split('/').pop()}
                              </a>
                            </li>
                          ))}
                        </ol>
                      </div>
                    )}
                  </>
                )}
              </figure>
            ))}
          </div>
        </>
      )}
      {id === 'mcp' && (
        <>
          <p>{m['seo_editorial.mcp_intro']()}</p>
          <p>{m['seo_editorial.mcp_steps']()}</p>
          <pre className="bg-muted max-w-full overflow-x-auto rounded-lg p-4 text-sm leading-6">
            <code>
              {JSON.stringify(
                {
                  mcpServers: {
                    fal: {
                      command: 'npx',
                      args: [
                        '-y',
                        '--package=@sebgrosjean/fal@3.0.0',
                        'fal-mcp',
                      ],
                      env: { FAL_KEY: 'YOUR_FAL_KEY' },
                    },
                  },
                },
                null,
                2
              )}
            </code>
          </pre>
          <p>{m['seo_editorial.mcp_queue']()}</p>
          <p>{m['seo_editorial.mcp_errors']()}</p>
          <p>
            <a href="https://github.com/ZenCocoon/fal" className="underline">
              ZenCocoon/fal — README
            </a>{' '}
            ·{' '}
            <a
              href="https://github.com/ZenCocoon/fal/blob/main/package.json"
              className="underline"
            >
              package.json
            </a>{' '}
            ·{' '}
            <a
              href="https://github.com/ZenCocoon/fal/blob/main/LICENSE"
              className="underline"
            >
              MIT license
            </a>{' '}
            ·{' '}
            <a
              href="https://github.com/ZenCocoon/fal/blob/main/src/mcp.ts"
              className="underline"
            >
              MCP implementation
            </a>
          </p>
        </>
      )}
      {(home || comparison) && (
        <p>
          <a
            href="https://ai.google.dev/gemini-api/docs/models/gemini-nano-banana-2.1"
            className="underline"
          >
            Google: Nano Banana 2.1
          </a>{' '}
          ·{' '}
          <a
            href="https://fal.ai/models/google/nano-banana-2.1/edit/api"
            className="underline"
          >
            fal: editing schema
          </a>{' '}
          ·{' '}
          <a
            href="https://ai.google.dev/gemini-api/docs/deprecations"
            className="underline"
          >
            Google: lifecycle
          </a>
        </p>
      )}
      {text && (
        <p>
          <a
            href="https://ai.google.dev/gemini-api/docs/image-generation"
            className="underline"
          >
            Google: image generation and text limitations
          </a>
        </p>
      )}
      <nav
        aria-label={m['seo_editorial.links_title']()}
        className="flex flex-wrap gap-x-5 gap-y-3 text-sm"
      >
        <Link href="/evaluation-method" className="underline">
          {m['seo_editorial.method']()}
        </Link>
        {id !== 'comparison' && (
          <Link href="/posts/nano-banana-21-vs-pro" className="underline">
            Nano Banana 2.1 vs Pro
          </Link>
        )}
        {id !== 'versus2' && (
          <Link href="/vs-2" className="underline">
            Nano Banana 2.1 vs 2
          </Link>
        )}
        {id !== 'chinese' && (
          <Link href="/prompts/chinese" className="underline">
            {m['prompts.chinese.title']()}
          </Link>
        )}
        {id !== 'blogText' && (
          <Link href="/blog/readable-text-in-ai-images" className="underline">
            {m['nano_site.blogText.heading']()}
          </Link>
        )}
        {id !== 'pricing' && (
          <Link href="/pricing" className="underline">
            {m['nano_site.pricing.heading']()}
          </Link>
        )}
        {text && (
          <Link href="/add-text-to-image" className="underline">
            {m['nano_site.editor.heading']()}
          </Link>
        )}
        {home && (
          <Link href="/prompts" className="underline">
            {m['nano_site.prompts.heading']()}
          </Link>
        )}
      </nav>
    </section>
  );
}
