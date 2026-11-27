import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { composeDocument } from '../../src/lib/canon/document';
import { COLLECTIONS, loadCatalog } from '../../src/lib/canon/load';
import { englishAudioSource, englishAudioTranscriptHash } from '../../src/lib/canon/english-audio';
import { audioPlayerData, englishAudioRegistrationVersion, loadAudio, loadEnglishAudioVersion, narrationHash, type EnglishAudioRegistration } from '../../src/lib/canon/audio';
import { englishAudioApprovalScopeIssues, englishAudioR2ObjectKey, englishAudioRequiredApprovalKeys } from '../../src/lib/canon/english-audio-authorization';
import { contentMetaPathForLayer, resolveLayer } from '../../src/lib/canon/layers';
import type { EnglishAudioApprovalManifest } from '../../src/lib/canon/english-audio-authorization';

const repoRoot = process.cwd();
const sha256 = (file: string) => createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const repoPath = (file: string) => path.relative(repoRoot, file).split(path.sep).join('/');

test('English R2 key builder accepts every UID in the five-Nikāya catalog', () => {
  const sourceHash = 'a'.repeat(64);
  const profileHash = 'b'.repeat(64);
  const objectHash = 'c'.repeat(64);
  for (const { code } of COLLECTIONS) {
    for (const { uid } of loadCatalog(code).texts) {
      const key = englishAudioR2ObjectKey({ collection: code, uid, source_sha256: sourceHash }, profileHash, objectHash);
      assert.equal(key, `en/${code}/${uid}/${sourceHash}-${profileHash}/${objectHash}.mp3`);
    }
  }
});

test('English approval allowlist cannot authorize UIDs outside a fresh candidate set', () => {
  const manifest = {
    authorized_uid_source_sha256: { 'dn/dn1': 'a'.repeat(64) },
  };
  assert.deepEqual(englishAudioApprovalScopeIssues(['dn/dn1'], manifest), []);
  assert.deepEqual(englishAudioApprovalScopeIssues(['dn/dn1'], {
    authorized_uid_source_sha256: { ...manifest.authorized_uid_source_sha256, 'kn/dhp1-20': 'b'.repeat(64) },
  }), ['English approval UID allowlist contains 1 UID(s) outside the current preflight']);
  assert.deepEqual(englishAudioApprovalScopeIssues(['dn/dn1'], { authorized_uid_source_sha256: null }), [
    'English approval UID allowlist is missing or malformed',
  ]);
});

function sourceAndDependencies() {
  const document = composeDocument('dn', 'dn25');
  const project = resolveLayer('english-project', 'dn', 'dn25');
  const source = englishAudioSource(document, project?.status ?? null);
  assert.equal(source.status, 'ready');
  assert.ok(source.source_sha256);

  const dependencies: Array<{ path: string; sha256: string }> = [];
  if (source.source_segment_counts['english-sujato'] > 0) {
    const sujato = resolveLayer('english-sujato', 'dn', 'dn25');
    assert.ok(sujato?.present && sujato.upstreamPath);
    dependencies.push({ path: sujato.upstreamPath, sha256: sha256(sujato.file) });
  }

  let projectMetaSha256: string | null = null;
  if (source.source_segment_counts['english-project'] > 0) {
    assert.ok(project?.present && project.contentPath && project.status === 'published');
    const meta = contentMetaPathForLayer(project.layer, 'dn', 'dn25');
    assert.ok(meta);
    projectMetaSha256 = sha256(meta);
    dependencies.push({ path: repoPath(project.contentPath), sha256: sha256(project.contentPath) });
    dependencies.push({ path: repoPath(meta), sha256: projectMetaSha256 });
  }
  return { document, source, dependencies, projectMetaSha256 };
}

