import { useState } from 'react';
import {
  ArrowRight,
  Check,
  LockKeyhole,
  Play,
  Sparkles,
  Upload,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import type { SeedanceDraftModeCopy } from '@/components/seedance-draft-types';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

export function SeedanceDraftWorkspace({
  copy,
}: {
  copy: SeedanceDraftModeCopy;
}) {
  const [duration, setDuration] = useState(5);
  const [ratio, setRatio] = useState('16:9');
  const [count, setCount] = useState(4);
  const [files, setFiles] = useState<string[]>([]);

  return (
    <section className="px-4 py-12 sm:py-20">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 max-w-3xl">
          <h2 className="text-3xl font-semibold">{copy.workspaceTitle}</h2>
          <p className="text-muted-foreground mt-3 leading-7">
            {copy.workspaceDescription}
          </p>
        </header>
        <div className="bg-card grid overflow-hidden rounded-[2rem] border shadow-xl shadow-black/5 lg:grid-cols-[.92fr_1.08fr]">
          <div className="space-y-6 border-b p-5 sm:p-8 lg:border-r lg:border-b-0">
            <label className="block text-sm font-semibold">
              {copy.promptLabel}
              <Textarea
                maxLength={5000}
                placeholder={copy.promptPlaceholder}
                className="mt-2 min-h-36 rounded-2xl p-4 leading-6"
              />
            </label>
            <div>
              <p className="text-sm font-semibold">{copy.referencesLabel}</p>
              <label className="bg-muted/25 hover:border-primary/40 mt-2 flex cursor-pointer items-center gap-3 rounded-2xl border border-dashed p-4 transition-colors">
                <span className="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-xl">
                  <Upload className="size-4" />
                </span>
                <span className="min-w-0 text-sm font-medium">
                  {copy.referencesHint}
                  {files.length ? (
                    <small className="text-muted-foreground mt-1 block truncate">
                      {files.join(', ')}
                    </small>
                  ) : null}
                </span>
                <input
                  className="sr-only"
                  type="file"
                  multiple
                  accept="image/*,video/*,audio/*"
                  onChange={(event) =>
                    setFiles(
                      Array.from(event.target.files ?? []).map(
                        (file) => file.name
                      )
                    )
                  }
                />
              </label>
            </div>
            <Choices
              label={copy.durationLabel}
              values={['5', '10', '15', '30']}
              value={String(duration)}
              onChange={(value) => setDuration(Number(value))}
              suffix="s"
            />
            <Choices
              label={copy.ratioLabel}
              values={['16:9', '9:16', '1:1']}
              value={ratio}
              onChange={setRatio}
            />
            <Choices
              label={copy.candidatesLabel}
              values={['2', '4', '8']}
              value={String(count)}
              onChange={(value) => setCount(Number(value))}
            />
            <Button disabled className="h-12 w-full rounded-xl">
              <Sparkles className="size-4" />
              {copy.draftAction}
            </Button>
            <p className="text-muted-foreground flex gap-2 text-xs leading-5">
              <LockKeyhole className="mt-0.5 size-3.5 shrink-0" />
              {copy.unavailableNote}
            </p>
          </div>
          <div className="bg-muted/20 p-5 sm:p-8">
            <div className="flex justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold">
                  {copy.comparisonTitle}
                </h3>
                <p className="text-muted-foreground mt-2 text-sm leading-6">
                  {copy.comparisonBody}
                </p>
              </div>
              <span className="bg-background hidden h-fit rounded-full border px-3 py-1 text-xs sm:block">
                {count} × {duration}s · {ratio}
              </span>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {Array.from({ length: count }, (_, index) => (
                <Candidate key={index} index={index} copy={copy} />
              ))}
            </div>
            <div className="bg-background mt-6 rounded-2xl border p-5">
              <h3 className="font-semibold">{copy.finalTitle}</h3>
              <p className="text-muted-foreground mt-1 text-sm leading-6">
                {copy.finalBody}
              </p>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <Button variant="outline" disabled>
                  <Check className="size-4" />
                  {copy.selectLabel}
                </Button>
                <Button disabled>
                  {copy.finalAction}
                  <ArrowRight className="size-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Choices({
  label,
  values,
  value,
  onChange,
  suffix = '',
}: {
  label: string;
  values: string[];
  value: string;
  onChange: (value: string) => void;
  suffix?: string;
}) {
  return (
    <fieldset>
      <legend className="text-sm font-semibold">{label}</legend>
      <div className="mt-2 flex flex-wrap gap-2">
        {values.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            className={cn(
              'h-10 min-w-16 rounded-xl border px-3 text-sm font-medium transition-colors',
              value === option
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border hover:border-primary/40'
            )}
          >
            {option}
            {suffix}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

function Candidate({
  index,
  copy,
}: {
  index: number;
  copy: SeedanceDraftModeCopy;
}) {
  const colors = [
    'from-violet-950 to-blue-950',
    'from-orange-950 to-slate-950',
    'from-emerald-950 to-slate-950',
    'from-indigo-950 to-fuchsia-950',
  ];
  return (
    <div
      className={cn(
        'relative aspect-video overflow-hidden rounded-2xl border bg-linear-to-br',
        colors[index % colors.length]
      )}
    >
      <div className="absolute inset-0 [background-image:radial-gradient(circle_at_35%_35%,rgba(255,255,255,.25),transparent_30%)] opacity-60" />
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="flex size-11 items-center justify-center rounded-full bg-white/15 text-white">
          <Play className="size-4 fill-current" />
        </span>
      </div>
      <div className="absolute inset-x-0 bottom-0 flex justify-between bg-linear-to-t from-black/90 to-transparent p-3 pt-10 text-xs text-white">
        <b>
          {copy.candidateLabel} {index + 1}
        </b>
        <span className="text-white/60">{copy.waitingLabel}</span>
      </div>
    </div>
  );
}
