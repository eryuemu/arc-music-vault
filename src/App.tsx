import React, { useState, useRef, useEffect } from 'react';
import { LOCAL_ARCHIVE } from './data/vaultData';
import { Album, Track, ViewMode, ThemeMode } from './types';
import { BookshelfView } from './components/BookshelfView';
import { BookSpreadView } from './components/BookSpreadView';
import { GalleryStageView } from './components/GalleryStageView';
import { QuietPlayer } from './components/QuietPlayer';

export const App: React.FC = () => {
  const [albums] = useState<Album[]>(LOCAL_ARCHIVE);
  const [selectedAlbum, setSelectedAlbum] = useState<Album>(LOCAL_ARCHIVE[0]);
  const [currentView, setCurrentView] = useState<ViewMode>('shelf');
  const [theme, setTheme] = useState<ThemeMode>('dark');
  const [currentTrack, setCurrentTrack] = useState<Track | null>(LOCAL_ARCHIVE[0].tracks[0]);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolume] = useState<number>(0.85);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
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
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.code === 'Space') {
        e.preventDefault();
        handleTogglePlay();
      }
      if (e.key === 'Escape') {
        if (currentView === 'stage') {
          setCurrentView('spread');
        } else if (currentView === 'spread') {
          setCurrentView('shelf');
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, currentView]);

  const isDark = theme === 'dark';

  return (
    <div
      className={`h-screen w-full flex flex-col transition-colors duration-300 overflow-hidden ${
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
      <main className="flex-1 flex flex-col pb-20 overflow-hidden relative justify-center">
        {currentView === 'shelf' && (
          <BookshelfView
            albums={albums}
            theme={theme}
            onToggleTheme={toggleTheme}
            onSelectAlbum={(alb) => {
              setSelectedAlbum(alb);
              setCurrentView('spread');
            }}
          />
        )}

        {currentView === 'spread' && (
          <BookSpreadView
            album={selectedAlbum}
            currentTrack={currentTrack}
            isPlaying={isPlaying}
            theme={theme}
            onToggleTheme={toggleTheme}
            onPlayTrack={(t) => handlePlayTrack(t, selectedAlbum)}
            onOpenStage={() => setCurrentView('stage')}
            onBackToShelf={() => setCurrentView('shelf')}
          />
        )}

        {currentView === 'stage' && (
          <GalleryStageView
            album={selectedAlbum}
            currentTrack={currentTrack}
            isPlaying={isPlaying}
            theme={theme}
            onToggleTheme={toggleTheme}
            onBackToSpread={() => setCurrentView('spread')}
          />
        )}
      </main>

      {/* Minimalist Floating Player */}
      <QuietPlayer
        currentTrack={currentTrack}
        currentAlbum={selectedAlbum}
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
