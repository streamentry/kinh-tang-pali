/**
 * Provider-free source-rights map for a freshly generated English preflight.
 *
 * This records which pinned English files and project-fill review metadata each
 * candidate uses. It never sends text to a provider or uploads any artifact.
 *
 *   node --import tsx scripts/audio-english-preflight.ts --require-ready --output /tmp/en-preflight.json
 *   node --import tsx scripts/audio-english-source-map.ts --preflight /tmp/en-preflight.json --output /tmp/en-source-map.json
 */
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import type { CollectionCode } from '../src/lib/canon/types';
import { COLLECTIONS, loadLock, loadCatalog } from '../src/lib/canon/load';
import { composeDocument } from '../src/lib/canon/document';
import { englishCoverageFor } from '../src/lib/canon/reference';
import { contentMetaPathForLayer, resolveLayer } from '../src/lib/canon/layers';
import { manifestCommit, upstreamPublishes } from '../src/lib/canon/manifest';
import { englishAudioSource } from '../src/lib/canon/english-audio';

const args = process.argv.slice(2);
const usage = 'Usage: node --import tsx scripts/audio-english-source-map.ts --preflight <file> --output <file>';
function option(name: string): string | undefined {
  const index = args.indexOf(`--${name}`);
  return index < 0 ? undefined : args[index + 1];
}
const preflightPath = option('preflight');
const outputPath = option('output');
if (!preflightPath || !outputPath || args.length !== 4) {
  console.error(`${usage}\nBoth paths are required; no provider or upload operation is available in this command.`);
  process.exit(2);
}

const preflightFile = path.resolve(preflightPath);
const outputFile = path.resolve(outputPath);
if (!existsSync(preflightFile)) throw new Error(`Preflight report is missing: ${preflightFile}`);
const preflightBytes = readFileSync(preflightFile);
const preflight = JSON.parse(preflightBytes.toString('utf8')) as {
  schema_version: number;
  generated_at: string;
  source_commit: string;
  upstream_manifest_commit: string;
  policy: string;
  scope: string[];
  totals: { candidates: number };
  candidate_uids: string[];
  excluded: Array<{ uid: string; collection: string }>;
};
const lock = loadLock();
const currentManifestCommit = manifestCommit();
if (preflight.schema_version !== 1 || preflight.policy !== 'resolved-english-column-v1'
  || preflight.source_commit !== lock.commit || preflight.upstream_manifest_commit !== lock.commit
  || currentManifestCommit !== lock.commit) {
  throw new Error('Preflight report, local upstream manifest, and source lock do not share the same pinned commit/policy.');
}
if (!Array.isArray(preflight.scope) || preflight.scope.length === 0
  || new Set(preflight.scope).size !== preflight.scope.length
  || preflight.scope.some((collection) => !COLLECTIONS.some((known) => known.code === collection))) {
  throw new Error('Preflight scope is missing, duplicated, or names an unknown Nikāya.');
}
if (!Array.isArray(preflight.candidate_uids) || preflight.candidate_uids.length !== preflight.totals.candidates
  || new Set(preflight.candidate_uids).size !== preflight.candidate_uids.length) {
  throw new Error('Preflight candidate UID list is malformed or duplicated.');
}
const preflightAgeMs = Date.now() - Date.parse(preflight.generated_at);
if (!Number.isFinite(preflightAgeMs) || preflightAgeMs < 0 || preflightAgeMs > 2 * 60 * 60 * 1000) {
  throw new Error('Source map requires a provider-free preflight generated within the last two hours.');
}
const scopeCollections = preflight.scope as CollectionCode[];
const catalogUids = new Set(scopeCollections.flatMap((code) => loadCatalog(code).texts.map((item) => `${code}/${item.uid}`)));
const preflightUids = [...preflight.candidate_uids, ...preflight.excluded.map((item) => `${item.collection}/${item.uid}`)];
if (new Set(preflightUids).size !== preflightUids.length || preflightUids.length !== catalogUids.size
  || preflightUids.some((uid) => !catalogUids.has(uid))) {
  throw new Error('Preflight candidate/exclusion rows do not cover the current five-Nikāya catalog exactly once.');
}

function sha256(file: string): string | null {
  if (!existsSync(file)) return null;
  return createHash('sha256').update(readFileSync(file)).digest('hex');
}
function repositoryPath(file: string): string {
  return path.relative(process.cwd(), file).split(path.sep).join('/');
}

