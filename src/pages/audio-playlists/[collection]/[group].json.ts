import type { APIRoute } from 'astro';
import { AUDIO_COLLECTIONS } from '../../../lib/canon/audio-catalog';
import { playlistTracks } from '../../../lib/canon/audio-playlist';
import { allGroups, hasNavigation } from '../../../lib/canon/groups';
import type { CollectionCode } from '../../../lib/canon/types';

export function getStaticPaths() {
  return AUDIO_COLLECTIONS.flatMap(collection => ['all', ...(hasNavigation(collection) ? allGroups(collection).map(node => node.id) : [])]
    .map(group => ({ params: { collection, group } })));
}

export const GET: APIRoute = ({ params }) => new Response(
  JSON.stringify(playlistTracks(params.collection as CollectionCode, params.group === 'all' ? undefined : params.group)),
  { headers: { 'Content-Type': 'application/json; charset=utf-8' } },
);
