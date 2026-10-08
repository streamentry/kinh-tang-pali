/**
 * Whole-text Vietnamese from SuttaCentral's legacy HTML (`sc-data`, `html_text/vi/pli/sutta`).
 *
 * What this is and is not. These are continuous-prose translations — Thích Minh Châu for most
 * of MN, DN, SN, AN; Bhikkhu Indacanda for most of KN — that SuttaCentral distributes as one
 * HTML file per text. They carry no segment IDs, so they are *not* a store layer: nothing
 * here may fill the `Việt hiện hành` column or count towards coverage. The reader shows them
 * as a whole text, next to the four columns, labelled for what it is.
 * `tests/unit/external-reference.test.ts` keeps that boundary.
 *
 * The extractor reads text only. Markup is dropped rather than passed through, so a page
 * never renders third-party HTML, and nothing here uses `set:html`.
 *
 * Provenance is carried by the files themselves: each one ends with a footer naming the
 * translator, the edition, who prepared it for SuttaCentral and under what permission. That
 * footer is kept verbatim and shown with the text, because the credit is a fact about the
 * file, not something to be re-derived from the collection it sits in.
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { loadLock } from './load';

const ROOT = process.cwd();

/** Where `npm run legacy:sync` puts the pinned checkout. */
export const LEGACY_CACHE_DIR = path.join(ROOT, '.cache/upstream/sc-data');

export type LegacyBlockKind = 'paragraph' | 'verse' | 'heading' | 'colophon';

export interface LegacyBlock {
  kind: LegacyBlockKind;
  text: string;
}

export interface LegacyArticle {
  /** The `id` SuttaCentral gives the article, usually the uid. */
  id: string;
  title: string;
  /** Collection, chapter and group names from the header, outermost first. */
  divisions: string[];
  blocks: LegacyBlock[];
}

export interface LegacyViText {
  uid: string;
  /** More than one for a range file such as `an1.1-10`, which holds several suttas. */
  articles: LegacyArticle[];
  /** Footer paragraphs, verbatim: translator, edition, preparer, permission. */
  footer: string[];
  /** As the file states it; not normalised, because spellings differ between files. */
  author?: string;
  editor?: string;
  publicationDate?: string;
}

const NEWLINE = '\u0001';
const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };

function decode(text: string): string {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (whole, body: string) => {
    if (body[0] === '#') {
      const code = body[1].toLowerCase() === 'x' ? parseInt(body.slice(2), 16) : parseInt(body.slice(1), 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : whole;
    }
    return ENTITIES[body.toLowerCase()] ?? whole;
  });
}

