/** Assessment writer. Recording preserves metadata; explicit --apply selects a full translation review for the quality gate. */
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync, openSync, closeSync, unlinkSync, renameSync } from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';
import { expectedStatusForQuality, validateQualityAssessment } from './lib/quality';
import { randomUUID } from 'node:crypto';
import { COLLECTIONS, loadCatalog, loadLock, loadMeta, loadSegmentMap, segmentMapForUid, sourcePathFor, upstreamFile } from '../src/lib/canon/load';
import { assessmentPath, contentDigest, loadAssessmentHistory, projectTranslationPath, TRANSLATION_RUBRIC, rubricFor, validateAssessmentHistory, assessmentIsCurrent, type Assessment } from '../src/lib/canon/quality';
import type { CollectionCode, EditorialMeta, TranslationQualityAssessment, TranslationQualityScores } from '../src/lib/canon/types';
import { validateSegmentMap } from './lib/validation';

function append(collection: CollectionCode, uid: string, entry: Assessment) {
  const file = assessmentPath(collection, uid);
  mkdirSync(path.dirname(file), { recursive: true });
  const lock = `${file}.lock`;
  const descriptor = openSync(lock, 'wx');
  const temporary = `${file}.${randomUUID()}.tmp`;
  try {
    const history = loadAssessmentHistory(collection, uid);
    let archiveAdded = false;
    const legacy = loadMeta(collection, uid)?.quality;
    if (!history.legacy_quality && legacy) {
      history.legacy_quality = structuredClone(legacy);
      archiveAdded = true;
    }
    // Repeating an unchanged technical audit is idempotent; a new full review is always distinct.
    const repeated = entry.scope === 'technical' && history.assessments.some(old => old.scope === entry.scope && old.target === entry.target && old.assessed_at === entry.assessed_at && old.content_sha256 === entry.content_sha256 && old.source_commit === entry.source_commit && old.notes === entry.notes && JSON.stringify(old.assessed_by) === JSON.stringify(entry.assessed_by) && JSON.stringify(old.scores) === JSON.stringify(entry.scores) && JSON.stringify(old.blocking_errors) === JSON.stringify(entry.blocking_errors));
    if (repeated && !archiveAdded) return;
    if (!repeated) history.assessments.push(entry);
    const errors = validateAssessmentHistory(history, collection, uid);
    if (errors.length) throw new Error(errors.join('\n'));
    writeFileSync(temporary, `${JSON.stringify(history, null, 2)}\n`, { flag: 'wx' });
    renameSync(temporary, file);
  } finally {
    if (existsSync(temporary)) unlinkSync(temporary);
    closeSync(descriptor);
    unlinkSync(lock);
  }
}

