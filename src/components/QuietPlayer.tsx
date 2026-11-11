import React from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX } from 'lucide-react';
import { Track, Album, ThemeMode } from '../types';

interface QuietPlayerProps {
  currentTrack: Track | null;
  currentAlbum: Album;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  theme?: ThemeMode;
  onTogglePlay: () => void;
  onSeek: (time: number) => void;
  onPrev: () => void;
  onNext: () => void;
  onVolumeChange: (vol: number) => void;
}

export const QuietPlayer: React.FC<QuietPlayerProps> = ({
  currentTrack,
  currentAlbum,
  isPlaying,
  currentTime,
  duration,
  volume,
  theme = 'dark',
  onTogglePlay,
  onSeek,
  onPrev,
  onNext,
  onVolumeChange
}) => {
  const isDark = theme === 'dark';

  const formatSeconds = (sec: number) => {
    if (isNaN(sec) || sec === 0) return '00:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  if (!currentTrack) return null;

  const trackSubtitle =
    currentTrack.composer && !currentTrack.artist.includes(currentTrack.composer)
      ? `${currentTrack.artist} · 曲: ${currentTrack.composer}`
      : currentTrack.artist;

  return (
    <footer
      className={`fixed bottom-0 left-0 right-0 z-40 px-6 md:px-12 py-3.5 select-none border-t transition-colors ${
        isDark
          ? 'bg-[#0c0d10]/95 backdrop-blur-md border-[#1e2029] text-[#eae8e3]'
          : 'bg-[#ffffff]/95 backdrop-blur-md border-[#dedad0] text-[#18191e] shadow-lg'
      }`}
    >
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Left: Current Track Info - ENLARGED */}
        <div className="flex items-center space-x-4 w-full md:w-1/4 min-w-0">
          <div
            className={`w-12 h-14 rounded-sm overflow-hidden bg-black border flex-shrink-0 shadow-sm ${
              isDark ? 'border-[#292b38]' : 'border-[#d4d0c5]'
            }`}
          >
            <img
              src={currentAlbum.artwork}
              alt={currentAlbum.title}
              className="w-full h-full object-cover object-center"
            />
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
                isDark ? 'text-[#9698a8]' : 'text-[#585a68]'
              }`}
            >
              {trackSubtitle}
            </p>
          </div>
        </div>

        {/* Center: Controls & Timeline - ENLARGED */}
        <div className="flex flex-col items-center w-full md:w-1/2 space-y-1.5">
          <div className="flex items-center space-x-6">
            <button
              onClick={onPrev}
              className={`p-1.5 transition-colors cursor-pointer ${
                isDark
                  ? 'text-[#848696] hover:text-[#ffffff]'
                  : 'text-[#626472] hover:text-[#18191e]'
              }`}
              title="上一曲"
            >
              <SkipBack className="w-4 h-4" />
            </button>

            <button
              onClick={onTogglePlay}
              className={`w-9 h-9 rounded-full flex items-center justify-center border transition-all cursor-pointer shadow-md ${
                isDark
                  ? 'bg-[#1e2029] hover:bg-[#2b2e3c] text-[#ffffff] border-[#343748]'
                  : 'bg-[#18191e] hover:bg-[#2f313a] text-[#ffffff] border-[#18191e]'
              }`}
              title={isPlaying ? '暂停 (空格)' : '播放 (空格)'}
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 fill-current" />
              ) : (
                <Play className="w-4 h-4 fill-current ml-0.5" />
              )}
            </button>

            <button
              onClick={onNext}
              className={`p-1.5 transition-colors cursor-pointer ${
                isDark
                  ? 'text-[#848696] hover:text-[#ffffff]'
                  : 'text-[#626472] hover:text-[#18191e]'
              }`}
              title="下一曲"
            >
              <SkipForward className="w-4 h-4" />
            </button>
          </div>

          <div
            className={`flex items-center space-x-3 w-full text-xs md:text-sm font-mono ${
              isDark ? 'text-[#7e8090]' : 'text-[#646675]'
            }`}
          >
            <span className="w-12 text-right">{formatSeconds(currentTime)}</span>
            <div className="relative flex-1 group py-1 cursor-pointer">
              <input
                type="range"
                min={0}
                max={duration || 100}
                value={currentTime}
                onChange={(e) => onSeek(Number(e.target.value))}
                className={`w-full h-1.5 rounded appearance-none cursor-pointer focus:outline-none ${
                  isDark
                    ? 'bg-[#20222c] accent-[#c5a059]'
                    : 'bg-[#dedad0] accent-[#967530]'
                }`}
              />
            </div>
            <span className="w-12">{formatSeconds(duration)}</span>
          </div>
        </div>

        {/* Right: Volume */}
        <div className="hidden md:flex items-center justify-end space-x-3 w-1/4">
          <button
            onClick={() => onVolumeChange(volume === 0 ? 0.8 : 0)}
            className={`transition-colors cursor-pointer ${
              isDark
                ? 'text-[#7e8090] hover:text-[#ffffff]'
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
            onChange={(e) => onVolumeChange(Number(e.target.value))}
            className={`w-24 h-1 rounded appearance-none cursor-pointer ${
              isDark
                ? 'bg-[#20222c] accent-[#c5a059]'
                : 'bg-[#dedad0] accent-[#967530]'
            }`}
          />
        </div>
      </div>
    </footer>
  );
};
