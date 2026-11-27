/**
 * Provider-free audit of the English approval allowlist against a fresh preflight.
 * This command never reads credentials, calls a provider, or writes audio/R2.
 *
 *   node --import tsx scripts/audio-english-preflight.ts --require-ready --output /tmp/en.json
 *   node --import tsx scripts/audio-english-authorization-check.ts --preflight /tmp/en.json --output /tmp/en-auth.json
 */
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import type { CollectionCode } from '../src/lib/canon/types';
import { COLLECTIONS, loadCatalog, loadLock } from '../src/lib/canon/load';
import { composeDocument } from '../src/lib/canon/document';
import { resolveLayer } from '../src/lib/canon/layers';
import { manifestCommit } from '../src/lib/canon/manifest';
import { englishAudioSource } from '../src/lib/canon/english-audio';
import { englishAudioAuthorizationIssues, loadEnglishAudioApprovalManifest } from '../src/lib/canon/english-audio-authorization';

const args = process.argv.slice(2);
const usage = 'Usage: node --import tsx scripts/audio-english-authorization-check.ts --preflight <file> --output <file> [--require-all-candidates]';
let preflightPath: string | undefined;
let outputPath: string | undefined;
let requireAllCandidates = false;
for (let index = 0; index < args.length;) {
  const arg = args[index];
  if (arg === '--require-all-candidates') {
    if (requireAllCandidates) {
      console.error(`${usage}\nDuplicate --require-all-candidates option.`);
      process.exit(2);
    }
    requireAllCandidates = true;
    index += 1;
    continue;
  }
  if (arg === '--preflight' || arg === '--output') {
    const value = args[index + 1];
    if (!value || value.startsWith('--')) {
      console.error(`${usage}\n${arg} requires a path.`);
      process.exit(2);
    }
    if (arg === '--preflight') {
      if (preflightPath) {
        console.error(`${usage}\nDuplicate --preflight option.`);
        process.exit(2);
      }
      preflightPath = value;
    } else {
      if (outputPath) {
        console.error(`${usage}\nDuplicate --output option.`);
        process.exit(2);
      }
      outputPath = value;
    }
    index += 2;
    continue;
  }
  console.error(`${usage}\nUnknown option: ${arg}`);
  process.exit(2);
}
if (!preflightPath || !outputPath) {
  console.error(`${usage}\nBoth paths are required; this command has no provider or upload operation.`);
  process.exit(2);
}

const resolvedPreflight = path.resolve(preflightPath);
const resolvedOutput = path.resolve(outputPath);
if (!existsSync(resolvedPreflight)) throw new Error(`Preflight report is missing: ${resolvedPreflight}`);
const preflightBytes = readFileSync(resolvedPreflight);
const preflight = JSON.parse(preflightBytes.toString('utf8')) as {
  schema_version: number;
  generated_at: string;
  source_commit: string;
  upstream_manifest_commit: string;
  policy: string;
  scope: string[];
  totals: { catalog_texts: number; candidates: number; no_english: number; partial: number; blocked: number };
  candidate_uids: string[];
  excluded: Array<{ uid: string; collection: string }>;
};
if (!Array.isArray(preflight.candidate_uids) || !Array.isArray(preflight.excluded)
  || !preflight.totals || !Number.isInteger(preflight.totals.candidates)) {
  throw new Error('Preflight candidate, exclusion, or total fields are malformed.');
}
const lock = loadLock();
const currentManifestCommit = manifestCommit();
if (preflight.schema_version !== 1 || preflight.policy !== 'resolved-english-column-v1'
  || preflight.source_commit !== lock.commit || preflight.upstream_manifest_commit !== lock.commit
  || currentManifestCommit !== lock.commit) {
  throw new Error('Preflight report, local upstream manifest, and source lock do not share the same pinned commit/policy.');
}
const age = Date.now() - Date.parse(preflight.generated_at);
if (!Number.isFinite(age) || age < 0 || age > 2 * 60 * 60 * 1000) throw new Error('Authorization check requires a preflight generated within the last two hours.');
if (preflight.scope.length !== COLLECTIONS.length
  || preflight.scope.some((collection, index) => collection !== COLLECTIONS[index].code)) {
  throw new Error('Authorization check requires the current complete DN/MN/SN/AN/KN preflight.');
}

