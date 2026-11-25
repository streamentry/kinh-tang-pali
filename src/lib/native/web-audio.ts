import { readAudioVersion, saveAudioVersion, readAutoNext, saveAutoNext, playlistIndexFromHash } from '../audio/navigation';
import type { PlayerTrack } from '../audio/playlist';
import type { AudioVersionPlayerData } from '../audio/types';
import type { NativeTrack } from './protocol';
import { installNativeBridge } from './web-bridge';

export function stopWebAudio(element: HTMLElement) {
  const audio = element.querySelector('audio');
  if (audio) { audio.pause(); audio.controls = false; audio.hidden = true; audio.removeAttribute('src'); audio.load(); }
  element.querySelector<HTMLElement>('.listening-custom')?.setAttribute('hidden', '');
}
function make<K extends keyof HTMLElementTagNameMap>(tag: K, className?: string, text?: string): HTMLElementTagNameMap[K] {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text) element.textContent = text;
  return element;
}
function versionPicker(versions: AudioVersionPlayerData[], change: () => void) {
  const label = make('label', 'listen-version');
  label.append(make('span', undefined, 'Bản nghe'));
  const select = make('select');
  select.setAttribute('aria-label', 'Chọn bản audio trong ứng dụng');
  for (const version of versions) {
    const option = make('option', undefined, version.label); option.value = version.id; select.append(option);
  }
  try { const selected = readAudioVersion(localStorage); if (versions.some(version => version.id === selected)) select.value = selected; } catch { /* Default is the original version. */ }
  select.addEventListener('change', () => {
    try { saveAudioVersion(localStorage, select.value as AudioVersionPlayerData['id']); } catch { /* Selection still works. */ }
    change();
  });
  label.append(select);
  return { label, select };
}

/** The native session uses one audio engine. Browser and no-JS fallbacks are unchanged. */
export function mountNativeSuttaAudio(element: HTMLElement): () => void {
  const bridge = installNativeBridge();
  if (!bridge) return () => {};
  stopWebAudio(element);
  const versions = JSON.parse(element.dataset.versions ?? '[]') as AudioVersionPlayerData[];
  if (!versions.length) return () => {};
  const panel = make('div', 'listening-options');
  panel.dataset.nativeAudio = 'true';
  const description = make('p', 'listen-version-description');
  const notice = make('p', 'listen-notice'); notice.setAttribute('role', 'status'); notice.hidden = true;
  const refresh = () => {
    const version = versions.find(item => item.id === picker.select.value)!;
    description.textContent = version.description;
    const label = element.querySelector('[data-track-label]'); if (label) label.textContent = version.label;
    const review = element.querySelector<HTMLElement>('[data-track-review]');
    if (review) { review.hidden = version.review_status !== 'pending'; review.textContent = version.review_status === 'pending' ? 'Chờ nghe duyệt' : ''; }
    const length = element.querySelector('[data-track-length]');
    if (length) length.textContent = `${Math.round(version.duration_seconds / 60)} phút`;
  };
  const picker = versionPicker(versions, refresh);
  const launch = (startSeconds?: number) => {
    const version = versions.find(item => item.id === picker.select.value)!;
    const track: NativeTrack = { uid: element.dataset.nativeUid!, title: element.dataset.nativeTitle!, pageUrl: location.href, version };
    const sent = bridge.play(track, startSeconds);
    notice.hidden = false;
    notice.textContent = sent ? 'Điều khiển nghe ở trình phát của ứng dụng. Vị trí được lưu trên thiết bị.' : 'Không mở được trình phát. Hãy thử lại.';
  };
  const play = make('button', 'button', 'Nghe trong ứng dụng'); play.type = 'button'; play.addEventListener('click', () => launch());
  const restart = make('button', 'listen-neighbour', 'Nghe từ đầu'); restart.type = 'button'; restart.addEventListener('click', () => launch(0));
  panel.append(picker.label, description, play, restart, notice);
  const footer = element.querySelector('.listening-footer'); element.insertBefore(panel, footer);
  refresh();
  return () => panel.remove();
}