const args = process.argv.slice(2);
if (args[0] === '--check') {
  let total = 0;
  const errors: string[] = [];
  for (const { code } of COLLECTIONS) {
    const dir = path.dirname(assessmentPath(code, '_'));
    if (!existsSync(dir)) continue;
    const catalog = new Set(loadCatalog(code).texts.map(item => item.uid));
    for (const name of readdirSync(dir)) {
      if (!name.endsWith('.json')) { errors.push(`${dir}/${name}: unknown history file`); continue; }
      const uid = name.slice(0, -5);
      if (!catalog.has(uid) || !existsSync(projectTranslationPath(code, uid))) errors.push(`${uid}: history without catalog/translation`);
      try {
        const history = loadAssessmentHistory(code, uid);
        errors.push(...validateAssessmentHistory(history, code, uid));
        const official = loadMeta(code, uid)?.quality;
        if (official?.assessment_id) {
          const selected = history.assessments.find(entry => entry.id === official.assessment_id);
          if (!selected || selected.scope !== 'full' || selected.target !== 'translation' || !assessmentIsCurrent(code, uid, selected) || selected.final_score !== official.final_score || TRANSLATION_RUBRIC.some(([key]) => selected.scores[key] !== official.scores[key]) || JSON.stringify(selected.blocking_errors) !== JSON.stringify(official.blocking_errors) || selected.assessed_at !== official.assessed_at || JSON.stringify(selected.assessed_by) !== JSON.stringify(official.assessed_by)) errors.push(`${uid}: official quality does not match its current saved full assessment`);
        }
      } catch (error) { errors.push(`${uid}: ${error}`); }
      total++;
    }
  }
  console.log(`Assessment histories checked: ${total}; errors: ${errors.length}`);
  if (errors.length) { console.error(errors.join('\n')); process.exitCode = 1; }
} else if (args[0] === '--apply' && args[1] && args[2]) {
  const uid = args[1];
  const collection = COLLECTIONS.find(({code}) => loadCatalog(code).texts.some(item => item.uid === uid))?.code;
  if (!collection) throw new Error(`Unknown UID ${uid}`);
  const history = loadAssessmentHistory(collection, uid);
  const historyErrors = validateAssessmentHistory(history, collection, uid);
  if (historyErrors.length) throw new Error(historyErrors.join('\n'));
  const entry = history.assessments.find(item => item.id === args[2]);
  if (!entry || entry.target !== 'translation' || entry.scope !== 'full' || entry.final_score === null) throw new Error('Only a complete translation assessment can drive publication status');
  if (!assessmentIsCurrent(collection, uid, entry)) throw new Error('Assessment content/source is stale; review the current text first');
  const file = path.join(process.cwd(), 'content/meta/sutta', collection, `${uid}.yaml`);
  const original = readFileSync(file, 'utf8');
  const document = YAML.parseDocument(original);
  const meta = document.toJSON() as EditorialMeta;
  if (meta.uid !== uid) throw new Error('Metadata UID mismatch');
  const quality: TranslationQualityAssessment = {
    scores: entry.scores as TranslationQualityScores, final_score: entry.final_score,
    blocking_errors: entry.blocking_errors, assessed_at: entry.assessed_at,
    assessed_by: entry.assessed_by, assessment_id: entry.id,
  };
  const status = expectedStatusForQuality(entry.final_score, entry.blocking_errors);
  const errors = validateQualityAssessment({ ...meta, quality, status });
  if (errors.length) throw new Error(errors.join('\n'));
  // Preserve the factual record of previous assessors when the current scorecard changes.
  const reviewers = [...new Set([...(meta.reviewers ?? []), ...(meta.quality?.assessed_by ?? []), ...entry.assessed_by])];
  document.set('reviewers', reviewers);
  document.set('quality', quality);
  document.set('status', status);
  const temporary = `${file}.${randomUUID()}.tmp`;
  try {
    writeFileSync(temporary, document.toString(), { flag: 'wx' });
    if (readFileSync(file, 'utf8') !== original || !assessmentIsCurrent(collection, uid, entry)) throw new Error('Content/metadata changed during apply; preserved the concurrent edit');
    renameSync(temporary, file);
  } finally { if (existsSync(temporary)) unlinkSync(temporary); }
  console.log(`${uid}: official quality ${entry.final_score.toFixed(2)}; status ${status}; history ${entry.id}`);
} else if (args[0] === '--report') {
  const rows = COLLECTIONS.flatMap(({code}) => loadCatalog(code).texts.filter(item => existsSync(projectTranslationPath(code, item.uid))).map(item => {
    const meta = loadMeta(code, item.uid);
    const history = loadAssessmentHistory(code, item.uid);
    const latest = (target: 'translation' | 'summary', scope: 'full' | 'content' | 'technical') => history.assessments.filter(entry => entry.target === target && entry.scope === scope && assessmentIsCurrent(code, item.uid, entry)).at(-1);
    const full = latest('translation', 'full');
    const content = latest('translation', 'content');
    const technical = latest('translation', 'technical');
    return { collection: code, uid: item.uid, status: meta?.status, legacyScore: (history.legacy_quality ?? meta?.quality)?.final_score ?? null,
      legacyDate: (history.legacy_quality ?? meta?.quality)?.assessed_at ?? null, fullReview: full?.id ?? null, fullReviewBlockers: full?.blocking_errors.length ?? null, contentReview: content?.id ?? null,
      technicalAudit: technical?.id ?? null, alignmentErrors: technical?.blocking_errors.length ?? null,
      summaryPresent: ['mn', 'dn'].includes(code) ? Boolean(meta?.summary) : null,
      summaryFullReview: ['mn', 'dn'].includes(code) ? latest('summary', 'full')?.id ?? null : null,
      summaryTechnicalAudit: ['mn', 'dn'].includes(code) ? latest('summary', 'technical')?.id ?? null : null,
      next: full ? full.blocking_errors.length ? 'resolve-full-review-blockers' : 'full-review-current' : content ? 'resolve-review-notes-and-technical-gate' : 'read-whole-store-and-adversarial-review',
    };
  }));
  console.log(JSON.stringify({ schemaVersion: 1, generated_at: new Date().toISOString(), source_commit: loadLock().commit,
    counts: { translations: rows.length, fullReviewsCurrent: rows.filter(row => row.fullReview).length,
      contentReviewsCurrent: rows.filter(row => row.contentReview).length,
      technicalAuditsCurrent: rows.filter(row => row.technicalAudit).length,
      textsWithAlignmentErrors: rows.filter(row => (row.alignmentErrors ?? 0) > 0).length,
      summariesPresent: rows.filter(row => row.summaryPresent).length }, rows }, null, 2));
} else if (args[0] === '--record'  && args[1] && args[2]) {
  const uid = args[1];
  const collection = COLLECTIONS.find(({ code }) => loadCatalog(code).texts.some(item => item.uid === uid))?.code;
  if (!collection || !existsSync(projectTranslationPath(collection, uid))) throw new Error(`Unknown translation ${uid}`);
  const input = JSON.parse(readFileSync(args[2], 'utf8')) as Assessment;
  const entry = { ...input, id: randomUUID(), content_sha256: contentDigest(collection, uid, input.target), source_commit: loadLock().commit };
  if (entry.scope === 'full') entry.final_score = rubricFor(entry.target).reduce((sum, [key]) => sum + (entry.scores[key] ?? 0), 0) / 10;
  append(collection, uid, entry);
  console.log(`${uid}: saved ${entry.target} assessment ${entry.id}`);
} else if (args[0] === '--audit-all' && /^\d{4}-\d{2}-\d{2}$/.test(args[1] ?? '')) {
  const date = args[1];
  const totals = { translations: 0, summaries: 0, alignmentErrors: 0 };
  for (const { code } of COLLECTIONS) {
    for (const item of loadCatalog(code).texts) {
      const file = projectTranslationPath(code, item.uid);
      if (!existsSync(file)) continue;
      const sourcePath = sourcePathFor(code, item.uid, item.sourcePath);
      if (!sourcePath || !existsSync(upstreamFile(sourcePath))) throw new Error(`${item.uid}: pinned Pāli missing; sync before audit`);
      const source = segmentMapForUid(loadSegmentMap(upstreamFile(sourcePath)), item.uid);
      const translation = JSON.parse(readFileSync(file, 'utf8'));
      const errors = validateSegmentMap(translation, { uid: item.uid, sourceIds: new Set(Object.keys(source)), requireComplete: true, requireLatinScript: true });
      const scores = Object.fromEntries(rubricFor('translation').map(([key]) => [key, key === 'segment_alignment' ? (errors.length ? 0 : 10) : null]));
      append(code, item.uid, {
        id: randomUUID(), target: 'translation', scope: 'technical', assessed_at: date,
        assessed_by: ['Repository segment validator'], scores, final_score: null, blocking_errors: errors,
        notes: `Kiểm tra tự động ${Object.keys(source).length} segment với Pāli trong cache: đủ ID, giá trị, NFC và hệ chữ Latin. Chưa đọc đối chiếu nghĩa, ngữ pháp hoặc văn phong; chưa chấm lại 10 tiêu chí. Đây không phải chứng nhận hash upstream hoặc giấy phép, không xác nhận trạng thái xuất bản.`,
        content_sha256: contentDigest(code, item.uid, 'translation'), source_commit: loadLock().commit,
      });
      const summary = ['mn', 'dn'].includes(code) ? loadMeta(code, item.uid)?.summary : undefined;
      if (summary) {
        const words = summary.trim().split(/\s+/).length;
        const paragraphs = summary.split(/\n{2,}/).map(p => p.trim()).filter(Boolean);
        const problems = [];
        if (words < 50 || words > 500) problems.push(`Tóm tắt ${words} từ, ngoài khoảng 50–500.`);
        if (paragraphs.length < 2 || paragraphs.some(p => p.includes('\n') || /^[-*#>|]/.test(p))) problems.push('Cấu trúc đoạn văn không đạt.');
        if (summary !== summary.normalize('NFC')) problems.push('Tóm tắt chưa chuẩn hóa NFC.');
        append(code, item.uid, {
          id: randomUUID(), target: 'summary', scope: 'technical', assessed_at: date,
          assessed_by: ['Repository summary validator'],
          scores: Object.fromEntries(rubricFor('summary').map(([key]) => [key, key === 'technical_integrity' ? (problems.length ? 0 : 10) : null])),
          final_score: null, blocking_errors: problems,
          notes: `Kiểm tra tự động: ${words} từ, ${paragraphs.length} đoạn, văn xuôi thuần và NFC. Chưa đối chiếu nội dung tóm tắt với toàn bài kinh; chưa chấm độ đúng nghĩa, đủ ý hay văn phong.`,
          content_sha256: contentDigest(code, item.uid, 'summary'), source_commit: loadLock().commit,
        });
        totals.summaries++;
      }
      totals.translations++;
      if (errors.length) totals.alignmentErrors++;
    }
  }
  console.log(JSON.stringify(totals));
} else {
  throw new Error('Use --check | --apply <uid> <assessment-id> | --report | --record <uid> <assessment.json> | --audit-all YYYY-MM-DD');
}
