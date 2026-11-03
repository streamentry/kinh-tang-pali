/** Modern reading aids have their own sources, review history and publication gate. */
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, realpathSync, statSync } from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';
import type { CollectionCode, EditorialStatus } from './types';
import { creditLabel, type SupportTool } from './tooling';

export const AUDIENCES = ['children', 'adults', 'older-adults'] as const;
export type Audience = (typeof AUDIENCES)[number];
export const EXPLANATION_SCORE_KEYS = [
  'source_fidelity', 'semantic_fidelity', 'core_coverage', 'logic_context',
  'terminology', 'audience_fit', 'clarity', 'editorial_separation',
  'practical_integrity', 'technical_integrity',
] as const;
export type ExplanationScoreKey = (typeof EXPLANATION_SCORE_KEYS)[number];
export type ExplanationScores = Record<ExplanationScoreKey, number>;
export const CRITICAL_EXPLANATION_KEYS = EXPLANATION_SCORE_KEYS.slice(0, 4);
export const EXPLANATION_SECTION_KINDS = ['teaching', 'example', 'clarification', 'practice'] as const;

export interface ExplanationSource {
  role: 'pali' | 'vietnamese-project' | 'reference';
  /** Repository-relative file, including .cache/upstream for pinned references. */
  path: string;
  sha256: string;
  /** Historical provenance; identical source bytes survive an unrelated upstream repin. */
  commit?: string;
}
export interface MeaningUnit { id: string; title: string; segments: string[]; summary: string }
export interface ExplanationSection {
  id: string;
  kind: (typeof EXPLANATION_SECTION_KINDS)[number];
  heading?: string;
  paragraphs: string[];
  meaningUnits: string[];
}
export interface ExplanationAudienceContent {
  title: string;
  authors: string[];
  sections: ExplanationSection[];
}
export interface ExplanationContent {
  schemaVersion: 1;
  uid: string;
  sourceDependencies: ExplanationSource[];
  meaningUnits: MeaningUnit[];
  audiences: Partial<Record<Audience, ExplanationAudienceContent | null>>;
}
export interface ExplanationReview {
  id: string;
  audience: Audience;
  reviewedAt: string;
  reviewers: string[];
  scores: ExplanationScores;
  rationale: Record<ExplanationScoreKey, string>;
  blockingErrors: string[];
  notes: string;
  contentHash: string;
  sourceHashes: Array<{ path: string; sha256: string }>;
}
export interface ExplanationMetadata {
  schemaVersion: 1;
  uid: string;
  audiences: Partial<Record<Audience, { status: EditorialStatus; selectedReviewId?: string }>>;
  reviews: ExplanationReview[];
}
export interface ExplanationAudienceView {
  /** Only a current, selected, publishable review makes prose available to the reader. */
  content?: ExplanationAudienceContent;
  status: 'not-started' | EditorialStatus | 'stale';
  score: number | null;
  reviewers: string[];
  reviewedAt?: string;
  reviewId?: string;
  blockers: string[];
}
export interface ExplanationBundle {
  uid: string;
  meaningUnits: MeaningUnit[];
  audiences: Record<Audience, ExplanationAudienceView>;
  complete: boolean;
  /** Completion score: minimum of all three published/current reviews, otherwise null. */
  minimumScore: number | null;
}
export interface ExplanationAudit {
  content: ExplanationContent;
  metadata: ExplanationMetadata;
  bundle: ExplanationBundle;
  errors: string[];
  sourceErrors: string[];
  sourceHashes: Array<{ path: string; sha256: string }>;
}
export interface ExplanationOptions { root?: string }

const SHA256 = /^[a-f0-9]{64}$/;
const COMMIT = /^[a-f0-9]{40}$/;
const LOCAL_ID = /^[a-z][a-z0-9-]*$/;
const record = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === 'object' && !Array.isArray(value);
const text = (value: unknown): value is string => typeof value === 'string' && Boolean(value.trim());
const strings = (value: unknown): value is string[] => Array.isArray(value) && value.every(text);
const unique = (values: readonly string[]) => new Set(values).size === values.length;
const sha256 = (bytes: string | Buffer) => createHash('sha256').update(bytes).digest('hex');
const gitBlobHash = (bytes: Buffer) => createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex');
const readJson = <T>(file: string): T => JSON.parse(readFileSync(file, 'utf8')) as T;

