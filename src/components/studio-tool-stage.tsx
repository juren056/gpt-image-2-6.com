import { useState, type ReactNode } from 'react';
import {
  ArrowRight,
  Download,
  ImagePlus,
  Layers,
  Loader2,
  Scan,
  SlidersHorizontal,
} from 'lucide-react';

import { Link } from '@/core/i18n/navigation';
import type { CreativeToolId } from '@/config/creative-tools';
import { PROMPT_LIBRARY_MANIFEST } from '@/config/prompt-library-manifest';
import type { StudioDeskCopy, StudioToolDraft } from '@/lib/studio-desk';

export function StudioToolStage({
  toolId,
  copy,
  source,
  result,
  draft,
  drawing,
  children,
  onPrompt,
  outputs = [],
  statuses = [],
  queuedInputs = [],
  isWorking = false,
}: {
  toolId: CreativeToolId;
  copy: StudioDeskCopy;
  source?: string;
  result?: string;
  draft: StudioToolDraft;
  drawing?: ReactNode;
  children: ReactNode;
  onPrompt: (prompt: string) => void;
  outputs?: Array<{ name: string; url: string }>;
  statuses?: string[];
  queuedInputs?: Array<{ name: string; url: string }>;
  isWorking?: boolean;
}) {
  const [compare, setCompare] = useState(50);
  const picture = (url: string | undefined, label: string, checker = false) => (
    <figure className={`studio-picture ${checker ? 'studio-checker' : ''}`}>
      {url ? (
        <img src={url} alt={label} />
      ) : (
        <div className="studio-picture-empty">
          <ImagePlus />
          <span>{copy.pending}</span>
        </div>
      )}
      <figcaption>{label}</figcaption>
    </figure>
  );
  if (toolId === 'T01' && !result) {
    const examples = PROMPT_LIBRARY_MANIFEST.featured
      .filter((item) => !item.referenceRequired)
      .slice(0, 3);
    return (
      <div className="studio-generation-start">
        <div className="studio-start-title">
          <ImagePlus />
          <h2>{copy.empty}</h2>
          <p>{copy.hint}</p>
        </div>
        <div className="studio-inspiration">
          <h3>{copy.examples}</h3>
          <div>
            {examples.map((item) => (
              <button
                type="button"
                key={item.id}
                onClick={() => onPrompt(item.prompt)}
              >
                <img
                  src={item.image}
                  alt={item.title}
                  loading="lazy"
                  width={300}
                  height={220}
                />
                <strong>{item.title}</strong>
                <span>
                  {item.sourceModel} · {item.license}
                </span>
              </button>
            ))}
          </div>
          <Link href="/settings/prompts">
            {copy.library}
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    );
  }
  if (['T02', 'T03', 'T06', 'T10', 'T18'].includes(toolId))
    return (
      <div className="studio-compare-stage">
        <div className="studio-stage-caption">
          <SlidersHorizontal size={16} />
          <span>{copy.hint}</span>
        </div>
        {source && result && toolId === 'T10' ? (
          <div className="studio-detail-compare">
            <img src={source} alt={copy.source} />
            <img
              src={result}
              alt={copy.result}
              style={{ clipPath: `inset(0 0 0 ${compare}%)` }}
            />
            <div
              className="studio-compare-line"
              style={{ left: `${compare}%` }}
            />
            <label>
              {copy.compare}
              <input
                aria-label={copy.compare}
                type="range"
                min="0"
                max="100"
                value={compare}
                onChange={(e) => setCompare(Number(e.target.value))}
              />
            </label>
          </div>
        ) : (
          <div className="studio-compare-grid">
            {picture(source, copy.source)}
            {picture(result, copy.result, toolId === 'T03')}
          </div>
        )}
        {toolId === 'T03' && (
          <p className="studio-stage-note">{copy.transparency}</p>
        )}
      </div>
    );
  if (['T07', 'T08', 'T22', 'T23'].includes(toolId))
    return (
      <div className="studio-drawing-stage">
        <p className="studio-stage-caption">{copy.hint}</p>
        {drawing}
        {result && (
          <div className="studio-drawing-result">
            {picture(result, copy.result)}
          </div>
        )}
      </div>
    );
  if (toolId === 'T09')
    return (
      <div className="studio-boundary-stage">
        <p>{copy.hint}</p>
        <div
          className="studio-checker studio-boundary"
          style={{
            aspectRatio: `${(draft.x || 50) * 20}/${(draft.y || 78) * 20}`,
          }}
        >
          {source ? <img src={source} alt={copy.source} /> : <ImagePlus />}
          <span>
            {(draft.x || 50) * 20} × {(draft.y || 78) * 20}
          </span>
        </div>
        <p className="studio-stage-note">{copy.layoutPreview}</p>
        {result && picture(result, copy.result)}
      </div>
    );
  if (toolId === 'T15') {
    const sizes =
      draft.outputSet === 'youtube'
        ? [
            ['1280 × 720', 16 / 9],
            ['1080 × 1080', 1],
          ]
        : draft.outputSet === 'store'
          ? [
              ['1200 × 1200', 1],
              ['1600 × 900', 16 / 9],
            ]
          : [
              ['1080 × 1080', 1],
              ['1080 × 1920', 9 / 16],
            ];
    return (
      <div className="studio-size-stage">
        <p>{copy.hint}</p>
        <div>
          {sizes.map(([label, ratio]) => (
            <figure key={label}>
              <div
                className="studio-checker"
                style={{
                  aspectRatio: String(ratio),
                  backgroundColor:
                    draft.fit === 'extend' ? draft.color2 : undefined,
                }}
              >
                {source ? (
                  <img
                    src={source}
                    alt={String(label)}
                    style={{
                      objectFit: draft.fit === 'cover' ? 'cover' : 'contain',
                    }}
                  />
                ) : (
                  <ImagePlus />
                )}
              </div>
              <figcaption>{label}</figcaption>
            </figure>
          ))}
        </div>
        <p className="studio-stage-note">{copy.layoutPreview}</p>
      </div>
    );
  }
  if (toolId === 'T16')
    return (
      <div className="studio-brand-sheet">
        {draft.brandLogoUrl && (
          <img
            className="studio-brand-logo"
            src={draft.brandLogoUrl}
            alt={copy.brandLogo}
          />
        )}
        <h2 style={{ fontFamily: draft.brand?.font || 'Inter' }}>
          {draft.brand?.name || copy.empty}
        </h2>
        <p>{copy.hint}</p>
        <div className="studio-brand-palette">
          {[
            draft.brand?.primary || '#facc15',
            draft.brand?.secondary || '#f5efe8',
          ].map((color, i) => (
            <div key={i}>
              <div style={{ background: color }} />
              <span>{color}</span>
            </div>
          ))}
        </div>
        <div
          className="studio-brand-type"
          style={{ fontFamily: draft.brand?.font || 'Inter' }}
        >
          Aa Bb Cc
          <br />
          <small>{draft.brand?.font || 'Inter'}</small>
        </div>
      </div>
    );
  if (toolId === 'T24')
    return (
      <div className="studio-recipe-document">
        <h2>{draft.template || copy.empty}</h2>
        <p>{copy.hint}</p>
        <div className="studio-recipe-variables">
          <span>{'{brand}'}</span>
          <span>{'{audience}'}</span>
        </div>
        <blockquote>{draft.prompt || copy.pending}</blockquote>
        <p className="studio-stage-note">{copy.recipePrivate}</p>
      </div>
    );
  if (['T14', 'T17', 'T25'].includes(toolId)) {
    return (
      <div className={`studio-deliverables studio-deliverables-${toolId}`}>
        <h2>{copy.empty}</h2>
        <p>{copy.hint}</p>
        {toolId === 'T25' && (
          <ol className="studio-flow-sequence">
            {draft.steps?.map((step, i) => (
              <li key={`${step}-${i}`}>
                <span>{i + 1}</span>
                {step}
              </li>
            ))}
          </ol>
        )}
        {toolId === 'T17' && (
          <div className="studio-shot-list">
            {draft.selectedOutputs?.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        )}
        {toolId === 'T14' && queuedInputs.length > 0 && (
          <section className="studio-input-queue" aria-label={copy.queue}>
            <h3>
              {copy.queue} · {queuedInputs.length}
            </h3>
            <ul>
              {queuedInputs.map((item, i) => (
                <li key={`${item.name}-${i}`}>
                  {item.url && <img src={item.url} alt={item.name} />}
                  <span>{item.name}</span>
                </li>
              ))}
            </ul>
          </section>
        )}
        {isWorking && (
          <p className="studio-stage-progress" role="status">
            <Loader2 className="animate-spin" size={18} />
            {copy.processing}
          </p>
        )}
        {statuses.length > 0 && (
          <section className="studio-run-log" aria-label={copy.runLog}>
            <h3>{copy.runLog}</h3>
            <ul>
              {statuses.map((status, i) => (
                <li
                  key={`${status}-${i}`}
                  data-state={
                    status.includes('failed')
                      ? 'failed'
                      : status.includes('completed')
                        ? 'completed'
                        : 'pending'
                  }
                >
                  {status}
                </li>
              ))}
            </ul>
          </section>
        )}
        <section className="studio-contact-sheet" aria-label={copy.results}>
          <h3>
            {copy.results} · {outputs.length}
          </h3>
          {outputs.length ? (
            <div>
              {outputs.map((output, i) => (
                <figure key={`${output.name}-${i}`}>
                  <a
                    href={output.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${copy.inspect}: ${output.name}`}
                  >
                    <img
                      src={output.url}
                      alt={output.name}
                      loading="lazy"
                      width={360}
                      height={270}
                    />
                  </a>
                  <figcaption>
                    <span>{output.name}</span>
                    <a href={output.url} download={output.name}>
                      <Download size={16} />
                      {copy.download}
                    </a>
                  </figcaption>
                </figure>
              ))}
            </div>
          ) : (
            <p className="studio-stage-note">{copy.pending}</p>
          )}
        </section>
      </div>
    );
  }
  if (['T20', 'T21'].includes(toolId))
    return (
      <div className={`studio-board studio-board-${toolId}`}>
        <div className="studio-board-heading">
          {toolId === 'T25' ? <Layers /> : <Scan />}
          <h2>{copy.empty}</h2>
          <p>{copy.hint}</p>
        </div>
        {toolId === 'T21' && (
          <div className="studio-template-sheet">
            <h3>{draft.template}</h3>
            <p>{draft.brand?.name || copy.project}</p>
            <Link href="/settings/prompts">
              {copy.library}
              <ArrowRight size={16} />
            </Link>
          </div>
        )}
        {result ? picture(result, copy.result) : children}
      </div>
    );
  return (
    <div className={`studio-artboard studio-artboard-${toolId}`}>
      <p className="studio-stage-caption">{copy.hint}</p>
      {toolId === 'T19' ? (
        children
      ) : !source && !result ? (
        <div className="studio-artboard-empty">
          <ImagePlus />
          <h2>{copy.empty}</h2>
          <p>{copy.uploadHint}</p>
        </div>
      ) : (
        children
      )}
    </div>
  );
}