export function mountNativePlaylist(element: HTMLElement, tracks: PlayerTrack[]): () => void {
  const bridge = installNativeBridge();
  if (!bridge || !tracks.length) return () => {};
  stopWebAudio(element);
  const controller = new AbortController();
  const panel = make('div', 'listening-options'); panel.dataset.nativeAudio = 'true';
  const title = make('p', 'collection-audio-current');
  const review = make('p', 'listening-review');
  const description = make('p', 'listen-version-description');
  const notice = make('p', 'listen-notice'); notice.setAttribute('role', 'status'); notice.hidden = true;
  let index = playlistIndexFromHash(location.hash, tracks) ?? 0;
  const common = tracks[0].versions.filter(version => tracks.every(track => track.versions.some(item => item.id === version.id)));
  let autoNext = true;
  try { autoNext = readAutoNext(localStorage); } catch { /* Default follows the site. */ }
  const previous = make('button', 'listen-neighbour', '← Bài trước'); previous.type = 'button';
  const next = make('button', 'listen-neighbour', 'Bài tiếp →'); next.type = 'button';
  const refresh = () => {
    const track = tracks[index];
    const version = track.versions.find(item => item.id === picker.select.value)!;
    title.textContent = `${track.uid.toUpperCase()} · ${track.title} · ${index + 1}/${tracks.length}`;
    description.textContent = version.description;
    review.hidden = version.review_status !== 'pending'; review.textContent = version.review_status === 'pending' ? 'Chờ nghe duyệt' : '';
    previous.disabled = index === 0; next.disabled = index === tracks.length - 1;
    element.querySelectorAll<HTMLButtonElement>('[data-play-track]').forEach(button => {
      button.hidden = false;
      button.setAttribute('aria-label', `Nghe ${button.dataset.playTrack?.toUpperCase()} trong ứng dụng`);
      button.closest('[data-audio-row]')?.setAttribute('data-current-audio', String(button.dataset.playTrack === track.uid));
      const fallback = button.closest('.sutta-row-audio')?.querySelector<HTMLElement>('[data-audio-fallback]');
      if (fallback) fallback.hidden = true;
    });
  };
  const picker = versionPicker(common, refresh);
  const nativeTrack = (track: PlayerTrack): NativeTrack | null => {
    const version = track.versions.find(item => item.id === picker.select.value);
    if (!version) return null;
    return { uid: track.uid, title: track.title, pageUrl: new URL(`${track.uid}/`, new URL(element.dataset.nativeTextBase!, location.href)).href, version };
  };
  const launch = () => {
    const track = nativeTrack(tracks[index]);
    if (!track) return;
    const queue: NativeTrack[] = [];
    if (autoNext) {
      for (const item of tracks.slice(index + 1)) {
        const entry = nativeTrack(item); if (!entry) break;
        queue.push(entry);
      }
    }
    const sent = bridge.play(track, undefined, queue);
    notice.hidden = false;
    notice.textContent = sent
      ? 'Điều khiển nghe ở trình phát của ứng dụng. Vị trí từng bài được lưu trên thiết bị.'
      : 'Danh sách này quá lớn để mở cùng lúc. Tắt tự chuyển bài hoặc mở một nhóm nhỏ hơn.';
  };
  previous.addEventListener('click', () => { if (index > 0) { index--; refresh(); } });
  next.addEventListener('click', () => { if (index < tracks.length - 1) { index++; refresh(); } });
  const play = make('button', 'button', 'Nghe trong ứng dụng'); play.type = 'button'; play.addEventListener('click', launch);
  const autoLabel = make('label', 'listen-auto');
  const autoInput = make('input'); autoInput.type = 'checkbox'; autoInput.checked = autoNext; autoInput.setAttribute('role', 'switch');
  autoInput.addEventListener('change', () => { autoNext = autoInput.checked; try { saveAutoNext(localStorage, autoNext); } catch { /* Keep local choice. */ } });
  autoLabel.append(autoInput, make('span', undefined, 'Tự chuyển bài cùng bản đang nghe'));
  panel.append(title, review, picker.label, description, previous, play, next, autoLabel, notice);
  element.querySelector('.collection-listening')?.append(panel);
  element.querySelectorAll<HTMLButtonElement>('[data-play-track]').forEach(button => {
    button.addEventListener('click', () => {
      const selected = tracks.findIndex(track => track.uid === button.dataset.playTrack);
      if (selected < 0) return;
      index = selected; refresh(); launch();
    }, { signal: controller.signal });
  });
  refresh();
  return () => { controller.abort(); panel.remove(); };
}
