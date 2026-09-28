/**
 * Support tooling stays declared, and the declaration stays true.
 *
 * This exists because naming a tool in prose rots. Three surfaces used to name AI
 * assistance by hand — the home page, the site footer, and the English fill scorecards —
 * and they had already drifted: 561 text metadata files recorded ChatGPT, the newest fill
 * files recorded OpenCode, and the site named only ChatGPT. Nothing caught it, because
 * nothing compared them.
 *
 * Two directions are checked, and both matter:
 *
 *   1. Any tool named in `content/meta` must be declared in `source/tooling.yaml`, so a new
 *      tool cannot be used without appearing in the credits.
 *   2. Any tool declared must be credited somewhere, so the declaration cannot decay into a
 *      list nobody reads.
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { creditLabel, loadTooling, supportTools, toolById, toolingRules } from '../../src/lib/canon/tooling';

const TOOLING_FILE = 'source/tooling.yaml';
const COLLECTIONS = ['dn', 'mn', 'sn', 'an', 'kn'];

/**
 * Every YAML file under content/meta, plus any directory entry that cannot be read.
 *
 * The unreadable list is not defensive padding. This volume has a recurring APFS defect
 * where `readdir` lists an entry that no read can open; a walk that simply reads everything
 * dies with `ENOENT` and takes the whole suite with it. Counting the ghosts instead turns
 * an unexplained crash into a named, actionable failure.
 */
function metaFiles(): {
  files: Array<{ file: string; text: string }>;
  ghosts: string[];
  /** Leftovers of the APFS orphan churn, which are volume debris rather than repository content. */
  debris: string[];
} {
  const files: Array<{ file: string; text: string }> = [];
  const ghosts: string[] = [];
  const debris: string[] = [];
  const walk = (dir: string): void => {
    let entries: Array<{ name: string; isDirectory(): boolean; isFile(): boolean }>;
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      (dir.includes('.apfs-orphan') ? debris : ghosts).push(dir);
      return;
    }
    for (const entry of entries) {
      const full = `${dir}/${entry.name}`;
      // `*.apfs-orphan*` directories are the 2026-09-27 volume damage, already excluded
      // from git and reported by `npm run doctor`. They are not repository content, so
      // failing on them would be failing on the machine rather than on the work.
      if (entry.name.includes('.apfs-orphan')) {
        debris.push(full);
        continue;
      }
      if (entry.isDirectory()) {
        walk(full);
        continue;
      }
      if (!entry.name.endsWith('.yaml')) continue;
      try {
        files.push({ file: full, text: readFileSync(full, 'utf8') });
      } catch {
        ghosts.push(full);
      }
    }
  };
  walk('content/meta');
  return { files, ghosts, debris };
}

const tools = supportTools();
const scanned = metaFiles();
const meta = scanned.files;

test('the metadata tree is fully readable', () => {
  // Not a formality: an APFS ghost entry under content/meta makes every walk over it die,
  // which is how a volume defect once took out a whole test file. `npm run doctor` names the
  // damage and explains that `rm` fails where a rename succeeds.
  assert.deepEqual(
    scanned.ghosts,
    [],
    `unreadable entries under content/meta: ${scanned.ghosts.join(', ')} — run npm run doctor`,
  );
  // The orphan debris is expected on this volume until `fsck_apfs` runs, and is reported by
  // the doctor rather than failing here. It is stated so that its absence is also a fact.
  if (scanned.debris.length > 0) {
    console.log(`  note: ${scanned.debris.length} APFS orphan leftover(s) under content/meta, `
      + 'excluded from this walk; npm run doctor reports them');
  }
});

test('the tooling manifest is well formed', () => {
  assert.ok(existsSync(TOOLING_FILE), `${TOOLING_FILE} exists`);
  assert.equal(loadTooling().schemaVersion, 1);
  assert.ok(tools.length > 0, 'at least one support tool is declared');
  const ids = tools.map((tool) => tool.id);
  assert.equal(new Set(ids).size, ids.length, 'tool ids are unique');
  for (const tool of tools) {
    assert.ok(tool.name, `${tool.id}: has a name`);
    assert.ok(tool.vendor, `${tool.id}: names its vendor`);
    assert.ok(tool.usedFor.length > 0, `${tool.id}: says what it was used for`);
    assert.ok(tool.standing, `${tool.id}: states its standing`);
    assert.ok(
      ['repository', 'user-declared'].includes(tool.declaredBy),
      `${tool.id}: declaredBy must be repository or user-declared`,
    );
    // A tool whose release is named must say who vouched for the name. A version string the
    // repository cannot check is still worth printing, but not worth asserting as verified.
    if (tool.release) {
      assert.equal(
        tool.declaredBy,
        'user-declared',
        `${tool.id}: a release label the build cannot verify must be marked user-declared`,
      );
    }
  }
});

