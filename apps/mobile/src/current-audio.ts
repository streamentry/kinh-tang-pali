import { isTrustedPageUrl, parseAudioManifest, type NativeTrack } from '../../../src/lib/native/protocol';

/** Resolve a saved listening record against today's website before resuming.
 * Bookmarks/progress persist locally; cached editorial metadata is not authority. */
export async function currentAudioTrack(
  saved: NativeTrack, siteUrl: string, fetcher: typeof fetch = fetch, signal?: AbortSignal,
): Promise<NativeTrack> {
  if (!isTrustedPageUrl(saved.pageUrl, siteUrl)) throw new Error('Bài nghe thuộc một thư viện khác.');
  const route = new URL(saved.pageUrl).pathname.match(/\/sutta\/(mn|dn|sn|an|kn)\/([a-z][a-z0-9.-]*)\/$/);
  if (!route || route[2] !== saved.uid) throw new Error('Không xác định được bài nghe. Hãy mở lại bài trong thư viện.');
  const controller = new AbortController();
  const abort = () => controller.abort();
  const checkAborted = () => {
    if (!controller.signal.aborted) return;
    const error = new Error('Đã hủy mở bản audio.');
    error.name = 'AbortError';
    throw error;
  };
  // React Native versions differ in support for AbortSignal.any(). Chain the
  // caller's cancellation to our bounded request without depending on it.
  if (signal?.aborted) abort();
  else signal?.addEventListener('abort', abort, { once: true });
  const timer = setTimeout(() => controller.abort(), 15_000);
  try {
    checkAborted();
    const endpoint = new URL(`app/audio/${route[1]}/${saved.uid}.json`, siteUrl);
    const response = await fetcher(endpoint.href, { signal: controller.signal, cache: 'no-cache' });
    checkAborted();
    if (!response.ok) throw new Error('Bản audio hiện chưa có trên website. Hãy mở lại bài trong thư viện.');
    const json: unknown = await response.json();
    checkAborted();
    const tracks = parseAudioManifest(json, siteUrl, saved.uid);
    if (!tracks) throw new Error('Thông tin audio không hợp lệ.');
    const track = tracks.find(item => item.version.id === saved.version.id);
    if (!track) throw new Error('Bản audio đã chọn không còn được phát hành. Hãy chọn lại bản nghe trong thư viện.');
    return track;
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', abort);
  }
}
