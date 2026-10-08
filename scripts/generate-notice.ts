/**
 * Generate `NOTICE` — what this project reads, who owns it, and under which terms.
 *
 * The root `LICENSE` is not touched. The code and the translated text are under different
 * licences and both were already declared in the repository; this script reports them, and
 * records what was previously recorded nowhere at all: the terms of the *upstream* material
 * the reader displays. Nothing here decides a legal question.
 *
 * Generated rather than written because a hand-typed attribution list is a copy that rots.
 * The lock is already the home for licence facts, so `NOTICE` is derived from it and
 * `tests/unit/licence-notice.test.ts` re-derives this file and fails if the two differ.
 *
 *   node --import tsx scripts/generate-notice.ts
 *   node --import tsx scripts/generate-notice.ts --check
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { loadLock, type ReferenceEdition, type SourceLock } from '../src/lib/canon/load';
import { supportTools } from '../src/lib/canon/tooling';
import { externalReferences } from '../src/lib/canon/external';

const ROOT = process.cwd();
const RULE = '='.repeat(78);

/** The name to print for an edition, preferring the human-readable one. */
function name(edition: ReferenceEdition): string {
  return edition.translatorName ?? edition.translator;
}

/**
 * One sentence on the terms, written so it cannot be misread.
 *
 * The distinction that matters is between material this project released into the public
 * domain and material it merely reads. Blurring those is the failure mode here, so the
 * third-party line says plainly that the material is *not* covered by our own dedication.
 */
function terms(edition: ReferenceEdition): string[] {
  const { license } = edition;
  if (license.group === 'public-domain') {
    return ['public domain — no copyright subsists.', '  The Pāli text is in the public domain.'];
  }
  if (license.group === 'suttacentral') {
    return [
      `${license.spdx} — SuttaCentral's own work, released to the public domain.`,
      '  Covers the interface, licensing and credits text, not the',
      '  scripture translations, which sit in the third-party group below.',
    ];
  }
  return [
    `Copyright (c) held by ${license.holder}.`,
    '  NOT covered by this project\'s CC0 dedication. Reused here under the terms the',
    '  translator grants, and displayed with attribution as required.',
    `  SPDX: ${license.spdx} — no machine-readable licence field exists upstream at this`,
    '  commit, so the terms are left unasserted rather than guessed.',
  ];
}

function editionBlock(edition: ReferenceEdition): string {
  const { license } = edition;
  const lines = [
    `  ${name(edition)}`,
    `    upstream path   ${edition.path}`,
    `    language        ${edition.language}`,
  ];
  if (edition.kind) lines.push(`    kind            ${edition.kind} (not scripture)`);
  lines.push(
    `    terms           ${terms(edition)[0]}`,
    ...terms(edition).slice(1).map((line) => `    ${line}`),
    `    attribution     ${license.attributionRequired ? 'required, and given' : 'not required'}`,
    `    stated by       ${license.statementFrom}`,
  );
  if (license.sourceRequest) {
    // The lock stores this as a full explanatory sentence, not a bare quotation, so it is
    // printed plainly rather than wrapped in quotes that would misattribute it as a quote.
    lines.push(`    request         ${license.sourceRequest}`);
  }
  if (license.basis) {
    lines.push(`    basis           ${license.basis}`);
  }
  if (edition.note) lines.push(`    role            ${edition.note}`);
  return lines.join('\n');
}

/** Render a `covers` map with a column wide enough for its longest key. */
function coversBlock(covers: Record<string, string>): string {
  const width = Math.max(...Object.keys(covers).map((key) => key.length));
  return Object.entries(covers)
    .map(([dir, what]) => `    ${dir.padEnd(width)}  ${what}`)
    .join('\n');
}

/**
 * Build the notice text from the lock.
 *
 * Pure and exported so the test can compare NOTICE against exactly what this function
 * produces. A test that re-implemented the format would pass while the file rotted, which is
 * the failure it is meant to catch.
 */