const knownCollections = new Set(COLLECTIONS.map((collection) => collection.code));
const uidSourceMap: Array<Record<string, unknown>> = [];
const projectOnlyUids: string[] = [];
const sourceUnits = new Map<string, {
  unit: string;
  source_path_prefix: string;
  candidate_texts: number;
  english_sujato_segments: number;
  files: Set<string>;
}>();
let sujatoCandidateCount = 0;
let sujatoSegmentCount = 0;

for (const candidate of preflight.candidate_uids) {
  const separator = candidate.indexOf('/');
  if (separator < 1) throw new Error(`Invalid candidate UID '${candidate}'.`);
  const collection = candidate.slice(0, separator) as CollectionCode;
  const uid = candidate.slice(separator + 1);
  if (!knownCollections.has(collection) || !uid) throw new Error(`Invalid candidate UID '${candidate}'.`);
  const catalog = loadCatalog(collection);
  if (!catalog.texts.some((item) => item.uid === uid)) throw new Error(`${candidate} is not in the pinned catalog.`);

  const document = composeDocument(collection, uid);
  if (document.commit !== lock.commit) throw new Error(`${candidate}: composed document is on a different source commit.`);
  const pali = resolveLayer('pali', collection, uid, { catalog });
  const sujato = resolveLayer('english-sujato', collection, uid, { catalog });
  const project = resolveLayer('english-project', collection, uid, { catalog });
  const coverage = englishCoverageFor(collection, uid);
  const source = englishAudioSource(document, project?.status ?? null);
  const blockers = [...source.blockers];

  if (!pali?.present) blockers.push('pinned Pāli root is not synced');
  if (!sujato?.upstreamPath) blockers.push('pinned English source path is unresolved');
  if (sujato?.upstreamPath) {
    const published = upstreamPublishes('english-sujato', sujato.upstreamPath);
    if (published === null) blockers.push('pinned English publication status is unknown');
    else if (published !== sujato.present) blockers.push('pinned English file presence differs from the upstream manifest');
  }
  if (project?.present && project.status !== 'published') blockers.push('English project fill is not published');
  const overlap = Object.entries(project?.segments ?? {})
    .some(([id, text]) => text.trim() !== '' && (sujato?.segments[id] ?? '').trim() !== '');
  if (overlap) blockers.push('English project fill shadows the pinned Sujato layer');
  if (!coverage?.resolved || coverage.substantiveWithoutEnglish > 0) blockers.push('substantive English coverage is incomplete or unresolved');
  if (source.status !== 'ready' || !source.source_sha256) blockers.push('resolved English source is not ready');
  if (blockers.length) throw new Error(`${candidate}: source-map generation blocked: ${[...new Set(blockers)].join('; ')}`);

  const usesSujato = source.source_segment_counts['english-sujato'] > 0;
  const usesProject = source.source_segment_counts['english-project'] > 0;
  const dependencies: Array<{ path: string; sha256: string }> = [];
  let projectMetaSha256: string | null = null;
  if (usesSujato) {
    const digest = sujato?.present ? sha256(sujato.file) : null;
    if (!sujato?.upstreamPath || !digest) throw new Error(`${candidate}: pinned Sujato source file hash is unavailable.`);
    dependencies.push({ path: sujato.upstreamPath, sha256: digest });
  }
  if (usesProject) {
    if (!project?.present || !project.contentPath || project.status !== 'published') {
      throw new Error(`${candidate}: published English project fill cannot be source-pinned.`);
    }
    const contentDigest = sha256(project.contentPath);
    const metaPath = contentMetaPathForLayer(project.layer, collection, uid);
    projectMetaSha256 = metaPath ? sha256(metaPath) : null;
    if (!contentDigest || !metaPath || !projectMetaSha256) throw new Error(`${candidate}: English fill or review metadata hash is unavailable.`);
    dependencies.push({ path: repositoryPath(project.contentPath), sha256: contentDigest });
    dependencies.push({ path: repositoryPath(metaPath), sha256: projectMetaSha256 });
  }

  const sourceLayers = source.source_segment_counts;
  const sujatoDependency = dependencies.find((dependency) => dependency.path.startsWith('translation/en/sujato/sutta/')) ?? null;
  const projectContentDependency = dependencies.find((dependency) => dependency.path.startsWith('content/translation/en/project/')) ?? null;
  const projectMetaDependency = dependencies.find((dependency) => dependency.path.startsWith('content/meta/en/')) ?? null;
  uidSourceMap.push({
    uid: candidate,
    source_sha256: source.source_sha256,
    english_segment_count: source.segments.length,
    english_sujato_segment_count: sourceLayers['english-sujato'],
    english_project_segment_count: sourceLayers['english-project'],
    english_project_status: project?.status ?? null,
    english_project_meta_sha256: projectMetaSha256,
    uses_sujato: usesSujato,
    uses_english_project: usesProject,
    sujato_source_path: sujatoDependency?.path ?? null,
    sujato_source_sha256: sujatoDependency?.sha256 ?? null,
    project_content_path: projectContentDependency?.path ?? null,
    project_content_sha256: projectContentDependency?.sha256 ?? null,
    project_review_meta_path: projectMetaDependency?.path ?? null,
  });

  if (usesProject && !usesSujato) projectOnlyUids.push(candidate);
  if (usesSujato) {
    sujatoCandidateCount += 1;
    const count = sourceLayers['english-sujato'];
    sujatoSegmentCount += count;
    const sourcePath = dependencies.find((dependency) => dependency.path.startsWith('translation/en/sujato/sutta/'))?.path;
    if (!sourcePath) throw new Error(`${candidate}: Sujato provenance has no pinned source file.`);
    const relative = sourcePath.slice('translation/en/sujato/sutta/'.length).split('/');
    const unit = collection === 'kn' ? `kn/${relative[1] ?? '(root)'}` : collection;
    const sourcePathPrefix = `translation/en/sujato/sutta/${unit}`;
    const summary = sourceUnits.get(unit) ?? {
      unit,
      source_path_prefix: sourcePathPrefix,
      candidate_texts: 0,
      english_sujato_segments: 0,
      files: new Set<string>(),
    };
    summary.candidate_texts += 1;
    summary.english_sujato_segments += count;
    summary.files.add(sourcePath);
    sourceUnits.set(unit, summary);
  }
}