function safeRelative(file: unknown): file is string {
  return text(file) && !file.includes('\\') && !file.includes('\0') && !path.posix.isAbsolute(file)
    && file.split('/').every(part => part !== '' && part !== '.' && part !== '..');
}
function validDate(value: unknown): value is string {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
    && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
}
function plain(value: unknown): value is string {
  return text(value) && value === value.normalize('NFC')
    && !/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/u.test(value)
    && !/<\/?[a-z][^>]*>/iu.test(value);
}
function sortedHashes(values: Array<{ path: string; sha256: string }>) {
  return values.map(({ path: sourcePath, sha256: hash }) => ({ path: sourcePath, sha256: hash }))
    .sort((a, b) => a.path.localeCompare(b.path));
}
function sameHashes(a: ExplanationReview['sourceHashes'], b: ExplanationReview['sourceHashes']): boolean {
  return JSON.stringify(sortedHashes(a)) === JSON.stringify(sortedHashes(b));
}

export function explanationPaths(collection: CollectionCode, uid: string, options: ExplanationOptions = {}) {
  if (!['mn', 'dn'].includes(collection) || !new RegExp(`^${collection}[1-9]\\d*$`).test(uid)) {
    throw new Error(`Modern explanations require an unpadded MN/DN UID: ${collection}/${uid}`);
  }
  const root = path.resolve(options.root ?? process.cwd());
  return {
    content: path.join(root, 'content/comment/vi/project/explanations/sutta', collection, `${uid}.json`),
    metadata: path.join(root, 'content/meta/explanations/sutta', collection, `${uid}.json`),
  };
}

/** A review of one audience never depends on another audience's wording or status. */
export function explanationContentHash(content: ExplanationContent, audience: Audience): string {
  return sha256(JSON.stringify({
    schemaVersion: content.schemaVersion,
    uid: content.uid,
    sources: content.sourceDependencies.map(({ role, path: sourcePath, sha256: hash }) => ({ role, path: sourcePath, sha256: hash }))
      .sort((a, b) => a.path.localeCompare(b.path)),
    meaningUnits: content.meaningUnits,
    audience,
    content: content.audiences[audience] ?? null,
  }));
}

export function explanationScore(scores: ExplanationScores): number | null {
  if (!record(scores) || Object.keys(scores).length !== EXPLANATION_SCORE_KEYS.length
    || EXPLANATION_SCORE_KEYS.some(key => typeof scores[key] !== 'number' || !Number.isFinite(scores[key]) || scores[key] < 0 || scores[key] > 10)) return null;
  return EXPLANATION_SCORE_KEYS.reduce((sum, key) => sum + scores[key], 0) / EXPLANATION_SCORE_KEYS.length;
}

// Compare the decimal values entered by reviewers, without rounding a score near
// the threshold or letting binary floating-point summation move an exact 9.0.
function decimalMeanAtLeast(scores: ExplanationScores, threshold: number): boolean {
  const values = EXPLANATION_SCORE_KEYS.map(key => {
    const [mantissa, exponent = '0'] = scores[key].toString().split('e');
    const [whole, fraction = ''] = mantissa.split('.');
    return { digits: BigInt(whole + fraction), places: fraction.length - Number(exponent) };
  });
  const places = Math.max(0, ...values.map(value => value.places));
  const total = values.reduce((sum, value) => sum + value.digits * 10n ** BigInt(places - value.places), 0n);
  return total >= BigInt(threshold * EXPLANATION_SCORE_KEYS.length) * 10n ** BigInt(places);
}

export function explanationStatus(review: Pick<ExplanationReview, 'scores' | 'blockingErrors'>): EditorialStatus {
  const score = explanationScore(review.scores);
  if (score === null || !Array.isArray(review.blockingErrors) || review.blockingErrors.length > 0 || !decimalMeanAtLeast(review.scores, 8)) return 'draft';
  return decimalMeanAtLeast(review.scores, 9) && CRITICAL_EXPLANATION_KEYS.every(key => review.scores[key] >= 9) ? 'published' : 'review';
}

