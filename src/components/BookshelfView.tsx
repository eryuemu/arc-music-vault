import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Layers, Columns3, Sun, Moon, Search, X, GripVertical, ChevronLeft, ChevronRight, Play, ArrowUpDown, Check } from 'lucide-react';
import { ThreeDimensionalBook } from './ThreeDimensionalBook';
import { Album, ShelfDisplayMode, ThemeMode, Track } from '../types';
import { useShelfDrag } from './useShelfDrag';
import { matchesSearch, moveItem } from '../preferences';

interface BookshelfViewProps {
  albums: Album[];
  search: string;
  searchOpen: boolean;
  stackPage: number;
  onSearch: (query: string) => void;
  onSearchOpenChange: (open: boolean) => void;
  onStackPageChange: (page: number) => void;
  onMoveAlbum: (id: string, target: string) => void;
  onPlayAlbum: (album: Album) => void;
  onPlayTrack: (track: Track) => void;
  theme: ThemeMode;
  displayMode: ShelfDisplayMode;
  onDisplayModeChange: (mode: ShelfDisplayMode) => void;
  onToggleTheme: () => void;
  onSelectAlbum: (album: Album) => void;
}

const stackPageSize = 4;
const searchPageSize = 40;

export const BookshelfView: React.FC<BookshelfViewProps> = ({
  albums,
  search,
  searchOpen,
  stackPage,
  onSearch,
  onSearchOpenChange,
  onStackPageChange,
  onMoveAlbum,
  onPlayAlbum,
  onPlayTrack,
  theme,
  displayMode,
  onDisplayModeChange,
  onToggleTheme,
  onSelectAlbum
}) => {
  const isDark = theme === 'dark';
  const reduceMotion = useReducedMotion();
  const [sorting, setSorting] = useState(false);
  const [searchLimit, setSearchLimit] = useState(searchPageSize);
  const [scrollEdges, setScrollEdges] = useState({ left: false, right: false });
  const rowRef = useRef<HTMLDivElement>(null);
  const { active, handle } = useShelfDrag(onMoveAlbum);
  const searchInput = useRef<HTMLInputElement>(null);
  const searchButton = useRef<HTMLButtonElement>(null);
  const query = search.trim().toLocaleLowerCase();
  const results = useMemo(() => {
    return albums.flatMap((album) => {
      const metadata = [album.title, album.subtitle, album.artist, album.catalogNumber];
      const tracks = query ? album.tracks.filter((track) => matchesSearch(query, [album.title, track.title, track.artist, track.composer])) : [];
      return matchesSearch(query, metadata) || tracks.length ? [{ album, tracks }] : [];
    });
  }, [albums, query]);
  const mode = query ? 'search' : displayMode;
  const stackPageCount = Math.ceil(results.length / stackPageSize);
  const canSort = sorting && !query;
  const orderedResults = active
    ? moveItem(results, results.findIndex(({ album }) => album.id === active.id),
      results.findIndex(({ album }) => album.id === active.target))
    : results;
  const displayedAlbums = mode === 'stacked'
    ? orderedResults.slice(stackPage * stackPageSize, (stackPage + 1) * stackPageSize) : orderedResults;
  const toolbarButton = 'archive-control inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border px-2.5 py-1.5 text-xs sm:text-sm';
  const displayButton = (value: ShelfDisplayMode) =>
    `archive-control flex items-center gap-1.5 rounded px-2.5 py-1.5 aria-pressed:bg-[#c5a059]/15 ${displayMode === value ? 'font-semibold' : ''}`;

  const updateScrollEdges = () => {
    const row = rowRef.current;
    if (!row) return;
    const remaining = row.scrollWidth - row.clientWidth - row.scrollLeft;
    const last = row.lastElementChild?.getBoundingClientRect();
    const bounds = row.getBoundingClientRect();
    const first = row.firstElementChild?.getBoundingClientRect();
    const left = row.scrollLeft > 5 && !!first && first.left < bounds.left - 3;
    const right = remaining > 5 && !!last && last.right > bounds.right + 3;
    setScrollEdges((current) => current.left === left && current.right === right ? current : { left, right });
  };

  useLayoutEffect(() => {
    const row = rowRef.current;
    if (!row) return;
    updateScrollEdges();
    const observer = new ResizeObserver(updateScrollEdges);
    observer.observe(row);
    if (row.firstElementChild) observer.observe(row.firstElementChild);
    return () => observer.disconnect();
  }, [mode, albums.length, canSort]);

  const closeSearch = () => {
    onSearch('');
    onSearchOpenChange(false);
    searchButton.current?.focus({ preventScroll: true });
  };

  useEffect(() => {
    if (searchOpen) searchInput.current?.focus({ preventScroll: true });
  }, [searchOpen]);

  useEffect(() => {
    const find = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== 'f' || (!event.ctrlKey && !event.metaKey) || searchButton.current?.closest('[inert]')) return;
      event.preventDefault();
      setSorting(false);
      onSearchOpenChange(true);
      searchInput.current?.focus({ preventScroll: true });
    };
    window.addEventListener('keydown', find);
    return () => window.removeEventListener('keydown', find);
  }, [onSearchOpenChange]);

  const scrollShelf = (direction: number) => {
    const row = rowRef.current;
    row?.scrollBy({ left: direction * Math.max(180, row.clientWidth * 0.7),
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  };

  const sortControls = (album: Album, index: number) => !canSort ? undefined : (
    <div className="archive-control flex w-fit items-center gap-1 rounded-md border p-0.5" aria-label={`排序《${album.title}》`}>
      <button
        type="button"
        {...handle(album.id)}
        aria-label={`拖动《${album.title}》排序`}
        title="拖到目标藏品的位置"
        className="touch-none cursor-grab rounded p-2 hover:bg-[#c5a059]/20 active:cursor-grabbing"
      ><GripVertical className="pointer-events-none h-4 w-4" aria-hidden="true" /></button>
      {([-1, 1] as const).map((direction) => {
        const neighbor = results[index + direction]?.album;
        const label = direction === -1 ? '向前移动' : '向后移动';
        const Icon = direction === -1 ? ChevronLeft : ChevronRight;
        return (
          <button key={direction} type="button" disabled={!neighbor}
            aria-label={`${label}《${album.title}》`} title={label}
            onClick={() => neighbor && onMoveAlbum(album.id, neighbor.id)}
            className="rounded p-2 hover:bg-[#c5a059]/20 disabled:opacity-30"
          ><Icon className="h-4 w-4" /></button>
        );
      })}
    </div>
  );

  const dropClass = (id: string) => active?.id === id ? 'shelf-drag-slot' : '';

  return (
    <div className="flex-1 flex flex-col justify-between px-6 md:px-14 lg:px-20 py-4 md:py-6 w-full max-w-7xl mx-auto select-none">
      {/* Top Architectural Gallery Header (No Sidebar!) */}
      <header
        className={`flex flex-col md:flex-row md:items-end justify-between gap-4 mb-5 pb-4 border-b transition-colors ${
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
            <span
              className={`hidden sm:inline-block text-xs font-mono ml-1 px-2 py-0.5 rounded-full border ${
                isDark
                  ? 'border-[#292b38] text-[#86889b] bg-[#121318]'
                  : 'border-[#dfdbd0] text-[#767888] bg-[#f7f5ef]'
              }`}
            >
              共 {albums.length} 卷典藏
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

        {/* Right Controls: Unified Collection Toolbar */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          {/* 搜索控制 (Search Control - Expandable in place) */}
          {searchOpen ? (
            <div
              id="shelf-search"
              className={`flex items-center rounded-lg border px-2.5 py-1.5 text-sm transition-all shadow-sm ${
                isDark
                  ? 'bg-[#14151b] border-[#c5a059]/60 text-[#dedbd2]'
                  : 'bg-[#ffffff] border-[#9e7d3b]/60 text-[#1a1b22]'
              }`}
            >
              <Search className="h-4 w-4 text-[#c5a059] shrink-0 mr-2" aria-hidden="true" />
              <input
                ref={searchInput}
                type="search"
                aria-label="搜索专辑、曲目或作者"
                placeholder="搜索画册、曲目或创作者…"
                value={search}
                onChange={(event) => {
                  setSearchLimit(searchPageSize);
                  onSearch(event.currentTarget.value);
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Escape') {
                    event.preventDefault();
                    closeSearch();
                  }
                }}
                className="w-36 sm:w-48 md:w-56 bg-transparent text-sm outline-none placeholder:text-current placeholder:opacity-50"
              />
              <button
                type="button"
                onClick={closeSearch}
                aria-label="关闭搜索"
                className="rounded p-1 text-current/60 hover:text-current hover:bg-[#c5a059]/20 cursor-pointer"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>
          ) : (
            <button
              ref={searchButton}
              type="button"
              aria-expanded={false}
              onClick={() => {
                setSorting(false);
                setSearchLimit(searchPageSize);
                onSearchOpenChange(true);
              }}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg border text-sm transition-all cursor-pointer ${
                isDark
                  ? 'bg-[#14151b] hover:bg-[#20222a] text-[#dedbd2] border-[#252733]'
                  : 'bg-[#ffffff] hover:bg-[#eae8df] text-[#1a1b22] border-[#d4d0c5] shadow-sm'
              }`}
              title="搜索画册、曲目或创作者 (Ctrl+F)"
            >
              <Search className="h-4 w-4 text-[#c5a059]" aria-hidden="true" />
              <span className="hidden sm:inline">搜索</span>
            </button>
          )}

          {/* 排序书籍 (Sort Books Switcher) */}
          {!searchOpen && (
            <button
              type="button"
              aria-pressed={sorting}
              onClick={() => {
                if (displayMode === 'stacked') onDisplayModeChange('shelf');
                setSorting(!sorting);
              }}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg border text-sm transition-all cursor-pointer ${
                sorting
                  ? 'border-[#c5a059] bg-[#c5a059]/15 text-[#c5a059] font-medium shadow-sm'
                  : isDark
                    ? 'bg-[#14151b] hover:bg-[#20222a] text-[#dedbd2] border-[#252733]'
                    : 'bg-[#ffffff] hover:bg-[#eae8df] text-[#1a1b22] border-[#d4d0c5] shadow-sm'
              }`}
              title={sorting ? '点击完成排序' : '拖动书籍调整陈列次序'}
            >
              {sorting ? (
                <>
                  <Check className="h-4 w-4 text-[#c5a059]" aria-hidden="true" />
                  <span>完成排序</span>
                </>
              ) : (
                <>
                  <ArrowUpDown className="h-4 w-4 text-[#c5a059]" aria-hidden="true" />
                  <span className="hidden sm:inline">排序书籍</span>
                </>
              )}
            </button>
          )}

          {/* Display Mode Switcher (立架并列 vs 画册叠放) */}
          <div
            className={`flex items-center space-x-1 p-1 rounded-lg border text-sm font-mono ${
              isDark
                ? 'bg-[#131418] border-[#22242e]'
                : 'bg-[#ffffff] border-[#d4d0c5] shadow-sm'
            }`}
          >
            {([
              ['shelf', '立架并列', Columns3],
              ['stacked', '画册叠放', Layers]
            ] as const).map(([value, label, Icon]) => (
              <button
                key={value}
                type="button"
                aria-pressed={displayMode === value}
                onClick={() => {
                  if (value === 'stacked') setSorting(false);
                  onStackPageChange(0);
                  setSearchLimit(searchPageSize);
                  if (searchOpen) {
                    onSearch('');
                    onSearchOpenChange(false);
                  }
                  onDisplayModeChange(value);
                }}
                className={displayButton(value)}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                <span className="text-xs sm:text-sm">{label}</span>
              </button>
            ))}
          </div>

          {/* 黑白切换按钮 (Light / Dark Monochrome Toggle) */}
          <button
            onClick={onToggleTheme}
            className={`flex items-center space-x-2 px-3 sm:px-4 py-2 rounded-lg border text-sm font-serif transition-all cursor-pointer ${
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
      </header>

      {/* Sorting Active Banner */}
      {canSort && (
        <div className="flex items-center justify-center -mt-2 mb-3">
          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-serif border border-[#c5a059]/40 bg-[#c5a059]/10 text-[#c5a059] shadow-sm">
            <ArrowUpDown className="w-3.5 h-3.5" aria-hidden="true" />
            按住书本拖拽以调整陈列顺序，松开自动保存
          </span>
        </div>
      )}

      {/* Main Exhibition Hall Stage (Books Centerpiece) */}
        <motion.section key={mode} aria-label="典藏书架" data-shelf-mode={mode}
          initial={reduceMotion ? false : { opacity: 0, y: mode === 'search' ? 10 : 18, scale: 0.992 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: reduceMotion ? 0 : 0.23, ease: [0.22, 0.72, 0.25, 1] }}
          className={`my-auto py-6 md:py-8 flex flex-col items-center justify-center relative ${
          mode === 'shelf' ? 'lg:w-[min(93.5rem,calc(100vw-3rem))] lg:self-center' : mode === 'search' ? '!mt-0 w-full' : ''
        }`}>
          {/* Soft overhead gallery spotlight gradient */}
          <div
            className={`absolute -top-16 w-3/4 h-72 blur-3xl pointer-events-none ${
              isDark
                ? 'bg-gradient-to-b from-[#1c1e28]/50 via-transparent to-transparent'
                : 'bg-gradient-to-b from-[#e8e4d8]/70 via-transparent to-transparent'
            }`}
          />

          {mode === 'search' ? (
            <div className="relative z-10 w-full">
              {query && <p role="status" className="mb-3 text-sm opacity-75">找到 {results.length} 部藏品</p>}
              {results.length === 0 && <p className="py-8 text-center text-sm opacity-75">没有找到匹配的专辑或曲目。</p>}
              <ul className="space-y-2">
                {results.slice(0, searchLimit).map(({ album, tracks }) => (
                  <li key={album.id} className="archive-control rounded-lg border">
                    <div className="flex flex-wrap items-center gap-2 rounded-lg p-2">
                      <button type="button" onClick={() => onSelectAlbum(album)} aria-label={`翻开《${album.title}》`}
                        className="flex min-w-0 flex-1 items-center gap-3 rounded p-1 text-left hover:bg-[#c5a059]/10">
                        <img data-cover={`shelf-${album.id}`} src={album.artwork} alt="" loading="lazy" className="h-12 w-9 shrink-0 rounded object-cover" />
                        <span className="min-w-0">
                          <span className="block truncate font-serif font-semibold">{album.title}</span>
                          <span className="block truncate text-xs opacity-70">{album.artist} · {album.tracks.length} 首</span>
                        </span>
                      </button>
                      <button type="button" onClick={() => onPlayAlbum(album)} aria-label={`播放《${album.title}》`}
                        className="rounded p-2 hover:bg-[#c5a059]/20" title="直接播放">
                        <Play className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>
                    {!!tracks.length && (
                      <ul className="border-t border-current/15 px-3 py-1">
                        {tracks.map((track) => (
                          <li key={track.id} className="flex items-center gap-2 text-sm">
                            <button type="button" aria-label={`播放曲目《${track.title}》`} onClick={() => onPlayTrack(track)}
                              className="flex min-w-0 flex-1 items-center gap-3 rounded p-2 text-left hover:bg-[#c5a059]/15">
                              <Play className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                              <span className="truncate">{track.title}</span>
                              <span className="ml-auto font-mono text-xs opacity-70">{track.duration}</span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
              {results.length > searchLimit && (
                <button type="button" className={`${toolbarButton} mt-3`} onClick={() => setSearchLimit(searchLimit + searchPageSize)}>
                  显示更多藏品
                </button>
              )}
            </div>
          ) : (
            <>
              <div ref={rowRef} data-shelf-scroll={mode === 'shelf' ? '' : undefined} onScroll={updateScrollEdges}
                className={mode === 'shelf'
                  ? 'shelf-row w-full flex items-end gap-6 sm:gap-10 lg:gap-14 px-4 pt-8 pb-2 z-10 overflow-x-auto no-scrollbar'
                  : 'relative grid place-content-center w-full py-10 z-10'}
              >
                {displayedAlbums.map(({ album }, index) => (
                  <ThreeDimensionalBook
                    key={album.id}
                    album={album}
                    displayMode={mode}
                    stackIndex={index}
                    totalStacked={displayedAlbums.length}
                    onOpen={() => onSelectAlbum(album)}
                    onPlay={() => onPlayAlbum(album)}
                    sortControls={sortControls(album, index)}
                    dragHandlers={canSort ? handle(album.id) : undefined}
                    dropClass={dropClass(album.id)}
                  />
                ))}
              </div>
              {mode === 'stacked' && stackPageCount > 1 && (
                <nav aria-label="画册叠放分页" className="relative z-20 flex items-center gap-3 text-xs">
                  <button type="button" disabled={stackPage === 0} onClick={() => onStackPageChange(stackPage - 1)}
                    className={`${toolbarButton} disabled:opacity-40`}>上一组</button>
                  <span>{stackPage + 1} / {stackPageCount}</span>
                  <button type="button" disabled={stackPage + 1 === stackPageCount} onClick={() => onStackPageChange(stackPage + 1)}
                    className={`${toolbarButton} disabled:opacity-40`}>下一组</button>
                </nav>
              )}
              {mode === 'shelf' && ([[-1, scrollEdges.left, ChevronLeft], [1, scrollEdges.right, ChevronRight]] as const)
                .map(([direction, visible, Icon]) => visible && (
                  <button key={direction} type="button" onClick={() => scrollShelf(direction)}
                    aria-label={direction === -1 ? '向左浏览书架' : '向右浏览书架'}
                    className={`archive-control absolute top-1/2 z-50 rounded-full border p-2 shadow-lg ${direction === -1 ? '-left-3' : '-right-3'}`}>
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </button>
                ))}
            </>
          )}

          {/* Solid Architectural Shelf Beam Plinth */}
          {mode === 'shelf' && (
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
        </motion.section>

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
        <span>点击封面翻书 · 空格暂停或播放</span>
      </footer>
    </div>
  );
};
