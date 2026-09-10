export type CollectionCode = 'dn' | 'mn' | 'sn' | 'an' | 'kn';
export type EditorialStatus = 'draft' | 'review' | 'published';

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
