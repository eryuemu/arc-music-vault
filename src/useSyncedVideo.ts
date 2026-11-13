import { useLayoutEffect, useState } from 'react';
import type { RefObject } from 'react';
import type { VideoStatus } from './types';

export function useSyncedVideo(
  audioRef: RefObject<HTMLAudioElement>,
  videoRef: RefObject<HTMLVideoElement>,
  activeVideoUrl?: string
): VideoStatus {
  const [status, setStatus] = useState<VideoStatus>('loading');

  useLayoutEffect(() => {
    const audio = audioRef.current;
    const video = videoRef.current;
    if (!activeVideoUrl || !audio || !video) return;

    setStatus('loading');
    let active = true;
    let needsPosition = true;

    const sync = () => {
      if (video.error) {
        setStatus('error');
        return;
      }
      if (audio.readyState < HTMLMediaElement.HAVE_METADATA ||
          video.readyState < HTMLMediaElement.HAVE_METADATA) return;

      const position = Math.min(audio.currentTime, video.duration);
      const wantsPlayback = !audio.paused && !audio.ended && position < video.duration;
      const shouldPlay = wantsPlayback && !audio.seeking &&
        audio.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA;
      if (!shouldPlay && !video.paused) video.pause();
      if (video.seeking || audio.seeking) return;

      const drift = position - video.currentTime;
      if (needsPosition) {
        needsPosition = false;
        if (Math.abs(drift) > 0.01) {
          video.currentTime = position;
          return;
        }
      }

      // Let playback catch up after a seek. Seeking again here can keep the
      // decoder busy while the audio clock continues to move.
      const correction = shouldPlay && Math.abs(drift) > 0.05
        ? Math.max(-0.25, Math.min(0.25, drift))
        : 0;
      const rate = audio.playbackRate * (1 + correction);
      if (video.playbackRate !== rate) video.playbackRate = rate;

      if (!wantsPlayback && video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
        setStatus('ready');
      }
      if (shouldPlay && video.paused) {
        void video.play().catch((error) => {
          if (active && error.name !== 'AbortError') setStatus('error');
        });
      }
    };

    const alignVideo = () => {
      needsPosition = true;
      sync();
    };
    const revealVideo = () => setStatus('ready');
    const audioEvents = ['loadedmetadata', 'playing', 'waiting', 'timeupdate', 'ratechange'];
    const audioPositionEvents = ['pause', 'seeking', 'seeked', 'ended'];
    const videoEvents = ['loadedmetadata', 'loadeddata', 'canplay', 'seeked', 'error'];
    audioEvents.forEach((event) => audio.addEventListener(event, sync));
    audioPositionEvents.forEach((event) => audio.addEventListener(event, alignVideo));
    videoEvents.forEach((event) => video.addEventListener(event, sync));
    video.addEventListener('playing', revealVideo);
    sync();

    return () => {
      active = false;
      audioEvents.forEach((event) => audio.removeEventListener(event, sync));
      audioPositionEvents.forEach((event) => audio.removeEventListener(event, alignVideo));
      videoEvents.forEach((event) => video.removeEventListener(event, sync));
      video.removeEventListener('playing', revealVideo);
      video.pause();
    };
  }, [activeVideoUrl, audioRef, videoRef]);

  return status;
}
