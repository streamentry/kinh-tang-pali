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
  const seenCollectionByFile = new Map();
  const primaryByFile = new Map();
  const assetShaCache = new Map();
  for (const cover of covers) {
    const where = cover.uid;
    if (seenUid.has(cover.uid)) found.push(`${where}: uid appears twice`);
    seenUid.add(cover.uid);
    const prevCollection = seenCollectionByFile.get(cover.file);
    if (prevCollection && (prevCollection !== cover.collection || cover.collection === 'dn' || cover.collection === 'mn')) {
      found.push(`${where}: ${cover.file} already used by another sutta (${prevCollection})`);
    }
    seenCollectionByFile.set(cover.file, cover.collection);
    const primary = primaryByFile.get(cover.file);
    if (!primary) {
      primaryByFile.set(cover.file, cover);
    } else {
      if (cover.asset !== primary.asset) found.push(`${where}: shared file ${cover.file} must share asset ${primary.asset}`);
      if (cover.sha256 !== primary.sha256) found.push(`${where}: shared file ${cover.file} must match primary sha256`);
      if (cover.originalSha1 !== primary.originalSha1) found.push(`${where}: shared file ${cover.file} must match primary originalSha1`);
    }
    if (!LICENCE.test(cover.license)) found.push(`${where}: licence ${cover.license} is not allowed`);
    if (cover.license.startsWith('CC-BY') && !cover.author) found.push(`${where}: ${cover.license} needs an author`);
    if (cover.license !== 'PD' && !cover.licenseUrl) found.push(`${where}: licence URL missing`);
    for (const key of ['sourcePage', 'sourceUrl', 'originalSha1', 'titleVi', 'altVi', 'asset', 'sha256']) {
      if (!cover[key]) found.push(`${where}: ${key} missing`);
    }
    if (!cover.sourcePage?.startsWith('https://commons.wikimedia.org/wiki/File:')) found.push(`${where}: source page is not a Commons file page`);
    if (cover.asset && !existsSync(cover.asset)) {
      found.push(`${where}: ${cover.asset} not on disk — run node scripts/sutta-covers.mjs`);
    } else if (cover.asset) {
      let diskSha = assetShaCache.get(cover.asset);
      if (!diskSha) {
        diskSha = sha256(readFileSync(cover.asset));
        assetShaCache.set(cover.asset, diskSha);
      }
      if (diskSha !== cover.sha256) found.push(`${where}: ${cover.asset} does not match its recorded SHA-256`);
    }
  }
  return found;
}

async function api(params) {
  for (let attempt = 1; ; attempt += 1) {
    const url = `${API}?${new URLSearchParams({ format: 'json', formatversion: '2', ...params })}`;
    const response = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
    if (response.ok) return response.json();
    if (attempt >= 6 || ![429, 500, 502, 503, 504].includes(response.status)) throw new Error(`Commons API ${response.status} for ${params.titles}`);
    await new Promise((resolve) => setTimeout(resolve, 3500 * attempt));
  }
}

async function download(url) {
  for (let attempt = 1; ; attempt += 1) {
    const response = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
    if (response.ok) return Buffer.from(await response.arrayBuffer());
    if (attempt >= 6 || ![429, 500, 502, 503, 504].includes(response.status)) throw new Error(`${response.status} downloading ${url}`);
    await new Promise((resolve) => setTimeout(resolve, 4000 * attempt));
  }
}