export function generateNotice(source: SourceLock = loadLock()): string {
  const references = source.referenceEditions.filter((edition) => edition.kind !== 'credits');
  const credits = source.referenceEditions.find((edition) => edition.kind === 'credits');

  return `${RULE}
NOTICE — sources, copyright, and where each translation comes from
${RULE}

This file is generated. Its sources of truth are source/suttacentral.lock.json and
source/external-references.yaml, and \`npm run license:check\` fails if it disagrees with
either. Edit those, not this file.

Nothing in this repository's own translation is derived from the reference translations
as a copy. They are read for triangulation, and every meaning decision is made against the
Pāli root, which is public domain.


1. PINNED UPSTREAM
------------------

  repository   ${source.repo}
  ref          ${source.ref}
  commit       ${source.commit}
  pinned at    ${source.pinnedAt}

Every file is listed with its git blob hash in source/upstream-manifest.json, so any local
copy can be checked against the commit above rather than trusted. The manifest currently
records ${source.referenceEditions.length} editions.


2. WHAT THIS PROJECT RELEASED
-----------------------------

The code and the translated scripture are under different terms. Both were declared in this
repository before this file existed; they are recorded here so there is one place to look,
and the declarations are checked against each other by the test suite.

  Code — ${source.projectLicense.code.spdx}
    stated by     ${source.projectLicense.code.statedBy}
${coversBlock(source.projectLicense.code.covers)}

  Translated scripture — ${source.projectLicense.content.spdx}
    holder        ${source.projectLicense.content.holder}
${coversBlock(source.projectLicense.content.covers)}

  This dedication covers only the work listed above. It does not extend to the reference
  translations in section 3, which remain the property of their translators.


3. REFERENCE TRANSLATIONS
-------------------------

These are displayed by the site as reference columns. They are not this project's work and
are not relicensed by anything in this repository.

${references.map(editionBlock).join('\n\n')}


4. THE PĀLI ROOT — THE ONLY AUTHORITY
-------------------------------------

  SuttaCentral Mahāsaṅgīti (bilara, ${source.rootEdition})
    terms          Public domain. The Pāli text carries no copyright.
    stated by      translation/vi/site/licensing_translation-vi-site.json#licensing:23

  Where a reference translation and the Pāli disagree, the Pāli decides. This is recorded
  as a rule because it is the rule most easily lost in a multi-layer setup.


5. CREDITS AND LICENSING STATEMENTS
-----------------------------------

${credits ? `  ${name(credits)}
    upstream path   ${credits.path}
    stated by       ${credits.license.statementFrom}

  Pinned because these are the terms the two reference columns above are displayed under.
  They are SuttaCentral's own Vietnamese statements, quoted rather than paraphrased so the
  wording this project is bound by is the wording SuttaCentral actually wrote.

  SuttaCentral's Vietnamese acknowledgements credit, verbatim from the pinned file:

    Tỳ-kheo Indacanda (Nguyệt Thiên)   Dịch thuật tiếng Việt.
    Bình Anson                          Chuẩn bị văn bản cho dịch thuật tiếng Việt.
    Ken Yifer                           Các đoạn kinh Pháp Cú trong Đại Chính tạng.
    Mark Lin                            Cố vấn kinh Pháp Cú bản tiếng Trung và tiếng Phạn.

  What they ask of anyone reusing this material, verbatim:

    "Ghi rõ nguồn gốc xuất xứ."        state the origin.
    "Giữ nguyên tinh thần đạo Phật."   preserve the spirit of the Dharma.

  One detail worth recording, because it explains a gap that otherwise looks like an
  omission: SuttaCentral's volunteer list credits Sister Uppalavanna with a draft
  translation of most of the Nikāyas, "bản dịch sơ bộ của hầu hết các bộ kinh nikaya".
  That draft never entered bilara-data. The Pinned upstream section above is therefore
  short of Vietnamese because of how the translation was distributed, not because this
  repository is missing files — ${source.paths.length > 0 ? 'every file that does exist is synced and hash-checked' : ''}.
` : '  (no credits edition is pinned — this is a configuration error)'}


6. WHOLE-TEXT REFERENCES — consult, not compare
-----------------------------------------------

These are not store layers and supply no text to any version of any text. They are recorded
here because they are where a reader can reach a Vietnamese translation of the whole Pāli
Nikāyas, which the pinned SuttaCentral snapshot does not carry — and because a source that is
consulted still has to be credited and still has to be named as what it is.

${externalReferences().map((reference) => {
  const who = reference.attribution.reviser
    ? `${reference.attribution.translator}, revised by ${reference.attribution.reviser}`
    : reference.attribution.translator;
  return `  ${reference.title}
    author / reviser  ${who}
    taken from        ${reference.attribution.distributor} — ${reference.attribution.distributorIsPublisher ? 'the publisher' : 'a third-party copy, not the publisher'}
    original edition  ${reference.originalPublication.split('. ')[0]}.
    terms             ${reference.licence.spdx}. ${reference.licence.basis}
    attribution       ${reference.licence.attributionRequired ? 'required, and given' : 'not required'}
    covers            ${reference.collections.join(', ')}${reference.mappedRange ? ` (${reference.mappedRange})` : ''}
    alignment         none. ${reference.purpose.split('. ')[0]}.
    verified          ${reference.verified ? (reference.verified.summary ?? `${reference.verified.matched}/${reference.verified.checked} sampled pages matched the Pāli name; the rest are typos in the site's own titles.`) : 'not recorded'}`;
}).join('\n\n')}

  A source with no machine-readable licence is recorded as ${externalReferences()[0]?.licence.spdx ?? 'NOASSERTION'} rather than guessed at. The word "no" in "no segment alignment" is
  load-bearing: these pages are continuous prose, so putting one beside a Pāli segment would
  require choosing which segment a paragraph belongs to, and that choice is an editorial
  decision this repository does not make silently.


7. SUPPORT TOOLING
-------------------

Declared in source/tooling.yaml, which every page reads. AI assistance is a support layer
and is never a source of scripture; the Pāli root remains the sole authority.

${supportTools()
  .map((tool) => {
    const line = `  ${tool.name}${tool.release ? ` · ${tool.release}` : ''}  (${tool.vendor})`;
    return tool.declaredBy === 'user-declared'
      ? `${line}\n      release label declared by the maintainer; not verifiable here`
      : line;
  })
  .join('\n')}

  Credit for a tool is not a claim that it endorses or approves of this translation, and
  not a claim that it bears responsibility for it. The editor is responsible for the text.


${RULE}
Questions about a particular passage's editorial history, including which reference layers
were consulted for it, are answered by its metadata file in content/meta/ and by its own
page on the site, which prints the layers that text was built from.
${RULE}
`;

}

/* Write or verify the file, but only when run as a command. Importing this module for
 * `generateNotice` must not touch the working tree, because the test imports it. */
if (import.meta.url === `file://${process.argv[1]}`) {
  const checkOnly = process.argv.includes('--check');
  const target = path.join(ROOT, 'NOTICE');

  if (checkOnly) {
    const current = existsSync(target) ? readFileSync(target, 'utf8') : '';
    if (current !== generateNotice()) {
      console.error('NOTICE does not match its sources: source/suttacentral.lock.json and source/external-references.yaml.');
      console.error('Run: npm run license:generate');
      process.exit(1);
    }
    console.log('NOTICE matches the lock and the declared external references.');
  } else {
    const content = generateNotice();
    writeFileSync(target, content, 'utf8');
    console.log(`wrote NOTICE (${content.length} bytes)`);
  }
}