interface Manifest { commit: string; editions: Array<{ path: string; files: Record<string, string> }> }
// The manifest is large. Reparse it only when the actual file changes during this process.
const manifestCache = new Map<string, { stamp: string; value: Manifest }>();
function readManifest(file: string): Manifest {
  const stat = statSync(file, { bigint: true });
  const stamp = `${stat.mtimeNs}:${stat.size}`;
  const cached = manifestCache.get(file);
  if (cached?.stamp === stamp) return cached.value;
  const value = readJson<Manifest>(file);
  manifestCache.set(file, { stamp, value });
  return value;
}

function sourceContext(content: ExplanationContent, collection: CollectionCode, uid: string, options: ExplanationOptions) {
  const root = path.resolve(options.root ?? process.cwd());
  const errors: string[] = [];
  const catalog = readJson<{ texts: Array<{ uid: string; sourcePath?: string }> }>(path.join(root, 'content/catalog/sutta', `${collection}.json`));
  const item = catalog.texts.find(entry => entry.uid === uid);
  if (!item) errors.push(`${uid}: UID is absent from the current ${collection} catalog`);
  const lock = readJson<{
    commit: string;
    referenceEditions: Array<{ path: string; role: string; language: string; translator: string }>;
    legacyHtml?: { path: string };
  }>(path.join(root, 'source/suttacentral.lock.json'));
  const paliPath = item?.sourcePath ?? `root/pli/ms/sutta/${collection}/${uid}_root-pli-ms.json`;
  const expectedPali = `.cache/upstream/suttacentral/${paliPath}`;
  const expectedVietnamese = `content/translation/vi/project/sutta/${collection}/${uid}_translation-vi-project.json`;
  const relativeSutta = paliPath.match(/^root\/pli\/ms\/(sutta\/.+)_root-pli-ms\.json$/)?.[1];
  const references = new Set<string>();
  for (const edition of lock.referenceEditions ?? []) {
    if (!['english', 'vietnamese-current'].includes(edition.role) || !relativeSutta) continue;
    references.add(`.cache/upstream/suttacentral/${edition.path}/${relativeSutta}_translation-${edition.language}-${edition.translator}.json`);
    references.add(`.cache/upstream/suttacentral/comment/${edition.language}/${edition.translator}/${relativeSutta}_comment-${edition.language}-${edition.translator}.json`);
  }
  if (lock.legacyHtml?.path) references.add(`.cache/upstream/sc-data/${lock.legacyHtml.path}/${collection}/${uid}.html`);
  references.add(`content/comment/vi/project/sutta/${collection}/${uid}_comment-vi-project.json`);
  const dependencies = Array.isArray(content.sourceDependencies) ? content.sourceDependencies : [];
  const hashes: ExplanationReview['sourceHashes'] = [];
  let paliIds: string[] = [];
  let manifest: Manifest | undefined;
  const manifestPath = path.join(root, 'source/upstream-manifest.json');
  if (!existsSync(manifestPath)) errors.push(`${uid}: current upstream manifest is missing`);
  else {
    manifest = readManifest(manifestPath);
    if (manifest.commit !== lock.commit) errors.push(`${uid}: upstream manifest does not match the current source lock`);
  }
  if (dependencies.filter(dep => dep?.role === 'pali').length !== 1) errors.push(`${uid}: exactly one pinned Pāli dependency is required`);
  if (dependencies.filter(dep => dep?.role === 'vietnamese-project').length !== 1) errors.push(`${uid}: exactly one project Vietnamese dependency is required`);
  const seenPaths = new Set<string>();
  for (const dependency of dependencies) {
    if (!record(dependency) || !safeRelative(dependency.path) || !SHA256.test(dependency.sha256 ?? '')) {
      errors.push(`${uid}: invalid source dependency path/hash`); continue;
    }
    if (seenPaths.has(dependency.path)) errors.push(`${uid}: duplicate source dependency ${dependency.path}`);
    seenPaths.add(dependency.path);
    if (dependency.commit !== undefined && !COMMIT.test(dependency.commit)) errors.push(`${uid}: invalid source provenance commit`);
    const allowed = dependency.role === 'pali' ? dependency.path === expectedPali
      : dependency.role === 'vietnamese-project' ? dependency.path === expectedVietnamese
        : dependency.role === 'reference' && (references.has(dependency.path) || /^docs\/editorial-[a-z0-9][a-z0-9-]*\.md$/.test(dependency.path));
    if (!allowed) { errors.push(`${uid}: source role/path is not the current source for this sutta: ${dependency.role}/${dependency.path}`); continue; }
    const absolute = path.join(root, dependency.path);
    if (!existsSync(absolute)) { errors.push(`${uid}: source file is missing: ${dependency.path}`); continue; }
    const resolved = realpathSync(absolute);
    const inside = path.relative(realpathSync(root), resolved);
    if (inside.startsWith(`..${path.sep}`) || inside === '..' || path.isAbsolute(inside)) {
      errors.push(`${uid}: source file resolves outside the repository: ${dependency.path}`); continue;
    }
    const bytes = readFileSync(absolute);
    const actual = sha256(bytes);
    hashes.push({ path: dependency.path, sha256: actual });
    if (actual !== dependency.sha256) errors.push(`${uid}: source bytes changed: ${dependency.path}`);
    const upstreamPrefix = '.cache/upstream/suttacentral/';
    if (dependency.path.startsWith(upstreamPrefix)) {
      const upstreamPath = dependency.path.slice(upstreamPrefix.length);
      const edition = manifest?.editions.find(entry => upstreamPath.startsWith(`${entry.path}/`));
      let expectedBlob = edition?.files[upstreamPath.slice(edition.path.length + 1)];
      if (!expectedBlob && dependency.role === 'reference' && upstreamPath.startsWith('comment/')) {
        const referenceManifestPath = path.join(root, 'source/explanation-references.json');
        if (existsSync(referenceManifestPath)) {
          const referenceManifest = readJson<{ schemaVersion: number; commit: string; files: Record<string, string> }>(referenceManifestPath);
          if (referenceManifest.schemaVersion !== 1 || referenceManifest.commit !== lock.commit) errors.push(`${uid}: explanation reference manifest does not match the current source lock`);
          else expectedBlob = referenceManifest.files?.[upstreamPath];
        }
      }
      if (!expectedBlob || gitBlobHash(bytes) !== expectedBlob) errors.push(`${uid}: source file does not match the current pinned git blob: ${dependency.path}`);
    }
    if (dependency.role === 'pali') {
      try {
        const source = JSON.parse(bytes.toString('utf8')) as Record<string, unknown>;
        if (!record(source) || Object.keys(source).length === 0 || Object.values(source).some(value => typeof value !== 'string')) throw new Error('invalid map');
        paliIds = Object.keys(source);
        if (paliIds.some(id => !id.startsWith(`${uid}:`))) errors.push(`${uid}: Pāli source contains another sutta's segment IDs`);
      } catch { errors.push(`${uid}: Pāli source is not a non-empty segment map`); }
    }
  }
  if (!paliIds.length) errors.push(`${uid}: no verified Pāli segment IDs are available`);
  const tooling = YAML.parse(readFileSync(path.join(root, 'source/tooling.yaml'), 'utf8')) as { assistance: SupportTool[] };
  return { errors, hashes: sortedHashes(hashes), paliIds: new Set(paliIds), tools: new Map(tooling.assistance.map(tool => [tool.id, tool])) };
}

