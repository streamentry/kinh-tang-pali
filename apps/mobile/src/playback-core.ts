import { locatePart, type AudioPart } from '../../../src/lib/audio/parts';
import { isNativeTrack, trackKey, type NativeTrack } from '../../../src/lib/native/protocol';
import type { ProgressStore } from './storage-core';

export interface PlaybackStatus {
  position: number;
  duration: number;
  playing: boolean;
  loading: boolean;
  error: string | null;
  rate: number;
  completed: boolean;
  queueRemaining: number;
}
export interface PlaybackSnapshot { track: NativeTrack | null; status: PlaybackStatus }
export interface PlayerEvent {
  isLoaded: boolean;
  currentTime: number;
  duration?: number;
  playing: boolean;
  isBuffering: boolean;
  didJustFinish: boolean;
  error?: string | null;
}
export interface PlayerPort {
  play(): void;
  pause(): void;
  seekTo(seconds: number): Promise<void>;
  setRate(rate: number): void;
  setLockScreen(active: boolean, track: NativeTrack): void;
  subscribe(listener: (status: PlayerEvent) => void): () => void;
  getStatus(): PlayerEvent;
  dispose(): void;
}
export interface PlaybackPlatform {
  /** A native queue can play every remaining MP3 part without a JS handoff.
   * Such a port reports time/duration across the supplied remaining parts and
   * emits didJustFinish only when the final supplied part ends. */
  supportsNativeMultipart?: boolean;
  prepare(): Promise<void>;
  createPlayer(url: string, remainingParts?: AudioPart[]): PlayerPort;
}
interface Session {
  player: PlayerPort;
  unsubscribe: () => void;
  partIndex: number;
  nativeMultipart: boolean;
  offset: number;
  target: number;
  prepared: boolean;
  restoring: boolean;
  ready: boolean;
  confirmedPosition: boolean;
  restoredAt: number;
  desiredPlaying: boolean;
  timeout: ReturnType<typeof setTimeout> | null;
}

const idle: PlaybackStatus = {
  position: 0, duration: 0, playing: false, loading: false, error: null,
  rate: 1, completed: false, queueRemaining: 0,
};
const saveError = 'Chưa lưu được vị trí nghe trên thiết bị. Hãy thử lưu lại.';
const bound = (value: number, duration: number) => Math.max(0, Math.min(Number.isFinite(value) ? value : 0, duration));
const partsOf = (track: NativeTrack) => track.version.parts ?? [track.version];

/** A platform-independent owner for the native player. Each load/seek has its
 * own player and callback identity, so an old network/seek completion cannot
 * start playback or overwrite the progress of a newer request. */
export class PlaybackController {
  private snapshot: PlaybackSnapshot = { track: null, status: { ...idle } };
  private listeners = new Set<() => void>();
  private session: Session | null = null;
  private queue: NativeTrack[] = [];
  private lastSavedAt = 0;
  private lastSavedSignature = '';

  constructor(
    private store: ProgressStore | null,
    private platform: PlaybackPlatform,
    private now: () => number = Date.now,
  ) {}

