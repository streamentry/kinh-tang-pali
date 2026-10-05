/**
 * A credit names a *tool*, not a string.
 *
 * `validate` has to answer one question: was the English fill written by whoever wrote the
 * Vietnamese? It answered by comparing the two `assessed_by` strings for equality. That is
 * only ever true when both happen to be spelled the same way, and they are not.
 *
 * `source/tooling.yaml` declares one tool, `opencode-space-bunny`, under four labels:
 * `name: Space Bunny`, `release: Muse Spark 1.3 Free`, `aliasInMetadata:
 * "OpenCode Space Bunny Free (agent)"`, `modelId: space-bunny-free`. The corpus credits all
 * of them — 461 files say `Muse Spark`, 15 say `OpenCode Space Bunny Free (agent) — re-scored
 * …`, 24 say `Space Bunny Free (OpenCode) — re-scored …` — because they are one tool under
 * different labels, not different authors.
 *
 * So the check reported a Vietnamese text assessed by `Muse Spark` and an English fill
 * assessed by `OpenCode Space Bunny Free (agent)` as written by two different people, and
 * the warning that says *"this fill is not an independent English reading"* stayed silent on
 * most of the fill layer. That is the failure `AGENTS.md` warns about by name: two spellings
 * of the same fact that no gate reconciles.
 *
 * The second test closes a gap in the guard itself. `tooling.test.ts` checks that every
 * attribution in `content/meta` names a declared tool — but it finds candidates with a fixed
 * regex over five words (`chatgpt|openai|opencode|space bunny|gpt-?[\d.]`). A tool whose name
 * contains none of them is invisible to it. `deepseek-v4.1-flash`, credited in 283 files, is
 * exactly that: undeclared, and unseeable. It is listed here as the one known instance so
 * that the *next* one fails instead of passing quietly.
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { parse as parseYaml } from 'yaml';
import { sharedCredit, supportTools, toolIdentityFor } from '../../src/lib/canon/tooling';

test('the labels of one declared tool all resolve to that one tool', () => {
  const bunny = toolByIdOrFail('opencode-space-bunny');
  const forms = [
    bunny.name,
    bunny.release ?? '',
    bunny.aliasInMetadata ?? '',
    bunny.modelId ?? '',
  ].filter(Boolean);
  for (const form of forms) {
    assert.equal(toolIdentityFor(form), bunny.id, `"${form}" should resolve to ${bunny.id}`);
  }

  // And the spellings the corpus actually uses, which are not all of them the whole label.
  // These are the strings that broke the exact comparison.
  for (const credit of [
    'Muse Spark',
    'Space Bunny',
    'OpenCode Space Bunny Free (agent)',
    'Muse Spark 1.3 Free (agent)',
    'Space Bunny Free (OpenCode) — re-scored 2026-10-05 after a duplicate-Pāli audit',
  ]) {
    assert.equal(toolIdentityFor(credit), 'opencode-space-bunny', `"${credit}" names the same tool`);
  }

  // Punctuation and spacing differ between the corpus and the declaration, and only the
  // tool matters.
  assert.equal(toolIdentityFor('GLM-5.3 Flash (ZCode)'), 'glm-5-3-flash');
  assert.equal(toolIdentityFor('GLM 5.3 Flash'), 'glm-5-3-flash');
  assert.equal(toolIdentityFor('ChatGPT (OpenAI), hỗ trợ biên dịch và QA'), 'chatgpt');
});

test('a release label is not matched on its version alone', () => {
  // `Muse Spark 1.3 Free` is indexed down to two words so that `Muse Spark` matches, but a
  // bare `Muse` must not: a one-word match would make any credit containing that word look
  // like this tool.
  assert.equal(toolIdentityFor('Muse'), null);
  assert.equal(toolIdentityFor('Free'), null);
  assert.equal(toolIdentityFor('the free translation layer'), null);
});

test('sharedCredit compares tools, so a cross-spelling fill is reported', () => {
  // The bug: these are one author written two ways, and the old exact comparison called
  // them two.
  assert.deepEqual(
    sharedCredit(['Muse Spark'], ['OpenCode Space Bunny Free (agent)']),
    ['OpenCode Space Bunny Free (agent)'],
    'the same tool under two spellings must be shared authorship',
  );
  assert.deepEqual(
    sharedCredit(['Muse Spark', 'Lê Việt Hồng (Cư Sĩ Chánh Niệm)'], ['GLM-5.3 Flash (ZCode)']),
    [],
    'two different tools must not be reported as shared',
  );
  // A credit naming no declared tool still matches on equality, so human names and project
  // names behave as they always did.
  assert.deepEqual(
    sharedCredit(['Kinh Tạng Pāli Project'], ['Kinh Tạng Pāli Project']),
    ['Kinh Tạng Pāli Project'],
  );
  assert.deepEqual(sharedCredit(['Kinh Tạng Pāli Project'], ['Lê Việt Hồng (Cư Sĩ Chánh Niệm)']), []);
});

test('every attribution in content/meta names a declared tool, or is on the list below', () => {
  // Credits that are not tools. These are names of people and of the project itself, plus
  // review notes written in prose — not products, and never to be matched as one.
  const NON_TOOL_EXACT = new Set([
    'Kinh Tạng Pāli Project',
    'Lê Việt Hồng (Cư Sĩ Chánh Niệm)',
  ]);
  const NON_TOOL_PREFIX = ['Adversarial review ', 'Note: '];

  // Credited in the corpus but absent from source/tooling.yaml. Each entry is a pending
  // decision for the maintainer, not an accepted name: the vendor and release cannot be
  // established from the repository, and `tooling.yaml` requires `declaredBy: user-declared`
  // for exactly this case. Listing it keeps the count honest and makes the *next* undeclared
  // tool a test failure rather than another 283 silent files.
  const UNDECLARED = new Set(['deepseek-v4.1-flash']);

  const found = new Map<string, number>();
  for (const file of metaFiles()) {
    let doc: Record<string, unknown>;
    try {
      doc = parseYaml(readFileSync(file, 'utf8')) as Record<string, unknown>;
    } catch {
      continue;
    }
    for (const credit of allCredits(doc)) {
      if (toolIdentityFor(credit) !== null) continue;
      if (NON_TOOL_EXACT.has(credit)) continue;
      if (NON_TOOL_PREFIX.some((prefix) => credit.startsWith(prefix))) continue;
      found.set(credit, (found.get(credit) ?? 0) + 1);
    }
  }

  const undeclared = new Set(found.keys());
  for (const name of UNDECLARED) {
    assert.ok(undeclared.has(name), `${name} is listed as undeclared but no longer appears in content/meta`);
  }
  assert.deepEqual(
    [...undeclared].filter((name) => !UNDECLARED.has(name)),
    [],
    `these attributions name no tool declared in source/tooling.yaml:\n  ${[...undeclared]
      .filter((name) => !UNDECLARED.has(name))
      .map((name) => `${name} (${found.get(name)} file(s))`)
      .join('\n  ')}`,
  );
});

/** Local copy so this test does not depend on `toolById`'s throw-on-unknown behaviour. */
function toolByIdOrFail(id: string) {
  const tool = supportTools().find((entry) => entry.id === id);
  assert.ok(tool, `${id} must be declared in source/tooling.yaml`);
  return tool;
}

function metaFiles(): string[] {
  const root = 'content/meta/sutta';
  if (!existsSync(root)) return [];
  return readdirSync(root).flatMap((collection) =>
    readdirSync(`${root}/${collection}`)
      .filter((file) => file.endsWith('.yaml'))
      .map((file) => `${root}/${collection}/${file}`),
  );
}

/** Every string a metadata file records as a translator, reviewer, or assessor. */
function allCredits(doc: Record<string, unknown>): string[] {
  const out: string[] = [];
  for (const field of ['translators', 'reviewers']) {
    const value = doc?.[field];
    if (Array.isArray(value)) out.push(...value);
  }
  const quality = doc?.quality as Record<string, unknown> | undefined;
  if (quality && Array.isArray(quality.assessed_by)) out.push(...quality.assessed_by);
  return out.filter((credit): credit is string => typeof credit === 'string' && credit.trim() !== '');
}
