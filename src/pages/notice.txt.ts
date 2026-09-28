/**
 * Serve `NOTICE` as plain text.
 *
 * The notice is generated from the lock, so this endpoint calls the same function the
 * generator calls rather than reading a file that could go stale between two builds. The
 * repository-root `NOTICE` remains the human-facing copy for anyone reading the source; this
 * is what a reader of the website follows a credit link to, and it cannot disagree with the
 * source of truth because it is derived from it on every request.
 *
 * It is `.txt` rather than an HTML page on purpose. A legal notice wrapped in site chrome
 * invites reading it as part of the site's own marketing, and it is plain text so that
 * anything — a curl, a mirror, an archive — can carry the terms with it intact.
 */
import type { APIRoute } from 'astro';
import { generateNotice } from '../../scripts/generate-notice';

export const GET: APIRoute = () =>
  // Byte-identical to the repository-root `NOTICE`. No extra newline is added here: the
  // generated text already ends with one, and appending another would make the served copy
  // differ from the file a reader can check out.
  new Response(generateNotice(), {
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      // The text is generated from a pinned commit, so it only changes when the pin does.
      'cache-control': 'public, max-age=3600',
    },
  });
