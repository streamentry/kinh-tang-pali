import { createHash } from 'node:crypto';
import { auditExplanations } from './explanations';
import type { Audience, ExplanationSection } from './explanations';

export const EXPLANATION_AUDIO_AUDIENCES = ['children', 'adults', 'older-adults'] as const satisfies readonly Audience[];
export type ExplanationAudioAudience = (typeof EXPLANATION_AUDIO_AUDIENCES)[number];

export const EXPLANATION_AUDIENCE_LABELS: Record<ExplanationAudioAudience, { title: string; anchor: string }> = {
  children: { title: 'Diễn giải dành cho trẻ em', anchor: 'dien-giai-tre-em' },
  adults: { title: 'Diễn giải dành cho người trưởng thành', anchor: 'dien-giai-nguoi-truong-thanh' },
  'older-adults': { title: 'Diễn giải dành cho người lớn tuổi', anchor: 'dien-giai-nguoi-lon-tuoi' },
};

export const EXPLANATION_KIND_LABELS: Record<ExplanationSection['kind'], string> = {
  teaching: 'Tìm hiểu bài kinh',
  example: 'Ví dụ trong đời sống hôm nay',
  clarification: 'Chỗ dễ hiểu sai',
  practice: 'Gợi ý suy xét và thực hành',
};

export const EXPLANATION_EDITORIAL_NOTE = 'Phần diễn giải do dự án biên soạn để hỗ trợ tìm hiểu; đây không phải nguyên văn lời Phật. Các ví dụ đời sống và gợi ý thực hành là lời của người biên soạn.';

export const EXPLANATION_SECTION_NOTES: Partial<Record<ExplanationSection['kind'], string>> = {
  example: 'Tình huống minh họa do người biên soạn đặt ra.',
  practice: 'Gợi ý vận dụng của người biên soạn.',
};

const sourceCache = new Map<string, ExplanationNarrationSource>();

export interface ExplanationNarrationSource {
  schema_version: 1;
  uid: string;
  collection: 'mn';
  policy: 'explanation-audience-v1';
  audience: ExplanationAudioAudience;
  audience_label: string;
  selected_review_id: string;
  review_date: string;
  content_hash: string;
  source_dependencies: Array<{ path: string; sha256: string }>;
  summary: '';
  segments: Array<[string, string]>;
  source_sha256: string;
}

/** Exact spoken text for one current, published MN explanation. */
export function explanationNarrationSource(uid: string, audience: ExplanationAudioAudience): ExplanationNarrationSource {
  if (!/^mn(?:[1-9]|[1-9]\d|1[0-4]\d|15[0-2])$/.test(uid)) {
    throw new Error(`Unsupported explanation audio UID: ${uid}`);
  }
  const cacheKey = `${uid}/${audience}`;
  const cached = sourceCache.get(cacheKey);
  if (cached) return cached;

  const audit = auditExplanations('mn', uid);
  if (!audit || audit.sourceErrors.length) throw new Error(`${uid}/${audience}: explanation sources are not current`);
  const view = audit.bundle.audiences[audience];
  if (view.status !== 'published' || !view.content || !view.reviewId || !view.reviewedAt || view.blockers.length) {
    throw new Error(`${uid}/${audience}: a current published selected explanation is required`);
  }
  const review = audit.metadata.reviews.find((entry) => entry.id === view.reviewId && entry.audience === audience);
  // auditExplanations already checks this selected review's content and source hashes.
  if (!review) throw new Error(`${uid}/${audience}: selected review record is missing`);

  const { title, sections } = view.content;
  const label = EXPLANATION_AUDIENCE_LABELS[audience].title;
  const segments: Array<[string, string]> = [
    ['audience-label', `${label}.`],
    ['explanation-title', title],
    ['editorial-note', EXPLANATION_EDITORIAL_NOTE],
  ];
  for (const section of sections) {
    segments.push([`${section.id}:kind`, EXPLANATION_KIND_LABELS[section.kind]]);
    if (section.heading) segments.push([`${section.id}:heading`, section.heading]);
    const note = EXPLANATION_SECTION_NOTES[section.kind];
    if (note) segments.push([`${section.id}:editorial-note`, note]);
    section.paragraphs.forEach((paragraph, index) => segments.push([`${section.id}:paragraph-${index + 1}`, paragraph]));
  }

  const sourceDependencies = audit.sourceHashes.slice().sort((a, b) => a.path < b.path ? -1 : a.path > b.path ? 1 : 0);
  const sourceIdentity: Omit<ExplanationNarrationSource, 'source_sha256'> = {
    schema_version: 1,
    uid,
    collection: 'mn' as const,
    policy: 'explanation-audience-v1' as const,
    audience,
    audience_label: label,
    selected_review_id: review.id,
    review_date: review.reviewedAt,
    content_hash: review.contentHash,
    source_dependencies: sourceDependencies,
    summary: '' as const,
    segments,
  };
  const source_sha256 = createHash('sha256')
    .update(JSON.stringify(sourceIdentity), 'utf8')
    .digest('hex');

  const result = { ...sourceIdentity, source_sha256 };
  sourceCache.set(cacheKey, result);
  return result;
}

export function allMNExplanationNarrationSources(): ExplanationNarrationSource[] {
  return Array.from({ length: 152 }, (_, index) => `mn${index + 1}`)
    .flatMap((uid) => EXPLANATION_AUDIO_AUDIENCES.map((audience) => explanationNarrationSource(uid, audience)));
}
