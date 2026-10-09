import {
  useEffect,
  useRef,
  useState,
  type PointerEvent,
  type WheelEvent,
} from 'react';

import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';

const MIN_SCALE = 1;
const MAX_SCALE = 5;
const SCALE_STEP = 0.25;

type Point = { x: number; y: number };

export function ZoomableImageDialog({
  open,
  onOpenChange,
  imageUrl,
  alt,
  title,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageUrl?: string;
  alt: string;
  title: string;
}) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{
    pointerId: number;
    pointer: Point;
    offset: Point;
  } | null>(null);
  const [scale, setScale] = useState(MIN_SCALE);
  const [offset, setOffset] = useState<Point>({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    if (!open) return;
    setScale(MIN_SCALE);
    setOffset({ x: 0, y: 0 });
    setDragging(false);
    dragStartRef.current = null;
  }, [imageUrl, open]);

  function resetZoom() {
    setScale(MIN_SCALE);
    setOffset({ x: 0, y: 0 });
  }

  function handleWheel(event: WheelEvent<HTMLDivElement>) {
    if (!imageUrl) return;
    event.preventDefault();

    const viewport = viewportRef.current;
    if (!viewport) return;
    const rect = viewport.getBoundingClientRect();
    const pointer = {
      x: event.clientX - (rect.left + rect.width / 2),
      y: event.clientY - (rect.top + rect.height / 2),
    };

    setScale((currentScale) => {
      const direction = event.deltaY < 0 ? 1 : -1;
      const nextScale = Math.min(
        MAX_SCALE,
        Math.max(MIN_SCALE, currentScale + direction * SCALE_STEP)
      );
      if (nextScale === currentScale) return currentScale;
      if (nextScale === MIN_SCALE) {
        setOffset({ x: 0, y: 0 });
        return nextScale;
      }

      const ratio = nextScale / currentScale;
      setOffset((currentOffset) => ({
        x: pointer.x - (pointer.x - currentOffset.x) * ratio,
        y: pointer.y - (pointer.y - currentOffset.y) * ratio,
      }));
      return nextScale;
    });
  }

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    if (scale <= MIN_SCALE || event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragStartRef.current = {
      pointerId: event.pointerId,
      pointer: { x: event.clientX, y: event.clientY },
      offset,
    };
    setDragging(true);
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    const dragStart = dragStartRef.current;
    if (!dragStart || dragStart.pointerId !== event.pointerId) return;
    setOffset({
      x: dragStart.offset.x + event.clientX - dragStart.pointer.x,
      y: dragStart.offset.y + event.clientY - dragStart.pointer.y,
    });
  }

  function stopDragging(event: PointerEvent<HTMLDivElement>) {
    if (dragStartRef.current?.pointerId !== event.pointerId) return;
    dragStartRef.current = null;
    setDragging(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="h-[100dvh] max-h-[100dvh] max-w-none grid-rows-[minmax(0,1fr)] gap-0 overflow-hidden rounded-none bg-black p-0 text-white sm:h-[min(92vh,900px)] sm:max-w-6xl sm:rounded-2xl">
        <DialogTitle className="sr-only">{title}</DialogTitle>
        <div
          ref={viewportRef}
          onWheel={handleWheel}
          onDoubleClick={() => {
            if (scale > MIN_SCALE) {
              resetZoom();
            } else {
              setScale(2);
            }
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={stopDragging}
          onPointerCancel={stopDragging}
          className={`flex min-h-0 touch-none items-center justify-center overflow-hidden p-3 select-none sm:p-5 ${
            scale > MIN_SCALE
              ? dragging
                ? 'cursor-grabbing'
                : 'cursor-grab'
              : 'cursor-zoom-in'
          }`}
        >
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={alt}
              draggable={false}
              className="max-h-full max-w-full object-contain will-change-transform"
              style={{
                transform: `translate3d(${offset.x}px, ${offset.y}px, 0) scale(${scale})`,
              }}
            />
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
