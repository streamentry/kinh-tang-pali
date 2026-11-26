import type { APIRoute } from 'astro';
import { AUDIO_COLLECTIONS } from '../../../../lib/canon/audio-catalog';
import { playlistTracks } from '../../../../lib/canon/audio-playlist';
import type { AudioVersionPlayerData } from '../../../../lib/audio/types';
import { withBase } from '../../../../lib/url';

/** Derived from the same validated player metadata as the website, never a second catalogue.
 * Native resume revalidates a saved recording against this resource before playing it.
 */
export function getStaticPaths() {
  return AUDIO_COLLECTIONS.flatMap(collection => playlistTracks(collection).map(track => ({
    params: { collection, uid: track.uid },
    props: { uid: track.uid, title: track.title, pagePath: withBase(`sutta/${collection}/${track.uid}/`), versions: track.versions },
  })));
}

interface Props { uid: string; title: string; pagePath: string; versions: AudioVersionPlayerData[]; }
export const GET: APIRoute<Props> = ({ props }) => new Response(JSON.stringify({ v: 1, ...props }), {
  headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'public, max-age=0, must-revalidate' },
});
