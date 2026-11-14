import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import type { Album, Track } from './types';
import { asRecord, readPreference, writePreference } from './preferences';

const resumeKey = 'arc_resume';

export function usePlayback(albums: Album[]) {
  const albumByTrack = useMemo(() => new Map(
    albums.flatMap((album) => album.tracks.map((track) => [track.id, album] as const))
  ), [albums]);
  const [restored] = useState(() => {
    const saved = asRecord(readPreference(resumeKey) ?? readPreference('arc_playback'));
    const savedTrack = typeof saved.trackId === 'string' && albumByTrack.has(saved.trackId)
      ? saved.trackId : undefined;
    return {
      trackId: savedTrack ?? albums[0].tracks[0].id,
      position: savedTrack && typeof saved.position === 'number' && Number.isFinite(saved.position)
        ? Math.max(0, saved.position) : 0,
      volume: typeof saved.volume === 'number' && Number.isFinite(saved.volume)
        ? Math.max(0, Math.min(1, saved.volume)) : 0.85
    };
  });

  const [trackId, setTrackId] = useState(restored.trackId);
  const [volume, setVolume] = useState(restored.volume);
  const [currentTime, setCurrentTime] = useState(restored.position);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState('');
  const audioRef = useRef<HTMLAudioElement>(null);
  const pendingPosition = useRef(restored.position);
  const positionRef = useRef(restored.position);
  const lastSavedAt = useRef(0);
  const lastSettings = useRef({ trackId, volume });

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

  const seek = (time: number) => {
    const audio = audioRef.current;
    if (!audio || !Number.isFinite(time) || !Number.isFinite(audio.duration)) return;
    const position = Math.max(0, Math.min(time, audio.duration));
    audio.currentTime = position;
    positionRef.current = position;
    setCurrentTime(position);
    save();
  };

  const playTrack = (track: Track, restart = false) => {
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
  };

  const step = (direction: 1 | -1) => {
    const album = albumByTrack.get(trackId);
    if (!album) return;
    const index = album.tracks.findIndex((track) => track.id === trackId);
    const next = album.tracks[(index + direction + album.tracks.length) % album.tracks.length];
    playTrack(next, true);
  };

  return {
    trackId, volume, audioRef, currentTime, duration, isPlaying, error,
    togglePlay, seek, playTrack, step, setVolume,
    audioEvents: {
      onLoadedMetadata: (event: React.SyntheticEvent<HTMLAudioElement>) => {
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
      onEnded: () => step(1),
      onPlay: (event: React.SyntheticEvent<HTMLAudioElement>) => setIsPlaying(!event.currentTarget.paused),
      onPause: (event: React.SyntheticEvent<HTMLAudioElement>) => {
        setIsPlaying(!event.currentTarget.paused);
        save();
      },
      onError: () => setError('无法读取此曲，请检查本地音频文件。')
    }
  };
}
