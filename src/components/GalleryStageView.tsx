import React from 'react';
import { ArrowLeft, Volume2, Disc, Sun, Moon, Film, Image as ImageIcon } from 'lucide-react';
import { Album, Track, ThemeMode, VideoStatus } from '../types';

interface GalleryStageViewProps {
  album: Album;
  currentTrack: Track | null;
  isPlaying: boolean;
  isVideoMode: boolean;
  videoStatus: VideoStatus;
  theme: ThemeMode;
  onMediaChange: (media: 'image' | 'video') => void;
  onToggleTheme: () => void;
  onBackToSpread: () => void;
}

export const GalleryStageView: React.FC<GalleryStageViewProps> = ({
  album,
  currentTrack,
  isPlaying,
  isVideoMode,
  videoStatus,
  theme,
  onMediaChange,
  onToggleTheme,
  onBackToSpread
}) => {
  const isDark = theme === 'dark';
  const useDarkControls = isVideoMode || isDark;
  const videoControl = 'border border-white/20 bg-black/60 backdrop-blur-sm';
  const activeMediaClass = useDarkControls
    ? 'bg-white/20 text-white font-medium'
    : 'bg-[#ebe8df] text-[#18191e] font-semibold';
  const inactiveMediaClass = useDarkControls
    ? 'text-[#b3b4bf] hover:text-white'
    : 'text-[#646675] hover:text-[#22242e]';

  return (
    <div
      className={`flex-1 flex flex-col items-center md:px-14 lg:px-20 max-w-7xl mx-auto w-full select-none ${
        isVideoMode ? 'relative px-3 py-3 sm:px-6 sm:py-5' : 'justify-between px-6 py-8'
      }`}
    >
      <div
        className={`w-full flex flex-wrap items-center justify-between gap-2 sm:gap-3 transition-colors ${
          isVideoMode ? '' : `pb-5 border-b ${isDark ? 'border-[#1f212a]' : 'border-[#dedad0]'}`
        }`}
      >
        <button
          type="button"
          onClick={onBackToSpread}
          className={`flex items-center gap-2 whitespace-nowrap text-sm sm:text-base md:text-lg font-serif transition-colors cursor-pointer group ${
            isVideoMode
              ? `${videoControl} rounded-lg px-2.5 sm:px-3 py-2 text-white hover:bg-black/80`
              : isDark
              ? 'text-[#a2a4b3] hover:text-[#eae8e3]'
              : 'text-[#555866] hover:text-[#18191e]'
          }`}
        >
          <ArrowLeft className={`${isVideoMode ? 'w-4 h-4' : 'w-5 h-5'} transition-transform group-hover:-translate-x-1`} />
          <span className="sm:hidden">返回展册</span>
          <span className="hidden sm:inline">返回双联展册 (Esc)</span>
        </button>

        <div className="flex shrink-0 items-center gap-2 sm:gap-4">
          {!isVideoMode && (
            <span
              className={`hidden md:inline text-xs md:text-sm font-mono tracking-widest uppercase font-semibold ${
                isDark ? 'text-[#a2a4b3]' : 'text-[#6e7080]'
              }`}
            >
              FINE ART GALLERY // 美术展台
            </span>
          )}

          {album.videoUrl && (
            <div
              className={`flex items-center space-x-1 p-1 rounded-lg text-xs md:text-sm font-mono ${
                isVideoMode
                  ? videoControl
                  : isDark
                  ? 'border bg-[#131418] border-[#22242e]'
                  : 'border bg-[#ffffff] border-[#d4d0c5] shadow-sm'
              }`}
            >
              <button
                type="button"
                aria-pressed={!isVideoMode}
                onClick={() => onMediaChange('image')}
                className={`flex items-center gap-1.5 whitespace-nowrap px-2 sm:px-3 py-1.5 rounded transition-all cursor-pointer ${
                  isVideoMode ? inactiveMediaClass : activeMediaClass
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>原画</span>
              </button>
              <button
                type="button"
                aria-pressed={isVideoMode}
                onClick={() => onMediaChange('video')}
                className={`flex items-center gap-1.5 whitespace-nowrap px-2 sm:px-3 py-1.5 rounded transition-all cursor-pointer ${
                  isVideoMode ? activeMediaClass : inactiveMediaClass
                }`}
              >
                <Film className="w-3.5 h-3.5" />
                <span>原版PV</span>
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={onToggleTheme}
            className={`flex items-center space-x-2 px-2 sm:px-3.5 py-2 rounded-lg text-sm font-serif transition-colors cursor-pointer ${
              isVideoMode
                ? `${videoControl} text-white hover:bg-black/80`
                : isDark
                ? 'border bg-[#14151b] hover:bg-[#20222a] text-[#dedbd2] border-[#252733]'
                : 'border bg-[#ffffff] hover:bg-[#eae8df] text-[#1a1b22] border-[#d4d0c5] shadow-sm'
            }`}
            title="黑白主题切换"
            aria-label={isDark ? '白宣纸境' : '墨夜黑曜'}
          >
            {isDark ? (
              <>
                <Sun className="w-4 h-4 text-[#c5a059]" />
                <span className="hidden sm:inline">白宣纸境</span>
              </>
            ) : (
              <>
                <Moon className={`w-4 h-4 ${isVideoMode ? 'text-[#e1c284]' : 'text-[#9e7d3b]'}`} />
                <span className="hidden sm:inline">墨夜黑曜</span>
              </>
            )}
          </button>
        </div>
      </div>

      {isVideoMode && videoStatus !== 'ready' && (
        <div className="flex flex-1 items-center justify-center">
          <p
            role={videoStatus === 'error' ? 'alert' : 'status'}
            className={`${videoControl} rounded-lg px-4 py-2 text-sm text-white`}
          >
            {videoStatus === 'error' ? '无法播放 PV' : '正在载入 PV…'}
          </p>
        </div>
      )}

      {!isVideoMode && (
        <>
          <div className="my-auto flex flex-col items-center py-6 w-full">
            <div
              className={`relative w-full p-5 md:p-6 border rounded-xs transition-colors ${
                isDark
                  ? 'bg-[#131418] border-[#22242e] shadow-[0_30px_70px_rgba(0,0,0,0.85)]'
                  : 'bg-[#ffffff] border-[#ded9cc] art-plate-shadow-light'
              } ${
                album.aspectRatio === 'landscape' ? 'max-w-[760px]' : 'max-w-[460px]'
              }`}
            >
              <div
                className={`relative overflow-hidden bg-black rounded-xs ${
                  album.aspectRatio === 'landscape' ? 'aspect-video' : 'aspect-[3/4.25]'
                }`}
              >
                <img
                  data-cover="stage-artwork"
                  src={album.artwork}
                  alt={album.title}
                  className="w-full h-full object-contain bg-black"
                />
              </div>

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
            </div>
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
        </>
      )}
    </div>
  );
};
