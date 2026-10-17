import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react';

import { wrapShowcaseIndex } from '@/lib/homepage-showcase';

type Direction = -1 | 0 | 1;
type EdgeIntensity = 0 | 1 | 2;

type EdgeCarouselOptions = {
  itemCount: number;
  enabled: boolean;
  paused?: boolean;
  hovered?: boolean;
  reducedMotion: boolean;
  normalHoldMs: number;
  normalMoveMs: number;
};

const EDGE_THRESHOLD = 0.16;
const FAST_EDGE_THRESHOLD = 0.075;
const EDGE_HOLD_MS: Record<Exclude<EdgeIntensity, 0>, number> = {
  1: 170,
  2: 45,
};
const EDGE_MOVE_MS: Record<Exclude<EdgeIntensity, 0>, number> = {
  1: 420,
  2: 270,
};
const SWIPE_THRESHOLD_PX = 38;

export function useEdgeCarousel({
  itemCount,
  enabled,
  paused = false,
  hovered = false,
  reducedMotion,
  normalHoldMs,
  normalMoveMs,
}: EdgeCarouselOptions) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [moveDirection, setMoveDirection] = useState<Direction>(0);
  const [edgeDirection, setEdgeDirection] = useState<Direction>(0);
  const [edgeIntensity, setEdgeIntensity] = useState<EdgeIntensity>(0);
  const touchStartRef = useRef<{
    pointerId: number;
    x: number;
    y: number;
  } | null>(null);

  const edgeActive = edgeDirection !== 0 && edgeIntensity !== 0;
  const motionDuration = reducedMotion
    ? 0
    : edgeIntensity === 2
      ? EDGE_MOVE_MS[2]
      : edgeIntensity === 1
        ? EDGE_MOVE_MS[1]
        : normalMoveMs;
  const canMove =
    enabled &&
    !paused &&
    !reducedMotion &&
    itemCount > 1 &&
    (!hovered || edgeActive);

  useEffect(() => {
    if (!canMove || moveDirection !== 0) return;
    const direction = edgeActive ? edgeDirection : 1;
    const delay = edgeActive
      ? EDGE_HOLD_MS[edgeIntensity as Exclude<EdgeIntensity, 0>]
      : normalHoldMs;
    const timer = window.setTimeout(() => setMoveDirection(direction), delay);
    return () => window.clearTimeout(timer);
  }, [
    canMove,
    edgeActive,
    edgeDirection,
    edgeIntensity,
    moveDirection,
    normalHoldMs,
  ]);

  useEffect(() => {
    if (moveDirection === 0 || itemCount < 1) return;
    const timer = window.setTimeout(() => {
      setActiveIndex((index) =>
        wrapShowcaseIndex(index + moveDirection, itemCount)
      );
      setMoveDirection(0);
    }, motionDuration);
    return () => window.clearTimeout(timer);
  }, [itemCount, motionDuration, moveDirection]);

  useEffect(() => {
    if (enabled && !paused && !reducedMotion) return;
    setEdgeDirection(0);
    setEdgeIntensity(0);
  }, [enabled, paused, reducedMotion]);

  const move = useCallback(
    (direction: -1 | 1) => {
      if (moveDirection !== 0 || itemCount < 2) return;
      if (reducedMotion) {
        setActiveIndex((index) =>
          wrapShowcaseIndex(index + direction, itemCount)
        );
        return;
      }
      setMoveDirection(direction);
    },
    [itemCount, moveDirection, reducedMotion]
  );

  const clearEdge = useCallback(() => {
    setEdgeDirection(0);
    setEdgeIntensity(0);
  }, []);

  const onPointerMove = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (event.pointerType === 'touch' || paused || reducedMotion) {
        clearEdge();
        return;
      }
      const bounds = event.currentTarget.getBoundingClientRect();
      if (bounds.width <= 0) return;
      const position = Math.min(
        1,
        Math.max(0, (event.clientX - bounds.left) / bounds.width)
      );
      const distance = Math.min(position, 1 - position);
      if (distance >= EDGE_THRESHOLD) {
        clearEdge();
        return;
      }
      setEdgeDirection(position < 0.5 ? -1 : 1);
      setEdgeIntensity(distance < FAST_EDGE_THRESHOLD ? 2 : 1);
    },
    [clearEdge, paused, reducedMotion]
  );

  const onPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (event.pointerType !== 'touch') return;
      clearEdge();
      touchStartRef.current = {
        pointerId: event.pointerId,
        x: event.clientX,
        y: event.clientY,
      };
    },
    [clearEdge]
  );

  const onPointerUp = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      const start = touchStartRef.current;
      touchStartRef.current = null;
      if (!start || start.pointerId !== event.pointerId) return;
      const deltaX = event.clientX - start.x;
      const deltaY = event.clientY - start.y;
      if (
        Math.abs(deltaX) < SWIPE_THRESHOLD_PX ||
        Math.abs(deltaX) <= Math.abs(deltaY)
      )
        return;
      move(deltaX < 0 ? 1 : -1);
    },
    [move]
  );

  const onPointerCancel = useCallback(() => {
    touchStartRef.current = null;
    clearEdge();
  }, [clearEdge]);

  return {
    activeIndex,
    setActiveIndex,
    moveDirection,
    edgeDirection,
    edgeIntensity,
    edgeActive,
    motionDuration,
    move,
    onPointerMove,
    onPointerDown,
    onPointerUp,
    onPointerCancel,
    clearEdge,
  };
}