function contentIssues(content: ExplanationContent, uid: string, paliIds: Set<string>, tools: Map<string, SupportTool>) {
  const errors: string[] = [];
  const audiences = Object.fromEntries(AUDIENCES.map(audience => [audience, [] as string[]])) as Record<Audience, string[]>;
  if (content.schemaVersion !== 1 || content.uid !== uid) errors.push(`${uid}: invalid explanation schema/UID`);
  if (!Array.isArray(content.sourceDependencies)) errors.push(`${uid}: sourceDependencies must be an array`);
  if (!Array.isArray(content.meaningUnits) || !content.meaningUnits.length) errors.push(`${uid}: a complete meaning map is required`);
  const units = Array.isArray(content.meaningUnits) ? content.meaningUnits : [];
  const unitIds = new Set<string>();
  const coveredSegments = new Set<string>();
  for (const unit of units) {
    if (!record(unit) || !text(unit.id) || !LOCAL_ID.test(unit.id) || unitIds.has(unit.id)) {
      errors.push(`${uid}: invalid or duplicate meaning-unit ID`); continue;
    }
    unitIds.add(unit.id);
    if (!plain(unit.title) || !plain(unit.summary)) errors.push(`${uid}/${unit.id}: meaning unit needs plain NFC title/summary`);
    if (!strings(unit.segments) || !unit.segments.length || !unique(unit.segments)) {
      errors.push(`${uid}/${unit.id}: non-empty unique source segments are required`); continue;
    }
    for (const segment of unit.segments) {
      if (!paliIds.has(segment)) errors.push(`${uid}/${unit.id}: unknown Pāli segment ${segment}`);
      else coveredSegments.add(segment);
    }
  }
  const missingSegments = [...paliIds].filter(id => !coveredSegments.has(id));
  if (missingSegments.length) errors.push(`${uid}: meaning map omits ${missingSegments.length} Pāli segment(s): ${missingSegments.join(', ')}`);
  if (!record(content.audiences)) errors.push(`${uid}: audiences must be an object`);
  else if (Object.keys(content.audiences).some(audience => !AUDIENCES.includes(audience as Audience))) errors.push(`${uid}: unknown audience key`);
  for (const audience of AUDIENCES) {
    const doc = content.audiences?.[audience];
    if (doc === undefined || doc === null) continue; // An absent draft is pending, never complete.
    const issues = audiences[audience];
    if (!record(doc)) { issues.push(`${uid}/${audience}: invalid audience content`); continue; }
    if (!plain(doc.title)) issues.push(`${uid}/${audience}: a plain NFC title is required`);
    if (!strings(doc.authors) || !doc.authors.length || !unique(doc.authors) || doc.authors.some(id => !tools.has(id))) issues.push(`${uid}/${audience}: authors must be registered tooling IDs`);
    if (!Array.isArray(doc.sections) || !doc.sections.length) { issues.push(`${uid}/${audience}: substantive sections are required`); continue; }
    const sectionIds = new Set<string>();
    const coveredUnits = new Set<string>();
    for (const section of doc.sections) {
      if (!record(section) || !text(section.id) || !LOCAL_ID.test(section.id) || sectionIds.has(section.id)) {
        issues.push(`${uid}/${audience}: invalid or duplicate section ID`); continue;
      }
      sectionIds.add(section.id);
      if (!EXPLANATION_SECTION_KINDS.includes(section.kind)) issues.push(`${uid}/${audience}/${section.id}: unknown section kind`);
      if (section.heading !== undefined && !plain(section.heading)) issues.push(`${uid}/${audience}/${section.id}: invalid heading`);
      if (!Array.isArray(section.paragraphs) || !section.paragraphs.length || section.paragraphs.some(paragraph => !plain(paragraph))) issues.push(`${uid}/${audience}/${section.id}: plain NFC paragraphs are required`);
      if (!strings(section.meaningUnits) || !section.meaningUnits.length || !unique(section.meaningUnits)) {
        issues.push(`${uid}/${audience}/${section.id}: meaning-unit references are required`); continue;
      }
      for (const unitId of section.meaningUnits) {
        if (!unitIds.has(unitId)) issues.push(`${uid}/${audience}/${section.id}: unknown meaning unit ${unitId}`);
        else if (['teaching', 'clarification'].includes(section.kind)) coveredUnits.add(unitId);
      }
    }
    const missing = [...unitIds].filter(id => !coveredUnits.has(id));
    if (missing.length) issues.push(`${uid}/${audience}: teaching/clarification omits meaning units: ${missing.join(', ')}`);
  }
  return { errors, audiences };
}

