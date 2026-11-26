/**
 * Check the built navigation pages in `dist/` against the plan they were built from.
 *
 *   npm run reading:check     (after `npm run build`)
 *
 * For every continuous-reading part, the segments on the page must be exactly the segments of
 * the texts the plan assigns to that part, in order, each once — compared ID by ID and markup by
 * markup with each text's own page, so a segment dropped, doubled, reordered or altered in the
 * reading view fails. Only the segment number's link may differ: on a reading page it points back
 * to the text's own page. Each part must be noindex, outside search, and free of duplicate IDs.
 * Every group must have its page and no other group page may exist.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { allGroups, groupHref } from '../src/lib/canon/groups';
import { groupReadingPlan, readingGroups } from '../src/lib/canon/group-reading';
import { readingPartPath } from '../src/lib/canon/reading-budget';
import { NAVIGATION_COLLECTIONS } from '../src/lib/canon/navigation-types';

const DIST = path.join(process.cwd(), 'dist');
const BASE = '/kinh-tang-pali/';

const segmentPattern = /<article class="segment[^"]*" id="([^"]+)" data-segment-id="[^"]+">([\s\S]*?)<\/article>/g;
export interface SegmentMarkup { id: string; body: string }

/** Segments of a built page; the number's link is normalised, being the one intended difference. */
export function segmentsOf(html: string): SegmentMarkup[] {
  return [...html.matchAll(segmentPattern)].map((match) => ({
    id: match[1],
    body: match[2].replace(/<div class="segment-id"><a href="[^"]*"/, '<div class="segment-id"><a href=""'),
  }));
}

/**
 * Problems of one built reading part against the segments it must hold (its texts' own pages,
 * concatenated in plan order). Empty when the part is exactly right.
 */
export function compareReadingPart(label: string, html: string, expected: readonly SegmentMarkup[]): string[] {
  const problems: string[] = [];
  if (!html.includes('<meta name="robots" content="noindex,follow"')) problems.push(`${label}: not noindex`);
  if (html.includes('data-pagefind-body')) problems.push(`${label}: would be indexed by Pagefind`);
  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]);
  const duplicate = ids.find((id, at) => ids.indexOf(id) !== at);
  if (duplicate) problems.push(`${label}: duplicate id ${duplicate}`);
  if (expected.length === 0) problems.push(`${label}: the plan expects no segment at all`);
  const actual = segmentsOf(html);
  if (actual.length !== expected.length) problems.push(`${label}: ${actual.length} segments, expected ${expected.length}`);
  const firstDifference = actual.findIndex((segment, at) => segment.id !== expected[at]?.id || segment.body !== expected[at]?.body);
  if (firstDifference >= 0) problems.push(`${label}: segment ${firstDifference} (${actual[firstDifference].id}) differs from its text's own page`);
  return problems;
}

function main(): void {
  const problems: string[] = [];
  const fail = (message: string) => problems.push(message);

  if (!existsSync(DIST)) {
    console.error('dist/ is missing — run: npm run build');
    process.exit(1);
  }

  const page = (relative: string) => path.join(DIST, relative, 'index.html');
  const canonicalCache = new Map<string, SegmentMarkup[]>();

  let parts = 0;
  let segmentsChecked = 0;
  for (const code of NAVIGATION_COLLECTIONS) {
    for (const node of readingGroups(code)) {
      const plan = groupReadingPlan(code, node.id)!;
      const base = groupHref(code, node.id);
      if (existsSync(page(readingPartPath(base, plan.length)))) fail(`${base}: a part beyond the plan's ${plan.length} exists`);
      plan.forEach((entries, index) => {
        const relative = readingPartPath(base, index);
        if (!existsSync(page(relative))) { fail(`${relative}: missing`); return; }
        parts += 1;
        const html = readFileSync(page(relative), 'utf8');
        const expected = entries.filter((entry) => entry.type === 'text').flatMap((entry) => {
          let canonical = canonicalCache.get(entry.uid);
          if (!canonical) {
            canonical = segmentsOf(readFileSync(page(`sutta/${code}/${entry.uid}/`), 'utf8'));
            canonicalCache.set(entry.uid, canonical);
          }
          if (entry.segments === 0 || canonical.length !== entry.segments) fail(`${entry.uid}: its page has ${canonical.length} segments, the plan counted ${entry.segments}`);
          return canonical;
        });
        problems.push(...compareReadingPart(relative, html, expected));
        segmentsChecked += expected.length;
        for (const entry of entries.filter((item) => item.type === 'link')) {
          if (!html.includes(`href="${BASE}sutta/${code}/${entry.uid}/"`)) fail(`${relative}: no link to the long text ${entry.uid}`);
        }
      });
    }
    const expectedGroups = new Set(allGroups(code).map((node) => node.id));
    const dir = path.join(DIST, 'sutta', code, 'nhom');
    const built = existsSync(dir) ? readdirSync(dir).filter((name) => existsSync(path.join(dir, name, 'index.html'))) : [];
    for (const id of expectedGroups) if (!built.includes(id)) fail(`group page ${code}/${id} is missing`);
    for (const id of built) if (!expectedGroups.has(id)) fail(`group page ${code}/${id} has no group`);
  }

  if (problems.length) {
    console.error('navigation pages do not match the plan:');
    for (const problem of problems.slice(0, 50)) console.error(`  - ${problem}`);
    if (problems.length > 50) console.error(`  … ${problems.length - 50} more`);
    process.exit(1);
  }
  console.log(`navigation pages verified: ${parts} reading parts, ${segmentsChecked} segments each matching its text's own page once and in order; every group page present.`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(process.cwd(), 'scripts/check-group-reading.ts')) main();
