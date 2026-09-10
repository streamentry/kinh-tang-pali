export type CollectionCode = 'dn' | 'mn' | 'sn' | 'an' | 'kn';
export type EditorialStatus = 'draft' | 'review' | 'published';

export const TRANSLATION_QUALITY_KEYS = [
  'source_provenance',
  'semantic_fidelity',
  'grammar_logic',
  'segment_alignment',
  'terminology',
  'triangulation',
  'vietnamese_clarity',
  'han_viet_balance',
  'ambiguity_integrity',
  'technical_integrity',
] as const;

export type TranslationQualityKey = (typeof TRANSLATION_QUALITY_KEYS)[number];
export type TranslationQualityScores = Record<TranslationQualityKey, number>;

export interface TranslationQualityAssessment {
  scores: TranslationQualityScores;
  final_score: number;
  blocking_errors: string[];
  assessed_at?: string;
  assessed_by?: string[];
}

export interface CatalogText {
  uid: string;
  order: number;
  sourcePath?: string;
}

export interface CanonCatalog {
  collection: CollectionCode;
  titlePali: string;
  titleVi: string;
  texts: CatalogText[];
}

export interface EditorialMeta {
  uid: string;
  status: EditorialStatus;
  translationTitle?: string;
  translators?: string[];
  reviewers?: string[];
  reviewedAt?: string;
  quality?: TranslationQualityAssessment;
  tags?: string[];
}

export interface CanonSegment {
  id: string;
  pali?: string;
  vi?: string;
  commentVi?: string;
}

export interface CanonDocument {
  uid: string;
  collection: CollectionCode;
  canonicalOrder: number;
  paliTitle?: string;
  viTitle: string;
  status: EditorialStatus;
  hasProjectData: boolean;
  segments: CanonSegment[];
}

export interface CollectionDefinition {
  code: CollectionCode;
  titlePali: string;
  titleVi: string;
  description: string;
}