export function validateExplanationReview(review: ExplanationReview, tools: ReadonlySet<string>): string[] {
  const errors: string[] = [];
  const prefix = text(review?.id) ? review.id : 'review';
  if (!record(review) || !text(review.id) || !AUDIENCES.includes(review.audience)) return [`${prefix}: invalid review ID/audience`];
  if (!validDate(review.reviewedAt)) errors.push(`${prefix}: valid review date required`);
  if (!strings(review.reviewers) || !review.reviewers.length || !unique(review.reviewers) || review.reviewers.some(id => !tools.has(id))) errors.push(`${prefix}: reviewers must be registered tooling IDs`);
  if (explanationScore(review.scores) === null) errors.push(`${prefix}: exactly ten finite scores in [0, 10] are required`);
  if (!record(review.rationale) || Object.keys(review.rationale).length !== EXPLANATION_SCORE_KEYS.length
    || EXPLANATION_SCORE_KEYS.some(key => !plain(review.rationale[key]))) errors.push(`${prefix}: a specific rationale for each criterion is required`);
  else if (new Set(EXPLANATION_SCORE_KEYS.map(key => review.rationale[key].trim())).size !== EXPLANATION_SCORE_KEYS.length) errors.push(`${prefix}: criterion rationales must not repeat one generic assessment`);
  if (!Array.isArray(review.blockingErrors) || review.blockingErrors.some(error => !plain(error))) errors.push(`${prefix}: blockingErrors must be a list of explicit issues`);
  if (!plain(review.notes)) errors.push(`${prefix}: review notes are required`);
  if (!SHA256.test(review.contentHash ?? '')) errors.push(`${prefix}: contentHash is required`);
  if (!Array.isArray(review.sourceHashes) || !review.sourceHashes.length
    || review.sourceHashes.some(source => !record(source) || !safeRelative(source.path) || !SHA256.test(source.sha256 ?? ''))
    || !unique(review.sourceHashes.map(source => source.path))) errors.push(`${prefix}: unique source hashes are required`);
  return errors;
}

