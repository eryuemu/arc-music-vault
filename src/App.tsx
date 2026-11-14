import React, { useState, useRef, useEffect, useCallback, useLayoutEffect, useMemo } from 'react';
import { useReducedMotion } from 'framer-motion';
import { Minimize2 } from 'lucide-react';
import { LOCAL_ARCHIVE } from './data/vaultData';
import { Album, Track, ViewMode, ThemeMode, ShelfDisplayMode } from './types';
import { moveCover } from './coverTransition';
import { useSyncedVideo } from './useSyncedVideo';
import { BookshelfView } from './components/BookshelfView';
import { BookSpreadView } from './components/BookSpreadView';
import { GalleryStageView } from './components/GalleryStageView';
import { QuietPlayer } from './components/QuietPlayer';
import { knownIds, moveItem, readPreference, writePreference } from './preferences';
import { usePlayback } from './usePlayback';

const albumIds = new Set(LOCAL_ARCHIVE.map((album) => album.id));
const trackIndex = new Map(LOCAL_ARCHIVE.flatMap((album) => album.tracks.map((track) => [track.id, { album, track }] as const)));
const shelfModes: ShelfDisplayMode[] = ['shelf', 'stacked'];

export const App: React.FC = () => {
  const [albumOrder, setAlbumOrder] = useState(() => knownIds(readPreference('arc_shelf_order'), albumIds));
  const albums = useMemo(() => {
    const known = new Map(LOCAL_ARCHIVE.map((album) => [album.id, album]));
    return [...albumOrder.map((id) => known.get(id)!), ...LOCAL_ARCHIVE.filter((album) => !albumOrder.includes(album.id))];
  }, [albumOrder]);
  const playback = usePlayback(LOCAL_ARCHIVE);
  const { audioRef, togglePlay: handleTogglePlay } = playback;
  const { track: currentTrack, album: playingAlbum } = trackIndex.get(playback.trackId)!;
  const [notice, setNotice] = useState('');
  const noticeTimer = useRef<ReturnType<typeof setTimeout>>();
  const [search, setSearch] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [stackPage, setStackPage] = useState(0);
  const [selectedAlbum, setSelectedAlbum] = useState<Album>(LOCAL_ARCHIVE[0]);
  const [currentView, setCurrentView] = useState<ViewMode>('shelf');
  const [stageMedia, setStageMedia] = useState<'image' | 'video'>('image');
  const [pvBackgroundEnabled, setPvBackgroundEnabled] = useState(() => readPreference('arc_pv_background') === true);
  const [pvFocusEnabled, setPvFocusEnabled] = useState<false | 'keyboard' | 'pointer'>(false);
  const [bookOpening, setBookOpening] = useState<'waiting' | 'opening' | null>(null);
  const [bookClosing, setBookClosing] = useState(false);
  const [shelfDisplayMode, setShelfDisplayMode] = useState(() => {
    const saved = readPreference('arc_shelf_display');
    return shelfModes.find((mode) => mode === saved) ?? 'shelf';
  });
  const [theme, setTheme] = useState<ThemeMode>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlTheme = params.get('theme');
      if (urlTheme === 'light' || urlTheme === 'dark') return urlTheme;
      const saved = (() => {
        try { return localStorage.getItem('arc_theme'); } catch { return null; }
      })();
      if (saved === 'light' || saved === 'dark') return saved;
    }
    return 'dark';
  });
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const interfaceRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLElement>(null);
  const exitPvFocusRef = useRef<HTMLButtonElement>(null);
  const viewScroll = useRef({ shelf: 0, spread: 0, stage: 0 });
  const shelfScroll = useRef(0);
  const shelfEntry = useRef('');
  const transitionDestination = useRef<ViewMode | null>(null);
  const returnFromStageQueued = useRef(false);
  const reduceMotion = useReducedMotion();
  const playingVideoUrl = playingAlbum.tracks[0]?.id === currentTrack.id ? playingAlbum.videoUrl : undefined;
  const backgroundVideoUrl = pvBackgroundEnabled ? playingVideoUrl : undefined;
  const stageVideoUrl = currentView === 'stage' ? selectedAlbum.videoUrl : undefined;
  const videoUrl = backgroundVideoUrl ?? stageVideoUrl;
  const isStageVideoMode = stageMedia === 'video' && !!stageVideoUrl && stageVideoUrl === backgroundVideoUrl;
  const videoStatus = useSyncedVideo(audioRef, videoRef, backgroundVideoUrl);
  const isBackgroundVisible = !!backgroundVideoUrl && videoStatus === 'ready';
  const isPvFocus = !!pvFocusEnabled && isBackgroundVisible;

  useEffect(() => writePreference('arc_shelf_order', albumOrder), [albumOrder]);
  useEffect(() => writePreference('arc_shelf_display', shelfDisplayMode), [shelfDisplayMode]);
  useEffect(() => writePreference('arc_pv_background', pvBackgroundEnabled), [pvBackgroundEnabled]);
  useEffect(() => () => clearTimeout(noticeTimer.current), []);

  const report = (message: string) => {
    clearTimeout(noticeTimer.current);
    setNotice(message);
    noticeTimer.current = setTimeout(() => setNotice(''), 2300);
  };

  const moveAlbum = (id: string, target: string) => {
    const ids = albums.map((album) => album.id);
    const position = ids.indexOf(target);
    setAlbumOrder(moveItem(ids, ids.indexOf(id), position));
    report(`已移到第 ${position + 1} 位`);
  };

  useLayoutEffect(() => setStageMedia('image'), [currentTrack.id]);

  const playTrack = playback.playTrack;

  const playAlbum = (album: Album) => {
    const [firstTrack] = album.tracks;
    if (firstTrack) playTrack(firstTrack);
  };

  useLayoutEffect(() => {
    if (!mainRef.current) return;
    mainRef.current.scrollTop = viewScroll.current[currentView];
    const shelf = mainRef.current.querySelector('[data-shelf-scroll]');
    if (shelf) shelf.scrollLeft = shelfScroll.current;
  }, [currentView, shelfDisplayMode]);

  useLayoutEffect(() => {
    if (!isBackgroundVisible) setPvFocusEnabled(false);
  }, [isBackgroundVisible]);

  useLayoutEffect(() => {
    const interfaceElement = interfaceRef.current;
    if (!isPvFocus || !interfaceElement) return;
    const previousFocus = document.activeElement;
    exitPvFocusRef.current?.focus({ preventScroll: true });
    interfaceElement.inert = true;

    return () => {
      interfaceElement.inert = false;
      if (previousFocus instanceof HTMLElement) previousFocus.focus({ preventScroll: true });
    };
  }, [isPvFocus]);

  const navigate = useCallback(async (to: ViewMode, fromCover: string, toCover: string, update?: () => void) => {
    if (transitionDestination.current) return false;
    transitionDestination.current = to;

    const main = mainRef.current;
    const from = main?.dataset.view as ViewMode | undefined;
    if (main && from) viewScroll.current[from] = main.scrollTop;
    const shelf = main?.querySelector('[data-shelf-scroll]');
    if (shelf) shelfScroll.current = shelf.scrollLeft;

    try {
      await moveCover(fromCover, toCover, () => {
        update?.();
        setCurrentView(to);
      }, !!reduceMotion);
      return true;
    } finally {
      transitionDestination.current = null;
    }
  }, [reduceMotion]);

  const openBook = async (album: Album, source = `shelf-${album.id}`) => {
    const moved = await navigate('spread', source, 'folio-cover', () => {
      shelfEntry.current = source;
      viewScroll.current.spread = 0;
      setSelectedAlbum(album);
      setBookOpening('waiting');
      setBookClosing(false);
    });
    if (moved) setBookOpening('opening');
  };

  const returnToShelf = useCallback(() => {
    void navigate('shelf', 'folio-cover', shelfEntry.current);
  }, [navigate]);

  const returnToSpread = useCallback(() => {
    if (transitionDestination.current === 'stage') {
      returnFromStageQueued.current = true;
      return;
    }
    void navigate('spread', 'stage-artwork', 'folio-artwork');
  }, [navigate]);

  const openStage = async () => {
    const moved = await navigate('stage', 'folio-artwork', 'stage-artwork', () => {
      viewScroll.current.stage = 0;
      setBookOpening(null);
      setStageMedia('image');
    });
    if (moved && returnFromStageQueued.current) {
      returnFromStageQueued.current = false;
      returnToSpread();
    }
  };

  const toggleTheme = () => {
    setTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      try {
        localStorage.setItem('arc_theme', next);
      } catch {}
      return next;
    });
  };

  const handleStageMediaChange = (media: 'image' | 'video') => {
    if (media === 'video') {
      const videoTrack = stageVideoUrl ? selectedAlbum.tracks[0] : undefined;
      if (!videoTrack) return;
      if (currentTrack.id !== videoTrack.id || !playback.isPlaying) playTrack(videoTrack);
      setPvBackgroundEnabled(true);
    }
    setStageMedia(media);
  };

  const togglePvBackground = () => {
    if (pvBackgroundEnabled) setStageMedia('image');
    setPvBackgroundEnabled(!pvBackgroundEnabled);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.defaultPrevented) return;
      if (e.key === 'Escape' && !e.repeat && !document.fullscreenElement) {
        if (isPvFocus) {
          e.preventDefault();
          setPvFocusEnabled(false);
          return;
        }
        if (currentView === 'stage') {
          returnToSpread();
          return;
        }
        if (currentView === 'spread') {
          setBookClosing(true);
          return;
        }
      }
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      const focusedButton = e.target instanceof HTMLElement && e.target.closest('button');
      if (e.code === 'Space' && !e.repeat && (isPvFocus || !focusedButton)) {
        e.preventDefault();
        handleTogglePlay();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleTogglePlay, currentView, isPvFocus, returnToSpread]);

  const isDark = theme === 'dark';

  return (
    <div
      data-pv-focus={isPvFocus}
      className={`relative isolate h-dvh w-full flex flex-col transition-colors duration-300 overflow-hidden ${
        isDark
          ? 'paper-texture-dark bg-[#0d0e11] text-[#eae8e3]'
          : 'paper-texture-light bg-[#f7f5ef] text-[#18191e]'
      }`}
    >
      <audio
        ref={audioRef}
        src={currentTrack.audioUrl}
        preload="metadata"
        {...playback.audioEvents}
      />
      {videoUrl && (
        <div
          className={`pv-screen pointer-events-none absolute inset-0 overflow-hidden bg-black ${isBackgroundVisible || isStageVideoMode ? '' : 'invisible'}`}
          aria-hidden="true"
        >
          <video
            key={videoUrl}
            ref={videoRef}
            src={videoUrl}
            muted
            playsInline
            preload={videoUrl === playingVideoUrl ? 'auto' : 'metadata'}
            onLoadedMetadata={(event) => {
              const video = event.currentTarget;
              if (video.videoHeight) video.style.setProperty('--pv-aspect', String(video.videoWidth / video.videoHeight));
            }}
            className={`pv-video ${isBackgroundVisible ? '' : 'invisible'}`}
          />
          {isBackgroundVisible && !isStageVideoMode && (
            <div className="pv-background-scrim absolute inset-0" data-theme={theme} />
          )}
        </div>
      )}

      <div ref={interfaceRef} className="relative flex min-h-0 flex-1 flex-col">
        <main ref={mainRef} data-view={currentView} className="pv-view flex-1 min-h-0 flex flex-col relative overflow-x-hidden overflow-y-auto" key={currentView}>
          {currentView === 'shelf' && (
            <BookshelfView
              albums={albums}
              search={search}
              searchOpen={searchOpen}
              onSearchOpenChange={setSearchOpen}
              stackPage={stackPage}
              onStackPageChange={setStackPage}
              onSearch={(value) => {
                setSearch(value);
                shelfScroll.current = 0;
                const shelf = mainRef.current?.querySelector('[data-shelf-scroll]');
                if (shelf) shelf.scrollLeft = 0;
              }}
              onMoveAlbum={moveAlbum}
              onPlayAlbum={playAlbum}
              onPlayTrack={playTrack}
              theme={theme}
              displayMode={shelfDisplayMode}
              onDisplayModeChange={(mode) => {
                const shelf = mainRef.current?.querySelector('[data-shelf-scroll]');
                if (shelf) shelfScroll.current = shelf.scrollLeft;
                viewScroll.current.shelf = mainRef.current?.scrollTop ?? 0;
                setShelfDisplayMode(mode);
              }}
              onToggleTheme={toggleTheme}
              onSelectAlbum={openBook}
            />
          )}

          {currentView === 'spread' && (
            <BookSpreadView
              album={selectedAlbum}
              currentTrack={currentTrack}
              isPlaying={playback.isPlaying}
              theme={theme}
              opening={bookOpening}
              closing={bookClosing}
              onToggleTheme={toggleTheme}
              onPlayTrack={playTrack}
              onOpenStage={openStage}
              onCloseBook={() => setBookClosing(true)}
              onBackToShelf={returnToShelf}
            />
          )}

          {currentView === 'stage' && (
            <GalleryStageView
              album={selectedAlbum}
              currentTrack={currentTrack}
              isPlaying={playback.isPlaying}
              isVideoMode={isStageVideoMode}
              videoStatus={videoStatus}
              theme={theme}
              onMediaChange={handleStageMediaChange}
              onToggleTheme={toggleTheme}
              onBackToSpread={returnToSpread}
            />
          )}
        </main>

        <div className="pv-player relative z-40 shrink-0">
          <QuietPlayer
            currentTrack={currentTrack}
            currentAlbum={playingAlbum}
            onOpenCover={currentView === 'shelf' ? () => void openBook(playingAlbum, 'player-cover') : undefined}
            isPlaying={playback.isPlaying}
            currentTime={playback.currentTime}
            duration={playback.duration}
            volume={playback.volume}
            theme={theme}
            isVideoMode={isBackgroundVisible || isStageVideoMode}
            pvBackgroundStatus={backgroundVideoUrl ? videoStatus : undefined}
            onTogglePvBackground={playingVideoUrl ? togglePvBackground : undefined}
            onEnterPvFocus={isBackgroundVisible ? (event) => {
              if (!transitionDestination.current) setPvFocusEnabled(event.detail === 0 ? 'keyboard' : 'pointer');
            } : undefined}
            onTogglePlay={handleTogglePlay}
            onSeek={playback.seek}
            onPrev={() => playback.step(-1)}
            onNext={() => playback.step(1)}
            onVolumeChange={playback.setVolume}
            error={playback.error}
          />
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-4 bottom-40 z-50 flex justify-center md:bottom-28" role="status">
        {notice && !isPvFocus && (
          <span className="rounded-md border border-[#c5a059]/40 bg-[#17171b] px-4 py-2 text-sm text-[#f5e7cc] shadow-lg">{notice}</span>
        )}
      </div>

      {isPvFocus && (
        <button
          ref={exitPvFocusRef}
          type="button"
          aria-label="退出清屏"
          aria-keyshortcuts="Escape"
          onClick={() => setPvFocusEnabled(false)}
          data-pv-keyboard={pvFocusEnabled === 'keyboard'}
          className="pv-exit absolute inset-0 z-50 cursor-default outline-none"
        >
          <span className="pv-exit-hint absolute bottom-5 right-5 flex cursor-pointer items-center gap-2 rounded-md border border-white/25 bg-black/70 px-3 py-2 text-xs text-white">
            <Minimize2 className="h-4 w-4" aria-hidden="true" />
            退出清屏 <kbd className="text-white/75">Esc</kbd>
          </span>
        </button>
      )}
    </div>
  );
};

export default App;
