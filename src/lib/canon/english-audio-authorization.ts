import fs from 'node:fs';
import path from 'node:path';
import type { EnglishAudioSource } from './english-audio';

export const ENGLISH_AUDIO_APPROVAL_KEYS = [
  'source_rights', 'provider_use', 'cost_ceiling', 'voice_sample', 'public_distribution',
] as const;

export type EnglishAudioApprovalKey = (typeof ENGLISH_AUDIO_APPROVAL_KEYS)[number];
interface ApprovalReference { status: 'pending' | 'approved'; reference: string | null; }

/** Canonical immutable object key shared by an English uploader and registration validator. */
export function englishAudioR2ObjectKey(
  source: Pick<EnglishAudioSource, 'collection' | 'uid' | 'source_sha256'>,
  profileSha256: string,
  objectSha256: string,
  partNumber?: number,
): string {
  if (!['dn', 'mn', 'sn', 'an', 'kn'].includes(source.collection)
    || !/^[a-z0-9.-]+$/.test(source.uid)
    || source.uid === '.' || source.uid === '..'
    || !/^[0-9a-f]{64}$/.test(source.source_sha256 ?? '')
    || !/^[0-9a-f]{64}$/.test(profileSha256)
    || !/^[0-9a-f]{64}$/.test(objectSha256)
    || (partNumber !== undefined && (!Number.isInteger(partNumber) || partNumber < 1))) {
    throw new Error('Cannot build an English R2 key from invalid source, profile, checksum, or part identity.');
  }
  const directory = `en/${source.collection}/${source.uid}/${source.source_sha256}-${profileSha256}/`;
  const filename = partNumber === undefined
    ? `${objectSha256}.mp3`
    : `part-${String(partNumber).padStart(3, '0')}-${objectSha256}.mp3`;
  return `${directory}${filename}`;
}

export interface EnglishAudioApprovalManifest {
  schema_version: 1;
  release_status: 'pending' | 'approved';
  source_commit: string;
  /** Exact per-UID resolved English identities authorized by the recorded decisions. */
  authorized_uid_source_sha256: Record<string, string>;
  profile: { status: 'pending' | 'approved'; id: string | null; sha256: string | null };
  approvals: {
    source_rights: ApprovalReference;
    provider_use: ApprovalReference & { provider: string | null; model: string | null; tier: 'free' | 'paid' | null };
    cost_ceiling: ApprovalReference & { max_usd: number | null; retry_limit: number | null; includes_r2_storage_and_egress: boolean };
    voice_sample: ApprovalReference & { approver: string | null; sample_sha256: string | null; profile_sha256: string | null };
    public_distribution: ApprovalReference & {
      destination: 'r2-public' | null;
      bucket: string | null;
      public_base_url: string | null;
      key_prefix: string | null;
    };
  };
}

type ProfileIdentity = { id: unknown; sha256: unknown };

const isRecord = (value: unknown): value is Record<string, unknown> => Boolean(value)
  && typeof value === 'object' && !Array.isArray(value);

/** Missing or malformed approval state fails closed. No provider call is made here. */
export function loadEnglishAudioApprovalManifest(repositoryRoot = process.cwd()): unknown {
  const file = path.join(repositoryRoot, 'source/english-audio-approvals.json');
  if (!fs.existsSync(file)) return null;
  try { return JSON.parse(fs.readFileSync(file, 'utf8')) as unknown; }
  catch { return null; }
}