/** Collapse source whitespace, keep only the line breaks the markup asked for. */
function tidy(raw: string): string {
  return decode(raw)
    .replace(/[ \t\r\n]+/g, ' ')
    .split(NEWLINE)
    .map((line) => line.trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .normalize('NFC');
}

const COLOPHON_CLASSES = new Set(['end', 'endsutta', 'endbook', 'endsection', 'namo', 'uddana']);
const SKIP_ELEMENTS = new Set(['head', 'script', 'style', 'title']);
/** Edition page markers (`Vi-n 1-4.`, `S.i.2`): scaffolding, not text. */
const MARKER_ANCHOR = /(^|\s)(ref|pts)(\s|$)/;

const TOKEN = /<!--[\s\S]*?-->|<(\/?)([a-zA-Z][a-zA-Z0-9]*)((?:\s[^<>]*?)?)\s*\/?>|([^<]+)|</g;

function classOf(attributes: string): string {
  const match = attributes.match(/class\s*=\s*(?:'([^']*)'|"([^"]*)")/i);
  return (match?.[1] ?? match?.[2] ?? '').trim();
}

function attributeOf(attributes: string, name: string): string {
  const match = attributes.match(new RegExp(`${name}\\s*=\\s*(?:'([^']*)'|"([^"]*)")`, 'i'));
  return match?.[1] ?? match?.[2] ?? '';
}

export function parseLegacyHtml(uid: string, html: string): LegacyViText {
  const articles: LegacyArticle[] = [];
  const footer: string[] = [];
  const meta: { author?: string; editor?: string; publicationDate?: string } = {};

  let skipping: string | null = null;
  let inHeader = false;
  let inFooter = false;
  let inBlockquote = false;
  let suppressAnchor = false;
  let buffer: string | null = null;
  let bufferKind: LegacyBlockKind | 'footer' | 'title' | 'division' | null = null;
  let metaField: keyof typeof meta | null = null;
  let metaBuffer = '';

  const current = (): LegacyArticle => {
    if (articles.length === 0) articles.push({ id: uid, title: '', divisions: [], blocks: [] });
    return articles[articles.length - 1];
  };

  const open = (kind: NonNullable<typeof bufferKind>): void => {
    if (buffer !== null) close();
    buffer = '';
    bufferKind = kind;
  };

  function close(): void {
    if (buffer === null || bufferKind === null) return;
    const text = tidy(buffer);
    const kind = bufferKind;
    buffer = null;
    bufferKind = null;
    if (!text) return;
    if (kind === 'footer') footer.push(text);
    else if (kind === 'title') current().title = text;
    else if (kind === 'division') current().divisions.push(text);
    else current().blocks.push({ kind, text });
  }

  const append = (text: string): void => {
    if (buffer !== null) buffer += text;
    if (metaField) metaBuffer += text;
  };

  for (const match of html.matchAll(TOKEN)) {
    const [, closing, rawName, attributes = '', text] = match;
    if (text !== undefined) {
      if (skipping || suppressAnchor) continue;
      append(text);
      continue;
    }
    if (!rawName) continue;
    const name = rawName.toLowerCase();
    const isClose = closing === '/';

    if (skipping) {
      if (isClose && name === skipping) skipping = null;
      continue;
    }
    if (!isClose && SKIP_ELEMENTS.has(name)) { skipping = name; continue; }

    if (name === 'article' && !isClose) {
      close();
      articles.push({ id: attributeOf(attributes, 'id') || uid, title: '', divisions: [], blocks: [] });
    } else if (name === 'header') {
      close();
      inHeader = !isClose;
    } else if (name === 'footer') {
      close();
      inFooter = !isClose;
    } else if (name === 'h1' && inHeader) {
      if (isClose) close(); else open('title');
    } else if (name === 'li' && inHeader) {
      if (isClose) close(); else open('division');
    } else if (name === 'blockquote' && !inHeader && !inFooter) {
      close();
      inBlockquote = !isClose;
      if (!isClose) open('verse');
    } else if (name === 'p') {
      if (isClose) {
        if (inBlockquote) { append(NEWLINE); } else close();
      } else if (inFooter) {
        open('footer');
      } else if (!inHeader && !inBlockquote) {
        const cls = classOf(attributes).split(/\s+/);
        if (cls.includes('subheading')) open('heading');
        else open(cls.some((c) => COLOPHON_CLASSES.has(c)) ? 'colophon' : 'paragraph');
      }
    } else if ((name === 'h2' || name === 'h3') && !inHeader && !inFooter) {
      if (isClose) close(); else open('heading');
    } else if (name === 'li' && !inHeader && !inFooter) {
      if (isClose) close(); else open('paragraph');
    } else if (name === 'br') {
      append(NEWLINE);
    } else if (name === 'a') {
      if (isClose) suppressAnchor = false;
      else if (MARKER_ANCHOR.test(classOf(attributes))) suppressAnchor = true;
    } else if (name === 'span' && inFooter) {
      const cls = classOf(attributes);
      if (isClose) {
        if (metaField) {
          const value = tidy(metaBuffer);
          if (value) meta[metaField] = value;
          metaField = null; metaBuffer = '';
        }
      } else if (cls === 'author') { metaField = 'author'; metaBuffer = ''; }
      else if (cls === 'editor') { metaField = 'editor'; metaBuffer = ''; }
      else if (cls === 'publication-date') { metaField = 'publicationDate'; metaBuffer = ''; }
    }
  }
  close();

  return { uid, articles: articles.filter((a) => a.blocks.length > 0 || a.title), footer, ...meta };
}

let fileIndex: Map<string, string> | null = null;

/** `<uid>.html` → absolute path, for every file in the pinned checkout. Empty when not synced. */
export function legacyViIndex(): Map<string, string> {
  if (fileIndex) return fileIndex;
  const index = new Map<string, string>();
  const base = path.join(LEGACY_CACHE_DIR, loadLock().legacyHtml.path);
  const walk = (dir: string): void => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith('.html')) index.set(entry.name.slice(0, -'.html'.length), full);
    }
  };
  if (existsSync(base)) walk(base);
  return (fileIndex = index);
}

/** Whether the pinned checkout is present at all, as opposed to a single text being absent. */
export function legacyViSynced(): boolean {
  return legacyViIndex().size > 0;
}

const parsed = new Map<string, LegacyViText | null>();

/** The parsed text for a uid, or `null` when the file is not in the cache. */
export function loadLegacyVi(uid: string): LegacyViText | null {
  if (parsed.has(uid)) return parsed.get(uid) ?? null;
  const file = legacyViIndex().get(uid);
  const result = file ? parseLegacyHtml(uid, readFileSync(file, 'utf8')) : null;
  parsed.set(uid, result);
  return result;
}
