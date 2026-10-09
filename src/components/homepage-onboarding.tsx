import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentType,
  type CSSProperties,
} from 'react';
import {
  ArrowRight,
  Check,
  ChevronLeft,
  ImageIcon,
  Sparkles,
  X,
} from 'lucide-react';

import { m } from '@/paraglide/messages.js';
import { Button } from '@/components/ui/button';

const TARGET_PADDING = 8;
const VIEWPORT_GUTTER = 16;
const POPOVER_GAP = 18;

type GuideStep = {
  target: string;
  icon: ComponentType<{ className?: string }>;
  title: () => string;
  description: () => string;
};

type TargetBox = {
  top: number;
  left: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
};

const generatorSteps: GuideStep[] = [
  {
    target: '[data-tour="generator-prompt"]',
    icon: Sparkles,
    title: () => m['landing.onboarding.generator.step_1_title'](),
    description: () => m['landing.onboarding.generator.step_1_description'](),
  },
  {
    target: '[data-tour="generator-options"]',
    icon: ImageIcon,
    title: () => m['landing.onboarding.generator.step_2_title'](),
    description: () => m['landing.onboarding.generator.step_2_description'](),
  },
  {
    target: '[data-tour="generator-submit"]',
    icon: Check,
    title: () => m['landing.onboarding.generator.step_3_title'](),
    description: () => m['landing.onboarding.generator.step_3_description'](),
  },
];

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function TourOverlay({
  open,
  step,
  steps,
  onBack,
  onNext,
  onClose,
  lastAction,
}: {
  open: boolean;
  step: number;
  steps: GuideStep[];
  onBack: () => void;
  onNext: () => void;
  onClose: () => void;
  lastAction: string;
}) {
  const [targetBox, setTargetBox] = useState<TargetBox | null>(null);
  const [popoverSize, setPopoverSize] = useState({ width: 360, height: 230 });
  const popoverRef = useRef<HTMLDivElement>(null);
  const currentStep = steps[step];

  const updateTarget = useCallback(() => {
    const element = document.querySelector<HTMLElement>(currentStep.target);
    if (!element) {
      setTargetBox(null);
      return;
    }

    const rect = element.getBoundingClientRect();
    setTargetBox({
      top: rect.top,
      left: rect.left,
      right: rect.right,
      bottom: rect.bottom,
      width: rect.width,
      height: rect.height,
    });
  }, [currentStep.target]);

  useEffect(() => {
    if (!open) return;

    const element = document.querySelector<HTMLElement>(currentStep.target);
    element?.scrollIntoView({ behavior: 'smooth', block: 'center' });

    const frame = window.requestAnimationFrame(updateTarget);
    const settle = window.setTimeout(updateTarget, 420);
    const observer = new ResizeObserver(updateTarget);
    if (element) observer.observe(element);

    window.addEventListener('resize', updateTarget);
    window.addEventListener('scroll', updateTarget, true);
    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(settle);
      observer.disconnect();
      window.removeEventListener('resize', updateTarget);
      window.removeEventListener('scroll', updateTarget, true);
    };
  }, [currentStep.target, open, updateTarget]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose, open]);

  useLayoutEffect(() => {
    if (!popoverRef.current) return;
    const rect = popoverRef.current.getBoundingClientRect();
    setPopoverSize({ width: rect.width, height: rect.height });
  }, [step, targetBox]);

  if (!open || !targetBox) return null;

  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const padded = {
    top: Math.max(0, targetBox.top - TARGET_PADDING),
    left: Math.max(0, targetBox.left - TARGET_PADDING),
    right: Math.min(viewportWidth, targetBox.right + TARGET_PADDING),
    bottom: Math.min(viewportHeight, targetBox.bottom + TARGET_PADDING),
  };
  const spaceAbove = padded.top - VIEWPORT_GUTTER;
  const spaceBelow = viewportHeight - padded.bottom - VIEWPORT_GUTTER;
  const placeBelow =
    spaceBelow >= popoverSize.height + POPOVER_GAP || spaceBelow >= spaceAbove;
  const popoverTop = placeBelow
    ? Math.min(
        padded.bottom + POPOVER_GAP,
        viewportHeight - popoverSize.height - VIEWPORT_GUTTER
      )
    : Math.max(VIEWPORT_GUTTER, padded.top - popoverSize.height - POPOVER_GAP);
  const popoverLeft = clamp(
    targetBox.left + targetBox.width / 2 - popoverSize.width / 2,
    VIEWPORT_GUTTER,
    Math.max(
      VIEWPORT_GUTTER,
      viewportWidth - popoverSize.width - VIEWPORT_GUTTER
    )
  );
  const arrowLeft = clamp(
    targetBox.left + targetBox.width / 2 - popoverLeft,
    24,
    popoverSize.width - 24
  );
  const StepIcon = currentStep.icon;
  const overlayClass =
    'pointer-events-auto fixed z-[80] bg-black/60 backdrop-blur-[1px] transition-all duration-200';

  return (
    <div aria-live="polite">
      <div
        className={overlayClass}
        style={{ inset: `0 0 ${viewportHeight - padded.top}px 0` }}
        onClick={onClose}
      />
      <div
        className={overlayClass}
        style={{
          top: padded.top,
          left: 0,
          width: padded.left,
          height: padded.bottom - padded.top,
        }}
        onClick={onClose}
      />
      <div
        className={overlayClass}
        style={{
          top: padded.top,
          left: padded.right,
          right: 0,
          height: padded.bottom - padded.top,
        }}
        onClick={onClose}
      />
      <div
        className={overlayClass}
        style={{ top: padded.bottom, left: 0, right: 0, bottom: 0 }}
        onClick={onClose}
      />

      <div
        className="border-primary pointer-events-none fixed z-[85] rounded-2xl border-2 shadow-[0_0_0_4px_color-mix(in_oklab,var(--primary)_18%,transparent),0_16px_50px_rgba(0,0,0,.22)] transition-all duration-200"
        style={{
          top: padded.top,
          left: padded.left,
          width: padded.right - padded.left,
          height: padded.bottom - padded.top,
        }}
      />

      <div
        ref={popoverRef}
        role="dialog"
        aria-modal="true"
        aria-label={currentStep.title()}
        className="border-border bg-popover text-popover-foreground fixed z-[90] w-[min(360px,calc(100vw-32px))] rounded-2xl border p-5 shadow-2xl transition-[top,left] duration-200 sm:p-6"
        style={
          {
            top: popoverTop,
            left: popoverLeft,
            '--tour-arrow-left': `${arrowLeft}px`,
          } as CSSProperties
        }
      >
        <span
          aria-hidden="true"
          className={`border-border bg-popover absolute size-4 -translate-x-1/2 rotate-45 border ${
            placeBelow
              ? '-top-2 border-r-0 border-b-0'
              : '-bottom-2 border-t-0 border-l-0'
          }`}
          style={{ left: 'var(--tour-arrow-left)' }}
        />

        <div className="mb-4 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-xl">
              <StepIcon className="size-4" />
            </span>
            <div>
              <p className="text-primary text-[10px] font-semibold tracking-[0.14em] uppercase">
                {m['landing.onboarding.beginner_label']()}
              </p>
              <p className="text-muted-foreground mt-0.5 text-xs">
                {m['landing.onboarding.step_count']({
                  current: step + 1,
                  total: steps.length,
                })}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:bg-muted hover:text-foreground -mt-2 -mr-2 rounded-full p-2 transition-colors"
            aria-label={m['landing.onboarding.skip']()}
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="mb-4 flex gap-1.5" aria-hidden="true">
          {steps.map((item, index) => (
            <span
              key={item.target}
              className={`h-1 flex-1 rounded-full ${
                index <= step ? 'bg-primary' : 'bg-muted'
              }`}
            />
          ))}
        </div>

        <h2 className="text-lg leading-tight font-semibold">
          {currentStep.title()}
        </h2>
        <p className="text-muted-foreground mt-2 text-sm leading-6">
          {currentStep.description()}
        </p>

        <div className="mt-5 flex items-center justify-between gap-3">
          {step > 0 ? (
            <Button variant="outline" size="sm" onClick={onBack}>
              <ChevronLeft className="size-4" />
              {m['landing.onboarding.back']()}
            </Button>
          ) : (
            <Button variant="ghost" size="sm" onClick={onClose}>
              {m['landing.onboarding.skip']()}
            </Button>
          )}
          <Button size="sm" onClick={onNext} autoFocus>
            {step === steps.length - 1
              ? lastAction
              : m['landing.onboarding.next']()}
            <ArrowRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export function HomepageOnboarding({ requestId }: { requestId: number }) {
  const [generatorOpen, setGeneratorOpen] = useState(false);
  const [generatorStep, setGeneratorStep] = useState(0);

  useEffect(() => {
    if (requestId <= 0) return;
    setGeneratorStep(0);
    setGeneratorOpen(true);
  }, [requestId]);

  const closeGeneratorGuide = useCallback(() => {
    setGeneratorOpen(false);
  }, []);

  const finishGeneratorGuide = useCallback(() => {
    closeGeneratorGuide();
    window.setTimeout(() => {
      document
        .getElementById('homepage-prompt')
        ?.focus({ preventScroll: false });
    }, 150);
  }, [closeGeneratorGuide]);

  return (
    <TourOverlay
      open={generatorOpen}
      step={generatorStep}
      steps={generatorSteps}
      onBack={() => setGeneratorStep((value) => Math.max(0, value - 1))}
      onNext={() => {
        if (generatorStep === generatorSteps.length - 1) {
          finishGeneratorGuide();
        } else {
          setGeneratorStep((value) => value + 1);
        }
      }}
      onClose={closeGeneratorGuide}
      lastAction={m['landing.onboarding.try_now']()}
    />
  );
}
