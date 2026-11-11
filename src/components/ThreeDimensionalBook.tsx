import React, { useState, useRef } from 'react';
import { motion, useSpring, useMotionValue, useTransform } from 'framer-motion';
import { BookOpen, Sparkles } from 'lucide-react';
import { Album, ThemeMode } from '../types';

interface ThreeDimensionalBookProps {
  album: Album;
  displayMode?: 'shelf' | 'stacked';
  stackIndex?: number;
  totalStacked?: number;
  theme?: ThemeMode;
  onClick: () => void;
}

export const ThreeDimensionalBook: React.FC<ThreeDimensionalBookProps> = ({
  album,
  displayMode = 'shelf',
  stackIndex = 0,
  totalStacked = 1,
  theme = 'dark',
  onClick
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isOpening, setIsOpening] = useState(false);

  // Mouse tilt physics with spring smoothing
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 220, damping: 20 });
  const mouseYSpring = useSpring(y, { stiffness: 220, damping: 20 });

  // Shelf natural baseline resting angles (Left book turns right, right book turns left)
  const baseRestingRotateY =
    displayMode === 'shelf'
      ? stackIndex === 0
        ? 5
        : stackIndex === totalStacked - 1
        ? -5
        : 0
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

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current || displayMode === 'stacked' || isOpening) return;
    const rect = cardRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    x.set(mouseX / rect.width - 0.5);
    y.set(mouseY / rect.height - 0.5);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    x.set(0);
    y.set(0);
  };

  const handleClick = () => {
    if (isOpening) return;
    setIsOpening(true);
    // Smooth physical lift & book opening transition before route change
    setTimeout(() => {
      onClick();
    }, 280);
  };

  // Stacked layout offsets
  const stackRotations = [-6, 3, -3];
  const stackRotation = stackRotations[stackIndex % stackRotations.length] || 0;
  const stackOffset = displayMode === 'stacked' ? stackIndex * 70 : 0;

  const isDark = theme === 'dark';

  return (
    <motion.div
      style={{ perspective: 1800 }}
      animate={
        displayMode === 'stacked'
          ? {
              rotateZ: isHovered ? 0 : stackRotation,
              x: isHovered
                ? stackIndex === 0
                  ? -160
                  : stackIndex === 1
                  ? 0
                  : 160
                : stackOffset - 70,
              y: isOpening ? -45 : isHovered ? -35 : stackIndex * 8,
              zIndex: isOpening ? 60 : isHovered ? 40 : 10 + stackIndex,
              scale: isOpening ? 1.08 : isHovered ? 1.04 : 1
            }
          : {
              rotateZ: 0,
              x: 0,
              y: isOpening ? -35 : isHovered ? -16 : 0,
              zIndex: isOpening ? 60 : isHovered ? 30 : 10,
              scale: isOpening ? 1.07 : 1
            }
      }
      transition={{ type: 'spring', stiffness: 280, damping: 24 }}
      className="relative flex flex-col items-center select-none"
    >
      <motion.div
        ref={cardRef}
        onClick={handleClick}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={handleMouseLeave}
        style={{
          rotateX: displayMode === 'shelf' && !isOpening ? rotateX : 0,
          rotateY: isOpening
            ? '-25deg'
            : displayMode === 'shelf'
            ? rotateY
            : '0deg',
          transformStyle: 'preserve-3d'
        }}
        whileHover={displayMode === 'shelf' && !isOpening ? { scale: 1.03 } : {}}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="relative cursor-pointer group"
      >
        {/* ================= 3D BOOK GEOMETRY (MUSEUM HARDCOVER VOLUME) ================= */}
        <div
          className={`relative w-[270px] sm:w-[295px] md:w-[320px] aspect-[3/4.25] rounded-r-md rounded-l-xs overflow-hidden border-t border-r border-b transition-shadow ${
            isDark
              ? 'bg-[#15161c] shadow-[0_30px_60px_rgba(0,0,0,0.95)] border-white/[0.09]'
              : 'bg-[#ffffff] shadow-[0_20px_45px_rgba(0,0,0,0.18)] border-black/[0.08]'
          }`}
          style={{ transformStyle: 'preserve-3d' }}
        >
          {/* Front Cover Artwork */}
          <div className="w-full h-full relative overflow-hidden bg-black rounded-r-sm">
            <img
              src={album.artwork}
              alt={album.title}
              className={`w-full h-full filter brightness-[0.92] group-hover:brightness-100 transition-all duration-300 ${
                album.aspectRatio === 'landscape'
                  ? 'object-cover object-center scale-[1.04]'
                  : 'object-cover object-top'
              }`}
            />

            {/* Dynamic Specular Sheen (Glides with cursor) */}
            <motion.div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: `radial-gradient(circle at ${glareX} ${glareY}, rgba(255,255,255,0.22) 0%, transparent 60%)`,
                opacity: isHovered ? 1 : 0.1,
                transition: 'opacity 0.25s'
              }}
            />

            {/* Subtle Vignette for Typographic Legibility */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-transparent pointer-events-none" />
          </div>

          {/* Left Hardcover Spine Gutter (真实精装凹槽压痕与布纹书脊) */}
          <div className="absolute left-0 top-0 bottom-0 w-7 bg-gradient-to-r from-black/85 via-black/30 to-transparent pointer-events-none z-10" />
          <div className="absolute left-7 top-0 bottom-0 w-[1px] bg-white/[0.12] pointer-events-none z-10 shadow-[0_0_2px_rgba(0,0,0,0.8)]" />

          {/* Golden Silk Bookmark Ribbon (悬垂真丝书签缎带) */}
          <div className="absolute -top-1.5 right-8 w-4 h-12 bg-[#c5a059] shadow-lg z-20 rounded-b-sm border-x border-[#9e7d3b] flex items-end justify-center pb-1">
            <div className="w-1.5 h-1.5 rounded-full bg-[#7d6029]" />
          </div>

          {/* Top Foil Catalog Number - ENLARGED */}
          <div className="absolute top-4 left-9 z-10">
            <span className="text-xs md:text-sm font-mono font-medium tracking-widest text-[#c5a059] bg-black/75 backdrop-blur-md px-3 py-1 rounded border border-[#c5a059]/35 shadow-md">
              {album.catalogNumber}
            </span>
          </div>

          {/* Bottom Hardcover Typographic Monograph - ENLARGED */}
          <div className="absolute bottom-5 left-9 right-6 z-10 space-y-1.5">
            <p className="text-xs md:text-sm font-mono tracking-wider text-[#b8bac6] font-medium">
              {album.releaseDate}
            </p>
            <h3 className="font-serif font-bold text-2xl md:text-3xl text-[#ffffff] tracking-wide leading-tight drop-shadow-md">
              {album.title}
            </h3>
            <p className="text-sm md:text-base text-[#cfd1de] font-light truncate">
              {album.subtitle}
            </p>
          </div>
        </div>

        {/* ================= 3D PHYSICAL PAPER PAGE BLOCK (书页厚度与层叠感) ================= */}
        {/* Right page thickness */}
        <div
          className="absolute top-2 right-[-11px] bottom-2 w-3 rounded-r-xs bg-[#e8e4da] opacity-90 border-y border-r border-[#1a1b22] pointer-events-none shadow-inner"
          style={{
            backgroundImage:
              'repeating-linear-gradient(to bottom, #d2ccc0 0px, #d2ccc0 1px, #ede9e0 2px, #ede9e0 3px)'
          }}
        />
        {/* Top page block rim */}
        <div
          className="absolute -top-1.5 left-4 right-1 h-2 rounded-t-xs bg-[#dfd9cc] opacity-85 border-t border-x border-[#1a1b22] pointer-events-none"
        />

        {/* ================= NATURAL FLOOR CONTACT SHADOW ================= */}
        <div
          className="absolute -bottom-8 left-4 right-4 h-8 bg-black/85 blur-lg rounded-full pointer-events-none transition-all duration-300"
          style={{
            transform: isHovered ? 'scale(0.85) translateY(10px)' : 'scale(1)',
            opacity: isOpening ? 0.3 : isHovered ? 0.45 : 0.8
          }}
        />
      </motion.div>

      {/* Tactile Under-book Action Hint - ENLARGED */}
      <div
        className={`mt-7 flex items-center space-x-2 text-sm md:text-base transition-colors ${
          isDark
            ? 'text-[#a4a8bc] group-hover:text-[#c5a059]'
            : 'text-[#454756] group-hover:text-[#9e7d3b]'
        }`}
      >
        <BookOpen className="w-4 h-4" />
        <span className="font-serif tracking-wide font-medium">
          {isOpening
            ? '正在展开画册...'
            : displayMode === 'stacked'
            ? '点选以展开画册'
            : '点击翻开展册'}
        </span>
      </div>
    </motion.div>
  );
};
