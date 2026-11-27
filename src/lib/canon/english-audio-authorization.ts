import fs from 'node:fs';
import path from 'node:path';
import type { EnglishAudioSource } from './english-audio';

export const ENGLISH_AUDIO_APPROVAL_KEYS = [
  'source_rights', 'provider_use', 'cost_ceiling', 'voice_sample', 'public_distribution',
] as const;

export type EnglishAudioApprovalKey = (typeof ENGLISH_AUDIO_APPROVAL_KEYS)[number];

export interface EnglishAudioApprovalManifest {
  schema_version: 1;
  release_status: 'pending' | 'approved';
  source_commit: string;
  /** Exact per-UID resolved English identities authorized by the recorded decisions. */
  authorized_uid_source_sha256: Record<string, string>;
  profile: { status: 'pending' | 'approved'; id: string | null; sha256: string | null };
  approvals: Record<EnglishAudioApprovalKey, { status: 'pending' | 'approved'; reference: string | null }>;
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
  return [...new Set(issues)];
}
