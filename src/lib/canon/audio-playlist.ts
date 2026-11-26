import { audioQueue } from './audio-catalog';
import { audioPlayerData, hasAudioRegistration, loadAudio, type AudioPlayerData } from './audio';
import { composeDocument } from './document';
import { groupTexts, hasNavigation } from './groups';
import type { CollectionCode } from './types';

export interface AudioPlaylistTrack extends AudioPlayerData { title: string; order: number; }
export const INLINE_PLAYLIST_LIMIT = 50;

export function playlistTracks(collection: CollectionCode, group?: string): AudioPlaylistTrack[] {
  const members = group && hasNavigation(collection) ? new Set(groupTexts(collection, group)) : null;
  return audioQueue(collection).filter(row => !members || members.has(row.uid)).flatMap(row => {
    if (!hasAudioRegistration(row.uid)) return [];
    const doc = composeDocument(collection, row.uid);
    const audio = loadAudio(doc);
    return audio ? [{ ...audioPlayerData(audio), title: doc.viTitle, order: row.order }] : [];
  });
}

/** Keep large lists out of every ancestor's HTML; preserve one native fallback. */
export function playlistPayload(tracks: AudioPlaylistTrack[], url?: string) {
  const minimal = tracks.map(track => ({ ...audioPlayerData(track), title: track.title, order: track.order }));
  return minimal.length > INLINE_PLAYLIST_LIMIT && url
    ? { inline: minimal.slice(0, 1), url }
    : { inline: minimal, url: undefined };
}
