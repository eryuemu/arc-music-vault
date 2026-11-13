import React, { useState, useRef, useEffect, useCallback, useLayoutEffect } from 'react';
import { useReducedMotion } from 'framer-motion';
import { LOCAL_ARCHIVE } from './data/vaultData';
import { Album, Track, ViewMode, ThemeMode, ShelfDisplayMode } from './types';
import { moveCover } from './coverTransition';
import { BookshelfView } from './components/BookshelfView';
import { BookSpreadView } from './components/BookSpreadView';
import { GalleryStageView } from './components/GalleryStageView';
import { QuietPlayer } from './components/QuietPlayer';

export const App: React.FC = () => {
  const [albums] = useState<Album[]>(LOCAL_ARCHIVE);
  const [selectedAlbum, setSelectedAlbum] = useState<Album>(LOCAL_ARCHIVE[0]);
  const [currentView, setCurrentView] = useState<ViewMode>('shelf');
  const [bookOpening, setBookOpening] = useState<'waiting' | 'opening' | null>(null);
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
  const [currentTrack, setCurrentTrack] = useState<Track | null>(LOCAL_ARCHIVE[0].tracks[0]);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolume] = useState<number>(0.85);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const mainRef = useRef<HTMLElement>(null);
  const viewScroll = useRef({ shelf: 0, spread: 0, stage: 0 });
  const shelfScroll = useRef(0);
  const shelfEntry = useRef('');
  const transitionDestination = useRef<ViewMode | null>(null);
  const returnFromStageQueued = useRef(false);
  const reduceMotion = useReducedMotion();
  const playingAlbum = albums.find((album) => album.tracks.some((track) => track.id === currentTrack?.id)) ?? selectedAlbum;

  useLayoutEffect(() => {
    if (!mainRef.current) return;
    mainRef.current.scrollTop = viewScroll.current[currentView];
    const shelf = mainRef.current.querySelector('[data-shelf-scroll]');
    if (shelf) shelf.scrollLeft = shelfScroll.current;
  }, [currentView, shelfDisplayMode]);

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

  const handlePlayTrack = (track: Track, album: Album = selectedAlbum) => {
    setSelectedAlbum(album);
    setCurrentTrack(track);
    if (audioRef.current) {
      audioRef.current.src = track.audioUrl;
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch((e) => console.warn('Audio play request blocked or pending interaction:', e));
    }
  };

  const handleTogglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch((e) => console.warn(e));
    }
  };

  const handleSeek = (newTime: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    if (audioRef.current) {
      audioRef.current.volume = newVol;
    }
  };

  const handleNextTrack = () => {
    if (!currentTrack) return;
    const currentIndex = selectedAlbum.tracks.findIndex((t) => t.id === currentTrack.id);
    if (currentIndex < selectedAlbum.tracks.length - 1) {
      handlePlayTrack(selectedAlbum.tracks[currentIndex + 1], selectedAlbum);
    } else {
      handlePlayTrack(selectedAlbum.tracks[0], selectedAlbum);
    }
  };

  const handlePrevTrack = () => {
    if (!currentTrack) return;
    const currentIndex = selectedAlbum.tracks.findIndex((t) => t.id === currentTrack.id);
    if (currentIndex > 0) {
      handlePlayTrack(selectedAlbum.tracks[currentIndex - 1], selectedAlbum);
    } else {
      handlePlayTrack(selectedAlbum.tracks[selectedAlbum.tracks.length - 1], selectedAlbum);
    }
  };

  // Keyboard shortcut (Space = Play/Pause, Esc = Back)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && currentView === 'stage' && !e.repeat && !document.fullscreenElement) {
        returnToSpread();
        return;
      }
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.code === 'Space' && !(e.target instanceof HTMLElement && e.target.closest('button'))) {
        e.preventDefault();
        handleTogglePlay();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, currentView, returnToSpread]);

  const isDark = theme === 'dark';

  return (
    <div
      className={`h-dvh w-full flex flex-col transition-colors duration-300 overflow-hidden ${
        isDark
          ? 'paper-texture-dark bg-[#0d0e11] text-[#eae8e3]'
          : 'paper-texture-light bg-[#f7f5ef] text-[#18191e]'
      }`}
    >
      {/* Hidden Native Audio Element */}
      <audio
        ref={audioRef}
        src={currentTrack?.audioUrl}
        onTimeUpdate={() => {
          if (audioRef.current) setCurrentTime(audioRef.current.currentTime);
        }}
        onLoadedMetadata={() => {
          if (audioRef.current) setDuration(audioRef.current.duration);
        }}
        onEnded={handleNextTrack}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />

      {/* Main Full-Width Viewport (No Sidebar! 100% Physical 3D Architecture) */}
      <main ref={mainRef} data-view={currentView} className="flex-1 min-h-0 flex flex-col relative overflow-x-hidden overflow-y-auto" key={currentView}>
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
            onToggleTheme={toggleTheme}
            onPlayTrack={(t) => handlePlayTrack(t, selectedAlbum)}
            onOpenStage={openStage}
            onBackToShelf={returnToShelf}
          />
        )}

        {currentView === 'stage' && (
          <GalleryStageView
            album={selectedAlbum}
            currentTrack={currentTrack}
            isPlaying={isPlaying}
            theme={theme}
            onToggleTheme={toggleTheme}
            onBackToSpread={returnToSpread}
          />
        )}
      </main>

      {/* Minimalist Floating Player */}
      <QuietPlayer
        currentTrack={currentTrack}
        currentAlbum={playingAlbum}
        onOpenCover={currentView === 'shelf' ? () => openBook(playingAlbum, 'player-cover') : undefined}
        isPlaying={isPlaying}
        currentTime={currentTime}
        duration={duration}
        volume={volume}
        theme={theme}
        onTogglePlay={handleTogglePlay}
        onSeek={handleSeek}
        onPrev={handlePrevTrack}
        onNext={handleNextTrack}
        onVolumeChange={handleVolumeChange}
      />
    </div>
  );
};

export default App;
