/**
 * Cover images for Dīgha and Majjhima reading pages.
 *
 * `source/sutta-covers.json` is the registry: which Wikimedia Commons file each sutta uses,
 * who made it, and under which terms. This script turns that registry into the files the
 * site builds from, and refuses to do so on anything it cannot verify:
 *
 *   node scripts/sutta-covers.mjs            download missing covers, verify, write derivatives
 *   node scripts/sutta-covers.mjs --refresh  re-download every cover (licence re-read too)
 *   node scripts/sutta-covers.mjs --check    offline: hashes, licences, uniqueness, coverage
 *
 * The licence and author are re-read from the Commons API at download time and must match
 * the registry; a file whose terms changed is not silently re-published under the old ones.
 * The original's SHA-1 (which Commons publishes) is checked before any resizing, so the
 * stored derivative is provably made from the file the registry names.
 */
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

const REGISTRY = 'source/sutta-covers.json';
const USER_AGENT = 'KinhTangPaliCovers/1.0 (https://github.com/streamentry/kinh-tang-pali)';
const API = 'https://commons.wikimedia.org/w/api.php';
/** Terms a cover may carry. Anything NC, ND, GFDL-only or unclear is refused. */
const LICENCE = /^(PD|CC0-1\.0|CC-BY-(?:SA-)?(?:1\.0|2\.0|2\.5|3\.0|4\.0))$/;

const registry = JSON.parse(readFileSync(REGISTRY, 'utf8'));
const { derivative } = registry;
const sha256 = (buffer) => createHash('sha256').update(buffer).digest('hex');
const sha1 = (buffer) => createHash('sha1').update(buffer).digest('hex');
const stripHtml = (value = '') => value.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&#039;|&apos;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, ' ').trim();

/** Commons' short licence name, normalised to the identifiers the registry stores. */
export function normaliseLicence(shortName = '') {
  const name = shortName.trim();
  if (/^cc0/i.test(name)) return 'CC0-1.0';
  if (/^public domain$|^pd\b|^pd-/i.test(name)) return 'PD';
  const cc = name.match(/^CC BY(-SA)? (\d\.\d)/i);
  if (cc) return `CC-BY-${cc[1] ? 'SA-' : ''}${cc[2]}`;
  return null;
}

function problems(covers = registry.covers) {
  const found = [];
  const seenUid = new Set();
  const seenFile = new Set();
  for (const cover of covers) {
    const where = cover.uid;
    if (seenUid.has(cover.uid)) found.push(`${where}: uid appears twice`);
    if (seenFile.has(cover.file)) found.push(`${where}: ${cover.file} already used by another sutta`);
    seenUid.add(cover.uid);
    seenFile.add(cover.file);
    if (!LICENCE.test(cover.license)) found.push(`${where}: licence ${cover.license} is not allowed`);
    if (cover.license.startsWith('CC-BY') && !cover.author) found.push(`${where}: ${cover.license} needs an author`);
    if (cover.license !== 'PD' && !cover.licenseUrl) found.push(`${where}: licence URL missing`);
    for (const key of ['sourcePage', 'sourceUrl', 'originalSha1', 'titleVi', 'altVi', 'asset', 'sha256']) {
      if (!cover[key]) found.push(`${where}: ${key} missing`);
    }
    if (!cover.sourcePage?.startsWith('https://commons.wikimedia.org/wiki/File:')) found.push(`${where}: source page is not a Commons file page`);
    if (cover.asset && !existsSync(cover.asset)) found.push(`${where}: ${cover.asset} not on disk — run node scripts/sutta-covers.mjs`);
    else if (cover.asset && sha256(readFileSync(cover.asset)) !== cover.sha256) found.push(`${where}: ${cover.asset} does not match its recorded SHA-256`);
  }
  return found;
}

async function api(params) {
  const url = `${API}?${new URLSearchParams({ format: 'json', formatversion: '2', ...params })}`;
  const response = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
  if (!response.ok) throw new Error(`Commons API ${response.status} for ${params.titles}`);
  return response.json();
}

async function download(url) {
  for (let attempt = 1; ; attempt += 1) {
    const response = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
    if (response.ok) return Buffer.from(await response.arrayBuffer());
    if (attempt >= 4 || ![429, 500, 502, 503, 504].includes(response.status)) throw new Error(`${response.status} downloading ${url}`);
    await new Promise((resolve) => setTimeout(resolve, 3000 * attempt));
  }
}

async function fetchCover(cover, sharp) {
  const data = await api({ action: 'query', titles: cover.file, prop: 'imageinfo', iiprop: 'url|sha1|size|mime|extmetadata' });
  const info = data.query.pages[0]?.imageinfo?.[0];
  if (!info) throw new Error(`${cover.uid}: ${cover.file} not found on Commons`);
  const meta = info.extmetadata ?? {};
  const licence = normaliseLicence(meta.LicenseShortName?.value);
  if (licence !== cover.license) throw new Error(`${cover.uid}: Commons now says ${meta.LicenseShortName?.value} (${licence}), registry says ${cover.license}`);
  const original = await download(info.url);
  if (sha1(original) !== info.sha1) throw new Error(`${cover.uid}: downloaded bytes do not match Commons SHA-1`);
  const image = sharp(original, { limitInputPixels: false, failOn: 'none' }).rotate();
  const output = await image
    .resize({ width: derivative.maxWidth, withoutEnlargement: true })
    .webp({ quality: derivative.quality, effort: 6 })
    .toBuffer();
  const asset = `src/assets/covers/${cover.collection}/${cover.uid}.webp`;
  mkdirSync(dirname(asset), { recursive: true });
  writeFileSync(asset, output);
  const { width, height } = await sharp(output).metadata();
  return {
    ...cover,
    sourceUrl: info.url,
    originalSha1: info.sha1,
    width: info.width,
    height: info.height,
    mime: info.mime,
    licenseShortName: meta.LicenseShortName?.value ?? cover.licenseShortName,
    licenseUrl: (meta.LicenseUrl?.value ?? cover.licenseUrl ?? null)?.replace(/^http:/, 'https:') ?? null,
    commonsArtist: stripHtml(meta.Artist?.value) || null,
    asset,
    assetWidth: width,
    assetHeight: height,
    sha256: sha256(output),
  };
}

async function main() {
  if (process.argv.includes('--check')) {
    const found = problems();
    if (found.length) {
      console.error(found.join('\n'));
      process.exit(1);
    }
    console.log(`sutta covers: ${registry.covers.length} verified`);
    return;
  }
  const refresh = process.argv.includes('--refresh');
  const { default: sharp } = await import('sharp');
  const covers = [];
  for (const cover of registry.covers) {
    const fresh = refresh || !cover.asset || !existsSync(cover.asset) || sha256(readFileSync(cover.asset)) !== cover.sha256;
    if (!fresh) { covers.push(cover); continue; }
    process.stdout.write(`${cover.uid} … `);
    const updated = await fetchCover(cover, sharp);
    console.log(`${updated.assetWidth}×${updated.assetHeight} ${(readFileSync(updated.asset).length / 1024).toFixed(0)} KB`);
    covers.push(updated);
    // Save after each file so an interrupted run keeps its verified progress.
    writeFileSync(REGISTRY, `${JSON.stringify({ ...registry, covers: [...covers, ...registry.covers.slice(covers.length)] }, null, 2)}\n`);
  }
  writeFileSync(REGISTRY, `${JSON.stringify({ ...registry, covers }, null, 2)}\n`);
  const found = problems(covers);
  if (found.length) {
    console.error(found.join('\n'));
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) await main();
