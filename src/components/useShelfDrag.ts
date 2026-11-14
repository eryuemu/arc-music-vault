import { useEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { flushSync } from 'react-dom';

interface Slot {
  id: string;
  center: number;
}

export function useShelfDrag(onMove: (id: string, target: string) => void) {
  const [active, setActive] = useState<{ id: string; target: string } | null>(null);
  const stopDrag = useRef<(() => void) | null>(null);

  useEffect(() => () => stopDrag.current?.(), []);

  const handle = (id: string) => ({
    onPointerDown(event: ReactPointerEvent<HTMLElement>) {
      if (event.button !== 0 || stopDrag.current) return;
      const item = event.currentTarget.closest<HTMLElement>('[data-sort-album]');
      const dragSurface = item?.querySelector<HTMLElement>('[data-drag-surface]');
      const list = item?.parentElement;
      const horizontal = list?.hasAttribute('data-shelf-scroll');
      const viewport = horizontal ? list : list?.closest<HTMLElement>('main[data-view]');
      if (!item || !dragSurface || !list || !viewport) return;

      const surface = dragSurface;
      const rect = surface.getBoundingClientRect();
      const scrolled = () => horizontal ? viewport.scrollLeft : viewport.scrollTop;
      const startScroll = scrolled();
      const start = { x: event.clientX, y: event.clientY };
      let x = start.x;
      let y = start.y;
      let frame = 0;
      let target = id;
      let inside = true;
      let ghost: HTMLElement | undefined;
      const pointerId = event.pointerId;
      // Keep the original slot centers stable while the visible books change places.
      const anchor = () => {
        const bounds = viewport.getBoundingClientRect();
        return (horizontal ? bounds.left : bounds.top) - scrolled() + startScroll;
      };
      const offset = anchor();
      const slots: Slot[] = Array.from(list.children).flatMap((child) => {
        const element = child as HTMLElement;
        const bounds = element.getBoundingClientRect();
        const slotId = element.dataset.sortAlbum;
        return slotId ? [{
          id: slotId,
          center: (horizontal ? bounds.left + bounds.width / 2 : bounds.top + bounds.height / 2) - offset
        }] : [];
      });

      const positionGhost = () => {
        if (!ghost) return;
        ghost.style.transform = `translate3d(${rect.left + x - start.x}px, ${rect.top + y - start.y}px, 0)`;
      };

      const update = () => {
        const bounds = viewport.getBoundingClientRect();
        const listBounds = list.getBoundingClientRect();
        inside = x >= bounds.left - 12 && x <= bounds.right + 12 &&
          y >= Math.max(bounds.top, listBounds.top) - 36 && y <= Math.min(bounds.bottom, listBounds.bottom) + 36;
        if (!inside) return;
        const pointer = horizontal ? x : y;
        const first = horizontal ? bounds.left : bounds.top;
        const last = horizontal ? bounds.right : bounds.bottom;
        const delta = pointer - first < 48 ? -10 : last - pointer < 48 ? 10 : 0;
        if (delta) viewport.scrollBy(horizontal ? { left: delta } : { top: delta });
        const center = pointer - anchor();
        const slot = slots.reduce<Slot | undefined>((closest, next) =>
          !closest || Math.abs(next.center - center) < Math.abs(closest.center - center) ? next : closest, undefined);
        if (slot && target !== slot.id) {
          target = slot.id;
          setActive({ id, target });
        }
      };

      const tick = () => {
        positionGhost();
        update();
        frame = requestAnimationFrame(tick);
      };

      function move(pointer: PointerEvent) {
        if (pointer.pointerId !== pointerId) return;
        x = pointer.clientX;
        y = pointer.clientY;
        if (ghost || Math.hypot(x - start.x, y - start.y) < 5) return;
        ghost = document.createElement('div');
        ghost.className = `shelf-drag-ghost${surface.closest('.paper-texture-light') ? ' paper-texture-light' : ''}`;
        ghost.inert = true;
        ghost.setAttribute('aria-hidden', 'true');
        ghost.style.width = `${rect.width}px`;
        ghost.style.height = `${rect.height}px`;
        const clone = surface.cloneNode(true) as HTMLElement;
        clone.querySelectorAll('[data-cover]').forEach((cover) => cover.removeAttribute('data-cover'));
        ghost.append(clone);
        document.body.append(ghost);
        setActive({ id, target });
        tick();
      }

      function stop() {
        cancelAnimationFrame(frame);
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', drop);
        window.removeEventListener('pointercancel', cancel);
        window.removeEventListener('blur', cancel);
        window.removeEventListener('keydown', escape);
        list?.removeEventListener('lostpointercapture', cancel);
        if (list?.hasPointerCapture(pointerId)) list.releasePointerCapture(pointerId);
        stopDrag.current = null;
      }

      function finish(commit: boolean) {
        stop();
        if (!ghost) return;
        const floating = ghost;
        const destination = commit && inside ? target : id;
        flushSync(() => {
          if (destination !== id) onMove(id, destination);
          setActive(null);
        });
        const resting = surface.getBoundingClientRect();
        if (!surface.isConnected || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
          floating.remove();
          return;
        }
        const land = floating.animate([
          { transform: floating.style.transform, opacity: 1 },
          { transform: `translate3d(${resting.left}px, ${resting.top}px, 0)`, opacity: 0 }
        ], { duration: 210, easing: 'cubic-bezier(.2,.75,.25,1)' });
        land.finished.then(() => floating.remove(), () => floating.remove());
      }

      function drop(pointer: PointerEvent) {
        if (pointer.pointerId !== pointerId) return;
        x = pointer.clientX;
        y = pointer.clientY;
        if (ghost) update();
        finish(true);
      }

      function cancel() { finish(false); }
      function escape(key: KeyboardEvent) {
        if (key.key !== 'Escape') return;
        key.preventDefault();
        cancel();
      }

      stopDrag.current = () => {
        stop();
        ghost?.remove();
      };
      list.setPointerCapture(pointerId);
      list.addEventListener('lostpointercapture', cancel);
      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', drop);
      window.addEventListener('pointercancel', cancel);
      window.addEventListener('blur', cancel);
      window.addEventListener('keydown', escape);
    }
  });

  return { active, handle };
}
