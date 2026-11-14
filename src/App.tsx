import React, { useState, useRef, useEffect, useCallback, useLayoutEffect } from 'react';
import { flushSync } from 'react-dom';
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

function playAudio(audio: HTMLAudioElement) {
  void audio.play().catch((error) => {
    if (error.name !== 'AbortError') console.warn('Audio playback failed:', error);
  });
}

export const App: React.FC = () => {
  const [albums] = useState<Album[]>(LOCAL_ARCHIVE);
  const [selectedAlbum, setSelectedAlbum] = useState<Album>(LOCAL_ARCHIVE[0]);
  const [currentView, setCurrentView] = useState<ViewMode>('shelf');
  const [stageMedia, setStageMedia] = useState<'image' | 'video'>('image');
  const [pvBackgroundEnabled, setPvBackgroundEnabled] = useState(false);
  const [pvFocusEnabled, setPvFocusEnabled] = useState<false | 'keyboard' | 'pointer'>(false);
  const [bookOpening, setBookOpening] = useState<'waiting' | 'opening' | null>(null);
  const [bookClosing, setBookClosing] = useState(false);
  const [shelfDisplayMode, setShelfDisplayMode] = useState<ShelfDisplayMode>('shelf');
  const [theme, setTheme] = useState<ThemeMode>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlTheme = params.get('theme');
      if (urlTheme === 'light' || urlTheme === 'dark') return urlTheme;
      const saved = localStorage.getItem('arc_theme') as ThemeMode | null;
      if (saved === 'light' || saved === 'dark') return saved;
    }
    return 'dark';
  });
  const [currentTrack, setCurrentTrack] = useState<Track>(LOCAL_ARCHIVE[0].tracks[0]);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolume] = useState<number>(0.85);

  const audioRef = useRef<HTMLAudioElement | null>(null);
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
  const playingAlbum = albums.find((album) => album.tracks.some((track) => track.id === currentTrack.id)) ?? selectedAlbum;
  const playingVideoUrl = playingAlbum.tracks[0]?.id === currentTrack.id ? playingAlbum.videoUrl : undefined;
  const backgroundVideoUrl = pvBackgroundEnabled ? playingVideoUrl : undefined;
  const stageVideoUrl = currentView === 'stage' ? selectedAlbum.videoUrl : undefined;
  const videoUrl = backgroundVideoUrl ?? stageVideoUrl;
  const isStageVideoMode = stageMedia === 'video' && !!stageVideoUrl && stageVideoUrl === backgroundVideoUrl;
  const videoStatus = useSyncedVideo(audioRef, videoRef, backgroundVideoUrl);
  const isBackgroundVisible = !!backgroundVideoUrl && videoStatus === 'ready';
  const isPvFocus = !!pvFocusEnabled && isBackgroundVisible;

  useLayoutEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

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

  const handlePlayTrack = (track: Track, restart = false) => {
    const audio = audioRef.current;
    if (!audio) return;

    if (track.id !== currentTrack.id) {
      // Commit the new source before play() so it can use the current user gesture.
      flushSync(() => {
        setCurrentTrack(track);
        setCurrentTime(0);
        setDuration(0);
        setStageMedia('image');
      });
    } else if (restart) {
      audio.currentTime = 0;
      setCurrentTime(0);
    }
    playAudio(audio);
  };

  const handleStageMediaChange = (media: 'image' | 'video') => {
    if (media === 'video') {
      const videoTrack = stageVideoUrl ? selectedAlbum.tracks[0] : undefined;
      if (!videoTrack) return;
      if (currentTrack.id !== videoTrack.id) handlePlayTrack(videoTrack);
      setPvBackgroundEnabled(true);
    }
    setStageMedia(media);
  };

  const togglePvBackground = () => {
    if (pvBackgroundEnabled) setStageMedia('image');
    setPvBackgroundEnabled(!pvBackgroundEnabled);
  };

  const handleTogglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) playAudio(audio);
    else audio.pause();
  }, []);

  const handleSeek = (newTime: number) => {
    const audio = audioRef.current;
    if (!audio || !Number.isFinite(newTime) || !Number.isFinite(audio.duration)) return;
    const position = Math.max(0, Math.min(newTime, audio.duration));
    audio.currentTime = position;
    setCurrentTime(position);
  };

  const stepTrack = (direction: 1 | -1) => {
    const tracks = playingAlbum.tracks;
    const index = tracks.findIndex((track) => track.id === currentTrack.id);
    const next = tracks[(index + direction + tracks.length) % tracks.length];
    if (next) handlePlayTrack(next, true);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        onDurationChange={(e) => {
          const length = e.currentTarget.duration;
          setDuration(Number.isFinite(length) ? length : 0);
        }}
        onEnded={() => stepTrack(1)}
        onPlay={(e) => setIsPlaying(!e.currentTarget.paused)}
        onPause={(e) => setIsPlaying(!e.currentTarget.paused)}
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
              isPlaying={isPlaying}
              theme={theme}
              opening={bookOpening}
              closing={bookClosing}
              onToggleTheme={toggleTheme}
              onPlayTrack={(track) => handlePlayTrack(track)}
              onOpenStage={openStage}
              onCloseBook={() => setBookClosing(true)}
              onBackToShelf={returnToShelf}
            />
          )}

          {currentView === 'stage' && (
            <GalleryStageView
              album={selectedAlbum}
              currentTrack={currentTrack}
              isPlaying={isPlaying}
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
            onOpenCover={currentView === 'shelf' ? () => openBook(playingAlbum, 'player-cover') : undefined}
            isPlaying={isPlaying}
            currentTime={currentTime}
            duration={duration}
            volume={volume}
            theme={theme}
            isVideoMode={isBackgroundVisible || isStageVideoMode}
            pvBackgroundStatus={backgroundVideoUrl ? videoStatus : undefined}
            onTogglePvBackground={playingVideoUrl ? togglePvBackground : undefined}
              onEnterPvFocus={isBackgroundVisible ? (event) => {
                if (!transitionDestination.current) setPvFocusEnabled(event.detail === 0 ? 'keyboard' : 'pointer');
              } : undefined}
            onTogglePlay={handleTogglePlay}
            onSeek={handleSeek}
            onPrev={() => stepTrack(-1)}
            onNext={() => stepTrack(1)}
            onVolumeChange={setVolume}
          />
        </div>
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
