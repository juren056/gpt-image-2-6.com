import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Pause,
  Play,
  Sparkles,
} from 'lucide-react';

import { Link } from '@/core/i18n/navigation';
import { PROMPT_LIBRARY_MANIFEST } from '@/config/prompt-library-manifest';
import { trackFunnelEvent } from '@/lib/analytics-events';
import { apiGet } from '@/lib/api-client';
import { prepareBananaGenerator } from '@/lib/banana-generator-navigation';
import {
  mixHomepageShowcase,
  wrapShowcaseIndex,
  type HomepageShowcaseCatalog,
  type HomepageShowcaseItem,
  type SiteTestShowcaseItem,
} from '@/lib/homepage-showcase';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';

const HOLD_MS = 1100;
const MOVE_MS = 800;
const WINDOW_RADIUS = 6;
const MAX_AUTOMATIC_IMPRESSIONS = 12;

export function HomepageShowcaseCarousel({
  siteTests,
  copy,
}: {
  siteTests: SiteTestShowcaseItem[];
  copy: Record<string, string>;
}) {
  const sectionRef = useRef<HTMLElement>(null);
  const measuredIds = useRef(new Set<string>());
  const [inView, setInView] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [manualPaused, setManualPaused] = useState(false);
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [moveDirection, setMoveDirection] = useState<-1 | 0 | 1>(0);
  const [selected, setSelected] = useState<HomepageShowcaseItem | null>(null);
  const [brokenIds, setBrokenIds] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    const element = sectionRef.current;
    if (!element) return;
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { rootMargin: '320px 0px', threshold: 0.05 }
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(media.matches);
    const visibility = () => setPageVisible(!document.hidden);
    update();
    visibility();
    media.addEventListener('change', update);
    document.addEventListener('visibilitychange', visibility);
    return () => {
      media.removeEventListener('change', update);
      document.removeEventListener('visibilitychange', visibility);
    };
  }, []);

  const catalogQuery = useQuery({
    queryKey: ['homepage-showcase', PROMPT_LIBRARY_MANIFEST.revision],
    queryFn: () =>
      apiGet<HomepageShowcaseCatalog>(
        `/data/homepage-showcase-v1.json?v=${PROMPT_LIBRARY_MANIFEST.revision}`
      ),
    enabled: inView,
    staleTime: Infinity,
    retry: 1,
  });

  const items = useMemo(
    () =>
      mixHomepageShowcase(catalogQuery.data?.items || [], siteTests).filter(
        (item) => !brokenIds.has(item.id)
      ),
    [brokenIds, catalogQuery.data?.items, siteTests]
  );
  const safeIndex = items.length
    ? wrapShowcaseIndex(activeIndex, items.length)
    : 0;
  const activeItem = items[safeIndex];
  const spotlightId = hoveredKey || activeItem?.id || null;
  const canAutoPlay =
    inView &&
    pageVisible &&
    !reducedMotion &&
    !manualPaused &&
    !hoveredKey &&
    !selected &&
    items.length > 1;

  useEffect(() => {
    if (!canAutoPlay || moveDirection !== 0) return;
    const timer = window.setTimeout(() => setMoveDirection(1), HOLD_MS);
    return () => window.clearTimeout(timer);
  }, [canAutoPlay, moveDirection, safeIndex]);

  useEffect(() => {
    if (moveDirection === 0) return;
    const timer = window.setTimeout(
      () => {
        setActiveIndex((index) =>
          wrapShowcaseIndex(index + moveDirection, items.length)
        );
        setMoveDirection(0);
      },
      reducedMotion ? 0 : MOVE_MS
    );
    return () => window.clearTimeout(timer);
  }, [items.length, moveDirection, reducedMotion]);

  useEffect(() => {
    if (!activeItem || !inView || moveDirection !== 0) return;
    const timer = window.setTimeout(() => {
      if (
        measuredIds.current.has(activeItem.id) ||
        measuredIds.current.size >= MAX_AUTOMATIC_IMPRESSIONS
      )
        return;
      measuredIds.current.add(activeItem.id);
      trackFunnelEvent('showcase_item_viewed', {
        item_id: activeItem.id,
        item_type: activeItem.kind,
        position: safeIndex + 1,
      });
    }, 700);
    return () => window.clearTimeout(timer);
  }, [activeItem, inView, moveDirection, safeIndex]);

  function move(direction: -1 | 1) {
    if (moveDirection !== 0 || items.length < 2) return;
    if (reducedMotion) {
      setActiveIndex((index) =>
        wrapShowcaseIndex(index + direction, items.length)
      );
      return;
    }
    setMoveDirection(direction);
  }

  function openItem(item: HomepageShowcaseItem) {
    setSelected(item);
    trackFunnelEvent('showcase_item_opened', {
      item_id: item.id,
      item_type: item.kind,
    });
  }

  const slots = Array.from(
    { length: WINDOW_RADIUS * 2 + 1 },
    (_, index) => index - WINDOW_RADIUS
  );

  return (
    <section
      ref={sectionRef}
      className="homepage-showcase"
      aria-labelledby="homepage-showcase-title"
    >
      <header className="homepage-showcase__header">
        <div>
          <h2 id="homepage-showcase-title">{copy.title}</h2>
          <p>{copy.body}</p>
        </div>
        <Link href="/prompts" className="homepage-showcase__library-link">
          {copy.all}
          <ChevronRight size={16} aria-hidden="true" />
        </Link>
      </header>

      <div
        className={`homepage-showcase__viewport${reducedMotion ? 'is-reduced' : ''}`}
        onPointerLeave={() => setHoveredKey(null)}
        onPointerDown={(event) => {
          if (event.pointerType === 'touch') setManualPaused(true);
        }}
      >
        <div className="homepage-showcase__focus" aria-hidden="true" />
        <div className="homepage-showcase__track">
          {items.length > 0 &&
            slots.map((slot) => {
              const item =
                items[wrapShowcaseIndex(safeIndex + slot, items.length)];
              const cardKey = `${item.id}:${slot}`;
              const becomesCenter =
                moveDirection === 0 ? slot === 0 : slot === moveDirection;
              const spotlight = hoveredKey
                ? cardKey === hoveredKey
                : becomesCenter;
              return (
                <article
                  key={cardKey}
                  className={`homepage-showcase__card${spotlight ? 'is-spotlight' : ''}`}
                  style={
                    {
                      '--showcase-x': `calc(${(slot - moveDirection) * 100}% + ${(slot - moveDirection) * 16}px)`,
                    } as CSSProperties
                  }
                  onPointerEnter={() => setHoveredKey(cardKey)}
                  onFocus={() => setHoveredKey(cardKey)}
                  onBlur={(event) => {
                    if (!event.currentTarget.contains(event.relatedTarget))
                      setHoveredKey(null);
                  }}
                >
                  <button
                    type="button"
                    className="homepage-showcase__open"
                    onClick={() => openItem(item)}
                    aria-label={`${copy.details}: ${item.title}`}
                  >
                    <span className="homepage-showcase__image">
                      <img
                        src={item.image}
                        alt=""
                        width={item.width}
                        height={item.height}
                        loading={Math.abs(slot) <= 2 ? 'eager' : 'lazy'}
                        decoding="async"
                        onError={() =>
                          setBrokenIds((current) => {
                            const next = new Set(current);
                            next.add(item.id);
                            return next;
                          })
                        }
                      />
                    </span>
                    <span className="homepage-showcase__body">
                      <strong>{item.title}</strong>
                      <span>{item.category}</span>
                    </span>
                  </button>
                </article>
              );
            })}
        </div>
      </div>

      <div className="homepage-showcase__controls">
        <button
          type="button"
          onClick={() => move(-1)}
          aria-label={copy.previous}
        >
          <ChevronLeft size={18} aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => setManualPaused((paused) => !paused)}
          aria-label={manualPaused ? copy.play : copy.pause}
          aria-pressed={manualPaused}
        >
          {manualPaused ? (
            <Play size={16} aria-hidden="true" />
          ) : (
            <Pause size={16} aria-hidden="true" />
          )}
        </button>
        <span aria-label={`${safeIndex + 1} / ${items.length}`}>
          {(safeIndex + 1).toLocaleString()} / {items.length.toLocaleString()}
        </span>
        <button type="button" onClick={() => move(1)} aria-label={copy.next}>
          <ChevronRight size={18} aria-hidden="true" />
        </button>
      </div>

      <Dialog
        open={selected !== null}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      >
        <DialogContent className="homepage-showcase__dialog">
          {selected && (
            <>
              <img
                src={selected.image}
                alt={selected.title}
                width={selected.width}
                height={selected.height}
              />
              <div className="homepage-showcase__dialog-body">
                <DialogTitle>{selected.title}</DialogTitle>
                <DialogDescription>
                  {selected.kind === 'community'
                    ? `${selected.category} · ${selected.sourceModel}`
                    : 'Nano Banana 2.1'}
                </DialogDescription>
                <div className="homepage-showcase__dialog-actions">
                  {selected.kind === 'community' ? (
                    <Link
                      href={`/prompts?prompt=${encodeURIComponent(selected.id)}#prompt-library`}
                      className="banana-button"
                    >
                      {copy.details}
                      <ChevronRight size={16} aria-hidden="true" />
                    </Link>
                  ) : (
                    <>
                      <button
                        type="button"
                        className="banana-button"
                        onClick={() => {
                          trackFunnelEvent('showcase_prompt_used', {
                            item_id: selected.id,
                            item_type: selected.kind,
                          });
                          prepareBananaGenerator({
                            model: 'nano-banana-2.1',
                            mode:
                              selected.operation === 'edit'
                                ? 'edit'
                                : 'generate',
                            prompt: selected.prompt,
                            aspectRatio: selected.aspectRatio,
                            resolution: selected.resolution,
                            outputCount: 1,
                            imageUrls:
                              selected.operation === 'edit'
                                ? selected.inputs
                                : [],
                            scene:
                              selected.operation === 'edit'
                                ? 'product'
                                : 'poster',
                          });
                          setSelected(null);
                        }}
                      >
                        <Sparkles size={16} aria-hidden="true" />
                        {copy.use}
                      </button>
                      <a
                        href={selected.originalOutput}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="homepage-showcase__secondary"
                      >
                        <ExternalLink size={16} aria-hidden="true" />
                        {copy.original}
                      </a>
                    </>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
      <span className="sr-only">
        {spotlightId ? `${safeIndex + 1} / ${items.length}` : ''}
      </span>
    </section>
  );
}