const catalogUids = new Set(COLLECTIONS.flatMap(({ code }) => loadCatalog(code).texts.map(({ uid }) => `${code}/${uid}`)));
const reportedUids = [...preflight.candidate_uids, ...preflight.excluded.map(({ collection, uid }) => `${collection}/${uid}`)];
if (new Set(reportedUids).size !== reportedUids.length || reportedUids.length !== catalogUids.size
  || reportedUids.some((uid) => !catalogUids.has(uid))) {
  throw new Error('Preflight candidate/exclusion rows do not cover the current five-Nikāya catalog exactly once.');
}
if (preflight.candidate_uids.length !== preflight.totals.candidates) throw new Error('Preflight candidate count does not match its UID list.');

const approvalManifest = loadEnglishAudioApprovalManifest(process.cwd());
const manifestPath = path.join(process.cwd(), 'source/english-audio-approvals.json');
const manifestSha256 = existsSync(manifestPath)
  ? createHash('sha256').update(readFileSync(manifestPath)).digest('hex') : null;
const profile = approvalManifest && typeof approvalManifest === 'object'
  ? (approvalManifest as { profile?: { id?: unknown; sha256?: unknown } }).profile ?? null : null;
const records: Array<Record<string, unknown>> = [];
const blockerCounts = new Map<string, number>();
const currentCandidates = new Set(preflight.candidate_uids);
for (const candidate of preflight.candidate_uids) {
  const split = candidate.indexOf('/');
  if (split < 1) throw new Error(`Invalid candidate UID: ${candidate}`);
  const collection = candidate.slice(0, split) as CollectionCode;
  const uid = candidate.slice(split + 1);
  const catalog = loadCatalog(collection);
  const document = composeDocument(collection, uid);
  if (document.commit !== lock.commit) throw new Error(`${candidate}: composed document is on a different source commit.`);
  const project = resolveLayer('english-project', collection, uid, { catalog });
  const source = englishAudioSource(document, project?.status ?? null);
  const profileIdentity = {
    id: profile?.id ?? null,
    sha256: profile?.sha256 ?? null,
  };
  const blockers = englishAudioAuthorizationIssues(source, profileIdentity, approvalManifest);
  for (const blocker of blockers) blockerCounts.set(blocker, (blockerCounts.get(blocker) ?? 0) + 1);
  records.push({
    uid: candidate,
    source_sha256: source.source_sha256,
    status: blockers.length === 0 ? 'authorized' : 'blocked',
    uses_sujato: source.source_segment_counts['english-sujato'] > 0,
    uses_english_project: source.source_segment_counts['english-project'] > 0,
    source_segment_counts: source.source_segment_counts,
    blockers,
  });
}

const authorized = records.filter((record) => record.status === 'authorized');
const manifestAllowlist = approvalManifest && typeof approvalManifest === 'object'
  ? (approvalManifest as { authorized_uid_source_sha256?: Record<string, string> }).authorized_uid_source_sha256 ?? {} : {};
const extraManifestUids = Object.keys(manifestAllowlist).filter((uid) => !currentCandidates.has(uid));
const report = {
  schema_version: 1,
  generated_at: new Date().toISOString(),
  source_commit: lock.commit,
  preflight_generated_at: preflight.generated_at,
  preflight_sha256: createHash('sha256').update(preflightBytes).digest('hex'),
  approval_manifest_sha256: manifestSha256,
  candidate_count: records.length,
  authorized_count: authorized.length,
  blocked_count: records.length - authorized.length,
  manifest_uids_outside_current_candidate_set: extraManifestUids,
  blockers_by_reason: Object.fromEntries([...blockerCounts.entries()].sort(([a], [b]) => a.localeCompare(b))),
  uids: records,
  provider_calls: 0,
  uploads: 0,
};

mkdirSync(path.dirname(resolvedOutput), { recursive: true });
writeFileSync(resolvedOutput, `${JSON.stringify(report, null, 2)}\n`);
process.stderr.write(`English authorization check: ${authorized.length}/${records.length} UIDs authorized; provider calls 0; uploads 0.\n`);
if (requireAllCandidates && authorized.length !== records.length) process.exitCode = 1;