async function fetchCover(cover, sharp, refresh = false) {
  let info;
  let licence;
  let artist;
  let credit;
  let licenseShortName;
  let licenseUrl;
  if (!refresh && cover.sourceUrl && cover.originalSha1 && cover.license && cover.width && cover.height && cover.mime) {
    info = {
      url: cover.sourceUrl,
      sha1: cover.originalSha1,
      width: cover.width,
      height: cover.height,
      mime: cover.mime,
    };
    licence = cover.license;
    artist = cover.commonsArtist ?? cover.author ?? null;
    credit = cover.credit || 'Wikimedia Commons';
    licenseShortName = cover.licenseShortName ?? cover.license;
    licenseUrl = cover.licenseUrl ?? null;
  } else {
    const data = await api({ action: 'query', titles: cover.file, prop: 'imageinfo', iiprop: 'url|sha1|size|mime|extmetadata' });
    info = data.query.pages[0]?.imageinfo?.[0];
    if (!info) throw new Error(`${cover.uid}: ${cover.file} not found on Commons`);
    const meta = info.extmetadata ?? {};
    licence = normaliseLicence(meta.LicenseShortName?.value);
    if (!licence) throw new Error(`${cover.uid}: Commons licence ${meta.LicenseShortName?.value} is not allowed`);
    if (cover.license && licence !== cover.license) throw new Error(`${cover.uid}: Commons now says ${meta.LicenseShortName?.value} (${licence}), registry says ${cover.license}`);
    artist = stripHtml(meta.Artist?.value) || null;
    credit = cover.credit || stripHtml(meta.Credit?.value) || 'Wikimedia Commons';
    licenseShortName = meta.LicenseShortName?.value ?? cover.licenseShortName;
    licenseUrl = (meta.LicenseUrl?.value ?? cover.licenseUrl ?? null)?.replace(/^http:/, 'https:') ?? null;
  }
  const original = await download(info.url);
  if (sha1(original) !== info.sha1) throw new Error(`${cover.uid}: downloaded bytes do not match Commons SHA-1`);
  const image = sharp(original, { limitInputPixels: false, failOn: 'none' }).rotate();
  const output = await image
    .resize({ width: derivative.maxWidth, withoutEnlargement: true })
    .webp({ quality: derivative.quality, effort: 6 })
    .toBuffer();
  const asset = cover.asset || `src/assets/covers/${cover.collection}/${cover.uid}.webp`;
  mkdirSync(dirname(asset), { recursive: true });
  writeFileSync(asset, output);
  const { width, height } = await sharp(output).metadata();
  return {
    ...cover,
    sourcePage: cover.sourcePage || `https://commons.wikimedia.org/wiki/${encodeURIComponent(cover.file.replace(/ /g, '_')).replace(/%3A/g, ':')}`,
    sourceUrl: info.url,
    originalSha1: info.sha1,
    width: info.width,
    height: info.height,
    mime: info.mime,
    author: cover.author || artist,
    credit,
    license: licence,
    licenseShortName,
    licenseUrl,
    commonsArtist: artist,
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
    const uniqueAssets = new Set(registry.covers.map((c) => c.asset)).size;
    console.log(`sutta covers: ${registry.covers.length} suttas (${uniqueAssets} unique WebP images) verified`);
    return;
  }
  const refresh = process.argv.includes('--refresh');
  const { default: sharp } = await import('sharp');
  const verifiedByFile = new Map();
  const covers = [...registry.covers];
  const primaryIndices = [];

  for (let i = 0; i < covers.length; i += 1) {
    const cover = covers[i];
    if (verifiedByFile.has(cover.file)) continue;
    verifiedByFile.set(cover.file, null);
    const fresh = refresh || !cover.asset || !existsSync(cover.asset) || !cover.sha256 || sha256(readFileSync(cover.asset)) !== cover.sha256;
    if (!fresh) {
      verifiedByFile.set(cover.file, cover);
    } else {
      primaryIndices.push(i);
    }
  }

  let cursor = 0;
  async function worker() {
    while (cursor < primaryIndices.length) {
      const idx = primaryIndices[cursor++];
      const cover = covers[idx];
      const updated = await fetchCover(cover, sharp);
      console.log(`${cover.uid} … ${updated.assetWidth}×${updated.assetHeight} ${(readFileSync(updated.asset).length / 1024).toFixed(0)} KB`);
      covers[idx] = updated;
      verifiedByFile.set(updated.file, updated);
      await new Promise((resolve) => setTimeout(resolve, 400));
    }
  }
  try {
    await Promise.all(Array.from({ length: Math.min(2, primaryIndices.length) }, () => worker()));
  } finally {
    for (let i = 0; i < covers.length; i += 1) {
      const cover = covers[i];
      const primary = verifiedByFile.get(cover.file);
      if (primary && primary !== cover) {
        covers[i] = {
          ...cover,
          sourcePage: primary.sourcePage,
          sourceUrl: primary.sourceUrl,
          originalSha1: primary.originalSha1,
          width: primary.width,
          height: primary.height,
          mime: primary.mime,
          author: cover.author || primary.author,
          credit: cover.credit || primary.credit,
          license: primary.license,
          licenseShortName: primary.licenseShortName,
          licenseUrl: primary.licenseUrl,
          commonsArtist: primary.commonsArtist,
          asset: primary.asset,
          assetWidth: primary.assetWidth,
          assetHeight: primary.assetHeight,
          sha256: primary.sha256,
        };
      }
    }
    writeFileSync(REGISTRY, `${JSON.stringify({ ...registry, covers }, null, 2)}\n`);
  }
  const found = problems(covers);
  if (found.length) {
    console.error(found.join('\n'));
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) await main();
