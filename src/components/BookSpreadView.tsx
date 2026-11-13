import React, { useEffect, useRef, useState } from 'react';
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from 'framer-motion';
import type { MotionStyle } from 'framer-motion';
import { Eye, ArrowLeft, Disc, Sun, Moon, Play } from 'lucide-react';
import { Album, Track, ThemeMode } from '../types';
import { HardcoverArtwork } from './HardcoverArtwork';
import { TurningLeaf } from './TurningLeaf';

interface BookSpreadViewProps {
  album: Album;
  currentTrack: Track | null;
  isPlaying: boolean;
  theme: ThemeMode;
  opening: 'waiting' | 'opening' | null;
  onToggleTheme: () => void;
  onPlayTrack: (track: Track) => void;
  onOpenStage: () => void;
  onBackToShelf: () => void;
}

export const BookSpreadView: React.FC<BookSpreadViewProps> = ({
  album,
  currentTrack,
  isPlaying,
  theme,
  opening,
  onToggleTheme,
  onPlayTrack,
  onOpenStage,
  onBackToShelf
}) => {
  const isDark = theme === 'dark';
  const reduceMotion = useReducedMotion();
  const viewRef = useRef<HTMLDivElement>(null);
  const [closing, setClosing] = useState(false);
  const [opened, setOpened] = useState(!opening || !!reduceMotion);
  const progress = useMotionValue(opening && !reduceMotion ? 0 : 1);
  const coverAngle = useTransform(progress, [0, 0.18, 0.47, 0.75, 0.9, 1], ['180deg', '150deg', '55deg', '3deg', '-1.4deg', '0deg']);
  const mobileCoverAngle = useTransform(progress, [0, 0.13, 0.47, 0.65, 1], ['0deg', '-13deg', '-89deg', '-115deg', '-115deg']);
  const mobileCoverOpacity = useTransform(progress, [0.39, 0.59], [1, 0]);
  const bookOffset = useTransform(progress, [0, 0.15, 0.82], ['-25%', '-23%', '0%']);
  const bookTilt = useTransform(progress, [0, 0.22, 0.7, 1], ['7deg', '11deg', '4deg', '0deg']);
  const pageVisibility = useTransform(progress, (position) => position > 0.03 ? 'visible' : 'hidden');
  const readingOpacity = useTransform(progress, [0.2, 0.47], [0, 1]);
  const leafShadow = useTransform(progress, [0, 0.16, 0.48, 0.74, 0.96], [0, 0.12, 0.84, 0.3, 0]);
  const leftPageShadow = useTransform(progress, [0.52, 0.7, 0.88, 0.97], [0, 0.32, 0.48, 0]);
  const shadowWidth = useTransform(progress, [0.16, 0.58, 0.96], [0.35, 1, 0.25]);

  useEffect(() => {
    if (opening === 'waiting') return;
    const target = closing ? 0 : 1;
    if (reduceMotion || progress.get() === target) {
      progress.set(target);
      if (closing) onBackToShelf();
      else setOpened(true);
      return;
    }

    const animation = animate(progress, target, {
      duration: closing ? 0.64 * progress.get() : 0.86,
      ease: [0.32, 0.12, 0.24, 1],
      onComplete: closing ? onBackToShelf : () => setOpened(true)
    });
    return () => animation.stop();
  }, [closing, onBackToShelf, opening, progress, reduceMotion]);

  useEffect(() => {
    if (closing) viewRef.current?.closest('main')?.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
  }, [closing, reduceMotion]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !e.repeat) {
        setClosing(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Check if current track belongs to this album
  const isCurrentAlbumActive = album.tracks.some((t) => t.id === currentTrack?.id);
  const isThisAlbumPlaying = isCurrentAlbumActive && isPlaying;

  return (
    <div ref={viewRef} className="my-auto px-4 sm:px-8 md:px-12 pt-3 pb-7 max-w-6xl mx-auto w-full select-none">
      {/* Top Quiet Navigation & Controls Header - COMPACT */}
      <div
        className={`flex items-center justify-between mb-3 pb-2.5 border-b transition-colors ${
          isDark ? 'border-[#1f212b]' : 'border-[#dedad0]'
        }`}
      >
        {/* Back to Shelf Button */}
        <button
          onClick={() => setClosing(true)}
          className={`flex items-center gap-2.5 whitespace-nowrap text-sm md:text-base font-serif transition-colors cursor-pointer group ${
            isDark
              ? 'text-[#b0b3c6] hover:text-[#ffffff]'
              : 'text-[#383a48] hover:text-[#18191e]'
          }`}
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          <span className="hidden sm:inline">返回典藏书架 (Esc)</span>
          <span className="sm:hidden">返回书架</span>
        </button>

        <div className="flex items-center space-x-3">
          {/* Catalog Seal */}
          <span
            className={`hidden min-[430px]:inline whitespace-nowrap text-xs font-mono font-medium tracking-wider px-2.5 py-1 rounded border ${
              isDark
                ? 'text-[#c5a059] border-[#c5a059]/30 bg-black/50'
                : 'text-[#8a6a26] border-[#8a6a26]/30 bg-[#eae7de]'
            }`}
          >
            {album.catalogNumber}
          </span>

          {/* 黑白主题切换按钮 (Monochrome Light/Dark Toggle) */}
          <button
            onClick={onToggleTheme}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border text-xs md:text-sm font-serif transition-all cursor-pointer ${
              isDark
                ? 'bg-[#14151b] hover:bg-[#20222a] text-[#dedbd2] border-[#252733]'
                : 'bg-[#ffffff] hover:bg-[#eae8df] text-[#1a1b22] border-[#d4d0c5] shadow-sm'
            }`}
            title="黑白主题切换"
          >
            {isDark ? (
              <>
                <Sun className="w-3.5 h-3.5 text-[#c5a059]" />
                <span className="hidden sm:inline">白宣纸境</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-[#9e7d3b]" />
                <span className="hidden sm:inline">墨夜黑曜</span>
              </>
            )}
          </button>

          {/* Exhibition Stage Button */}
          <button
            onClick={onOpenStage}
            disabled={closing || !opened}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs md:text-sm font-serif border transition-all cursor-pointer ${
              isDark
                ? 'bg-[#181a22] hover:bg-[#232634] text-[#c5a059] border-[#2e303d]'
                : 'bg-[#ffffff] hover:bg-[#eae8df] text-[#9e7d3b] border-[#d4d0c5] shadow-sm'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span className="whitespace-nowrap">纯享展台</span>
          </button>
        </div>
      </div>

      <div className="folio-scene" data-theme={theme}>
        <motion.div
          className="folio"
          style={{
            '--folio-cover-angle': coverAngle,
            '--folio-mobile-cover-angle': mobileCoverAngle,
            '--folio-mobile-cover-opacity': mobileCoverOpacity,
            '--folio-offset': bookOffset,
            '--folio-tilt': bookTilt,
            '--folio-page-visibility': pageVisibility,
            '--folio-reading-opacity': readingOpacity
          } as MotionStyle}
        >
          <div className="folio-hinge">
            <div className="folio-page folio-page--left flex flex-col items-center justify-center p-4 md:p-6">
              {/* Vinyl Record that slides out smoothly when playing */}
              <motion.div
                initial={false}
                animate={{
                  x: isThisAlbumPlaying ? 55 : 0,
                  rotate: isThisAlbumPlaying ? 360 : 0,
                  opacity: isThisAlbumPlaying ? 0.95 : 0.25
                }}
                transition={{
                  x: { type: 'spring', stiffness: 220, damping: 24 },
                  rotate: {
                    repeat: Infinity,
                    duration: 18,
                    ease: 'linear'
                  },
                  opacity: { duration: 0.3 }
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-40 h-40 md:w-48 md:h-48 rounded-full pointer-events-none z-0 hidden sm:flex items-center justify-center"
                style={{
                  background:
                    'radial-gradient(circle, #1a1a1a 0%, #111111 40%, #080808 70%, #000000 100%)',
                  boxShadow:
                    '0 10px 25px rgba(0,0,0,0.85), inset 0 0 0 2px rgba(255,255,255,0.08)'
                }}
              >
                {/* Vinyl sound groove rings */}
                <div className="absolute inset-3 rounded-full border border-white/[0.04]" />
                <div className="absolute inset-7 rounded-full border border-white/[0.04]" />
                <div className="absolute inset-11 rounded-full border border-white/[0.04]" />
                <div className="absolute inset-15 rounded-full border border-white/[0.04]" />

                {/* Center Vinyl Label */}
                <div
                  className={`w-14 h-14 md:w-16 md:h-16 rounded-full border flex items-center justify-center shadow-inner overflow-hidden ${
                    isDark
                      ? 'bg-[#252733] border-[#c5a059]/40'
                      : 'bg-[#e8e5dc] border-[#9e7d3b]/40'
                  }`}
                >
                  <img
                    src={album.artwork}
                    alt={album.title}
                    className="w-full h-full object-cover filter brightness-90"
                  />
                  <div className="absolute w-2.5 h-2.5 rounded-full bg-black border border-white/30" />
                </div>
              </motion.div>

              {/* Framed Artwork Plate - PERFECT PROPORTIONS */}
              <div
                className={`p-3 md:p-3.5 border rounded-xs w-full transition-shadow relative z-10 ${
                  isDark
                    ? 'bg-[#14151b] border-[#252733] art-plate-shadow'
                    : 'bg-[#ffffff] border-[#ded9cc] art-plate-shadow-light'
                } ${
                  album.aspectRatio === 'landscape'
                    ? 'max-w-[460px]'
                    : 'max-w-[280px] sm:max-w-[300px] md:max-w-[325px]'
                }`}
              >
                <button
                  type="button"
                  className={`relative block w-full overflow-hidden rounded-xs bg-black group cursor-pointer ${
                    album.aspectRatio === 'landscape' ? 'aspect-video' : 'aspect-[3/4.25]'
                  }`}
                  onClick={onOpenStage}
                  disabled={closing || !opened}
                  aria-label={`在纯享展台查看《${album.title}》原画`}
                  title="点击进入全屏纯享展台"
                >
                  <img
                    data-cover="folio-artwork"
                    src={album.artwork}
                    alt={album.title}
                    className="w-full h-full object-contain bg-black group-hover:scale-[1.02] transition-transform duration-500"
                  />

                  {/* Subtle Hover Action Overlay */}
                  <span aria-hidden="true" className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-black/80 text-white text-xs font-serif backdrop-blur-sm border border-white/20 shadow-xl">
                      <Eye className="w-3.5 h-3.5 text-[#c5a059]" />
                      <span>放大展台</span>
                    </span>
                  </span>
                </button>

                {/* Museum Plate Caption */}
                <div
                  className={`mt-2.5 pt-2 border-t flex items-center justify-between text-xs font-mono ${
                    isDark
                      ? 'border-[#20222b] text-[#a0a2b5]'
                      : 'border-[#eae6dc] text-[#555869]'
                  }`}
                >
                  <span className="font-medium truncate mr-2">
                    图版 I · 《{album.title}》原画特刊
                  </span>
                  <span className="flex-shrink-0 font-mono">
                    {album.dimensions}
                  </span>
                </div>
              </div>
              <motion.div className="folio-turn-shadow folio-turn-shadow--left" style={{ opacity: leftPageShadow }} aria-hidden="true" />
            </div>
            <div className="folio-hardcover" data-cover="folio-cover" aria-hidden="true">
              <HardcoverArtwork album={album} />
            </div>
          </div>

          <div className="folio-page folio-page--right flex flex-col justify-between gap-3.5 p-4 md:p-6 lg:pl-9">
            {/* Header Titles - SCALED DOWN ONE NOTCH TO PREVENT OVERFLOW & MULTILINE */}
            <div className="space-y-1.5">
              <span
                className={`text-xs font-mono tracking-widest uppercase font-semibold ${
                  isDark ? 'text-[#c5a059]' : 'text-[#967530]'
                }`}
              >
                ARCHIVAL RELEASE // {album.releaseDate}
              </span>
              <h2
                className={`text-2xl sm:text-3xl lg:text-[2.1rem] font-serif font-normal tracking-wide leading-tight ${
                  isDark ? 'text-[#eae8e3]' : 'text-[#18191e]'
                }`}
              >
                《{album.title}》
              </h2>
              <p
                className={`text-xs sm:text-sm font-light ${
                  isDark ? 'text-[#b6b8cb]' : 'text-[#383a48]'
                }`}
              >
                {album.subtitle} · {album.artist}
              </p>

              <p
                className={`text-xs sm:text-sm leading-relaxed font-light pt-0.5 line-clamp-2 md:line-clamp-3 ${
                  isDark ? 'text-[#a4a6b8]' : 'text-[#2a2c38]'
                }`}
              >
                {album.description}
              </p>
            </div>

            {/* Dynamic Tracklist - COMPACT & HIGH LEGIBILITY */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between mb-1.5">
                <p
                  className={`text-xs font-mono tracking-wider uppercase flex items-center space-x-1.5 font-semibold ${
                    isDark ? 'text-[#9294a5]' : 'text-[#424452]'
                  }`}
                >
                  <Disc
                    className={`w-3.5 h-3.5 ${
                      isDark ? 'text-[#c5a059]' : 'text-[#967530]'
                    }`}
                  />
                  <span>分轨篇章 (INDEX OF TRACKS)</span>
                </p>
                <span
                  className={`text-xs font-mono ${
                    isDark ? 'text-[#727485]' : 'text-[#686a7a]'
                  }`}
                >
                  共 {album.tracks.length} 首 · 点击即播
                </span>
              </div>

              {/* Track rows - COMPACT HEIGHT */}
              <div className="space-y-1.5 max-h-[175px] sm:max-h-[200px] md:max-h-[220px] overflow-y-auto no-scrollbar pr-1">
                {album.tracks.map((track) => {
                  const isSelected = currentTrack?.id === track.id;
                  const isThisPlaying = isSelected && isPlaying;

                  return (
                    <motion.div
                      key={track.id}
                      onClick={() => onPlayTrack(track)}
                      whileHover={{ x: 3 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                      className={`group flex items-center justify-between px-3.5 py-2 rounded transition-all cursor-pointer border relative overflow-hidden ${
                        isSelected
                          ? isDark
                            ? 'bg-[#1b1c26] text-[#ffffff] font-medium border-[#36394c] shadow-sm'
                            : 'bg-[#f2efe6] text-[#18191e] font-semibold border-[#d3ccba] shadow-sm'
                          : isDark
                          ? 'text-[#b2b4c5] hover:text-[#ffffff] hover:bg-[#161720] border-transparent'
                          : 'text-[#383a48] hover:text-[#18191e] hover:bg-[#faf9f5] border-transparent'
                      }`}
                    >
                      {/* Left Golden Accent Indicator Line */}
                      {isSelected && (
                        <motion.div
                          layoutId="activeTrackIndicator"
                          className={`absolute left-0 top-0 bottom-0 w-1 ${
                            isDark ? 'bg-[#c5a059]' : 'bg-[#9e7d3b]'
                          }`}
                        />
                      )}

                      <div className="flex items-center space-x-3 overflow-hidden pl-1">
                        <span
                          className={`font-mono text-xs w-6 font-medium ${
                            isSelected
                              ? isDark
                                ? 'text-[#c5a059]'
                                : 'text-[#9e7d3b]'
                              : isDark
                              ? 'text-[#7a7c8d]'
                              : 'text-[#4c4e5c]'
                          }`}
                        >
                          {String(track.trackNumber).padStart(2, '0')}
                        </span>

                        <div className="overflow-hidden">
                          <div className="flex items-center space-x-2">
                            <span
                              className={`text-xs sm:text-sm md:text-base font-serif truncate ${
                                isSelected
                                  ? isDark
                                    ? 'text-[#ffffff] font-medium'
                                    : 'text-[#18191e] font-bold'
                                  : isDark
                                  ? 'text-[#c8cadb]'
                                  : 'text-[#18191e]'
                              }`}
                            >
                              {track.title}
                            </span>

                            {/* Bouncing Acoustic Frequency Equalizer Bars */}
                            {isThisPlaying && (
                              <div className="flex items-end space-x-0.5 h-3 ml-1 flex-shrink-0">
                                <motion.span
                                  animate={{ height: ['30%', '100%', '40%'] }}
                                  transition={{ repeat: Infinity, duration: 0.6, ease: 'easeInOut' }}
                                  className={`w-0.5 rounded-full ${
                                    isDark ? 'bg-[#c5a059]' : 'bg-[#9e7d3b]'
                                  }`}
                                />
                                <motion.span
                                  animate={{ height: ['70%', '30%', '90%'] }}
                                  transition={{ repeat: Infinity, duration: 0.75, ease: 'easeInOut' }}
                                  className={`w-0.5 rounded-full ${
                                    isDark ? 'bg-[#c5a059]' : 'bg-[#9e7d3b]'
                                  }`}
                                />
                                <motion.span
                                  animate={{ height: ['100%', '20%', '80%'] }}
                                  transition={{ repeat: Infinity, duration: 0.55, ease: 'easeInOut' }}
                                  className={`w-0.5 rounded-full ${
                                    isDark ? 'bg-[#c5a059]' : 'bg-[#9e7d3b]'
                                  }`}
                                />
                                <motion.span
                                  animate={{ height: ['40%', '90%', '30%'] }}
                                  transition={{ repeat: Infinity, duration: 0.8, ease: 'easeInOut' }}
                                  className={`w-0.5 rounded-full ${
                                    isDark ? 'bg-[#c5a059]' : 'bg-[#9e7d3b]'
                                  }`}
                                />
                              </div>
                            )}
                          </div>
                          <p
                            className={`text-[11px] sm:text-xs font-light truncate ${
                              isDark ? 'text-[#848698]' : 'text-[#444654]'
                            }`}
                          >
                            作编曲：{track.composer}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2.5 pl-2 flex-shrink-0">
                        {!isThisPlaying && (
                          <span
                            className={`opacity-0 group-hover:opacity-100 transition-opacity ${
                              isDark ? 'text-[#c5a059]' : 'text-[#9e7d3b]'
                            }`}
                          >
                            <Play className="w-3 h-3 fill-current" />
                          </span>
                        )}
                        <span
                          className={`font-mono text-xs ${
                            isDark ? 'text-[#787a8b]' : 'text-[#444654]'
                          }`}
                        >
                          {track.duration}
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Production Colophon Archival Specifications - COMPACT & VISIBLE */}
            <div
              className={`pt-3 border-t grid grid-cols-2 gap-x-3 gap-y-1 text-xs font-mono ${
                isDark
                  ? 'border-[#1e2029] text-[#808294]'
                  : 'border-[#eae6dc] text-[#444654]'
              }`}
            >
              {album.credits.map((c, idx) => (
                <div key={idx} className="truncate">
                  <span className={isDark ? 'text-[#5d5f6f]' : 'text-[#626474]'}>
                    {c.label}：
                  </span>
                  <span
                    className={`font-medium ${
                      isDark ? 'text-[#aeb0c2]' : 'text-[#111216]'
                    }`}
                  >
                    {c.value}
                  </span>
                </div>
              ))}
            </div>
            <motion.div className="folio-turn-shadow" style={{ opacity: leafShadow, scaleX: shadowWidth }} aria-hidden="true" />
          </div>
          {!reduceMotion && <TurningLeaf progress={progress} />}
        </motion.div>
      </div>
    </div>
  );
};
