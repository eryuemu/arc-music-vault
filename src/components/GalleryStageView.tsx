import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Volume2, Disc, Sun, Moon, Film, Image as ImageIcon } from 'lucide-react';
import { Album, Track, ThemeMode } from '../types';

interface GalleryStageViewProps {
  album: Album;
  currentTrack: Track | null;
  isPlaying: boolean;
  theme: ThemeMode;
  onToggleTheme: () => void;
  onBackToSpread: () => void;
}

export const GalleryStageView: React.FC<GalleryStageViewProps> = ({
  album,
  currentTrack,
  isPlaying,
  theme,
  onToggleTheme,
  onBackToSpread
}) => {
  const [activeMedia, setActiveMedia] = useState<'image' | 'video'>('image');
  const isDark = theme === 'dark';

  return (
    <div className="flex-1 flex flex-col justify-between items-center px-6 md:px-14 lg:px-20 py-8 max-w-7xl mx-auto w-full select-none animate-fadeIn">
      {/* Top Quiet Back Navigation & Controls */}
      <div
        className={`w-full flex items-center justify-between pb-5 border-b transition-colors ${
          isDark ? 'border-[#1f212a]' : 'border-[#dedad0]'
        }`}
      >
        <button
          onClick={onBackToSpread}
          className={`flex items-center space-x-3 text-base md:text-lg font-serif transition-colors cursor-pointer group ${
            isDark
              ? 'text-[#a2a4b3] hover:text-[#eae8e3]'
              : 'text-[#555866] hover:text-[#18191e]'
          }`}
        >
          <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
          <span>返回双联展册 (Esc)</span>
        </button>

        <div className="flex items-center space-x-4">
          <span
            className={`text-xs md:text-sm font-mono tracking-widest uppercase font-semibold ${
              isDark ? 'text-[#a2a4b3]' : 'text-[#6e7080]'
            }`}
          >
            FINE ART GALLERY // 美术展台
          </span>

          {/* Video / Artwork Mode Switcher (If album has PV) */}
          {album.videoUrl && (
            <div
              className={`flex items-center space-x-1 p-1 rounded-lg border text-xs md:text-sm font-mono ${
                isDark
                  ? 'bg-[#131418] border-[#22242e]'
                  : 'bg-[#ffffff] border-[#d4d0c5] shadow-sm'
              }`}
            >
              <button
                onClick={() => setActiveMedia('image')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded transition-all cursor-pointer ${
                  activeMedia === 'image'
                    ? isDark
                      ? 'bg-[#20222b] text-[#eae8e3] font-medium'
                      : 'bg-[#ebe8df] text-[#18191e] font-semibold'
                    : isDark
                    ? 'text-[#707280] hover:text-[#c4c2ba]'
                    : 'text-[#828492] hover:text-[#22242e]'
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>原画</span>
              </button>
              <button
                onClick={() => setActiveMedia('video')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded transition-all cursor-pointer ${
                  activeMedia === 'video'
                    ? isDark
                      ? 'bg-[#20222b] text-[#eae8e3] font-medium'
                      : 'bg-[#ebe8df] text-[#18191e] font-semibold'
                    : isDark
                    ? 'text-[#707280] hover:text-[#c4c2ba]'
                    : 'text-[#828492] hover:text-[#22242e]'
                }`}
              >
                <Film className="w-3.5 h-3.5" />
                <span>原版PV</span>
              </button>
            </div>
          )}

          {/* 黑白切换按钮 */}
          <button
            onClick={onToggleTheme}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg border text-sm font-serif transition-all cursor-pointer ${
              isDark
                ? 'bg-[#14151b] hover:bg-[#20222a] text-[#dedbd2] border-[#252733]'
                : 'bg-[#ffffff] hover:bg-[#eae8df] text-[#1a1b22] border-[#d4d0c5] shadow-sm'
            }`}
            title="黑白主题切换"
          >
            {isDark ? (
              <>
                <Sun className="w-4 h-4 text-[#c5a059]" />
                <span className="hidden sm:inline">白宣纸境</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-[#9e7d3b]" />
                <span className="hidden sm:inline">墨夜黑曜</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Centerpiece: Museum Gallery Wall Mounted Artwork or Video */}
      <div className="my-auto flex flex-col items-center py-6 w-full">
        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className={`relative w-full p-5 md:p-6 border rounded-xs transition-colors ${
            isDark
              ? 'bg-[#131418] border-[#22242e] shadow-[0_30px_70px_rgba(0,0,0,0.85)]'
              : 'bg-[#ffffff] border-[#ded9cc] art-plate-shadow-light'
          } ${
            activeMedia === 'video' || album.aspectRatio === 'landscape'
              ? 'max-w-[760px]'
              : 'max-w-[460px]'
          }`}
        >
          {activeMedia === 'video' && album.videoUrl ? (
            <div className="relative overflow-hidden bg-black rounded-xs aspect-video">
              <video
                src={album.videoUrl}
                controls
                autoPlay
                className="w-full h-full object-contain"
              />
            </div>
          ) : (
            <div
              className={`relative overflow-hidden bg-black rounded-xs ${
                album.aspectRatio === 'landscape' ? 'aspect-video' : 'aspect-[3/4.25]'
              }`}
            >
              <img
                src={album.artwork}
                alt={album.title}
                className="w-full h-full object-contain bg-black"
              />
            </div>
          )}

          {/* Exhibition Plaque - ENLARGED */}
          <div
            className={`mt-4 pt-3.5 border-t flex items-center justify-between text-xs md:text-sm font-mono ${
              isDark
                ? 'border-[#20222a] text-[#8e90a0]'
                : 'border-[#eae6dc] text-[#636573]'
            }`}
          >
            <div className="space-y-1">
              <span
                className={`font-serif text-base md:text-lg font-semibold block ${
                  isDark ? 'text-[#ffffff]' : 'text-[#18191e]'
                }`}
              >
                《{album.title}》
              </span>
              <span className={isDark ? 'text-[#7e8090]' : 'text-[#757787]'}>
                {album.artist} · {album.releaseDate}
              </span>
            </div>
            <div className="text-right">
              <span
                className={`block font-semibold text-sm ${
                  isDark ? 'text-[#c5a059]' : 'text-[#967530]'
                }`}
              >
                {album.catalogNumber}
              </span>
              <span className={isDark ? 'text-[#6e7080]' : 'text-[#8e90a0]'}>
                {album.dimensions}
              </span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Subtle Bottom Status - ENLARGED */}
      <div
        className={`w-full flex items-center justify-between text-xs md:text-sm font-mono border-t pt-4 transition-colors ${
          isDark
            ? 'border-[#191a22] text-[#787a8b]'
            : 'border-[#dedad0] text-[#636574]'
        }`}
      >
        <div className="flex items-center space-x-2.5">
          {isPlaying ? (
            <Volume2
              className={`w-4 h-4 animate-pulse ${
                isDark ? 'text-[#c5a059]' : 'text-[#967530]'
              }`}
            />
          ) : (
            <Disc className="w-4 h-4 text-[#6e7080]" />
          )}
          <span>
            正在播放：
            <strong className={isDark ? 'text-[#eae8e3]' : 'text-[#18191e]'}>
              {currentTrack?.title}
            </strong>
          </span>
        </div>
        <span className={isDark ? 'text-[#787a8b]' : 'text-[#707282]'}>
          {currentTrack?.composer ? `作编曲：${currentTrack.composer}` : ''}
        </span>
      </div>
    </div>
  );
};
