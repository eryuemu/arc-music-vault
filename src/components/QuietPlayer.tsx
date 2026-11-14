import React from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Film, Maximize2 } from 'lucide-react';
import { Track, Album, ThemeMode, VideoStatus } from '../types';
import './QuietPlayer.css';

interface QuietPlayerProps {
  currentTrack: Track | null;
  currentAlbum: Album;
  onOpenCover?: () => void;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  theme?: ThemeMode;
  isVideoMode?: boolean;
  pvBackgroundStatus?: VideoStatus;
  onTogglePvBackground?: () => void;
  onEnterPvFocus?: React.MouseEventHandler<HTMLButtonElement>;
  onTogglePlay: () => void;
  onSeek: (time: number) => void;
  onPrev: () => void;
  onNext: () => void;
  onVolumeChange: (vol: number) => void;
  error: string;
}

const formatSeconds = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const remainder = Math.floor(seconds % 60);
  return `${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`;
};

export const QuietPlayer: React.FC<QuietPlayerProps> = ({
  currentTrack,
  currentAlbum,
  onOpenCover,
  isPlaying,
  currentTime,
  duration,
  volume,
  theme = 'dark',
  isVideoMode = false,
  pvBackgroundStatus,
  onTogglePvBackground,
  onEnterPvFocus,
  onTogglePlay,
  onSeek,
  onPrev,
  onNext,
  onVolumeChange,
  error
}) => {
  const isDark = isVideoMode || theme === 'dark';

  if (!currentTrack) return null;

  const canSeek = Number.isFinite(duration) && duration > 0;
  const elapsed = canSeek && Number.isFinite(currentTime)
    ? Math.min(duration, Math.max(0, currentTime))
    : 0;
  const elapsedLabel = formatSeconds(elapsed);
  const durationLabel = canSeek ? formatSeconds(duration) : currentTrack.duration;
  const playLabel = isPlaying ? '暂停' : '播放';
  const muteLabel = volume === 0 ? '取消静音' : '静音';
  const pvBackgroundActive = pvBackgroundStatus !== undefined;
  const pvBackgroundMessage = pvBackgroundStatus === 'error' ? 'PV 背景加载失败'
    : pvBackgroundStatus === 'loading' ? '正在载入 PV 背景…' : '';
  const trackSubtitle =
    currentTrack.composer && !currentTrack.artist.includes(currentTrack.composer)
      ? `${currentTrack.artist} · 曲: ${currentTrack.composer}`
      : currentTrack.artist;

  return (
    <footer
      data-player-theme={isVideoMode ? 'video' : theme}
      className={`quiet-player shrink-0 z-40 px-4 sm:px-6 lg:px-12 py-2 md:py-3.5 select-none border-t transition-colors ${
        isVideoMode
          ? 'bg-black/60 backdrop-blur-sm border-white/20 text-[#eae8e3]'
          : isDark
            ? 'bg-[#0c0d10]/95 backdrop-blur-md border-[#1e2029] text-[#eae8e3]'
            : 'bg-[#ffffff]/95 backdrop-blur-md border-[#dedad0] text-[#18191e] shadow-lg'
      }`}
    >
      <div className="max-w-7xl mx-auto grid grid-cols-[minmax(0,1fr)_auto] md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)_minmax(0,1fr)] items-center gap-x-3 gap-y-1 md:gap-4">
        <div className="flex items-center gap-3 md:gap-4 min-w-0">
          <div
            data-cover="player-cover"
            className={`relative w-9 h-10 md:w-12 md:h-14 rounded-sm overflow-hidden bg-black border flex-shrink-0 shadow-sm ${
              isDark ? 'border-[#292b38]' : 'border-[#d4d0c5]'
            }`}
          >
            <img
              src={currentAlbum.artwork}
              alt={currentAlbum.title}
              className="w-full h-full object-cover object-center"
            />
            {onOpenCover && (
              <button
                type="button"
                aria-label={`翻开正在播放的《${currentAlbum.title}》`}
                onClick={onOpenCover}
                className="absolute inset-0 cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#c5a059]"
              />
            )}
          </div>
          <div className="min-w-0">
            <h4
              className={`text-base md:text-lg font-serif font-semibold truncate ${
                isDark ? 'text-[#ffffff]' : 'text-[#18191e]'
              }`}
            >
              {currentTrack.title}
            </h4>
            <p
              className={`text-xs md:text-sm truncate font-light mt-0.5 ${
                isVideoMode ? 'text-white/80' : isDark ? 'text-[#9698a8]' : 'text-[#585a68]'
              }`}
            >
              {trackSubtitle}
            </p>
          </div>
        </div>

        <div className="contents md:flex md:flex-col md:items-center md:space-y-1">
          <div className="flex items-center gap-0.5 sm:gap-2 lg:gap-3">
            <button
              type="button"
              onClick={onPrev}
              aria-label="上一曲"
              className={`p-1.5 transition-colors cursor-pointer ${
                isVideoMode ? 'text-white/80 hover:text-white' : isDark
                  ? 'text-[#9698a8] hover:text-white'
                  : 'text-[#626472] hover:text-[#18191e]'
              }`}
              title="上一曲"
            >
              <SkipBack className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onTogglePlay}
              aria-label={playLabel}
              className={`w-9 h-9 rounded-full flex items-center justify-center border transition-all cursor-pointer shadow-md ${
                isVideoMode ? 'bg-white/15 hover:bg-white/25 text-white border-white/30' : isDark
                  ? 'bg-[#1e2029] hover:bg-[#2b2e3c] text-white border-[#343748]'
                  : 'bg-[#18191e] hover:bg-[#2f313a] text-white border-[#18191e]'
              }`}
              title={`${playLabel} (空格)`}
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 fill-current" />
              ) : (
                <Play className="w-4 h-4 fill-current ml-0.5" />
              )}
            </button>

            <button
              type="button"
              onClick={onNext}
              aria-label="下一曲"
              className={`p-1.5 transition-colors cursor-pointer ${
                isVideoMode ? 'text-white/80 hover:text-white' : isDark
                  ? 'text-[#9698a8] hover:text-white'
                  : 'text-[#626472] hover:text-[#18191e]'
              }`}
              title="下一曲"
            >
              <SkipForward className="w-4 h-4" />
            </button>

            {onTogglePvBackground && (
              <button
                type="button"
                onClick={onTogglePvBackground}
                aria-pressed={pvBackgroundActive}
                aria-label="PV 背景"
                title={pvBackgroundMessage || 'PV 背景'}
                className={`flex min-h-8 items-center justify-center gap-1.5 rounded-md border px-2 text-xs transition-colors cursor-pointer ${
                  pvBackgroundStatus === 'error'
                    ? isDark ? 'border-red-300/40 text-red-200' : 'border-red-700/40 text-red-800'
                    : pvBackgroundActive
                    ? isDark ? 'border-[#e2bd77]/40 bg-[#e2bd77]/15 text-[#f0d49b]' : 'border-[#967530]/40 bg-[#967530]/10 text-[#70551f]'
                    : isDark ? 'border-white/15 text-[#b3b4bf] hover:text-white' : 'border-[#d4d0c5] text-[#585a68] hover:text-[#18191e]'
                }`}
              >
                <Film className={`w-4 h-4 ${pvBackgroundStatus === 'loading' ? 'motion-safe:animate-pulse' : ''}`} aria-hidden="true" />
                <span className="hidden lg:inline">PV 背景</span>
              </button>
            )}
            {onEnterPvFocus && (
              <button
                type="button"
                onClick={onEnterPvFocus}
                aria-label="清屏观看 PV"
                title="清屏观看 PV"
                className="flex min-h-8 items-center justify-center gap-1.5 rounded-md border border-white/20 px-2 text-xs text-white/90 transition-colors hover:border-[#e2bd77]/50 hover:bg-[#e2bd77]/15 hover:text-[#f0d49b]"
              >
                <Maximize2 className="h-4 w-4" aria-hidden="true" />
                <span className="hidden lg:inline">清屏</span>
              </button>
            )}
            {pvBackgroundMessage && <span className="sr-only" role="status">{pvBackgroundMessage}</span>}
          </div>

          <div
            className={`col-span-2 flex items-center gap-2 sm:gap-3 w-full text-xs md:text-sm font-mono tabular-nums ${
              isVideoMode ? 'text-white/90' : isDark ? 'text-[#a2a4b3]' : 'text-[#646675]'
            }`}
          >
            <span className="min-w-[5ch] text-right">{elapsedLabel}</span>
            <input
              type="range"
              min={0}
              max={canSeek ? duration : 0}
              step="any"
              value={elapsed}
              disabled={!canSeek}
              aria-label="播放进度"
              aria-valuetext={`${elapsedLabel} / ${durationLabel}`}
              onChange={(e) => onSeek(e.currentTarget.valueAsNumber)}
              onKeyDown={(e) => {
                const offset = { ArrowLeft: -5, ArrowDown: -5, ArrowRight: 5, ArrowUp: 5 }[e.key];
                if (offset === undefined) return;
                e.preventDefault();
                onSeek(Math.min(duration, Math.max(0, elapsed + offset)));
              }}
              className="quiet-player-range min-w-0 flex-1"
              style={{ '--player-progress': `${canSeek ? elapsed / duration * 100 : 0}%` } as React.CSSProperties}
            />
            <span className="min-w-[5ch]">{durationLabel}</span>
          </div>
        </div>

        <div className="col-span-2 flex min-w-0 items-center justify-end gap-2 md:col-span-1">
          <button
            type="button"
            onClick={() => onVolumeChange(volume === 0 ? 0.8 : 0)}
            aria-label={muteLabel}
            title={muteLabel}
            className={`transition-colors cursor-pointer ${
              isVideoMode ? 'text-white/80 hover:text-white' : isDark
                ? 'text-[#9698a8] hover:text-white'
                : 'text-[#646675] hover:text-[#18191e]'
            }`}
          >
            {volume === 0 ? (
              <VolumeX className="w-4 h-4" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={volume}
            aria-label="音量"
            onChange={(e) => onVolumeChange(e.currentTarget.valueAsNumber)}
            className="quiet-player-range w-16 max-w-full lg:w-24"
            style={{ '--player-progress': `${volume * 100}%` } as React.CSSProperties}
          />
        </div>
        {error && <p className="col-span-full text-xs text-red-500" role="alert">{error}</p>}
      </div>
    </footer>
  );
};
