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
  /**
   * "Tóm tắt & diễn giải" do dự án biên soạn: văn xuôi thuần, ≤ 500 từ, chỉ diễn đạt
   * điều bài kinh nói. Đây là lớp hỗ trợ đọc, không phải kinh văn — hiển thị thành một
   * mục riêng, tách khỏi các segment canonical ở dưới nó.
   */
  summary?: string;
}

/**
 * Why a reference version is not showing text for a text.
 *
 * These are genuinely different situations and a reader must be able to tell them
 * apart. Collapsing them into "unavailable" would let a local cache state masquerade
 * as a fact about the corpus — the failure mode the coverage audit already found once,
 * when 1,596 texts SuttaCentral simply does not translate looked like a sync problem.
 */
export type LayerAbsenceReason =
  /** The pinned edition publishes this text and we have the file. */
  | 'none'
  /** The pinned edition does not publish this text at all: a limit of the snapshot. */
  | 'not-published-upstream'
  /** The edition publishes it, but the file is not in the local cache yet. */
  | 'not-synced'
  /** The project layer has no data for this text yet. */
  | 'not-started';

export interface CanonSegment {
  id: string;
  pali?: string;
  vi?: string;
  commentVi?: string;
  /** Pinned English reference, Sujato. */
  en?: string;
  /** Thích Minh Châu's Vietnamese, where the pinned snapshot provides it. */
  viCurrent?: string;
  /**
   * Which layer supplied the English actually shown.
   *
   * The reader displays one English column, but it is assembled from two layers:
   * Sujato where it translated, and our own fill where it left a passage blank. Those
   * have different standing — a pinned published translation versus our own draft —
   * so the column records which one it is rather than presenting a blend.
   */
  enFrom?: 'english-sujato' | 'english-project';
  /** Per-version absence, so a blank cell can say why it is blank. */
  absence: {
    en: LayerAbsenceReason;
    viCurrent: LayerAbsenceReason;
    vi: LayerAbsenceReason;
  };
}

/** How one of the four versions stands for a whole text, for the reader's header. */
/**
 * The four display columns, in the order a translator reads them.
 *
 * The ids are the display columns, not store layer ids: one column can be assembled
 * from several layers (`english` is Sujato plus our fill) and one store layer feeds no
 * column at all. The layers that contributed travel with the column as `sourceLayers`.
 */
export type CanonLayerId = 'pali' | 'english' | 'viCurrent' | 'vi';

export interface CanonLayerSummary {
  id: CanonLayerId;
  title: string;
  /** `authority` | `reference` | `project`, straight from the store registry. */
  standing: 'authority' | 'reference' | 'project';
  language: string;
  role: string;
  note?: string;
  reason: LayerAbsenceReason;
  /** Segments carrying words, out of the Pāli segment count. */
  withText: number;
  total: number;
  /** Which layers contributed, where a display column merges more than one layer. */
  sourceLayers: string[];
  /** Editorial status, for the project's own layers. */
  status?: string;
  /**
   * A one-line credit naming the translator, the distributor, the edition path, the pinned
   * commit and the licence the version is displayed under.
   *
   * Undefined when this text has no content from that layer, because a credit names work the
   * page does not contain. The credit is per text, not per site or per layer: the Vietnamese
   * Nikāyas distributed at budsas.org/uni/ are not one translator's work throughout, so an
   * author can never be inferred from a distributor.
   */
  credit?: string;
  /** How this version may be reused, for the credits page and the panel footnote. */
  license?: {
    group: 'public-domain' | 'suttacentral' | 'third-party';
    spdx: string;
    holder: string;
    attributionRequired: boolean;
  };
}

export interface CanonDocument {
  uid: string;
  collection: CollectionCode;
  canonicalOrder: number;
  paliTitle?: string;
  viTitle: string;
  /** Tóm tắt & diễn giải do dự án biên soạn, khi meta có trường `summary`. */
  summary?: string;
  status: EditorialStatus;
  hasProjectData: boolean;
  segments: CanonSegment[];
  /** Pinned bilara commit the authority layer was read at. */
  commit: string;
  /** The four versions, in the order a translator should read them. */
  layers: CanonLayerSummary[];
}

export interface CollectionDefinition {
  code: CollectionCode;
  titlePali: string;
  titleVi: string;
  description: string;
}
