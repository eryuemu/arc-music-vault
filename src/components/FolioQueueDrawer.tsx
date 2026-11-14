import React, { useEffect, useRef } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ListMusic, X, Play, Pause, LocateFixed } from 'lucide-react';
import type { Album, ThemeMode, Track } from '../types';

interface FolioQueueDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  albums: Album[];
  currentTrack: Track | null;
  isPlaying: boolean;
  onPlayTrack: (track: Track) => void;
  onPlayAlbum?: (album: Album) => void;
  theme?: ThemeMode;
}

const chineseNumerals = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];

export const FolioQueueDrawer: React.FC<FolioQueueDrawerProps> = ({
  isOpen,
  onClose,
  albums,
  currentTrack,
  isPlaying,
  onPlayTrack,
  onPlayAlbum,
  theme = 'dark'
}) => {
  const isDark = theme === 'dark';
  const reduceMotion = useReducedMotion();
  const activeItemRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const totalTracks = albums.reduce((sum, album) => sum + album.tracks.length, 0);

  // Scroll active track into view
  const scrollToActive = () => {
    if (activeItemRef.current) {
      activeItemRef.current.scrollIntoView({
        behavior: reduceMotion ? 'auto' : 'smooth',
        block: 'nearest'
      });
    }
  };

  useEffect(() => {
    if (isOpen) {
      // Small timeout to allow entrance animation before scrolling
      const timer = setTimeout(scrollToActive, 200);
      return () => clearTimeout(timer);
    }
  }, [isOpen, currentTrack?.id]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Subtle backdrop overlay for mobile / focus */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px] md:bg-transparent md:backdrop-blur-none"
            aria-hidden="true"
          />

          {/* Floating Folio Queue Slip (宣纸曲目折页) */}
          <motion.aside
            role="dialog"
            aria-label="馆藏曲目卷目清单"
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 30, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 30, scale: 0.98 }}
            transition={{ type: 'spring', damping: 28, stiffness: 350 }}
            className={`fixed bottom-[66px] md:bottom-[72px] right-2 sm:right-6 md:right-10 z-50 w-[calc(100vw-1rem)] sm:w-[440px] md:w-[480px] max-h-[min(560px,calc(100vh-120px))] rounded-xl border flex flex-col shadow-2xl backdrop-blur-xl overflow-hidden select-none ${
              isDark
                ? 'bg-[#0f1015]/95 border-[#282a38] text-[#eae8e3]'
                : 'bg-[#faf8f2]/95 border-[#dcd6c8] text-[#18191e]'
            }`}
          >
            {/* Header / Archival Slip Head */}
            <div
              className={`flex items-center justify-between px-4 sm:px-5 py-3 border-b shrink-0 ${
                isDark ? 'border-[#222432] bg-[#14151c]/60' : 'border-[#eae4d6] bg-[#f4f0e6]/70'
              }`}
            >
              <div className="flex items-center space-x-2.5 min-w-0">
                <ListMusic className="w-4 h-4 text-[#c5a059] shrink-0" aria-hidden="true" />
                <div className="min-w-0">
                  <div className="flex items-center space-x-2">
                    <h3 className="font-serif text-sm sm:text-base font-semibold truncate tracking-wide">
                      馆藏曲目卷目
                    </h3>
                    <span
                      className={`text-[11px] font-mono px-1.5 py-0.5 rounded border leading-none ${
                        isDark ? 'border-[#303344] text-[#9092a4]' : 'border-[#ded7c8] text-[#6e7080]'
                      }`}
                    >
                      {totalTracks} 轨
                    </span>
                  </div>
                  <p
                    className={`text-xs font-mono truncate mt-0.5 ${
                      isDark ? 'text-[#828498]' : 'text-[#707282]'
                    }`}
                  >
                    RESONANCE QUEUE // 全馆连播流转
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-1 shrink-0">
                <button
                  type="button"
                  onClick={scrollToActive}
                  aria-label="定位正在播放的曲目"
                  title="定位当前播放"
                  className={`p-1.5 rounded transition-colors cursor-pointer ${
                    isDark
                      ? 'text-[#9698a8] hover:text-white hover:bg-white/10'
                      : 'text-[#626474] hover:text-[#18191e] hover:bg-black/5'
                  }`}
                >
                  <LocateFixed className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="收起卷目清单"
                  title="收起卷目清单 (Esc)"
                  className={`p-1.5 rounded transition-colors cursor-pointer ${
                    isDark
                      ? 'text-[#9698a8] hover:text-white hover:bg-white/10'
                      : 'text-[#626474] hover:text-[#18191e] hover:bg-black/5'
                  }`}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Scrollable Catalog Content */}
            <div
              ref={scrollContainerRef}
              className="flex-1 overflow-y-auto overflow-x-hidden p-2 sm:p-3 space-y-4 no-scrollbar"
            >
              {albums.map((album, albumIdx) => {
                const numeral = chineseNumerals[albumIdx] ?? String(albumIdx + 1);
                const hasActiveTrack = album.tracks.some((t) => t.id === currentTrack?.id);

                return (
                  <div
                    key={album.id}
                    className={`rounded-lg border p-2 transition-colors ${
                      hasActiveTrack
                        ? isDark
                          ? 'border-[#36394c] bg-[#161722]/60'
                          : 'border-[#d6cebc] bg-[#f2eee3]/60'
                        : isDark
                        ? 'border-transparent bg-transparent'
                        : 'border-transparent bg-transparent'
                    }`}
                  >
                    {/* Album Section Header */}
                    <div className="flex items-center justify-between mb-2 px-1.5">
                      <div className="flex items-center space-x-2.5 min-w-0">
                        <img
                          src={album.artwork}
                          alt={album.title}
                          className="w-7 h-7 sm:w-8 sm:h-8 rounded object-cover shadow-sm shrink-0 border border-current/10"
                        />
                        <div className="min-w-0">
                          <h4 className="font-serif text-xs sm:text-sm font-semibold truncate leading-tight">
                            卷{numeral} · 《{album.title}》
                          </h4>
                          <span
                            className={`text-[11px] truncate block mt-0.5 ${
                              isDark ? 'text-[#8e90a2]' : 'text-[#646675]'
                            }`}
                          >
                            {album.artist} · 共 {album.tracks.length} 首
                          </span>
                        </div>
                      </div>

                      {onPlayAlbum && (
                        <button
                          type="button"
                          onClick={() => onPlayAlbum(album)}
                          aria-label={`直接播放《${album.title}》全专`}
                          title="直接播放本专"
                          className={`p-1.5 rounded transition-colors cursor-pointer shrink-0 ${
                            isDark
                              ? 'text-[#9698a8] hover:text-[#c5a059] hover:bg-[#c5a059]/10'
                              : 'text-[#686a7c] hover:text-[#9e7d3b] hover:bg-[#9e7d3b]/10'
                          }`}
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                        </button>
                      )}
                    </div>

                    {/* Track Rows inside this Album */}
                    <div className="space-y-1">
                      {album.tracks.map((track) => {
                        const isCurrent = currentTrack?.id === track.id;
                        const isCurrentPlaying = isCurrent && isPlaying;

                        return (
                          <div
                            key={track.id}
                            ref={isCurrent ? activeItemRef : undefined}
                            onClick={() => onPlayTrack(track)}
                            className={`group relative flex items-center justify-between px-2 sm:px-3 py-1.5 rounded-md text-xs sm:text-sm cursor-pointer transition-all border ${
                              isCurrent
                                ? isDark
                                  ? 'bg-[#1e202c] text-white border-[#3e4258] shadow-sm font-medium'
                                  : 'bg-[#ede8dc] text-[#18191e] border-[#cdc5b3] shadow-sm font-semibold'
                                : isDark
                                ? 'text-[#b2b4c5] hover:text-white hover:bg-[#1a1b24] border-transparent'
                                : 'text-[#484a5a] hover:text-[#18191e] hover:bg-[#f3efe6] border-transparent'
                            }`}
                          >
                            {/* Golden Left Bar Indicator for active track */}
                            {isCurrent && (
                              <div
                                className={`absolute left-0 top-0 bottom-0 w-1 rounded-l ${
                                  isDark ? 'bg-[#c5a059]' : 'bg-[#9e7d3b]'
                                }`}
                              />
                            )}

                            <div className="flex items-center space-x-2.5 min-w-0 pr-2">
                              {/* Track Number / Equalizer Animation */}
                              <div className="w-5 flex items-center justify-center shrink-0">
                                {isCurrentPlaying ? (
                                  <div className="flex items-end space-x-0.5 h-3">
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
                                  </div>
                                ) : isCurrent ? (
                                  <Pause className={`w-3 h-3 ${isDark ? 'text-[#c5a059]' : 'text-[#9e7d3b]'}`} />
                                ) : (
                                  <span
                                    className={`font-mono text-xs ${
                                      isDark ? 'text-[#727486]' : 'text-[#848696]'
                                    }`}
                                  >
                                    {String(track.trackNumber).padStart(2, '0')}
                                  </span>
                                )}
                              </div>

                              {/* Titles */}
                              <span className="font-serif truncate">{track.title}</span>
                              <span
                                className={`text-[11px] truncate hidden sm:inline ${
                                  isDark ? 'text-[#7e8094]' : 'text-[#787a8a]'
                                }`}
                              >
                                {track.artist}
                              </span>
                            </div>

                            {/* Duration */}
                            <span
                              className={`font-mono text-xs shrink-0 tabular-nums ${
                                isCurrent
                                  ? isDark ? 'text-[#c5a059]' : 'text-[#9e7d3b]'
                                  : isDark ? 'text-[#6e7082]' : 'text-[#888a9a]'
                              }`}
                            >
                              {track.duration}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};