const projectOnly = lock.projectLicense.content;
const sujatoLicense = lock.referenceEditions.find((edition) => edition.path === 'translation/en/sujato')?.license ?? null;
const report = {
  schema_version: 1,
  generated_at: new Date().toISOString(),
  source_commit: lock.commit,
  upstream_manifest_commit: currentManifestCommit,
  preflight_generated_at: preflight.generated_at,
  preflight_sha256: createHash('sha256').update(preflightBytes).digest('hex'),
  preflight_candidate_count: preflight.totals.candidates,
  project_only_uids: projectOnlyUids,
  project_only_count: projectOnlyUids.length,
  uses_sujato_texts: sujatoCandidateCount,
  uses_sujato_segments: sujatoSegmentCount,
  sujato_license_record: sujatoLicense,
  project_content_license: { spdx: projectOnly.spdx, holder: projectOnly.holder },
  sujato_source_units: [...sourceUnits.values()]
    .sort((a, b) => a.unit.localeCompare(b.unit))
    .map(({ files, ...unit }) => ({ ...unit, source_file_count: files.size })),
  uid_source_map: uidSourceMap,
  provider_calls: 0,
  uploads: 0,
  rights_gate: 'not assessed; this map records source identity only and grants no TTS or distribution authorization',
};

if (uidSourceMap.length !== preflight.totals.candidates) throw new Error('Source map does not match the preflight candidate count.');
const resolved = path.resolve(outputFile);
mkdirSync(path.dirname(resolved), { recursive: true });
const reportEntries = Object.entries(report);
const serialized = reportEntries.map(([key, value], index) => {
  const valueJson = key === 'uid_source_map'
    ? `[\n${uidSourceMap.map((row) => `    ${JSON.stringify(row)}`).join(',\n')}\n  ]`
    : JSON.stringify(value, null, 2).split('\n').map((line, lineIndex) => lineIndex === 0 ? line : `  ${line}`).join('\n');
  return `  ${JSON.stringify(key)}: ${valueJson}${index < reportEntries.length - 1 ? ',' : ''}`;
});
writeFileSync(resolved, `{\n${serialized.join('\n')}\n}\n`);
process.stderr.write(`English source map: ${uidSourceMap.length} candidates; ${sujatoCandidateCount} use Sujato; ${projectOnlyUids.length} project-only; provider calls 0; uploads 0.\n`);