function registrationFor(
  source: ReturnType<typeof englishAudioSource>,
  dependencies: Array<{ path: string; sha256: string }>,
  projectMetaSha256: string | null,
): EnglishAudioRegistration {
  const profileSha256 = 'a'.repeat(64);
  const artifactSha256 = 'b'.repeat(64);
  const r2Key = englishAudioR2ObjectKey(source, profileSha256, artifactSha256);
  return {
    schema_version: 1,
    uid: source.uid,
    collection: source.collection,
    language: 'en',
    track_kind: 'english-translation',
    transcript_policy: 'resolved-english-column-v1',
    source_commit: source.source_commit,
    source_sha256: source.source_sha256!,
    transcript_sha256: englishAudioTranscriptHash(source)!,
    segment_sources: source.segments.map(({ id, source: layer }) => ({ id, source: layer })),
    source_dependencies: dependencies,
    english_project_meta_sha256: projectMetaSha256,
    narration_profile_id: 'english-test-profile-v1',
    narration_profile_sha256: profileSha256,
    r2_bucket: 'test-audio',
    r2_key: r2Key,
    approval_refs: {
      source_rights: 'editorial-decision:test-rights',
      provider_use: 'editorial-decision:test-provider',
      cost_ceiling: 'editorial-decision:test-budget',
      voice_sample: 'editorial-decision:test-sample',
      public_distribution: 'editorial-decision:test-distribution',
    },
    url: `https://audio.example.org/${r2Key}`,
    duration_seconds: 90,
    sha256: artifactSha256,
    bytes: 1200,
    upload_verified: true,
    public_range_verified: true,
    r2_full_sha256_verified: true,
    review_status: 'pending',
  };
}

function approvedManifestFor(source: ReturnType<typeof englishAudioSource>, registration: EnglishAudioRegistration): EnglishAudioApprovalManifest {
  const approvalRefs = registration.approval_refs;
  const usesSujato = source.source_segment_counts['english-sujato'] > 0;
  return {
    schema_version: 2,
    release_status: 'approved',
    source_commit: source.source_commit,
    authorized_uid_source_sha256: { [`${source.collection}/${source.uid}`]: source.source_sha256! },
    profile: { status: 'approved', id: registration.narration_profile_id, sha256: registration.narration_profile_sha256 },
    approvals: {
      source_rights: usesSujato ? {
        status: 'approved',
        reference: approvalRefs.source_rights,
        basis: 'editor-legal-decision',
        ai_derived_tts_allowed: true,
        public_audio_distribution_allowed: true,
        source_scope_reference: 'editorial-decision:test-source-scope',
      } : {
        status: 'pending',
        reference: null,
        basis: null,
        ai_derived_tts_allowed: null,
        public_audio_distribution_allowed: null,
        source_scope_reference: null,
      },
      provider_use: { status: 'approved', reference: approvalRefs.provider_use, provider: 'Gemini', model: 'gemini-test-tts', tier: 'paid' },
      cost_ceiling: { status: 'approved', reference: approvalRefs.cost_ceiling, max_usd: 100, retry_limit: 2, includes_r2_operations: true, includes_r2_storage_and_egress: true },
      voice_sample: { status: 'approved', reference: approvalRefs.voice_sample, approver: 'English editor test', sample_sha256: 'c'.repeat(64), profile_sha256: registration.narration_profile_sha256 },
      public_distribution: { status: 'approved', reference: approvalRefs.public_distribution, destination: 'r2-public', bucket: 'test-audio', public_base_url: 'https://audio.example.org', key_prefix: 'en/' },
    },
  };
}

test('project-only English can use the separately approved pilot path without clearing Sujato rights', () => {
  const document = composeDocument('kn', 'bv1');
  const project = resolveLayer('english-project', 'kn', 'bv1');
  assert.ok(project?.present && project.contentPath && project.status === 'published');
  const source = englishAudioSource(document, project.status);
  assert.equal(source.source_segment_counts['english-sujato'], 0);
  assert.ok(source.source_segment_counts['english-project'] > 0);

  const metaPath = contentMetaPathForLayer(project.layer, 'kn', 'bv1');
  assert.ok(metaPath);
  const projectMetaSha256 = sha256(metaPath);
  const dependencies = [
    { path: repoPath(project.contentPath), sha256: sha256(project.contentPath) },
    { path: repoPath(metaPath), sha256: projectMetaSha256 },
  ];
  const registration = registrationFor(source, dependencies, projectMetaSha256);
  registration.approval_refs.source_rights = null;
  const approvals = approvedManifestFor(source, registration);
  assert.equal(approvals.approvals.source_rights.status, 'pending');
  assert.deepEqual(englishAudioRequiredApprovalKeys(source), [
    'provider_use', 'cost_ceiling', 'voice_sample', 'public_distribution',
  ]);
  assert.ok(englishAudioRegistrationVersion(source, registration, dependencies, projectMetaSha256, approvals));

  const sujato = sourceAndDependencies();
  const sujatoRegistration = registrationFor(sujato.source, sujato.dependencies, sujato.projectMetaSha256);
  const sujatoApprovals = approvedManifestFor(sujato.source, sujatoRegistration);
  sujatoApprovals.approvals.source_rights = {
    status: 'pending', reference: null, basis: null, ai_derived_tts_allowed: null,
    public_audio_distribution_allowed: null, source_scope_reference: null,
  };
  assert.equal(englishAudioRegistrationVersion(
    sujato.source, sujatoRegistration, sujato.dependencies, sujato.projectMetaSha256, sujatoApprovals,
  ), null, 'Sujato-derived audio remains hidden until explicit rights clearance');
});

