import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Eye, Volume2, ArrowLeft, Disc, Sun, Moon, Play } from 'lucide-react';
import { Album, Track, ThemeMode } from '../types';

interface BookSpreadViewProps {
  album: Album;
  currentTrack: Track | null;
  isPlaying: boolean;
  theme: ThemeMode;
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
  onToggleTheme,
  onPlayTrack,
  onOpenStage,
  onBackToShelf
}) => {
  const isDark = theme === 'dark';

  // Esc key listener to return to shelf
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onBackToShelf();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onBackToShelf]);

  // Check if current track belongs to this album
  const isCurrentAlbumActive = album.tracks.some((t) => t.id === currentTrack?.id);
  const isThisAlbumPlaying = isCurrentAlbumActive && isPlaying;

  return (
    <div className="flex-1 flex flex-col justify-center px-4 sm:px-8 md:px-12 py-2 max-w-6xl mx-auto w-full select-none">
      {/* Top Quiet Navigation & Controls Header - COMPACT */}
      <div
        className={`flex items-center justify-between mb-3 pb-2.5 border-b transition-colors ${
          isDark ? 'border-[#1f212b]' : 'border-[#dedad0]'
        }`}
      >
        {/* Back to Shelf Button */}
        <button
          onClick={onBackToShelf}
          className={`flex items-center space-x-2.5 text-sm md:text-base font-serif transition-colors cursor-pointer group ${
            isDark
              ? 'text-[#b0b3c6] hover:text-[#ffffff]'
              : 'text-[#383a48] hover:text-[#18191e]'
          }`}
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          <span>返回典藏书架 (Esc)</span>
        </button>

        <div className="flex items-center space-x-3">
          {/* Catalog Seal */}
          <span
            className={`text-xs font-mono font-medium tracking-wider px-2.5 py-1 rounded border ${
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
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs md:text-sm font-serif border transition-all cursor-pointer ${
              isDark
                ? 'bg-[#181a22] hover:bg-[#232634] text-[#c5a059] border-[#2e303d]'
                : 'bg-[#ffffff] hover:bg-[#eae8df] text-[#9e7d3b] border-[#d4d0c5] shadow-sm'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>纯享展台</span>
          </button>
        </div>
      </div>

      {/* ================= THE TWO-PAGE OPEN FOLIO SPREAD (PHYSICAL 3D UNROLL) ================= */}
      <div
        style={{ perspective: 2000 }}
        className="w-full relative"
      >
        <div
          className={`grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 rounded-lg p-4 md:p-6 lg:p-7 border relative overflow-hidden transition-colors ${
            isDark
              ? 'bg-[#121318] border-[#22242e] shadow-[0_25px_60px_rgba(0,0,0,0.85)]'
              : 'bg-[#ffffff] border-[#ded9cd] shadow-[0_15px_45px_rgba(0,0,0,0.07)]'
          }`}
        >
          {/* Center Spine Binding Gutter Seam */}
          <div
            className={`hidden lg:block absolute top-0 bottom-0 left-1/2 w-[2px] -ml-[1px] z-20 pointer-events-none ${
              isDark
                ? 'bg-gradient-to-b from-transparent via-[#2b2d3c] to-transparent shadow-[0_0_8px_rgba(0,0,0,0.9)]'
                : 'bg-gradient-to-b from-transparent via-[#e4e0d4] to-transparent shadow-[0_0_6px_rgba(0,0,0,0.06)]'
            }`}
          />

          {/* ================= LEFT FOLIO: ARTWORK MOUNT & VINYL DISC ================= */}
          <motion.div
            initial={{ rotateY: 24, opacity: 0, x: -25 }}
            animate={{ rotateY: 0, opacity: 1, x: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            style={{ transformOrigin: 'right center' }}
            className={`lg:col-span-5 flex flex-col items-center justify-center p-4 md:p-6 rounded-sm border relative overflow-visible ${
              isDark
                ? 'bg-[#0b0c0f] border-[#1b1c24]'
                : 'bg-[#f8f7f2] border-[#e8e4d8]'
            }`}
          >
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
              <div
                className={`relative overflow-hidden rounded-xs bg-black group cursor-pointer ${
                  album.aspectRatio === 'landscape' ? 'aspect-video' : 'aspect-[3/4.25]'
                }`}
                onClick={onOpenStage}
                title="点击进入全屏纯享展台"
              >
                <img
                  src={album.artwork}
                  alt={album.title}
                  className="w-full h-full object-contain bg-black group-hover:scale-[1.02] transition-transform duration-500"
                />

                {/* Subtle Hover Action Overlay */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-black/80 text-white text-xs font-serif backdrop-blur-sm border border-white/20 shadow-xl">
                    <Eye className="w-3.5 h-3.5 text-[#c5a059]" />
                    <span>放大展台</span>
                  </span>
                </div>
              </div>

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
          </motion.div>

          {/* ================= RIGHT FOLIO: COLOPHON & DYNAMIC TRACKLIST ================= */}
          <motion.div
            initial={{ rotateY: -24, opacity: 0, x: 25 }}
            animate={{ rotateY: 0, opacity: 1, x: 0 }}
            transition={{ duration: 0.55, delay: 0.03, ease: [0.16, 1, 0.3, 1] }}
            style={{ transformOrigin: 'left center' }}
            className="lg:col-span-7 flex flex-col justify-between space-y-3.5 lg:pl-4"
          >
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
          </motion.div>
        </div>
      </div>
    </div>
  );
};
