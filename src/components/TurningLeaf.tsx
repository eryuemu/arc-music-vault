import { useCallback, useLayoutEffect, useRef } from 'react';
import { transform, useMotionValueEvent } from 'framer-motion';
import type { MotionValue } from 'framer-motion';

const stripCount = 16;
const strips = Array.from({ length: stripCount }, (_, index) => index);
const foldProgress = transform([0.21, 0.43, 0.7, 0.96], [0, 0.12, 0.73, 1]);

export function TurningLeaf({ progress }: { progress: MotionValue<number> }) {
  const leafRef = useRef<HTMLDivElement>(null);

  const positionLeaf = useCallback((position: number) => {
    const leaf = leafRef.current;
    if (!leaf) return;

    const turn = foldProgress(position);
    const visible = position > 0 && turn < 1;
    leaf.style.visibility = visible ? 'visible' : 'hidden';
    if (!visible) return;

    const stripWidth = leaf.clientWidth / stripCount;
    const mobile = leaf.offsetLeft === 0;
    const lift = Math.sin(turn * Math.PI);
    const hinge = -turn * Math.PI * (mobile ? 0.5 : 1);
    const bend = lift * (mobile ? 0.85 : 1.15);
    const opacity = Math.min(1, (1 - turn) * 11);
    let x = 0;
    let z = 0;

    // Each strip starts where the previous one ends, along the same curved sheet.
    for (const index of strips) {
      const strip = leaf.children[index] as HTMLElement;
      const angle = hinge + bend * (0.5 - (index + 0.5) / stripCount);
      strip.style.transform = `translate3d(${x}px, 0, ${z}px) rotateY(${angle}rad)`;
      strip.style.opacity = `${opacity}`;
      strip.style.setProperty('--leaf-shade', `${0.32 * lift * Math.abs(Math.sin(angle + 0.35))}`);
      strip.style.setProperty('--leaf-light', `${0.2 * lift * Math.max(0, Math.cos(angle + 0.7))}`);
      x += Math.cos(angle) * stripWidth;
      z -= Math.sin(angle) * stripWidth;
    }
  }, []);

  useLayoutEffect(() => positionLeaf(progress.get()), [positionLeaf, progress]);
  useMotionValueEvent(progress, 'change', positionLeaf);

  return (
    <div ref={leafRef} className="folio-leaf" aria-hidden="true">
      {strips.map((index) => (
        <span key={index} className="folio-leaf-strip" style={{ width: `calc(${100 / stripCount}% + 0.5px)` }} />
      ))}
    </div>
  );
}