test('English registration binds source, provenance, review metadata, approvals and public R2 evidence', () => {
  const { document, source, dependencies, projectMetaSha256 } = sourceAndDependencies();
  const registration = registrationFor(source, dependencies, projectMetaSha256);
  const approvals = approvedManifestFor(source, registration);
  const version = englishAudioRegistrationVersion(source, registration, dependencies, projectMetaSha256, approvals);
  assert.ok(version);
  assert.equal(version.id, 'english-standard');
  assert.equal(version.kind, 'english');
  assert.equal(version.label, 'English translation');
  assert.equal(version.start_seconds, 0);
  assert.equal(version.review_status, 'pending');
  assert.equal(version.url, registration.url);

  assert.equal(englishAudioRegistrationVersion(source, { ...registration, transcript_sha256: '0'.repeat(64) }, dependencies, projectMetaSha256, approvals), null);
  assert.equal(englishAudioRegistrationVersion(source, { ...registration, english_project_meta_sha256: '0'.repeat(64) }, dependencies, projectMetaSha256, approvals), null);
  assert.equal(englishAudioRegistrationVersion(source, { ...registration, approval_refs: { ...registration.approval_refs, source_rights: '' } }, dependencies, projectMetaSha256, approvals), null);
  assert.equal(englishAudioRegistrationVersion(source, registration, dependencies, projectMetaSha256), null, 'the repository approval manifest is pending by default');
  assert.equal(englishAudioRegistrationVersion(source, registration, dependencies, projectMetaSha256, { ...approvals, authorized_uid_source_sha256: {} }), null);
  assert.equal(englishAudioRegistrationVersion(source, registration, dependencies, projectMetaSha256, { ...approvals, source_commit: 'stale-commit' }), null);
  assert.equal(englishAudioRegistrationVersion(source, registration, dependencies, projectMetaSha256, {
    ...approvals,
    approvals: { ...approvals.approvals, cost_ceiling: { ...approvals.approvals.cost_ceiling, max_usd: null } },
  }), null);
  assert.equal(englishAudioRegistrationVersion(source, registration, dependencies, projectMetaSha256, {
    ...approvals,
    approvals: { ...approvals.approvals, cost_ceiling: { ...approvals.approvals.cost_ceiling, includes_r2_operations: false } },
  }), null);
  assert.equal(englishAudioRegistrationVersion(source, registration, dependencies, projectMetaSha256, {
    ...approvals,
    approvals: { ...approvals.approvals, source_rights: { ...approvals.approvals.source_rights, ai_derived_tts_allowed: false } },
  }), null);
  assert.equal(englishAudioRegistrationVersion(source, registration, dependencies, projectMetaSha256, {
    ...approvals,
    approvals: { ...approvals.approvals, provider_use: { ...approvals.approvals.provider_use, model: '' } },
  }), null);
  assert.equal(englishAudioRegistrationVersion(source, registration, dependencies, projectMetaSha256, {
    ...approvals,
    approvals: { ...approvals.approvals, public_distribution: { ...approvals.approvals.public_distribution, key_prefix: 'vi/' } },
  }), null);
  assert.equal(englishAudioRegistrationVersion(source, { ...registration, r2_bucket: 'unapproved-bucket' }, dependencies, projectMetaSha256, approvals), null);
  assert.equal(englishAudioRegistrationVersion(source, { ...registration, r2_key: `vi/${registration.r2_key}` }, dependencies, projectMetaSha256, approvals), null);
  assert.equal(englishAudioRegistrationVersion(source, { ...registration, url: 'https://other.example.org/audio.mp3' }, dependencies, projectMetaSha256, approvals), null);
  assert.equal(englishAudioRegistrationVersion(source, registration, dependencies, projectMetaSha256, {
    ...approvals,
    approvals: { ...approvals.approvals, public_distribution: { ...approvals.approvals.public_distribution, public_base_url: 'http://audio.example.org' } },
  }), null);
  assert.equal(englishAudioRegistrationVersion(source, { ...registration, approval_refs: { ...registration.approval_refs, source_rights: 'unregistered-ref' } }, dependencies, projectMetaSha256, approvals), null);
  assert.equal(englishAudioRegistrationVersion(source, { ...registration, public_range_verified: false }, dependencies, projectMetaSha256, approvals), null);
  assert.equal(englishAudioRegistrationVersion(source, { ...registration, duration_seconds: 1801 }, dependencies, projectMetaSha256, approvals), null);
  assert.equal(englishAudioRegistrationVersion({ ...source, status: 'blocked' }, registration, dependencies, projectMetaSha256, approvals), null);

  const partHashes = ['d'.repeat(64), 'e'.repeat(64)];
  const parts = partHashes.map((sha, index) => {
    const r2_key = englishAudioR2ObjectKey(source, registration.narration_profile_sha256, sha, index + 1);
    return { url: `https://audio.example.org/${r2_key}`, r2_key, sha256: sha, bytes: 1000, duration_seconds: 600 };
  });
  const orderedHash = createHash('sha256').update(partHashes.map(sha => `${sha}\n`).join('')).digest('hex');
  const multipart = {
    ...registration, url: parts[0].url, r2_key: undefined, parts, asset_kind: 'reading-parts-v1',
    checksum_scope: 'ordered-part-sha256-lines', duration_seconds: 1200, sha256: orderedHash, bytes: 2000,
  };
  assert.ok(englishAudioRegistrationVersion(source, multipart, dependencies, projectMetaSha256, approvals));
  assert.equal(englishAudioRegistrationVersion(source, {
    ...multipart, parts: [{ ...parts[0], r2_key: 'en/dn/dn25/part-001.mp3' }, parts[1]],
  }, dependencies, projectMetaSha256, approvals), null);
  assert.equal(englishAudioR2ObjectKey(source, registration.narration_profile_sha256, partHashes[0], 1), parts[0].r2_key);
  assert.throws(() => englishAudioR2ObjectKey({ ...source, uid: '../escape' }, registration.narration_profile_sha256, partHashes[0]));

  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'english-audio-registration-'));
  const originalCwd = process.cwd();
  try {
    const englishFile = path.join(temporary, 'content/audio/en/dn/dn25.json');
    const vietnameseFile = path.join(temporary, 'content/audio/dn25.json');
    fs.mkdirSync(path.dirname(englishFile), { recursive: true });
    fs.mkdirSync(path.dirname(vietnameseFile), { recursive: true });
    fs.writeFileSync(englishFile, JSON.stringify(registration));
    fs.writeFileSync(vietnameseFile, JSON.stringify({
      uid: document.uid,
      url: 'https://audio.example.org/vi/dn/dn25.mp3',
      source_sha256: narrationHash(document),
      duration_seconds: 300,
      scripture_start_seconds: 60,
      voice: 'Charon',
      review_status: 'pending',
      sha256: 'c'.repeat(64),
      bytes: 2000,
    }));
    process.chdir(temporary);

    assert.equal(loadEnglishAudioVersion(document), null, 'the default pending manifest must hide any English sidecar');
    assert.equal(loadEnglishAudioVersion(document, approvals)?.id, 'english-standard');
    assert.deepEqual(loadAudio(document)?.versions.map(version => version.id), ['original']);
    const combined = loadAudio(document, approvals);
    assert.ok(combined);
    assert.deepEqual(combined.versions.map(version => version.id), ['original', 'english-standard']);
    const playerData = audioPlayerData(combined);
    assert.ok(!JSON.stringify(playerData).includes('approval_refs'));
    assert.ok(!JSON.stringify(playerData).includes('source_dependencies'));

    fs.writeFileSync(englishFile, JSON.stringify({ ...registration, source_sha256: '0'.repeat(64) }));
    assert.equal(loadEnglishAudioVersion(document, approvals), null);
    assert.deepEqual(loadAudio(document, approvals)?.versions.map(version => version.id), ['original']);
  } finally {
    process.chdir(originalCwd);
    fs.rmSync(temporary, { recursive: true, force: true });
  }
});
