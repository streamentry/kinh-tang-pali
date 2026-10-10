import type { CanonDocument } from './types';
export function narrationIssues(doc: CanonDocument): string[] {
  const issues: string[] = [];
  if (doc.status !== 'published') issues.push(`translation status is ${doc.status}`);
  if (!doc.summary?.trim()) issues.push('summary missing');
  const root = doc.layers.find(layer => layer.id === 'pali');
  if (root?.reason !== 'none' || !doc.segments.some(s => s.pali?.trim())) issues.push('pinned Pali source not synced');
  const missing = doc.segments.filter(s => !s.id.split(':')[1].startsWith('0.') && s.pali?.trim() && !s.vi?.trim());
  if (missing.length) issues.push(`canonical Vietnamese missing at ${missing.map(s => s.id).join(', ')}`);
  return issues;
}
