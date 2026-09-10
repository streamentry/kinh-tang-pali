import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import YAML from 'yaml';
import { composeDocument, loadCatalog } from '../src/lib/canon/load';
import type { CollectionCode } from '../src/lib/canon/types';

interface BookManifest {
  id: string;
  title: string;
  lang: string;
  collection: CollectionCode;
  selection: { from: string; to: string };
  statuses: Array<'published' | 'review' | 'draft'>;
  pali: 'none' | 'interlinear' | 'parallel';
  comments: 'none' | 'endnotes';
  license: string;
}

const manifestPath = process.argv[2];
const format = process.argv[3];
if (!manifestPath || !['epub', 'pdf'].includes(format)) {
  console.error('Usage: tsx scripts/build-book.ts <manifest.yaml> <epub|pdf>');
  process.exit(2);
}

const manifest = YAML.parse(readFileSync(manifestPath, 'utf8')) as BookManifest;
const catalog = loadCatalog(manifest.collection);
const fromIndex = catalog.texts.findIndex((x) => x.uid === manifest.selection.from);
const toIndex = catalog.texts.findIndex((x) => x.uid === manifest.selection.to);
if (fromIndex < 0 || toIndex < fromIndex) throw new Error('Invalid book selection range');

const docs = catalog.texts
  .slice(fromIndex, toIndex + 1)
  .map((item) => composeDocument(manifest.collection, item.uid))
  .filter((doc) => manifest.statuses.includes(doc.status) && doc.hasProjectData && doc.segments.some((s) => s.vi?.trim()));

if (docs.length === 0) {
  throw new Error(`No eligible translated texts for ${manifest.id}; publication is intentionally blocked rather than emitting an empty book.`);
}

const chunks: string[] = [
  '---',
  `title: ${JSON.stringify(manifest.title)}`,
  `lang: ${manifest.lang}`,
  `rights: ${JSON.stringify(manifest.license)}`,
  '---',
  '',
];

for (const doc of docs) {
  chunks.push(`# ${doc.viTitle}`, '', `_${doc.uid.toUpperCase()}${doc.paliTitle ? ` · ${doc.paliTitle}` : ''}_`, '');
  for (const segment of doc.segments) {
    if (!segment.vi?.trim()) continue;
    chunks.push(`<span id="${segment.id}"></span>`);
    if (manifest.pali !== 'none' && segment.pali) chunks.push(`*${segment.pali.trim()}*`, '');
    chunks.push(segment.vi.trim(), '');
    if (segment.commentVi && manifest.comments === 'endnotes') chunks.push(`> ${segment.commentVi.trim()}`, '');
  }
}

const cacheDir = path.join(process.cwd(), '.cache/books');
const exportDir = path.join(process.cwd(), 'exports');
mkdirSync(cacheDir, { recursive: true });
mkdirSync(exportDir, { recursive: true });
const intermediate = path.join(cacheDir, `${manifest.id}.md`);
writeFileSync(intermediate, chunks.join('\n'), 'utf8');

const defaults = format === 'epub' ? 'pandoc/epub.defaults.yaml' : 'pandoc/pdf.defaults.yaml';
const output = path.join(exportDir, `${manifest.id}.${format}`);
const run = spawnSync('pandoc', ['--defaults', defaults, intermediate, '-o', output], { stdio: 'inherit' });
if (run.error) throw run.error;
if (run.status !== 0) process.exit(run.status ?? 1);
console.log(`Built ${output}`);
