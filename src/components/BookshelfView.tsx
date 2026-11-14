import React from 'react';
import { Layers, Columns3, Compass, Sun, Moon } from 'lucide-react';
import { ThreeDimensionalBook } from './ThreeDimensionalBook';
import { Album, ShelfDisplayMode, ThemeMode } from '../types';

interface BookshelfViewProps {
  albums: Album[];
  theme: ThemeMode;
  displayMode: ShelfDisplayMode;
  onDisplayModeChange: (mode: ShelfDisplayMode) => void;
  onToggleTheme: () => void;
  onSelectAlbum: (album: Album) => void;
}

export const BookshelfView: React.FC<BookshelfViewProps> = ({
  albums,
  theme,
  displayMode,
  onDisplayModeChange,
  onToggleTheme,
  onSelectAlbum
}) => {
  const isDark = theme === 'dark';

  return (
    <div className="flex-1 flex flex-col justify-between px-6 md:px-14 lg:px-20 py-4 md:py-6 w-full max-w-7xl mx-auto select-none">
      {/* Top Architectural Gallery Header (No Sidebar!) */}
      <header
        className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b transition-colors ${
          isDark ? 'border-[#1f212a]' : 'border-[#dedad0]'
        }`}
      >
        <div className="space-y-2">
          <div className="flex items-center space-x-2.5">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isDark ? 'bg-[#c5a059]' : 'bg-[#9e7d3b]'
              }`}
            />
            <span
              className={`text-xs md:text-sm font-mono tracking-[0.25em] uppercase font-semibold ${
                isDark ? 'text-[#a2a4b3]' : 'text-[#6e7080]'
              }`}
            >
              LOCAL ARCHIVE // 本地视听藏书阁
            </span>
          </div>
          <h1
            className={`text-3xl md:text-4xl lg:text-5xl font-serif font-normal tracking-wide ${
              isDark ? 'text-[#eae8e3]' : 'text-[#18191e]'
            }`}
          >
            术界与独立概念典藏馆
          </h1>
        </div>

        {/* Right Controls: Theme Toggle & Display Mode Switcher */}
        <div className="flex shrink-0 items-center space-x-3.5">
          {/* 黑白切换按钮 (Light / Dark Monochrome Toggle) */}
          <button
            onClick={onToggleTheme}
            className={`flex items-center space-x-2.5 px-4 py-2 rounded-lg border text-sm font-serif transition-all cursor-pointer ${
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

          {/* Display Mode Switcher (立架并列 vs 画册叠放) */}
          <div
            className={`flex items-center space-x-1 p-1 rounded-lg border text-sm font-mono ${
              isDark
                ? 'bg-[#131418] border-[#22242e]'
                : 'bg-[#ffffff] border-[#d4d0c5] shadow-sm'
            }`}
          >
            <button
              onClick={() => onDisplayModeChange('shelf')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded transition-all cursor-pointer ${
                displayMode === 'shelf'
                  ? isDark
                    ? 'bg-[#20222b] text-[#eae8e3] font-medium shadow-sm'
                    : 'bg-[#ebe8df] text-[#18191e] font-semibold'
                  : isDark
                  ? 'text-[#707280] hover:text-[#c4c2ba]'
                  : 'text-[#828492] hover:text-[#22242e]'
              }`}
            >
              <Columns3 className="w-4 h-4" />
              <span>立架并列</span>
            </button>
            <button
              onClick={() => onDisplayModeChange('stacked')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded transition-all cursor-pointer ${
                displayMode === 'stacked'
                  ? isDark
                    ? 'bg-[#20222b] text-[#eae8e3] font-medium shadow-sm'
                    : 'bg-[#ebe8df] text-[#18191e] font-semibold'
                  : isDark
                  ? 'text-[#707280] hover:text-[#c4c2ba]'
                  : 'text-[#828492] hover:text-[#22242e]'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>画册叠放</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Exhibition Hall Stage (Books Centerpiece) */}
      <main className={`my-auto py-6 md:py-8 flex flex-col items-center justify-center relative ${
        displayMode === 'shelf' ? 'lg:w-[min(93.5rem,calc(100vw-3rem))] lg:self-center' : ''
      }`}>
        {/* Soft overhead gallery spotlight gradient */}
        <div
          className={`absolute -top-16 w-3/4 h-72 blur-3xl pointer-events-none ${
            isDark
              ? 'bg-gradient-to-b from-[#1c1e28]/50 via-transparent to-transparent'
              : 'bg-gradient-to-b from-[#e8e4d8]/70 via-transparent to-transparent'
          }`}
        />

        <div data-shelf-scroll={displayMode === 'shelf' ? '' : undefined} className={displayMode === 'shelf'
          ? 'shelf-row w-full flex items-end gap-6 sm:gap-10 lg:gap-14 px-4 pt-8 pb-2 z-10 overflow-x-auto no-scrollbar'
          : 'relative grid place-content-center w-full py-10 z-10'
        }>
          {albums.map((album, idx) => (
            <ThreeDimensionalBook
              key={album.id}
              album={album}
              theme={theme}
              displayMode={displayMode}
              stackIndex={idx}
              totalStacked={albums.length}
              onOpen={() => onSelectAlbum(album)}
            />
          ))}
        </div>

        {/* Solid Architectural Shelf Beam Plinth */}
        {displayMode === 'shelf' && (
          <div className="w-full max-w-5xl lg:max-w-[calc(100%-4rem)] relative mt-4">
            <div
              className={`w-full h-4 border-t border-b shadow-2xl flex items-center px-6 ${
                isDark
                  ? 'bg-[#14151b] border-[#2a2c38] border-b-[#090a0d]'
                  : 'bg-[#ded8cb] border-[#cfc8b8] border-b-[#b8b09d]'
              }`}
            >
              <div
                className={`w-full h-[1px] ${
                  isDark
                    ? 'bg-gradient-to-r from-transparent via-[#3a3d4d] to-transparent opacity-60'
                    : 'bg-gradient-to-r from-transparent via-[#ffffff] to-transparent opacity-70'
                }`}
              />
            </div>
            <div
              className={`w-full h-14 bg-gradient-to-b ${
                isDark
                  ? 'from-black/80 to-transparent'
                  : 'from-black/15 to-transparent'
              }`}
            />
          </div>
        )}
      </main>

      {/* Minimalist Footnote Specifications - ENLARGED */}
      <footer
        className={`pt-5 border-t flex flex-col sm:flex-row items-center justify-between gap-3 text-xs md:text-sm font-mono transition-colors ${
          isDark
            ? 'border-[#191a22] text-[#787a8b]'
            : 'border-[#dedad0] text-[#636574]'
        }`}
      >
        <div className="flex items-center space-x-4">
          <span>馆藏本：{albums.length} 部</span>
          <span>•</span>
          <span>路径：/workspace/本地音乐库</span>
        </div>
        <div
          className={`flex items-center space-x-2 font-serif text-xs md:text-sm ${
            isDark ? 'text-[#9294a5]' : 'text-[#4c4e5c]'
          }`}
        >
          <Compass
            className={`w-4 h-4 ${isDark ? 'text-[#c5a059]' : 'text-[#9e7d3b]'}`}
          />
          <span>点选书籍以 3D 展册翻开 · 键盘空格暂停/播放</span>
        </div>
      </footer>
    </div>
  );
};
