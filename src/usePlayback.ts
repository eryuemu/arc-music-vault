import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import type { Album, PlaybackMode, Track } from './types';
import { asRecord, readPreference, writePreference } from './preferences';

const resumeKey = 'arc_resume';
const modeKey = 'arc_playback_mode';
const validModes: PlaybackMode[] = ['all', 'album', 'one', 'shuffle'];

export function usePlayback(albums: Album[]) {
  const albumByTrack = useMemo(() => new Map(
    albums.flatMap((album) => album.tracks.map((track) => [track.id, album] as const))
  ), [albums]);

  const [restored] = useState(() => {
    const saved = asRecord(readPreference(resumeKey) ?? readPreference('arc_playback'));
    const savedTrack = typeof saved.trackId === 'string' && albumByTrack.has(saved.trackId)
      ? saved.trackId : undefined;
    const savedMode = readPreference(modeKey);
    const initialMode: PlaybackMode = typeof savedMode === 'string' && validModes.includes(savedMode as PlaybackMode)
      ? (savedMode as PlaybackMode)
      : 'all';

    return {
      trackId: savedTrack ?? albums[0]?.tracks[0]?.id ?? '',
      position: savedTrack && typeof saved.position === 'number' && Number.isFinite(saved.position)
        ? Math.max(0, saved.position) : 0,
      volume: typeof saved.volume === 'number' && Number.isFinite(saved.volume)
        ? Math.max(0, Math.min(1, saved.volume)) : 0.85,
      mode: initialMode
    };
  });

  const [trackId, setTrackId] = useState(restored.trackId);
  const [volume, setVolumeState] = useState(restored.volume);
  const [mode, setModeState] = useState<PlaybackMode>(restored.mode);
  const [currentTime, setCurrentTime] = useState(restored.position);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [error, setError] = useState('');

  const audioRef = useRef<HTMLAudioElement>(null);
  const pendingPosition = useRef(restored.position);
  const positionRef = useRef(restored.position);
  const lastSavedAt = useRef(0);
  const lastSettings = useRef({ trackId, volume });
  const lastNonZeroVolume = useRef(restored.volume > 0 ? restored.volume : 0.85);
  const modeRef = useRef(mode);

  useLayoutEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  const setMode = useCallback((nextMode: PlaybackMode) => {
    setModeState(nextMode);
    writePreference(modeKey, nextMode);
  }, []);

  const cycleMode = useCallback(() => {
    const cycleMap: Record<PlaybackMode, PlaybackMode> = {
      all: 'album',
      album: 'one',
      one: 'shuffle',
      shuffle: 'all'
    };
    const next = cycleMap[modeRef.current] ?? 'all';
    setMode(next);
    return next;
  }, [setMode]);

  const setVolume = useCallback((newVolume: number) => {
    const clamped = Math.max(0, Math.min(1, Number.isFinite(newVolume) ? newVolume : 0.85));
    if (clamped > 0) {
      lastNonZeroVolume.current = clamped;
    }
    setVolumeState(clamped);
  }, []);

  const toggleMute = useCallback(() => {
    if (volume === 0) {
      setVolume(lastNonZeroVolume.current || 0.85);
    } else {
      lastNonZeroVolume.current = volume;
      setVolume(0);
    }
  }, [volume, setVolume]);

  const save = useCallback(() => {
    writePreference(resumeKey, { ...lastSettings.current, position: positionRef.current });
    lastSavedAt.current = Date.now();
  }, []);

  useLayoutEffect(() => {
    lastSettings.current = { trackId, volume };
    save();
  }, [trackId, volume, save]);

  useLayoutEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  useEffect(() => {
    const saveWhenHidden = () => {
      if (document.hidden) save();
    };
    window.addEventListener('pagehide', save);
    document.addEventListener('visibilitychange', saveWhenHidden);
    return () => {
      window.removeEventListener('pagehide', save);
      document.removeEventListener('visibilitychange', saveWhenHidden);
    };
  }, [save]);

  const play = useCallback((audio: HTMLAudioElement) => {
    setError('');
    void audio.play().catch((reason) => {
      if (reason.name !== 'AbortError') setError('无法播放此曲，请检查本地音频文件。');
    });
  }, []);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) play(audio);
    else audio.pause();
  }, [play]);

  const seek = useCallback((time: number) => {
    const audio = audioRef.current;
    if (!audio || !Number.isFinite(time) || !Number.isFinite(audio.duration)) return;
    const position = Math.max(0, Math.min(time, audio.duration));
    audio.currentTime = position;
    positionRef.current = position;
    setCurrentTime(position);
    save();
  }, [save]);

  const playTrack = useCallback((track: Track, restart = false) => {
    const audio = audioRef.current;
    if (!audio) return;
    if (track.id !== trackId) {
      pendingPosition.current = 0;
      positionRef.current = 0;
      // Commit the source before play() to retain the current user gesture.
      flushSync(() => {
        setTrackId(track.id);
        setCurrentTime(0);
        setDuration(0);
        setIsPlaying(false);
      });
    } else if (restart) {
      pendingPosition.current = 0;
      seek(0);
    }
    play(audio);
  }, [trackId, play, seek]);

  const togglePlayTrack = useCallback((track: Track) => {
    if (track.id === trackId) {
      togglePlay();
    } else {
      playTrack(track, true);
    }
  }, [trackId, togglePlay, playTrack]);

  const step = useCallback((direction: 1 | -1, options?: { allowRestartThreshold?: boolean; fromEnded?: boolean }) => {
    const audio = audioRef.current;
    // 1. Previous button 3-second threshold: return to track beginning first
    if (direction === -1 && (options?.allowRestartThreshold ?? true)) {
      if (audio && audio.currentTime > 3) {
        seek(0);
        if (audio.paused) play(audio);
        return;
      }
    }

    const currentAlbum = albumByTrack.get(trackId);
    if (!currentAlbum) return;

    // 2. Single track loop ('one') triggered by track end
    if (modeRef.current === 'one' && options?.fromEnded) {
      seek(0);
      if (audio) play(audio);
      return;
    }

    const trackIndexInAlbum = currentAlbum.tracks.findIndex((track) => track.id === trackId);

    // 3. Album loop mode ('album'): loop strictly within current album
    if (modeRef.current === 'album') {
      const albumTracks = currentAlbum.tracks;
      if (albumTracks.length <= 1) {
        seek(0);
        if (audio && audio.paused) play(audio);
        return;
      }
      if (direction === 1) {
        const nextIndex = (trackIndexInAlbum + 1) % albumTracks.length;
        playTrack(albumTracks[nextIndex], true);
      } else {
        const prevIndex = (trackIndexInAlbum - 1 + albumTracks.length) % albumTracks.length;
        playTrack(albumTracks[prevIndex], true);
      }
      return;
    }

    // 4. Shuffle mode ('shuffle')
    if (modeRef.current === 'shuffle') {
      const allTracks = albums.flatMap((album) => album.tracks);
      if (allTracks.length <= 1) {
        seek(0);
        return;
      }
      const candidateTracks = allTracks.filter((t) => t.id !== trackId);
      const randomTrack = candidateTracks[Math.floor(Math.random() * candidateTracks.length)];
      if (randomTrack) {
        playTrack(randomTrack, true);
        return;
      }
    }

    // 5. Sequential / Vault Loop ('all')
    if (direction === 1) {
      if (trackIndexInAlbum < currentAlbum.tracks.length - 1) {
        playTrack(currentAlbum.tracks[trackIndexInAlbum + 1], true);
      } else {
        const currentAlbumIndex = albums.findIndex((a) => a.id === currentAlbum.id);
        const nextAlbum = albums[(currentAlbumIndex + 1) % albums.length];
        if (nextAlbum?.tracks[0]) {
          playTrack(nextAlbum.tracks[0], true);
        }
      }
    } else {
      if (trackIndexInAlbum > 0) {
        playTrack(currentAlbum.tracks[trackIndexInAlbum - 1], true);
      } else {
        const currentAlbumIndex = albums.findIndex((a) => a.id === currentAlbum.id);
        const prevAlbum = albums[(currentAlbumIndex - 1 + albums.length) % albums.length];
        if (prevAlbum && prevAlbum.tracks.length > 0) {
          playTrack(prevAlbum.tracks[prevAlbum.tracks.length - 1], true);
        }
      }
    }
  }, [albums, albumByTrack, trackId, play, playTrack, seek]);

  // MediaSession API Integration for mobile lockscreen & hardware keys
  useEffect(() => {
    if (typeof window === 'undefined' || !('mediaSession' in navigator)) return;
    const album = albumByTrack.get(trackId);
    const track = album?.tracks.find((t) => t.id === trackId);
    if (!track || !album) return;

    const artworkUrl = album.artwork.startsWith('http')
      ? album.artwork
      : `${window.location.origin}${album.artwork}`;

    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: track.title,
        artist: track.artist,
        album: album.title,
        artwork: [
          { src: artworkUrl, sizes: '512x512', type: 'image/jpeg' }
        ]
      });
    } catch {}
  }, [trackId, albumByTrack]);

  useEffect(() => {
    if (typeof window === 'undefined' || !('mediaSession' in navigator)) return;
    try {
      navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
    } catch {}
  }, [isPlaying]);

  useEffect(() => {
    if (typeof window === 'undefined' || !('mediaSession' in navigator)) return;
    if ('setPositionState' in navigator.mediaSession && duration > 0 && Number.isFinite(duration)) {
      try {
        navigator.mediaSession.setPositionState({
          duration: Math.max(0, duration),
          playbackRate: audioRef.current?.playbackRate || 1,
          position: Math.max(0, Math.min(currentTime, duration))
        });
      } catch {}
    }
  }, [currentTime, duration]);

  useEffect(() => {
    if (typeof window === 'undefined' || !('mediaSession' in navigator)) return;

    const onPlay = () => {
      const audio = audioRef.current;
      if (audio && audio.paused) play(audio);
    };
    const onPause = () => {
      const audio = audioRef.current;
      if (audio && !audio.paused) audio.pause();
    };
    const onPrev = () => step(-1);
    const onNext = () => step(1);
    const onSeekTo = (details: MediaSessionActionDetails) => {
      if (details.seekTime !== undefined && Number.isFinite(details.seekTime)) {
        seek(details.seekTime);
      }
    };

    try {
      navigator.mediaSession.setActionHandler('play', onPlay);
      navigator.mediaSession.setActionHandler('pause', onPause);
      navigator.mediaSession.setActionHandler('previoustrack', onPrev);
      navigator.mediaSession.setActionHandler('nexttrack', onNext);
      navigator.mediaSession.setActionHandler('seekto', onSeekTo);
    } catch {}

    return () => {
      try {
        navigator.mediaSession.setActionHandler('play', null);
        navigator.mediaSession.setActionHandler('pause', null);
        navigator.mediaSession.setActionHandler('previoustrack', null);
        navigator.mediaSession.setActionHandler('nexttrack', null);
        navigator.mediaSession.setActionHandler('seekto', null);
      } catch {}
    };
  }, [play, seek, step]);

  return {
    trackId,
    volume,
    mode,
    audioRef,
    currentTime,
    duration,
    isPlaying,
    isBuffering,
    error,
    togglePlay,
    seek,
    playTrack,
    togglePlayTrack,
    step,
    setVolume,
    toggleMute,
    setMode,
    cycleMode,
    audioEvents: {
      onLoadedMetadata: (event: React.SyntheticEvent<HTMLAudioElement>) => {
        setIsBuffering(false);
        if (pendingPosition.current > 0) {
          const position = pendingPosition.current < event.currentTarget.duration ? pendingPosition.current : 0;
          pendingPosition.current = 0;
          seek(position);
        }
      },
      onTimeUpdate: (event: React.SyntheticEvent<HTMLAudioElement>) => {
        if (pendingPosition.current > 0) return;
        const position = event.currentTarget.currentTime;
        positionRef.current = event.currentTarget.ended ? 0 : position;
        setCurrentTime(position);
        if (Date.now() - lastSavedAt.current >= 2000) save();
      },
      onDurationChange: (event: React.SyntheticEvent<HTMLAudioElement>) => {
        const length = event.currentTarget.duration;
        setDuration(Number.isFinite(length) ? length : 0);
      },
      onEnded: () => step(1, { fromEnded: true }),
      onPlay: (event: React.SyntheticEvent<HTMLAudioElement>) => {
        setIsBuffering(false);
        setIsPlaying(!event.currentTarget.paused);
      },
      onPause: (event: React.SyntheticEvent<HTMLAudioElement>) => {
        setIsBuffering(false);
        setIsPlaying(!event.currentTarget.paused);
        save();
      },
      onWaiting: () => setIsBuffering(true),
      onPlaying: () => {
        setIsBuffering(false);
        setIsPlaying(true);
      },
      onCanPlay: () => setIsBuffering(false),
      onError: () => {
        setIsBuffering(false);
        setError('无法读取此曲，请检查本地音频文件。');
      }
    }
  };
}
