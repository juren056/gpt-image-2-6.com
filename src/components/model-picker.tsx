import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import { Check, ChevronDown, Search } from 'lucide-react';

import { cn } from '@/lib/utils';
import { ModelBrandTile } from '@/components/creative-visuals';

export type ModelPickerOption = { id: string; label: string; credits?: number };

export function ModelPicker({
  value,
  options,
  onChange,
  disabled,
  ariaLabel,
  creditUnit = 'credits',
  searchLabel,
  emptyLabel,
  className,
}: {
  value?: string;
  options: ModelPickerOption[];
  onChange: (value: string) => void;
  disabled?: boolean;
  ariaLabel: string;
  creditUnit?: string;
  searchLabel?: string;
  emptyLabel?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const [position, setPosition] = useState({
    left: 16,
    top: 16,
    width: 320,
    maxHeight: 400,
  });
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listboxId = useId();
  const panelId = useId();
  const selected = options.find((option) => option.id === value) ?? options[0];
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const filteredOptions = options.filter((option) =>
    `${option.label} ${option.id}`.toLocaleLowerCase().includes(normalizedQuery)
  );
  const currentIndex = Math.min(
    activeIndex,
    Math.max(0, filteredOptions.length - 1)
  );

  const close = (restoreFocus = true) => {
    setOpen(false);
    if (restoreFocus) triggerRef.current?.focus();
  };
  const show = () => {
    setQuery('');
    setActiveIndex(
      Math.max(
        0,
        options.findIndex((option) => option.id === selected?.id)
      )
    );
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    const updatePosition = () => {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const margin = 16;
      const width = Math.min(620, window.innerWidth - margin * 2);
      const below = window.innerHeight - rect.bottom - margin - 8;
      const above = rect.top - margin - 8;
      const useAbove = below < 240 && above > below;
      const maxHeight = Math.max(120, Math.min(480, useAbove ? above : below));
      setPosition({
        left: Math.max(
          margin,
          Math.min(rect.left, window.innerWidth - width - margin)
        ),
        top: useAbove
          ? Math.max(margin, rect.top - maxHeight - 8)
          : rect.bottom + 8,
        width,
        maxHeight,
      });
    };
    updatePosition();
    searchRef.current?.focus({ preventScroll: true });
    const outside = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', outside);
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      document.removeEventListener('pointerdown', outside);
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    document
      .getElementById(`${listboxId}-${currentIndex}`)
      ?.scrollIntoView({ block: 'nearest' });
  }, [currentIndex, listboxId, open, query]);
  useEffect(() => {
    if (disabled) setOpen(false);
  }, [disabled]);

  const choose = (index: number) => {
    const option = filteredOptions[index];
    if (!option) return;
    onChange(option.id);
    close();
  };
  const onSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      close();
    } else if (event.key === 'Tab') {
      // Continue tab navigation from the trigger when the search input unmounts.
      close();
    } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (!filteredOptions.length) return;
      const direction = event.key === 'ArrowDown' ? 1 : -1;
      setActiveIndex(
        (currentIndex + direction + filteredOptions.length) %
          filteredOptions.length
      );
    } else if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      setActiveIndex(
        event.key === 'Home' ? 0 : Math.max(0, filteredOptions.length - 1)
      );
    } else if (event.key === 'Enter') {
      event.preventDefault();
      choose(currentIndex);
    }
  };

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      <button
        ref={triggerRef}
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={panelId}
        disabled={disabled || !selected}
        onClick={() => (open ? close() : show())}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault();
            show();
          } else if (event.key === 'Escape' && open) {
            event.preventDefault();
            close();
          }
        }}
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
          id={panelId}
          role="dialog"
          aria-label={ariaLabel}
          style={position}
          className="border-border bg-popover text-popover-foreground fixed z-[80] flex flex-col overflow-hidden rounded-3xl border p-3 shadow-2xl"
        >
          <div className="border-border bg-background mb-3 flex shrink-0 items-center gap-2 rounded-xl border px-3">
            <Search
              className="text-muted-foreground size-4 shrink-0"
              aria-hidden="true"
            />
            <input
              ref={searchRef}
              role="combobox"
              aria-label={searchLabel ?? ariaLabel}
              aria-expanded={open}
              aria-controls={listboxId}
              aria-autocomplete="list"
              aria-activedescendant={
                filteredOptions.length
                  ? `${listboxId}-${currentIndex}`
                  : undefined
              }
              placeholder={searchLabel ?? ariaLabel}
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setActiveIndex(0);
              }}
              onKeyDown={onSearchKeyDown}
              className="placeholder:text-muted-foreground min-h-11 min-w-0 flex-1 bg-transparent text-sm outline-none"
            />
          </div>
          <div
            id={listboxId}
            role="listbox"
            aria-label={ariaLabel}
            className="grid min-h-0 grid-cols-1 gap-2 overflow-y-auto p-0.5 sm:grid-cols-2"
          >
            {filteredOptions.map((option, index) => {
              const isSelected = option.id === selected?.id;
              return (
                <button
                  id={`${listboxId}-${index}`}
                  key={option.id}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  tabIndex={-1}
                  onPointerMove={() => setActiveIndex(index)}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => choose(index)}
                  className={cn(
                    'flex min-h-24 w-full items-center gap-3 rounded-2xl border p-3 text-left transition-colors',
                    isSelected
                      ? 'border-primary/60 bg-primary/10'
                      : 'border-border bg-background hover:bg-accent/70',
                    index === currentIndex && 'ring-primary/40 ring-2'
                  )}
                >
                  <ModelBrandTile
                    modelId={option.id}
                    className="size-11 shrink-0 rounded-xl"
                    markClassName="size-5"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm leading-snug font-semibold">
                      {option.label}
                    </span>
                    {typeof option.credits === 'number' ? (
                      <span className="text-muted-foreground mt-1 block text-xs">
                        {option.credits} {creditUnit}
                      </span>
                    ) : null}
                  </span>
                  {isSelected ? (
                    <Check
                      className="text-primary size-4 shrink-0"
                      aria-hidden="true"
                    />
                  ) : null}
                </button>
              );
            })}
          </div>
          {!filteredOptions.length ? (
            <p
              role="status"
              className="text-muted-foreground px-4 py-8 text-center text-sm"
            >
              {emptyLabel ?? searchLabel ?? ariaLabel}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
