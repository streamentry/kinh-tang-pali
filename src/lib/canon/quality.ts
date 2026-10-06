import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { loadMeta, loadLock } from './load';
import type { CollectionCode, TranslationQualityAssessment } from './types';

export const TRANSLATION_RUBRIC = [
  ['source_provenance', 'Nguồn & xuất xứ', 'Đúng UID, nguồn Pāli đã ghim; xác định đúng tác giả và nguồn tham khảo.'],
  ['semantic_fidelity', 'Đúng nghĩa Pāli', 'Giữ đủ ý; không thêm diễn giải vào lời kinh, không làm lệch giáo nghĩa.'],
  ['grammar_logic', 'Ngữ pháp & logic', 'Đúng người nói, chủ thể, phủ định, điều kiện, số lượng và quan hệ mệnh đề.'],
  ['segment_alignment', 'Đủ đoạn & căn chỉnh', 'Đủ segment, đúng ID và ranh giới; bảo toàn lặp và dấu lược.'],
  ['terminology', 'Thuật ngữ', 'Chính xác theo ngữ cảnh, giữ các phân biệt quan trọng và nhất quán.'],
  ['triangulation', 'Đối chiếu nguồn', 'Đọc Pāli, English và Việt truyền thống khi có; phân xử bất đồng bằng Pāli.'],
  ['vietnamese_clarity', 'Tiếng Việt sáng rõ', 'Câu tự nhiên, dễ hiểu, không dịch máy móc hay giả cổ.'],
  ['han_viet_balance', 'Hán–Việt & súc tích', 'Giữ thuật ngữ hữu ích, giảm từ tối nghĩa và diễn đạt dài dòng.'],
  ['ambiguity_integrity', 'Bất định & trung thực', 'Ghi nhận cách hiểu khác; không bịa nguồn hoặc che giấu bất định.'],
  ['technical_integrity', 'Kỹ thuật & phát hành', 'JSON/YAML, NFC, metadata, giấy phép và các kiểm tra bắt buộc đều đạt.'],
] as const;
export const SUMMARY_RUBRIC = [
  ['source_fidelity', 'Bám sát bài kinh', 'Mọi khẳng định có căn cứ trong kinh; không thêm giáo lý hoặc suy diễn.'],
  ['core_coverage', 'Đủ ý chính', 'Nêu được trọng tâm và kết luận; không bỏ ý khiến người đọc hiểu sai.'],
  ['argument_structure', 'Cấu trúc lập luận', 'Giữ trình tự và các quan hệ điều kiện, đối chiếu, nhân quả của kinh.'],
  ['context', 'Bối cảnh & người nói', 'Đúng địa điểm, người nói, người nghe và tình huống khi được nêu.'],
  ['terminology', 'Thuật ngữ', 'Dùng đúng nghĩa theo ngữ cảnh, nhất quán với bản dịch.'],
  ['clarity', 'Sáng rõ & tự nhiên', 'Văn xuôi dễ hiểu với người Việt hiện đại, không calque hay giả cổ.'],
  ['concision', 'Súc tích', 'Chọn lọc ý, tránh lặp thừa; không quá 500 từ.'],
  ['editorial_separation', 'Tách biệt lời kinh', 'Phân biệt tóm tắt với nguyên văn; không gán diễn giải cho Đức Phật.'],
  ['ambiguity_integrity', 'Bất định & trung thực', 'Không biến cách hiểu chưa chắc thành kết luận chắc chắn.'],
  ['technical_integrity', 'Kỹ thuật & trình bày', 'Văn xuôi thuần, NFC, đoạn văn hợp lệ và hiển thị đúng.'],
] as const;
export type AssessmentTarget = 'translation' | 'summary';
export interface Assessment {
  id: string;
  target: AssessmentTarget;
  scope: 'full' | 'content' | 'technical';
  assessed_at: string;
  assessed_by: string[];
  notes: string;
  scores: Record<string, number | null>;
  final_score: number | null;
  blocking_errors: string[];
  content_sha256: string;
  source_commit: string;
}
export interface AssessmentHistory { schemaVersion: 1; uid: string; legacy_quality?: TranslationQualityAssessment; assessments: Assessment[] }
export const sha256 = (text: string) => createHash('sha256').update(text).digest('hex');
export const rubricFor = (target: AssessmentTarget) => target === 'summary' ? SUMMARY_RUBRIC : TRANSLATION_RUBRIC;
export function assessmentPath(collection: CollectionCode, uid: string): string {
  return path.join(process.cwd(), 'content/meta/assessments', collection, `${uid}.json`);
}
export function projectTranslationPath(collection: CollectionCode, uid: string): string {
  return path.join(process.cwd(), 'content/translation/vi/project/sutta', collection, `${uid}_translation-vi-project.json`);
}
export function contentDigest(collection: CollectionCode, uid: string, target: AssessmentTarget): string {
  const translation = readFileSync(projectTranslationPath(collection, uid), 'utf8');
  // Summary depends on the translation as well as its own wording.
  return sha256(target === 'summary' ? JSON.stringify([translation, loadMeta(collection, uid)?.summary ?? '']) : translation);
}
export function loadAssessmentHistory(collection: CollectionCode, uid: string): AssessmentHistory {
  const file = assessmentPath(collection, uid);
  return existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : { schemaVersion: 1, uid, assessments: [] };
}
export function assessmentIsCurrent(collection: CollectionCode, uid: string, entry: Assessment): boolean {
  return entry.source_commit === loadLock().commit && entry.content_sha256 === contentDigest(collection, uid, entry.target);
}
export function validateAssessmentHistory(history: AssessmentHistory, collection: CollectionCode, uid: string): string[] {
  const errors: string[] = [];
  if (history.schemaVersion !== 1 || history.uid !== uid || !Array.isArray(history.assessments)) return [`${uid}: invalid assessment history`];
  const legacy = history.legacy_quality;
  if (legacy) {
    const keys = TRANSLATION_RUBRIC.map(([key]) => key);
    const values = keys.map(key => legacy.scores?.[key]);
    if (Object.keys(legacy.scores ?? {}).length !== 10 || values.some(value => typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 10) || typeof legacy.final_score !== 'number' || !Number.isFinite(legacy.final_score) || Math.abs(values.reduce((sum, value) => sum + value, 0) / 10 - legacy.final_score) > 0.005 || !Array.isArray(legacy.blocking_errors)) errors.push(`${uid}: invalid archived legacy quality`);
  }
  const ids = new Set<string>();
  for (const entry of history.assessments) {
    const prefix = `${uid}/${entry.id}`;
    if (!entry.id || ids.has(entry.id)) errors.push(`${prefix}: missing or duplicate assessment id`);
    ids.add(entry.id);
    if (!['translation', 'summary'].includes(entry.target) || !['full', 'content', 'technical'].includes(entry.scope)) { errors.push(`${prefix}: invalid target/scope`); continue; }
    if (entry.target === 'summary' && !['dn', 'mn'].includes(collection)) errors.push(`${prefix}: summaries only belong to DN/MN`);
    if (entry.target === 'summary' && !loadMeta(collection, uid)?.summary?.trim()) errors.push(`${prefix}: summary assessment requires a summary`);
    const date = entry.assessed_at;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date ?? '') || !Number.isFinite(Date.parse(date)) || new Date(date).toISOString().slice(0, 10) !== date) errors.push(`${prefix}: invalid assessment date`);
    if (!Array.isArray(entry.assessed_by) || !entry.assessed_by.length || entry.assessed_by.some(x => typeof x !== 'string' || !x.trim())) errors.push(`${prefix}: assessor required`);
    if (typeof entry.notes !== 'string' || !entry.notes.trim()) errors.push(`${prefix}: notes required`);
    if (!/^[a-f0-9]{64}$/.test(entry.content_sha256 ?? '') || !/^[a-f0-9]{40}$/.test(entry.source_commit ?? '')) errors.push(`${prefix}: content/source fingerprint required`);
    if (!Array.isArray(entry.blocking_errors) || entry.blocking_errors.some(x => typeof x !== 'string' || !x.trim())) errors.push(`${prefix}: invalid blockers`);
    const keys = rubricFor(entry.target).map(row => row[0]);
    const scores = entry.scores ?? {};
    if (Object.keys(scores).length !== keys.length || keys.some(key => !(key in scores)) || Object.keys(scores).some(key => !keys.includes(key as never))) errors.push(`${prefix}: wrong rubric criteria`);
    for (const value of Object.values(scores)) if (value !== null && (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 10)) errors.push(`${prefix}: invalid score`);
    if (entry.scope === 'full') {
      if (keys.some(key => typeof scores[key] !== 'number')) errors.push(`${prefix}: full review needs every score`);
      const mean = keys.reduce((sum, key) => sum + (scores[key] ?? 0), 0) / keys.length;
      if (typeof entry.final_score !== 'number' || Math.abs(mean - entry.final_score) > 0.000001) errors.push(`${prefix}: final score must equal raw mean`);
    } else if (entry.scope === 'content') {
      if (entry.target !== 'translation' || entry.final_score !== null || scores.technical_integrity !== null || keys.filter(key => key !== 'technical_integrity').some(key => typeof scores[key] !== 'number')) errors.push(`${prefix}: content review needs nine content scores and pending technical gate`);
    } else {
      if (entry.final_score !== null) errors.push(`${prefix}: technical audit cannot claim an overall score`);
      const allowed = entry.target === 'translation' ? ['segment_alignment'] : ['technical_integrity'];
      if (keys.some(key => !allowed.includes(key) && scores[key] !== null)) errors.push(`${prefix}: technical audit cannot score semantic criteria`);
    }
  }
  return errors;
}