test('every AI tool named in content/meta is declared', () => {
  // The direction that stops an uncredited tool entering the corpus. Attribution lines come
  // in two shapes — `"ChatGPT (OpenAI), hỗ trợ biên dịch và QA"` and
  // `"OpenCode Space Bunny Free (agent)"` — so a line counts as declared when it names a
  // declared tool's name *or* its vendor, case-insensitively.
  const tokens = tools.flatMap((tool) =>
    [tool.name, tool.vendor, tool.aliasInMetadata]
      .filter((value): value is string => Boolean(value))
      .map((value) => value.toLowerCase()),
  );
  const undeclared = new Map<string, string[]>();
  for (const { file, text } of meta) {
    for (const line of text.split('\n')) {
      // Only attribution lines: a YAML list entry naming a tool.
      if (!/^\s*-\s/.test(line)) continue;
      if (!/chatgpt|openai|opencode|space bunny|claude|gemini|gpt-?\d/i.test(line)) continue;
      const known = tokens.some((token) => line.toLowerCase().includes(token));
      if (known) continue;
      const key = line.trim().slice(0, 60);
      if (!undeclared.has(key)) undeclared.set(key, []);
      undeclared.get(key)!.push(file);
    }
  }
  const offending = [...undeclared.entries()].map(([line, files]) => `${line}  (e.g. ${files[0]})`);
  assert.deepEqual(
    offending,
    [],
    'a tool named in content/meta must be declared in source/tooling.yaml',
  );
});

test('every declared tool is credited on the site', () => {
  // The other direction: a declaration nobody renders is a lie of omission. Each tool's
  // name must appear on at least one surface.
  const surfaces = ['src/pages/index.astro', 'src/layouts/Base.astro', 'src/pages/credits.astro']
    .map((file) => ({ file, text: existsSync(file) ? readFileSync(file, 'utf8') : '' }));
  for (const tool of tools) {
    const credited = surfaces.some((surface) =>
      surface.text.includes(tool.id) ||
      surface.text.includes('supportTools') ||
      surface.text.includes(tool.vendor),
    );
    assert.ok(credited, `${tool.id} (${tool.vendor}) is credited on a page`);
  }
});

test('no page names an AI tool in hand-written markup', () => {
  // The rule that would have prevented the drift. A tool name may appear in a page only if
  // it comes from the declaration; typing one into markup is what made the three surfaces
  // disagree.
  const allowed = new Set([...tools.map((t) => t.vendor), ...tools.map((t) => t.name)]);
  for (const file of ['src/pages/index.astro', 'src/layouts/Base.astro', 'src/pages/credits.astro', 'src/components/SuttaReader.astro']) {
    if (!existsSync(file)) continue;
    const text = readFileSync(file, 'utf8');
    for (const match of text.matchAll(/ChatGPT|OpenAI|OpenCode|Claude|Gemini|GPT-?\d/gi)) {
      // Inside the frontmatter it is the import or the id; inside the body it is a
      // hard-coded name, which is the thing being banned.
      const bodyStart = text.indexOf('---', 3);
      const body = bodyStart >= 0 ? text.slice(bodyStart) : text;
      const at = text.indexOf(match[0]);
      if (at < bodyStart) continue;
      void allowed;
      assert.fail(`${file} names "${match[0]}" in markup; read it from source/tooling.yaml instead`);
    }
  }
});

test('the standing rules are present and say the important thing', () => {
  const rules = toolingRules();
  assert.ok(rules.length >= 3, 'the rules are stated');
  assert.ok(
    rules.some((rule) => /authority/i.test(rule) && /Pāli/i.test(rule)),
    'one rule says Pāli is the only authority',
  );
  assert.ok(
    rules.some((rule) => /trách nhiệm/i.test(rule)),
    'one rule puts responsibility on the editor, not the tool',
  );
});