/** Shared pre-provider/pre-upload gate for a single current resolved English UID. */
export function englishAudioAuthorizationIssues(
  source: EnglishAudioSource,
  profile: ProfileIdentity,
  manifest: unknown,
): string[] {
  const issues: string[] = [];
  if (source.status !== 'ready' || !source.source_sha256) issues.push('resolved English source is not ready');
  if (!isRecord(manifest)) return [...issues, 'English audio approval manifest is missing or malformed'];
  const candidate = manifest as Partial<EnglishAudioApprovalManifest>;
  if (candidate.schema_version !== 1) issues.push('English audio approval manifest schema is unsupported');
  if (candidate.release_status !== 'approved') issues.push('English audio release approvals are pending');
  if (candidate.source_commit !== source.source_commit) issues.push('approval manifest source commit is stale');

  const uidKey = `${source.collection}/${source.uid}`;
  const authorized = isRecord(candidate.authorized_uid_source_sha256)
    ? candidate.authorized_uid_source_sha256[uidKey] : undefined;
  if (typeof authorized !== 'string' || !source.source_sha256 || authorized !== source.source_sha256) {
    issues.push(`UID source identity is not authorized: ${uidKey}`);
  }

  const approvedProfile = candidate.profile;
  if (!isRecord(approvedProfile) || approvedProfile.status !== 'approved'
    || typeof profile.id !== 'string' || !profile.id.trim() || approvedProfile.id !== profile.id
    || typeof profile.sha256 !== 'string' || !/^[0-9a-f]{64}$/.test(profile.sha256)
    || approvedProfile.sha256 !== profile.sha256) {
    issues.push('English narration profile is not approved or does not match');
  }

  if (!isRecord(candidate.approvals)) {
    issues.push('English audio approval references are missing');
  } else {
    for (const key of ENGLISH_AUDIO_APPROVAL_KEYS) {
      const approval = candidate.approvals[key];
      if (!isRecord(approval) || approval.status !== 'approved'
        || typeof approval.reference !== 'string' || !approval.reference.trim()) {
        issues.push(`English audio approval is pending: ${key}`);
      }
    }

    const provider = candidate.approvals.provider_use;
    if (!isRecord(provider) || typeof provider.provider !== 'string' || !provider.provider.trim()
      || typeof provider.model !== 'string' || !provider.model.trim()
      || !['free', 'paid'].includes(provider.tier as string)) {
      issues.push('Approved English provider, model, or tier is missing');
    }

    const budget = candidate.approvals.cost_ceiling;
    if (!isRecord(budget) || typeof budget.max_usd !== 'number' || !Number.isFinite(budget.max_usd) || budget.max_usd <= 0
      || typeof budget.retry_limit !== 'number' || !Number.isInteger(budget.retry_limit) || budget.retry_limit < 0
      || budget.includes_r2_storage_and_egress !== true) {
      issues.push('Approved total cost ceiling or retry allowance is missing');
    }

    const sample = candidate.approvals.voice_sample;
    if (!isRecord(sample) || typeof sample.approver !== 'string' || !sample.approver.trim()
      || typeof sample.sample_sha256 !== 'string' || !/^[0-9a-f]{64}$/.test(sample.sample_sha256)
      || sample.profile_sha256 !== candidate.profile?.sha256) {
      issues.push('Approved English voice sample identity is missing or stale');
    }

    const distribution = candidate.approvals.public_distribution;
    if (!isRecord(distribution) || distribution.destination !== 'r2-public'
      || typeof distribution.bucket !== 'string' || !distribution.bucket.trim()
      || typeof distribution.public_base_url !== 'string' || !isPublicHttpsBase(distribution.public_base_url)
      || distribution.key_prefix !== 'en/') {
      issues.push('Approved public R2 destination, HTTPS base URL, bucket, or English key prefix is missing');
    }
  }
  return [...new Set(issues)];
}

/** A registration must carry the exact decision references in the approved manifest. */
export function englishAudioRegistrationAuthorizationIssues(
  source: EnglishAudioSource,
  profile: ProfileIdentity,
  registration: unknown,
  manifest: unknown,
): string[] {
  const issues = englishAudioAuthorizationIssues(source, profile, manifest);
  if (!isRecord(registration) || !isRecord(registration.approval_refs)
    || !isRecord(manifest) || !isRecord(manifest.approvals)) {
    return [...issues, 'English registration approval references are missing'];
  }
  for (const key of ENGLISH_AUDIO_APPROVAL_KEYS) {
    const expected = manifest.approvals[key];
    if (!isRecord(expected) || typeof expected.reference !== 'string'
      || registration.approval_refs[key] !== expected.reference) {
      issues.push(`Registration approval reference does not match: ${key}`);
    }
  }

  const distribution = manifest.approvals.public_distribution;
  if (!isRecord(distribution) || typeof distribution.bucket !== 'string'
    || typeof distribution.public_base_url !== 'string' || !isPublicHttpsBase(distribution.public_base_url)
    || typeof source.source_sha256 !== 'string' || typeof profile.sha256 !== 'string'
    || !/^[0-9a-f]{64}$/.test(profile.sha256)) {
    return [...new Set([...issues, 'Approved public R2 object identity is incomplete'])];
  }
  if (registration.r2_bucket !== distribution.bucket) issues.push('English audio bucket does not match the approved R2 bucket');

  const base = new URL(distribution.public_base_url).origin;
  const parts = Array.isArray(registration.parts) ? registration.parts : null;
  if (parts) {
    if (registration.r2_key !== undefined) issues.push('Multipart English audio must store object keys on each part');
    parts.forEach((part, index) => {
      if (!isRecord(part) || typeof part.sha256 !== 'string' || !/^[0-9a-f]{64}$/.test(part.sha256)) {
        issues.push(`English audio part ${index + 1} lacks a valid checksum for its object key`);
        return;
      }
      const expectedKey = englishAudioR2ObjectKey(source, profile.sha256 as string, part.sha256, index + 1);
      if (part.r2_key !== expectedKey) issues.push(`English audio part ${index + 1} key is not immutable or source/profile-bound`);
      if (part.url !== `${base}/${expectedKey}`) issues.push(`English audio part ${index + 1} URL does not match its approved R2 key`);
    });
  } else {
    const objectHash = registration.sha256;
    const expectedKey = typeof objectHash === 'string' && /^[0-9a-f]{64}$/.test(objectHash)
      ? englishAudioR2ObjectKey(source, profile.sha256 as string, objectHash) : null;
    if (!expectedKey || registration.r2_key !== expectedKey) issues.push('English audio key is not immutable or source/profile-bound');
    if (!expectedKey || registration.url !== `${base}/${expectedKey}`) issues.push('English audio URL does not match its approved R2 key');
  }
  return [...new Set(issues)];
}

function isPublicHttpsBase(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password
      && url.pathname === '/' && !url.search && !url.hash;
  } catch { return false; }
}
