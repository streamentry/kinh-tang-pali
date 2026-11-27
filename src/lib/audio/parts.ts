import type { AudioPart, ReadingMedia } from './types';
export type { AudioPart, ReadingMedia } from './types';

export function validParts(track: ReadingMedia): boolean {
  if (track.parts === undefined) return true;
  if (!Array.isArray(track.parts) || track.parts.length < 2) return false;
  const urls = new Set<string>();
  let total = 0;
  for (const part of track.parts) {
    if (!part || typeof part.url !== 'string' || !/^(https:\/\/|\/[^/])/.test(part.url)
      || !part.url.endsWith('.mp3') || urls.has(part.url)
      || !Number.isFinite(part.duration_seconds) || part.duration_seconds <= 0 || part.duration_seconds > 1800) return false;
    urls.add(part.url); total += part.duration_seconds;
  }
  return track.url === track.parts[0].url && Math.abs(total - track.duration_seconds) < .001;
}

export function locatePart(parts: AudioPart[], seconds: number) {
  let offset = 0;
  const target = Math.max(0, Math.min(seconds, parts.reduce((sum, p) => sum + p.duration_seconds, 0)));
  for (let index = 0; index < parts.length; index++) {
    if (target < offset + parts[index].duration_seconds || index === parts.length - 1)
      return { index, time: target - offset };
    offset += parts[index].duration_seconds;
  }
  throw new Error('Empty reading');
}

/** Own internal ended events so the page advances only after the whole reading.
 * No MediaSource, audio concatenation or extra runtime dependency is needed.
 */
export class ReadingPlayer {
  private track: ReadingMedia;
  private index = 0;
  private pendingTime: number | null = null;
  private playbackRate: number;
  private loaded = false;
  constructor(private audio: HTMLAudioElement, track: ReadingMedia, private failure: (error: unknown) => void) {
    this.track = track;
    this.playbackRate = audio.playbackRate;
    audio.addEventListener('ended', this.onEnded);
    audio.addEventListener('loadedmetadata', this.onMetadata);
  }
  private get parts(): AudioPart[] { return this.track.parts ?? [this.track]; }
  get currentTime() {
    return this.parts.slice(0, this.index).reduce((sum, p) => sum + p.duration_seconds, 0)
      + (this.pendingTime ?? this.audio.currentTime);
  }
  get duration() {
    return !this.loaded || this.track.parts ? this.track.duration_seconds
      : Number.isFinite(this.audio.duration) && this.audio.duration > 0 ? this.audio.duration : this.track.duration_seconds;
  }
  get url() { return this.parts[this.index].url; }
  get partNumber() { return this.index + 1; }
  get partCount() { return this.parts.length; }
  get ended() { return this.index === this.parts.length - 1 && this.audio.ended; }
  private onMetadata = () => {
    if (this.loaded && this.pendingTime !== null) {
      this.audio.currentTime = this.pendingTime;
      this.pendingTime = null;
      this.audio.playbackRate = this.playbackRate;
    }
  };
  private onEnded = (event: Event) => {
    if (!this.loaded || this.index === this.parts.length - 1) return;
    event.stopImmediatePropagation();
    this.switchPart(this.index + 1, 0, true);
  };
  private switchPart(index: number, time: number, resume: boolean) {
    this.audio.pause();
    this.index = index; this.pendingTime = time;
    if (!this.loaded) return;
    this.audio.src = this.parts[index].url;
    this.audio.load();
    if (resume) this.audio.play().catch(this.failure);
  }
  /** Start fetching the selected part only after the listener explicitly plays. */
  load() {
    if (this.loaded) return;
    this.loaded = true;
    this.audio.src = this.parts[this.index].url;
    this.audio.load();
  }
  setPlaybackRate(rate: number) {
    this.audio.playbackRate = rate;
    this.playbackRate = this.audio.playbackRate;
  }
  seek(seconds: number) {
    const position = locatePart(this.parts, Number.isFinite(seconds) ? seconds : 0);
    if (position.index !== this.index) this.switchPart(position.index, position.time, !this.audio.paused);
    else if (this.pendingTime !== null) this.pendingTime = position.time;
    else if (!this.loaded) this.pendingTime = position.time;
    else this.audio.currentTime = position.time;
  }
  select(track: ReadingMedia) {
    this.audio.pause();
    this.track = track;
    this.index = 0;
    this.pendingTime = 0;
    this.loaded = false;
    this.audio.removeAttribute('src');
    this.audio.load();
  }
  destroy() {
    this.audio.removeEventListener('ended', this.onEnded);
    this.audio.removeEventListener('loadedmetadata', this.onMetadata);
    this.audio.pause();
  }
}
