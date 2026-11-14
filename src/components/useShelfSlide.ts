import { useLayoutEffect, useRef } from 'react';
import { flushSync } from 'react-dom';

function bookSlots(row: HTMLElement) {
  return Array.from(row.querySelectorAll<HTMLElement>(':scope > [data-shelf-slot]'), (book) => ({
    book,
    id: book.dataset.shelfSlot as string,
    bounds: book.getBoundingClientRect()
  }));
}

function intersectsRow(book: DOMRect, row: DOMRect) {
  return book.right > row.left && book.left < row.right;
}

export function useShelfSlide() {
  const flights = useRef(new Set<Animation>());
  const leaving = useRef(new Map<string, HTMLElement>());

  const stop = () => {
    flights.current.forEach((flight) => flight.cancel());
    flights.current.clear();
    leaving.current.forEach((book) => book.remove());
    leaving.current.clear();
  };

  useLayoutEffect(() => stop, []);

  return (row: HTMLElement | null, nextIds: string[], reduceMotion: boolean, update: () => void, direction?: -1 | 1) => {
    if (!row || reduceMotion || !row.animate || !CSS.supports('translate', '1px 1px')) {
      stop();
      update();
      return;
    }

    const viewport = row.getBoundingClientRect();
    const slots = bookSlots(row);
    const before = new Map(slots.map(({ id, bounds }) => [id, bounds]));
    leaving.current.forEach((book, id) => before.set(id, book.getBoundingClientRect()));
    const next = new Set(nextIds);
    const departures = slots.flatMap(({ book, id, bounds }, index) => {
      if (next.has(id) || !intersectsRow(bounds, viewport)) return [];
      const copy = book.cloneNode(true) as HTMLElement;
      copy.removeAttribute('data-shelf-slot');
      copy.removeAttribute('data-sort-album');
      copy.querySelectorAll('[data-cover]').forEach((cover) => cover.removeAttribute('data-cover'));
      copy.inert = true;
      copy.setAttribute('aria-hidden', 'true');
      return [{ copy, id, bounds, index }];
    });

    // Measure the moving books before cancelling so a reversal starts in place.
    stop();
    flushSync(update);
    const landingViewport = row.getBoundingClientRect();

    const play = (book: HTMLElement, fromX: number, fromY: number, toX: number, index: number) => {
      const distance = Math.hypot(toX - fromX, fromY);
      if (distance < 1) return;
      const lift = Math.min(distance * 0.09, 16);
      const frames = Array.from({ length: 9 }, (_, step) => {
        const progress = step / 8;
        const x = fromX + (toX - fromX) * progress;
        const y = fromY * (1 - progress) - 4 * lift * progress * (1 - progress);
        return { translate: `${x}px ${y}px` };
      });
      const flight = book.animate(frames, {
        duration: 480 + Math.min(distance * 0.14, 78) + (index % 4) * 12,
        easing: 'cubic-bezier(0.32, 0.08, 0.22, 1)'
      });
      flights.current.add(flight);
      const cleanup = () => flights.current.delete(flight);
      flight.finished.then(cleanup, cleanup);
      return flight;
    };

    bookSlots(row).forEach(({ book, id, bounds }, index) => {
      const start = before.get(id);
      if (!intersectsRow(bounds, landingViewport) && (!start || !intersectsRow(start, viewport))) return;
      const enterFromLeft = direction ? direction < 0 : bounds.left + bounds.width / 2 < landingViewport.left + landingViewport.width / 2;
      const edge = enterFromLeft ? landingViewport.left - bounds.width - 24 : landingViewport.right + 24;
      play(book, (start?.left ?? edge) - bounds.left, start ? start.top - bounds.top : 0, 0, index);
    });

    departures.forEach(({ copy, id, bounds, index }) => {
      const left = bounds.left - landingViewport.left;
      const top = bounds.top - landingViewport.top;
      Object.assign(copy.style, {
        position: 'absolute', left: `${left + row.scrollLeft}px`, top: `${top + row.scrollTop}px`,
        width: `${bounds.width}px`, transform: 'none', pointerEvents: 'none'
      });
      row.append(copy);
      leaving.current.set(id, copy);
      const exitToLeft = direction ? direction > 0 : index < nextIds.length;
      const edge = exitToLeft ? -bounds.width - 24 : landingViewport.width + 24;
      const flight = play(copy, 0, 0, edge - left, index);
      const remove = () => {
        copy.remove();
        if (leaving.current.get(id) === copy) leaving.current.delete(id);
      };
      if (flight) flight.finished.then(remove, remove);
      else remove();
    });
  };
}
