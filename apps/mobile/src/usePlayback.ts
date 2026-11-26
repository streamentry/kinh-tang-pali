import { useEffect, useMemo, useSyncExternalStore } from 'react';
import { AppState } from 'react-native';
import { createAudioPlayer, createAudioPlaylist, setAudioModeAsync, type AudioStatus } from 'expo-audio';
import { PlaybackController, type PlaybackPlatform, type PlayerEvent } from './playback-core';
import { playlistEvent } from './playlist-clock';
import type { ProgressStore } from './storage-core';
import type { NativeTrack } from '../../../src/lib/native/protocol';

function lockScreenMetadata(track: NativeTrack, sourceUrl: string | undefined) {
  const part = track.version.parts?.findIndex(item => item.url === sourceUrl) ?? -1;
  return {
    title: track.title,
    artist: track.version.label + (part >= 0 ? ` · Phần ${part + 1}/${track.version.parts!.length}` : ''),
    albumTitle: 'Kinh Tạng Pāli Việt',
  };
}

const eventOf = (status: AudioStatus): PlayerEvent => ({
  isLoaded: status.isLoaded,
  currentTime: status.currentTime,
  duration: status.duration,
  playing: status.playing,
  isBuffering: status.isBuffering,
  didJustFinish: status.didJustFinish,
  error: status.error,
});

function nativePlatform(): PlaybackPlatform {
  let preparation: Promise<void> | null = null;
  return {
    supportsNativeMultipart: true,
    prepare() {
      preparation ??= setAudioModeAsync({
        playsInSilentMode: true, shouldPlayInBackground: true, interruptionMode: 'doNotMix',
      }).catch(error => { preparation = null; throw error; });
      return preparation;
    },
    createPlayer(url, remainingParts) {
      if (remainingParts && remainingParts.length > 1) {
        const playlist = createAudioPlaylist({
          sources: remainingParts.map(part => ({ uri: part.url })), updateInterval: 500, loop: 'none',
        });
        let lastEvent: PlayerEvent | null = null;
        let lockScreenTrack: NativeTrack | null = null;
        const metadata = (track: NativeTrack) => lockScreenMetadata(track, remainingParts[playlist.currentIndex]?.url);
        return {
          play: () => playlist.play(),
          pause: () => playlist.pause(),
          seekTo: seconds => playlist.seekTo(seconds), // Initial seek is within the first queued part.
          setRate: rate => { playlist.playbackRate = rate; },
          setLockScreen(active, track) {
            lockScreenTrack = active ? track : null;
            playlist.setActiveForLockScreen(active, metadata(track), {
              showSeekBackward: true, showSeekForward: true, showNextTrack: false, showPreviousTrack: false,
            });
          },
          subscribe(listener) {
            const statusSubscription = playlist.addListener('playlistStatusUpdate', status => {
              lastEvent = playlistEvent(remainingParts, status);
              listener(lastEvent);
            });
            const trackSubscription = playlist.addListener('trackChanged', () => {
              if (lockScreenTrack) playlist.updateLockScreenMetadata(metadata(lockScreenTrack));
            });
            return () => { statusSubscription.remove(); trackSubscription.remove(); };
          },
          getStatus: () => playlistEvent(remainingParts, {
            currentIndex: playlist.currentIndex, currentTime: playlist.currentTime,
            playing: playlist.playing, isBuffering: playlist.isBuffering, isLoaded: playlist.isLoaded,
            didJustFinish: lastEvent?.didJustFinish ?? false, error: lastEvent?.error ?? null,
          }),
          dispose: () => playlist.release(),
        };
      }
      const player = createAudioPlayer({ uri: url }, { updateInterval: 500 });
      let lastEvent: PlayerEvent | null = null;
      return {
        play: () => player.play(),
        pause: () => player.pause(),
        seekTo: seconds => player.seekTo(seconds, 0, 0),
        setRate: rate => { player.playbackRate = rate; },
        setLockScreen: (active, track) => player.setActiveForLockScreen(active,
          lockScreenMetadata(track, url), { showSeekBackward: true, showSeekForward: true }),
        subscribe(listener) {
          const subscription = player.addListener('playbackStatusUpdate', status => {
            lastEvent = eventOf(status);
            listener(lastEvent);
          });
          return () => subscription.remove();
        },
        getStatus: () => ({
          isLoaded: player.isLoaded, currentTime: player.currentTime,
          duration: player.duration,
          playing: player.playing, isBuffering: player.isBuffering,
          didJustFinish: lastEvent?.didJustFinish ?? false, error: lastEvent?.error ?? null,
        }),
        dispose: () => player.release(),
      };
    },
  };
}

/** Mount once above every screen. No audio starts during hydration. */
export function usePlayback(store: ProgressStore | null) {
  const controller = useMemo(() => new PlaybackController(store, nativePlatform()), [store]);
  const snapshot = useSyncExternalStore(controller.subscribe, controller.getSnapshot, controller.getSnapshot);
  useEffect(() => {
    const subscription = AppState.addEventListener('change', () => controller.flush());
    const interval = setInterval(controller.flush, 5_000);
    return () => {
      subscription.remove();
      clearInterval(interval);
      controller.dispose();
    };
  }, [controller]);
  return {
    ...snapshot,
    playTrack: controller.playTrack,
    pause: controller.pause,
    stop: controller.stop,
    stopAfterCurrent: controller.stopAfterCurrent,
    toggle: controller.toggle,
    retry: controller.retry,
    retrySaves: controller.retrySaves,
    seek: controller.seek,
    skip: controller.skip,
    setRate: controller.setRate,
    flush: controller.flush,
  };
}