  getSnapshot = () => this.snapshot;
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  };

  private update(status: Partial<PlaybackStatus>, track = this.snapshot.track) {
    this.snapshot = { track, status: { ...this.snapshot.status, ...status } };
    for (const listener of this.listeners) listener();
  }

  private release() {
    const previous = this.session;
    this.session = null; // Invalidate callbacks before invoking native methods.
    if (!previous) return;
    if (previous.timeout) clearTimeout(previous.timeout);
    previous.unsubscribe();
    try { previous.player.pause(); } catch { /* Native process may already be gone. */ }
    try {
      if (this.snapshot.track) previous.player.setLockScreen(false, this.snapshot.track);
    } catch { /* Releasing the player still has to happen. */ }
    try { previous.player.dispose(); } catch { /* Already released by the native process. */ }
  }

  private fail(error: unknown, message = 'Không phát được audio. Hãy kiểm tra kết nối rồi thử lại.') {
    this.flush();
    this.release();
    this.update({ error: message, loading: false, playing: false });
  }

  private acceptPosition(session: Session, event: PlayerEvent): boolean {
    if (!Number.isFinite(event.currentTime)) return false;
    if (session.confirmedPosition) return true;
    // Some native players resolve a seek when it is scheduled. Until the first
    // matching sample, retain the requested position instead of persisting a
    // delayed initial zero. Account for time played while JS was suspended.
    const elapsed = Math.max(0, (this.now() - session.restoredAt) / 1_000);
    if (event.currentTime < session.target - 1
      || event.currentTime > session.target + elapsed * this.snapshot.status.rate + 2) return false;
    session.confirmedPosition = true;
    return true;
  }

  /** Synchronous SQLite commit. Called by native status updates and lifecycle
   * events; periodic saves limit loss when the OS kills the process outright. */
  flush = () => {
    const { track, status } = this.snapshot;
    const session = this.session;
    // EOF releases the native player; a failed final save must remain retryable.
    if (!track || !this.store || (!session?.ready && !status.completed)) return;
    let position = status.position;
    if (!status.completed && session) {
      try {
        const current = session.player.getStatus();
        if (current.isLoaded && this.acceptPosition(session, current)) {
          position = bound(session.offset + current.currentTime, status.duration);
        }
      } catch { /* Preserve the last observed position after a native reset. */ }
    }
    try {
      const signature = JSON.stringify([trackKey(track), position, status.rate, status.completed]);
      if (signature === this.lastSavedSignature) return;
      this.store.saveListening({
        track, position, duration: status.duration, rate: status.rate, completed: status.completed,
      });
      this.lastSavedAt = this.now();
      this.lastSavedSignature = signature;
      if (this.snapshot.status.error === saveError) this.update({ error: null });
    } catch (error) {
      this.update({ error: saveError });
    }
  };

  playTrack = (track: NativeTrack, startSeconds?: number, queue: NativeTrack[] = []) => {
    if (!isNativeTrack(track) || queue.some(item => !isNativeTrack(item) || item.version.id !== track.version.id)) {
      this.update({ error: 'Thông tin audio không hợp lệ. Hãy mở lại bài trên thư viện.' });
      return;
    }
    if (startSeconds !== undefined && (!Number.isFinite(startSeconds) || startSeconds < 0)) {
      this.update({ error: 'Vị trí phát không hợp lệ.' });
      return;
    }
    const sameTrack = this.snapshot.track && trackKey(this.snapshot.track) === trackKey(track);
    if (sameTrack && this.session?.ready && startSeconds === undefined && !this.snapshot.status.completed && !this.snapshot.status.error) {
      this.queue = [...queue];
      this.update({ queueRemaining: this.queue.length });
      this.resume();
      return;
    }
    this.flush();
    let position = startSeconds;
    let rate = this.snapshot.status.rate;
    if (position === undefined) {
      try {
        const saved = this.store?.getListening(track);
        position = saved && !saved.completed ? saved.position : track.version.start_seconds;
        rate = saved?.rate ?? rate;
      } catch (error) {
        this.update({ error: 'Không đọc được vị trí nghe đã lưu. Dữ liệu vẫn được giữ lại.' });
        return;
      }
    }
    this.queue = [...queue];
    this.update({ rate });
    this.load(track, position, true);
  };

  private load(track: NativeTrack, seconds: number, desiredPlaying: boolean) {
    this.release();
    const parts = partsOf(track);
    const location = locatePart(parts, seconds);
    const offset = parts.slice(0, location.index).reduce((sum, part) => sum + part.duration_seconds, 0);
    this.update({
      position: bound(seconds, track.version.duration_seconds), duration: track.version.duration_seconds,
      playing: false, loading: true, error: null, completed: false, queueRemaining: this.queue.length,
    }, track);
    try {
      const remainingParts = parts.slice(location.index);
      const nativeMultipart = Boolean(this.platform.supportsNativeMultipart && remainingParts.length > 1);
      const player = this.platform.createPlayer(parts[location.index].url, nativeMultipart ? remainingParts : undefined);
      const session: Session = {
        player, unsubscribe: () => {}, partIndex: location.index, nativeMultipart, offset, target: location.time,
        prepared: false, restoring: false, ready: false, confirmedPosition: false, restoredAt: 0,
        desiredPlaying, timeout: null,
      };
      this.session = session;
      session.unsubscribe = player.subscribe(event => this.onStatus(session, event));
      session.timeout = setTimeout(() => {
        if (this.session === session && !session.ready) {
          this.fail(new Error('Audio load timeout'), 'Audio tải quá lâu. Hãy kiểm tra kết nối rồi thử lại.');
        }
      }, 30_000);
      void this.platform.prepare().then(() => {
        if (this.session !== session) return;
        session.prepared = true;
        this.onStatus(session, player.getStatus());
      }).catch(error => { if (this.session === session) this.fail(error); });
    } catch (error) { this.fail(error); }
  }

  private onStatus(session: Session, event: PlayerEvent) {
    if (session !== this.session) return;
    if (event.error) { this.fail(event.error); return; }
    if (!session.ready) {
      if (event.isLoaded && session.prepared && !session.restoring) void this.restore(session);
      return;
    }
    const { track, status } = this.snapshot;
    if (!track) return;
    if (!event.didJustFinish && (!event.isLoaded || event.isBuffering)) {
      this.update({ loading: true });
      // AVQueuePlayer can become unloaded between parts. Do not wait forever
      // if the next remote part fails without a native error event.
      session.timeout ??= setTimeout(() => {
        if (this.session === session && this.snapshot.status.loading) {
          this.fail(new Error('Audio buffering timeout'), 'Audio tải quá lâu. Hãy kiểm tra kết nối rồi thử lại.');
        }
      }, 30_000);
      if (!event.isLoaded) return;
    } else if (session.timeout) {
      clearTimeout(session.timeout);
      session.timeout = null;
    }
    // iOS may already have removed the last AVQueuePlayer item when EOF fires.
    if (!event.didJustFinish && !this.acceptPosition(session, event)) return;
    if (event.didJustFinish) {
      const parts = partsOf(track);
      const resume = session.desiredPlaying;
      if (!session.nativeMultipart && session.partIndex < parts.length - 1) {
        const nextPosition = session.offset + parts[session.partIndex].duration_seconds;
        this.update({ position: nextPosition, playing: false });
        this.flush();
        this.load(track, nextPosition, resume);
      } else {
        this.update({ position: status.duration, playing: false, loading: false, completed: true });
        this.flush();
        const next = resume ? this.queue.shift() : undefined;
        if (next) this.load(next, next.version.start_seconds, true);
        else this.release(); // Remove a dead lock-screen Play action at EOF.
      }
      return;
    }
    const position = bound(session.offset + event.currentTime, status.duration);
    const paused = status.playing && !event.playing && !event.isBuffering;
    const partDuration = event.duration && Number.isFinite(event.duration) && event.duration > 0
      ? event.duration : partsOf(track)[session.partIndex].duration_seconds;
    // A native paused sample can precede its EOF notification. Retain play
    // intent at that boundary so it does not prevent part/queue continuation.
    // Explicit pause() has already cleared the intent before emitting a sample.
    if (!event.isBuffering && (event.playing || event.currentTime < partDuration - 0.1)) {
      session.desiredPlaying = event.playing;
    }
    this.update({ position, playing: event.playing, loading: event.isBuffering,
      completed: status.completed && position >= status.duration - 0.01 });
    if (event.playing && !status.playing) {
      // iOS may resume an interrupted individual AVPlayer using play(), which
      // restores 1x. Reapply the reader's chosen speed after native resumption.
      try { session.player.setRate(status.rate); }
      catch (error) { this.fail(error); return; }
    }
    if (paused || this.now() - this.lastSavedAt >= 5_000) this.flush();
  }

  private async restore(session: Session) {
    if (this.session !== session || session.restoring) return;
    session.restoring = true;
    try {
      await session.player.seekTo(session.target);
      if (this.session !== session) return;
      session.player.setRate(this.snapshot.status.rate);
      session.ready = true;
      session.restoring = false;
      session.restoredAt = this.now();
      if (session.timeout) clearTimeout(session.timeout);
      session.timeout = null;
      this.update({ position: session.offset + session.target, loading: false });
      this.flush();
      if (session.desiredPlaying) this.resume();
    } catch (error) { if (this.session === session) this.fail(error); }
  }

  private resume() {
    const session = this.session;
    const track = this.snapshot.track;
    if (!session || !track) return;
    session.desiredPlaying = true;
    if (!session.ready) return;
    try {
      session.player.setLockScreen(true, track);
      session.player.play();
    } catch (error) { this.fail(error); }
  }

  pause = () => {
    if (!this.session) return;
    this.session.desiredPlaying = false;
    try { this.session.player.pause(); } catch (error) { this.fail(error); }
    this.update({ playing: false });
    this.flush();
  };

  toggle = () => {
    if (!this.snapshot.track) return;
    if (this.snapshot.status.playing || this.session?.desiredPlaying && this.snapshot.status.loading) this.pause();
    else if (this.snapshot.status.completed || this.snapshot.status.error) {
      this.playTrack(this.snapshot.track, this.snapshot.status.completed
        ? this.snapshot.track.version.start_seconds : this.snapshot.status.position, this.queue);
    } else this.resume();
  };

  /** Retrying a write must not change playback, including while paused or
   * completed. Media failures retain the normal explicit retry behavior. */
  retry = () => {
    if (this.snapshot.status.error === saveError) this.flush();
    else this.toggle();
  };

  seek = (seconds: number) => {
    if (!this.snapshot.track || !Number.isFinite(seconds)) return;
    const resume = this.session?.ready && !this.snapshot.status.loading
      ? this.snapshot.status.playing : this.session?.desiredPlaying ?? false;
    this.flush();
    this.load(this.snapshot.track, bound(seconds, this.snapshot.status.duration), resume);
  };

  skip = (seconds: number) => { this.seek(this.snapshot.status.position + seconds); };

  setRate = (rate: number) => {
    if (!Number.isFinite(rate) || rate < 0.5 || rate > 2) return;
    this.update({ rate });
    try { if (this.session?.ready) this.session.player.setRate(rate); }
    catch (error) { this.fail(error); }
    this.flush();
  };

  /** Finish this session before importing a backup. Later lifecycle/interval
   * callbacks then have no old player position to write over imported data. */
  stop = () => {
    this.flush();
    this.release();
    this.queue = [];
    this.lastSavedSignature = '';
    this.update({ ...idle }, null);
  };

  dispose = () => {
    this.flush();
    this.release();
    this.listeners.clear();
  };
}
