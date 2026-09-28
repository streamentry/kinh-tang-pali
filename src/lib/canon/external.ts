/**
 * Whole-text external references — things to consult, not layers to compose.
 *
 * The distinction this module exists to hold: a store layer supplies prose at *segment*
 * granularity, and the reader, the coverage metric and the `…pe…` ellipsis all assume it. A
 * whole page of continuous prose aligned to nothing is not that. Declaring one as a layer
 * would look tidy and would quietly corrupt two things at once — coverage would rise for
 * text that is not segment-comparable, and the comparison view would show columns that do
 * not line up, with nothing a reader could detect.
 *
 * So these are recorded with enough provenance to credit properly and explicitly not enough
 * to imply an alignment nobody demonstrated. `tests/unit/external-reference.test.ts` enforces
 * both directions: a whole-text reference may not enter the store, and a store layer may not
 * be declared here.
 */
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';

const ROOT = process.cwd();

export interface ReferenceAttribution {
  translator: string;
  /** Who revised the text, when they were not the translator. Recorded separately. */
  reviser?: string;
  /** Why the reviser is named, in the source's own terms. */
  reviserBasis?: string;
  distributor: string;
  /**
   * Whether the distributor is also the original publisher.
   *
   * `false` matters: it is the difference between "this is the edition" and "this is
   * someone's copy of the edition", and a reader relying on the text is owed the difference.
   */
  distributorIsPublisher: boolean;
  siteMaintainer?: string;
}

export interface ReferenceLicence {
  spdx: string;
  holder: string;
  basis: string;
  /** Where the terms are stated upstream, or `null` when nothing machine-readable exists. */
  statementFrom: string | null;
  attributionRequired: boolean;
}

export interface ExternalReference {
  id: string;
  kind: 'whole-text-reference';
  title: string;
  purpose: string;
  /** `none` is the only value that means what it says. */
  alignment: 'none';
  attribution: ReferenceAttribution;
  originalPublication: string;
  licence: ReferenceLicence;
  baseUrl: string;
  indexUrl?: string;
  urlTemplate: string;
  urlNumber: string;
  collections: string[];
  mappedRange?: string;
  verified?: {
    method: string;
    checked: number;
    matched: number;
    exceptions?: Array<{ uid: string; page: string; siteTitle: string; expected: string; note: string }>;
  };
  unverifiedCollections?: Array<{ collection: string; reason: string }>;
}

export interface ExternalReferenceManifest {
  schemaVersion: number;
  references: ExternalReference[];
  rules: string[];
}

let cached: ExternalReferenceManifest | null = null;

export function loadExternalReferences(): ExternalReferenceManifest {
  if (cached) return cached;
  const file = path.join(ROOT, 'source/external-references.yaml');
  if (!existsSync(file)) return (cached = { schemaVersion: 1, references: [], rules: [] });
  cached = YAML.parse(readFileSync(file, 'utf8')) as ExternalReferenceManifest;
  return cached;
}

export function externalReferences(): ExternalReference[] {
  return loadExternalReferences().references;
}

export function externalReferenceRules(): string[] {
  return loadExternalReferences().rules;
}

export function referenceById(id: string): ExternalReference {
  const found = externalReferences().find((entry) => entry.id === id);
  if (!found) {
    throw new Error(`Unknown external reference '${id}'. Declared: ${externalReferences().map((r) => r.id).join(', ') || '(none)'}`);
  }
  return found;
}

/** The first two digits of the number, because budsas zero-pads to two. */
function mnemonicNumber(uid: string): string | null {
  const match = uid.match(/^([a-z]+)(\d+)$/);
  return match ? match[2].padStart(2, '0') : null;
}

/**
 * The whole-text page for a uid, or `null` when this reference has no verified mapping for it.
 *
 * `null` rather than a guess. A link to the wrong sutta is worse than no link: a reader who
 * opens "Kinh X" and finds "Kinh Y" has no way to know, and the failure is silent. Returning
 * null is what lets the reader say "chưa đối chiếu ánh xạ" honestly.
 */
export function pageUrlFor(reference: ExternalReference, uid: string): string | null {
  if (!reference.collections.includes(uid.match(/^([a-z]+)/)?.[1] ?? '')) return null;
  const number = mnemonicNumber(uid);
  return number === null ? null : reference.urlTemplate.replace('{N}', number);
}

/**
 * One sentence crediting the text, with the honest caveat attached.
 *
 * Author and reviser both appear, and so does the reason no segment alignment is claimed.
 * A reader who is about to compare this text against a segment must not be able to miss that
 * they cannot.
 */
export function creditForReference(reference: ExternalReference): string {
  const { attribution, licence } = reference;
  const who = attribution.reviser
    ? `${attribution.translator}, hiệu đính ${attribution.reviser}`
    : attribution.translator;
  const kind = attribution.distributorIsPublisher ? 'bản xuất bản' : 'bản sao chép bên thứ ba';
  return `${who} — lấy từ ${attribution.distributor} (${kind}). `
    + `Không theo segment, không dùng để đối chiếu từng câu. `
    + `${licence.spdx}: ${licence.holder}.`;
}

/** The reasons this reference is not a column, for the reader to show rather than hide. */
export function caveatForReference(reference: ExternalReference): string[] {
  const lines = [
    'Văn xuôi liên tục, không chia theo segment của bilara — đối chiếu ở mức câu chứ không ở mức segment.',
  ];
  if (reference.attribution.reviser && reference.attribution.reviserBasis) {
    lines.push(reference.attribution.reviserBasis.trim());
  }
  if (!reference.attribution.distributorIsPublisher) {
    lines.push(`Đây là bản sao của bên thứ ba, không phải bản xuất bản. ${reference.originalPublication}`);
  }
  lines.push(`Không có tuyên bố quyền tác giả máy đọc được: ${reference.licence.spdx}. Không suy ra CC0.`);
  return lines;
}
