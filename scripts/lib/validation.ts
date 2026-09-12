export interface SegmentValidationOptions {
  uid: string;
  sourceIds: Set<string>;
  requireComplete?: boolean;
  /** Canonical Vietnamese text only; comments may quote other writing systems. */
  requireLatinScript?: boolean;
}

export function validateSegmentMap(
  segments: Record<string, unknown>,
  options: SegmentValidationOptions,
): string[] {
  const errors: string[] = [];
  const { uid, sourceIds, requireComplete = false, requireLatinScript = false } = options;
  const seen = new Set<string>();

  for (const [id, value] of Object.entries(segments)) {
    if (seen.has(id)) errors.push(`${uid}: duplicate segment ${id}`);
    seen.add(id);
    if (!id.startsWith(`${uid}:`)) errors.push(`${uid}: segment ${id} has wrong UID prefix`);
    if (!sourceIds.has(id)) errors.push(`${uid}: orphan segment ${id} does not exist in pinned Pāli source`);
    if (typeof value !== 'string') errors.push(`${uid}: segment ${id} must be a string`);
    if (typeof value === 'string' && value !== value.normalize('NFC')) errors.push(`${uid}: segment ${id} is not NFC-normalized`);
    if (typeof value === 'string' && requireLatinScript) {
      // This catches accidental script contamination, not mistranslation or English residue.
      // Pāli names use Latin letters; combining marks and punctuation remain permitted.
      const unexpected = [...new Set([...value].filter(
        (character) => /\p{Letter}/u.test(character) && !/\p{Script=Latin}/u.test(character),
      ))];
      if (unexpected.length > 0) {
        errors.push(`${uid}: segment ${id} contains non-Latin letters: ${unexpected.slice(0, 8).join(' ')}`);
      }
      if (value.includes('\uFFFD')) errors.push(`${uid}: segment ${id} contains a replacement character`);
    }
  }

  if (requireComplete) {
    for (const id of sourceIds) {
      const value = segments[id];
      if (typeof value !== 'string' || value.trim() === '') {
        errors.push(`${uid}: missing translation for ${id}`);
      }
    }
  }

  return errors;
}