test('creditLabel prints the release the maintainer gave', () => {
  const bunny = toolById('opencode-space-bunny');
  assert.equal(bunny.release, 'Muse Spark 1.3 Free');
  // The label is printed as given. A credit that reformats the tool's own name is not a
  // credit, so this asserts the exact string a reader will see.
  assert.equal(creditLabel(bunny), 'Space Bunny · Muse Spark 1.3 Free (OpenCode)');
  const chatgpt = toolById('chatgpt');
  assert.equal(chatgpt.release, null);
  assert.equal(creditLabel(chatgpt), 'ChatGPT · OpenAI');
});

test('the sutta metadata that predates this tooling is left as history', () => {
  // 561 text metadata files record ChatGPT because that is what produced them. Rewriting
  // them to name the current tool would be falsifying the record of how each text was made.
  // This test exists to say that is deliberate, so a future agent does not "fix" it.
  const historical = meta.filter(({ file, text }) =>
    /^\s*-\s*"ChatGPT \(OpenAI\)/m.test(text) && file.includes('content/meta/sutta/'),
  );
  assert.ok(historical.length > 0, 'the historical ChatGPT attribution is still on record');
  for (const { file } of historical) {
    assert.ok(
      !/Space Bunny|OpenCode/.test(readFileSync(file, 'utf8')),
      `${file}: a text made with ChatGPT must not be re-attributed to a later tool`,
    );
  }
});

test('the English fill metadata names the declared tool that wrote it', () => {
  // The fill layer is new work, so its attribution must be current and traceable — a
  // free-text agent name nobody can match to a declared tool is exactly what the other
  // direction of this test exists to catch.
  const bunny = toolById('opencode-space-bunny');
  const alias = bunny.aliasInMetadata ?? bunny.name;
  const fills = meta.filter(({ file }) => file.includes('content/meta/en/'));
  assert.ok(fills.length > 0, 'there is English fill metadata to check');
  for (const { file, text } of fills) {
    assert.match(text, /assessed_by:/, `${file}: records who assessed it`);
    assert.ok(
      text.includes(alias),
      `${file}: the fill was written by "${alias}", which is the declared tooling`,
    );
  }
});

test('the historical attributions are each a declared tool', () => {
  // The counts the site quotes, pinned so that a rewrite of the corpus cannot quietly
  // change what the credits page says happened.
  const tally = new Map<string, number>();
  for (const { text } of meta) {
    for (const line of text.split('\n')) {
      if (!/^\s*-\s/.test(line)) continue;
      if (!/chatgpt|openai|opencode|space bunny|gpt-?[\d.]/i.test(line)) continue;
      const key = line.trim().replace(/^-\s*/, '').replace(/,$/, '').replace(/"/g, '');
      tally.set(key, (tally.get(key) ?? 0) + 1);
    }
  }
  const declared = tools.flatMap((tool) => [tool.name, tool.aliasInMetadata])
    .filter((value): value is string => Boolean(value));
  for (const [line, count] of tally) {
    assert.ok(
      declared.some((name) => line.includes(name)),
      `"${line}" (${count} file(s)) is not a declared tool`,
    );
  }
  // The four tools the corpus actually names, pinned as *floors* rather than exact counts.
  //
  // Growth is legitimate: translating a text adds it to whichever tool did the work, so the
  // count for the current tool rises as the corpus grows, and pinning equality would fail
  // every time real work lands. What must never happen is a count going *down* — that is
  // someone erasing the record of how an existing text was made, which is the failure this
  // test exists to catch. So the invariant is monotonic: counts may rise, never fall.
  //
  // The floor is the count observed when the four-tool inventory was established. A tool
  // dropping below it means historical attribution was rewritten, not that work was undone.
  const FLOORS: Array<[string, number]> = [
    ['ChatGPT (OpenAI), hỗ trợ biên dịch và QA', 561],
    ['GPT-5.6 Sol', 99],
    ['GPT-6 Astra Pro', 4],
    ['OpenCode Space Bunny Free (agent)', 14],
  ];
  for (const [line, floor] of FLOORS) {
    const count = tally.get(line) ?? 0;
    assert.ok(
      count >= floor,
      `${line}: ${count} file(s), below the recorded floor of ${floor} — historical attribution was removed`,
    );
  }
  // And every one of the four must still be present, so a tool cannot quietly vanish from
  // the corpus either.
  for (const [line, floor] of FLOORS) {
    assert.ok((tally.get(line) ?? 0) > 0, `${line} no longer appears anywhere in content/meta`);
  }
});
