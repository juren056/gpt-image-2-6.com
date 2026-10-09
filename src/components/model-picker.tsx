import { useEffect, useId, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';

import { cn } from '@/lib/utils';
import { ModelBrandTile } from '@/components/creative-visuals';

export type ModelPickerOption = {
  id: string;
  label: string;
  credits?: number;
};

export function ModelPicker({
  value,
  options,
  onChange,
  disabled,
  ariaLabel,
  creditUnit = 'credits',
  className,
}: {
  value?: string;
  options: ModelPickerOption[];
  onChange: (value: string) => void;
  disabled?: boolean;
  ariaLabel: string;
  creditUnit?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();
  const selectedIndex = Math.max(
    0,
    options.findIndex((option) => option.id === value)
  );
  const selected = options[selectedIndex];

  useEffect(() => {
    const close = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, []);

  const choose = (index: number) => {
    const option = options[index];
    if (!option) return;
    onChange(option.id);
    setActiveIndex(index);
    setOpen(false);
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (!options.length) return;
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const direction = event.key === 'ArrowDown' ? 1 : -1;
      const start = open ? activeIndex : selectedIndex;
      setActiveIndex((start + direction + options.length) % options.length);
      setOpen(true);
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (open) choose(activeIndex);
      else {
        setActiveIndex(selectedIndex);
        setOpen(true);
      }
    } else if (event.key === 'Escape') {
      setOpen(false);
    } else if (event.key === 'Home' && open) {
      event.preventDefault();
      setActiveIndex(0);
    } else if (event.key === 'End' && open) {
      event.preventDefault();
      setActiveIndex(options.length - 1);
    }
  };

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      <button
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        disabled={disabled || !selected}
        onClick={() => {
          setActiveIndex(selectedIndex);
          setOpen((current) => !current);
        }}
        onKeyDown={onKeyDown}
        className="border-border bg-background focus-visible:ring-primary/25 hover:border-primary/35 flex min-h-12 w-full items-center gap-3 rounded-2xl border px-2.5 text-left shadow-sm transition focus-visible:ring-4 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60"
      >
        {selected ? (
          <ModelBrandTile
            modelId={selected.id}
            className="size-8 rounded-lg"
            markClassName="size-4"
          />
        ) : null}
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold">
            {selected?.label || ariaLabel}
          </span>
          {typeof selected?.credits === 'number' ? (
            <span className="text-muted-foreground block text-[11px]">
              {selected.credits} {creditUnit}
            </span>
          ) : null}
        </span>
        <ChevronDown
          className={cn(
            'text-muted-foreground size-4 shrink-0 transition-transform',
            open && 'rotate-180'
          )}
          aria-hidden="true"
        />
      </button>

      {open ? (
        <div
          id={listboxId}
          role="listbox"
          aria-label={ariaLabel}
          className="border-border bg-popover absolute z-40 mt-2 max-h-80 w-full overflow-y-auto rounded-2xl border p-1.5 shadow-2xl"
        >
          {options.map((option, index) => {
            const isSelected = option.id === value;
            const isActive = index === activeIndex;
            return (
              <button
                key={option.id}
                type="button"
                role="option"
                aria-selected={isSelected}
                onPointerMove={() => setActiveIndex(index)}
                onClick={() => choose(index)}
                className={cn(
                  'flex min-h-12 w-full items-center gap-3 rounded-xl px-2.5 text-left transition-colors',
                  isActive ? 'bg-accent' : 'hover:bg-accent/70'
                )}
              >
                <ModelBrandTile
                  modelId={option.id}
                  className="size-8 rounded-lg"
                  markClassName="size-4"
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">
                    {option.label}
                  </span>
                  {typeof option.credits === 'number' ? (
                    <span className="text-muted-foreground text-[11px]">
                      {option.credits} {creditUnit}
                    </span>
                  ) : null}
                </span>
                {isSelected ? (
                  <Check className="text-primary size-4" aria-hidden="true" />
                ) : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