export function emptyExplanationMetadata(uid: string): ExplanationMetadata {
  return { schemaVersion: 1, uid, audiences: Object.fromEntries(AUDIENCES.map(audience => [audience, { status: 'draft' as const }])), reviews: [] };
}

export function auditExplanations(collection: CollectionCode, uid: string, options: ExplanationOptions = {}): ExplanationAudit | null {
  const files = explanationPaths(collection, uid, options);
  if (!existsSync(files.content)) {
    if (existsSync(files.metadata)) throw new Error(`${uid}: explanation metadata exists without content`);
    return null;
  }
  const content = readJson<ExplanationContent>(files.content);
  if (!record(content)) throw new Error(`${uid}: explanation content must be an object`);
  const metadata = existsSync(files.metadata) ? readJson<ExplanationMetadata>(files.metadata) : emptyExplanationMetadata(uid);
  if (!record(metadata)) throw new Error(`${uid}: explanation metadata must be an object`);
  const sources = sourceContext(content, collection, uid, options);
  const issues = contentIssues(content, uid, sources.paliIds, sources.tools);
  const errors = [...sources.errors, ...issues.errors, ...AUDIENCES.flatMap(audience => issues.audiences[audience])];
  const globalMetadataErrors: string[] = [];
  if (metadata.schemaVersion !== 1 || metadata.uid !== uid || !record(metadata.audiences) || !Array.isArray(metadata.reviews)) globalMetadataErrors.push(`${uid}: invalid explanation metadata schema/UID`);
  if (record(metadata.audiences) && Object.keys(metadata.audiences).some(audience => !AUDIENCES.includes(audience as Audience))) globalMetadataErrors.push(`${uid}: unknown metadata audience`);
  const reviews = Array.isArray(metadata.reviews) ? metadata.reviews : [];
  const reviewErrors = new Map<string, string[]>();
  const toolIds = new Set(sources.tools.keys());
  const seenReviewIds = new Set<string>();
  for (const review of reviews) {
    const problems = validateExplanationReview(review, toolIds);
    if (seenReviewIds.has(review?.id)) problems.push(`${uid}: duplicate review ID ${review.id}`);
    seenReviewIds.add(review?.id);
    reviewErrors.set(review?.id, problems);
    errors.push(...problems);
  }
  errors.push(...globalMetadataErrors);
  const views = {} as Record<Audience, ExplanationAudienceView>;
  for (const audience of AUDIENCES) {
    const doc = content.audiences?.[audience];
    const state = metadata.audiences?.[audience];
    const blockers = [...sources.errors, ...issues.errors, ...globalMetadataErrors, ...issues.audiences[audience]];
    let storedStatus: EditorialStatus = 'draft';
    if (state !== undefined) {
      if (!record(state) || !['draft', 'review', 'published'].includes(state.status)) {
        const error = `${uid}/${audience}: invalid editorial state`; errors.push(error); blockers.push(error);
      } else storedStatus = state.status;
    }
    const selectedId = state?.selectedReviewId;
    const matches = selectedId ? reviews.filter(review => review?.id === selectedId && review.audience === audience) : [];
    const selected = matches.length === 1 ? matches[0] : undefined;
    if (selectedId && !selected) {
      const error = `${uid}/${audience}: selected review is missing, duplicated, or belongs to another audience`;
      errors.push(error); blockers.push(error);
    }
    if (selected) blockers.push(...(reviewErrors.get(selected.id) ?? []));
    const structurallyReady = Boolean(doc) && blockers.length === 0;
    const current = Boolean(selected && structurallyReady && selected.contentHash === explanationContentHash(content, audience)
      && sameHashes(selected.sourceHashes, sources.hashes));
    const stale = Boolean(selected && (!current) && (sources.errors.length > 0 || (structurallyReady && selected.contentHash !== explanationContentHash(content, audience))
      || (structurallyReady && !sameHashes(selected.sourceHashes, sources.hashes))));
    if (stale) blockers.push(`${uid}/${audience}: the selected review no longer matches the content/source bytes`);
    if (current && selected) blockers.push(...selected.blockingErrors);
    const score = current && selected ? explanationScore(selected.scores) : null;
    let status: ExplanationAudienceView['status'] = !doc ? 'not-started' : stale ? 'stale' : 'draft';
    if (doc && !stale && structurallyReady) {
      if (!selected) status = storedStatus === 'review' ? 'review' : 'draft';
      else if (current) {
        const eligible = explanationStatus(selected);
        status = storedStatus === 'draft' ? 'draft' : storedStatus === 'review' && eligible === 'published' ? 'review' : eligible;
      }
    }
    if (storedStatus === 'published' && status !== 'published') errors.push(`${uid}/${audience}: published state lacks a complete current review satisfying the explanation gate`);
    if (!doc && storedStatus !== 'draft') errors.push(`${uid}/${audience}: an absent audience cannot be ${storedStatus}`);
    views[audience] = {
      status,
      content: status === 'published' ? doc ?? undefined : undefined,
      score,
      reviewers: current && selected ? selected.reviewers.map(id => creditLabel(sources.tools.get(id)!)) : [],
      reviewedAt: current ? selected?.reviewedAt : undefined,
      reviewId: current ? selected?.id : undefined,
      blockers,
    };
  }
  const scores = AUDIENCES.map(audience => views[audience].score);
  const complete = AUDIENCES.every(audience => views[audience].status === 'published');
  const bundle: ExplanationBundle = {
    uid, meaningUnits: Array.isArray(content.meaningUnits) ? content.meaningUnits : [], audiences: views,
    complete,
    minimumScore: complete && scores.every((score): score is number => score !== null) ? Math.min(...scores) : null,
  };
  return { content, metadata, bundle, errors: [...new Set(errors)], sourceErrors: sources.errors, sourceHashes: sources.hashes };
}

export function loadExplanations(collection: CollectionCode, uid: string, options: ExplanationOptions = {}): ExplanationBundle | null {
  if (!['mn', 'dn'].includes(collection)) return null;
  return auditExplanations(collection, uid, options)?.bundle ?? null;
}
