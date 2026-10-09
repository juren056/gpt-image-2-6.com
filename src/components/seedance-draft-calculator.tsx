import { useMemo, useState } from 'react';
import { Calculator, CircleDollarSign } from 'lucide-react';

import { cn } from '@/lib/utils';
import type { SeedanceDraftModeCopy } from '@/components/seedance-draft-types';
import { Input } from '@/components/ui/input';

export function SeedanceDraftCalculator({
  copy,
}: {
  copy: SeedanceDraftModeCopy;
}) {
  const [duration, setDuration] = useState(5);
  const [drafts, setDrafts] = useState(4);
  const [attempts, setAttempts] = useState(4);
  const [draftRate, setDraftRate] = useState(0.2205);
  const [finalRate, setFinalRate] = useState(1.164);
  const estimate = useMemo(
    () => ({
      old: attempts * duration * finalRate,
      draft: drafts * duration * draftRate + duration * finalRate,
    }),
    [attempts, draftRate, drafts, duration, finalRate]
  );

  return (
    <section className="bg-muted/25 border-y px-4 py-12 sm:py-20">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[.8fr_1.2fr]">
        <div>
          <span className="bg-primary/10 text-primary flex size-12 items-center justify-center rounded-2xl">
            <Calculator className="size-5" />
          </span>
          <h2 className="mt-5 text-3xl font-semibold">
            {copy.calculatorTitle}
          </h2>
          <p className="text-muted-foreground mt-3 leading-7">
            {copy.calculatorBody}
          </p>
        </div>
        <div className="bg-card rounded-3xl border p-5 sm:p-7">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <NumberBox
              label={copy.durationLabel}
              value={duration}
              step={1}
              onChange={setDuration}
            />
            <NumberBox
              label={copy.candidatesLabel}
              value={drafts}
              step={1}
              onChange={setDrafts}
            />
            <NumberBox
              label={copy.usualAttemptsLabel}
              value={attempts}
              step={1}
              onChange={setAttempts}
            />
            <NumberBox
              label={copy.draftRateLabel}
              value={draftRate}
              step={0.0001}
              onChange={setDraftRate}
            />
            <NumberBox
              label={copy.finalRateLabel}
              value={finalRate}
              step={0.001}
              onChange={setFinalRate}
            />
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <Cost label={copy.oldCostLabel} value={estimate.old} />
            <Cost label={copy.draftCostLabel} value={estimate.draft} active />
          </div>
          <p className="text-muted-foreground mt-4 flex gap-2 text-xs leading-5">
            <CircleDollarSign className="mt-0.5 size-3.5 shrink-0" />
            {copy.estimateNote}
          </p>
        </div>
      </div>
    </section>
  );
}

function NumberBox({
  label,
  value,
  step,
  onChange,
}: {
  label: string;
  value: number;
  step: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="text-sm font-medium">
      {label}
      <Input
        type="number"
        min={0}
        max={100}
        step={step}
        value={value}
        onChange={(event) =>
          onChange(Math.max(0, Number(event.target.value) || 0))
        }
        className="mt-2 rounded-xl"
      />
    </label>
  );
}

function Cost({
  label,
  value,
  active = false,
}: {
  label: string;
  value: number;
  active?: boolean;
}) {
  return (
    <div
      className={cn(
        'rounded-2xl border p-4',
        active && 'border-primary/30 bg-primary/5'
      )}
    >
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="mt-2 text-2xl font-semibold tabular-nums">
        ${value.toFixed(2)}
      </p>
    </div>
  );
}
