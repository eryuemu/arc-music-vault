import React, { useState } from 'react';
import { motion, useSpring, useMotionValue, useMotionTemplate, useReducedMotion, useTransform } from 'framer-motion';
import { BookOpen } from 'lucide-react';
import { Album, ThemeMode } from '../types';
import { HardcoverArtwork } from './HardcoverArtwork';

interface ThreeDimensionalBookProps {
  album: Album;
  displayMode?: 'shelf' | 'stacked';
  stackIndex?: number;
  totalStacked?: number;
  theme?: ThemeMode;
  onOpen: () => void;
}

export const ThreeDimensionalBook: React.FC<ThreeDimensionalBookProps> = ({
  album,
  displayMode = 'shelf',
  stackIndex = 0,
  totalStacked = 1,
  theme = 'dark',
  onOpen
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const reduceMotion = useReducedMotion();

  // Mouse tilt physics with spring smoothing
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 220, damping: 20 });
  const mouseYSpring = useSpring(y, { stiffness: 220, damping: 20 });

  // The slight resting angle keeps the fore-edge visible before hovering.
  const baseRestingRotateY =
    displayMode === 'shelf'
      ? stackIndex === 0
        ? -9
        : stackIndex === totalStacked - 1
        ? -4
        : -6
      : 0;

  // 3D rotations based on cursor
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ['10deg', '-10deg']);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], [
    `${baseRestingRotateY - 14}deg`,
    `${baseRestingRotateY + 14}deg`
  ]);

  // Dynamic light glare position
  const glareX = useTransform(mouseXSpring, [-0.5, 0.5], ['0%', '100%']);
  const glareY = useTransform(mouseYSpring, [-0.5, 0.5], ['0%', '100%']);
  const glare = useMotionTemplate`radial-gradient(ellipse at ${glareX} ${glareY}, rgb(255 236 190 / 0.26), transparent 62%)`;

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'touch' || reduceMotion) return;
    if (!isHovered) setIsHovered(true);
    if (displayMode === 'stacked') return;

    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    x.set(mouseX / rect.width - 0.5);
    y.set(mouseY / rect.height - 0.5);
  };

  const handlePointerLeave = () => {
    setIsHovered(false);
    x.set(0);
    y.set(0);
  };

  // Stacked layout offsets
  const stackRotations = [-6, 3, -3];
  const stackRotation = stackRotations[stackIndex % stackRotations.length] || 0;
  const stackOffset = (stackIndex - (totalStacked - 1) / 2) * 23;
  const hovering = isHovered && !reduceMotion;

  const isDark = theme === 'dark';

  return (
    <motion.div
      initial={false}
      style={{ perspective: 1200, zIndex: hovering ? 40 : 10 + stackIndex }}
      animate={
        displayMode === 'stacked'
          ? {
              rotateZ: hovering ? 0 : stackRotation,
              x: `${stackOffset * (hovering ? 1.55 : 1)}%`,
              y: hovering ? -15 : stackIndex * 8,
              scale: hovering ? 1.02 : 1
            }
          : {
              rotateZ: 0,
              x: 0,
              y: hovering ? -10 : 0,
              scale: 1
            }
      }
      transition={reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 280, damping: 34 }}
      className={`relative flex shrink-0 flex-col items-center select-none ${displayMode === 'stacked' ? 'col-start-1 row-start-1' : ''}`}
    >
      <motion.div
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        style={{
          rotateX: displayMode === 'shelf' && !reduceMotion ? rotateX : 0,
          rotateY: displayMode === 'shelf'
            ? reduceMotion ? baseRestingRotateY : rotateY
            : -8,
          transformStyle: 'preserve-3d'
        }}
        className="shelf-book"
      >
        <div className="shelf-book-back" aria-hidden="true" />
        <div className="shelf-book-paper" aria-hidden="true" />
        <div className="shelf-book-fore-edge" aria-hidden="true" />
        <div className="shelf-book-head-edge" aria-hidden="true" />
        <div className="shelf-book-spine" aria-hidden="true" />

        <div className="shelf-book-cover" data-cover={`shelf-${album.id}`}>
          <HardcoverArtwork
            album={album}
            lit={hovering}
            sheen={
              <motion.div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: glare,
                  opacity: hovering ? 1 : 0.1,
                  transition: 'opacity 0.25s'
                }}
              />
            }
          />
        </div>

        <button
          type="button"
          className="shelf-book-trigger"
          data-stack-landing={displayMode === 'stacked' ? '' : undefined}
          aria-label={`翻开《${album.title}》`}
          onClick={onOpen}
        />
      </motion.div>

      {displayMode === 'shelf' && (
        <div className={`mt-7 flex items-center gap-2 text-sm md:text-base ${isDark ? 'text-[#a4a8bc]' : 'text-[#454756]'}`}>
          <BookOpen className="w-4 h-4" />
          <span className="font-serif tracking-wide font-medium">
            点击翻开展册
          </span>
        </div>
      )}
    </motion.div>
  );
};
