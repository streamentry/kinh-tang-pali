/**
 * Support tooling, declared once in `source/tooling.yaml`.
 *
 * The site used to name AI assistance in hand-written markup in three places, and those
 * places had already drifted apart: 561 text metadata files recorded ChatGPT, the newest
 * English fill files recorded OpenCode, and the home page named only ChatGPT. Prose that
 * names a tool rots the moment a second tool is used, and nothing catches it.
 *
 * So the tools are declared in one reviewable file and every surface reads from it. A test
 * enforces both directions: a tool named anywhere must be declared here, and a tool declared
 * here must actually be credited somewhere — so the list cannot decay into something nobody
 * reads.
 */
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';

const ROOT = process.cwd();

export type ToolStanding = 'assistance';

export interface SupportTool {
  id: string;
  name: string;
  vendor: string;
  /** Release or version label. `null` where the vendor does not publish one to us. */
  release: string | null;
  modelId?: string;
  /**
   * The name this tool carries inside `content/meta`, when it differs from `name`.
   *
   * The corpus and the credits have to agree about who did the work. A tool credited as
   * "Space Bunny" while 14 metadata files say "OpenCode Space Bunny Free (agent)" is the
   * same drift in a smaller place, so the corpus's spelling is declared rather than left
   * implicit.
   */
  aliasInMetadata?: string;
  link?: string;
  usedFor: string[];
  standing: string;
  /**
   * `user-declared` marks a name the repository cannot verify.
   *
   * A model's release name is not something a build can check, and stating it as though the
   * repository confirmed it would be exactly the unfalsifiable claim the project's rules
   * exist to prevent. The site says so where it prints the name.
   */
  declaredBy: 'repository' | 'user-declared';
}

export interface ToolingManifest {
  schemaVersion: number;
  assistance: SupportTool[];
  rules: string[];
}

let cached: ToolingManifest | null = null;

export function loadTooling(): ToolingManifest {
  if (cached) return cached;
  const file = path.join(ROOT, 'source/tooling.yaml');
  if (!existsSync(file)) throw new Error('source/tooling.yaml is missing; support tooling is undeclared');
  cached = YAML.parse(readFileSync(file, 'utf8')) as ToolingManifest;
  return cached;
}

export function supportTools(): SupportTool[] {
  return loadTooling().assistance;
}

export function toolingRules(): string[] {
  return loadTooling().rules;
}

export function toolById(id: string): SupportTool {
  const tool = supportTools().find((entry) => entry.id === id);
  if (!tool) throw new Error(`Unknown support tool '${id}'. Declared: ${supportTools().map((t) => t.id).join(', ')}`);
  return tool;
}

/**
 * A tool's name as it should appear in a credit, with the release where there is one.
 *
 * `Muse Spark 1.3 Free` is the label the maintainer gave, so it is printed as given rather
 * than reformatted — a credit that paraphrases the tool's own name is not a credit.
 */
export function creditLabel(tool: SupportTool): string {
  return tool.release ? `${tool.name} · ${tool.release} (${tool.vendor})` : `${tool.name} · ${tool.vendor}`;
}

/**
 * Tool names grouped by vendor, for a sentence that has to name several at once.
 *
 * The flat form reads badly once there is more than one model from the same provider:
 * "ChatGPT · OpenAI, GPT-5.6 Sol · OpenAI, GPT-6 Astra Pro · OpenAI" says the same thing
 * three times. Here the vendor is said once and the models listed under it.
 */
export function creditGroups(): Array<{ vendor: string; models: string[] }> {
  const byVendor = new Map<string, string[]>();
  for (const tool of supportTools()) {
    const models = byVendor.get(tool.vendor) ?? [];
    models.push(tool.release ? `${tool.name} ${tool.release}` : tool.name);
    byVendor.set(tool.vendor, models);
  }
  return [...byVendor.entries()].map(([vendor, models]) => ({ vendor, models }));
}

/** The same grouping as one line, for the site footer. */
export function creditSummary(): string {
  return creditGroups()
    .map((group) => `${group.vendor} (${group.models.join(', ')})`)
    .join(' · ');
}

/* ------------------------------------------------------------------------- *
 * Which tool is a credit naming?
 *
 * `validate` asks a question that a string comparison answers wrongly: "was the English
 * fill written by whoever wrote the Vietnamese?" It answered by comparing the two `assessed_by`
 * strings for equality. That is true only if both happen to be spelled the same way.
 *
 * They are not. `source/tooling.yaml` declares one tool, `opencode-space-bunny`, with
 * `name: Space Bunny`, `release: Muse Spark 1.3 Free` and
 * `aliasInMetadata: "OpenCode Space Bunny Free (agent)"` — and the corpus credits all three
 * spellings, because they are the same tool under three labels. So a Vietnamese text
 * assessed by `Muse Spark` and an English fill assessed by
 * `OpenCode Space Bunny Free (agent)` were two different authors as far as the check was
 * concerned, and the warning that says "this is not an independent English reading" stayed
 * silent on the majority of the fill layer.
 *
 * Two strings cannot be compared directly, so each is resolved to the tool it names, and
 * the tools are compared. A name that resolves to nothing resolves to nothing — the check
 * then falls back to comparing the strings, which is what it always did.
 * ------------------------------------------------------------------------- */

/** Lowercase, and collapse punctuation to single spaces, so labels compare across spellings. */
function normalise(value: string): string {
  return value.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
}

/**
 * Every form of a tool's name that a credit might use, as normalised substrings.
 *
 * A release label like `Muse Spark 1.3 Free` also has to match a credit that says only
 * `Muse Spark`, so the release is indexed by its prefixes from the start — down to two
 * words, which keeps `Muse` alone from matching everything.
 */
function spellings(tool: SupportTool): string[] {
  const out = new Set<string>();
  const push = (value: string | undefined | null): void => {
    const words = normalise(value ?? '').split(' ').filter(Boolean);
    if (words.length === 0) return;
    for (let take = words.length >= 2 ? 2 : 1; take <= words.length; take += 1) {
      out.add(words.slice(0, take).join(' '));
    }
  };
  push(tool.name);
  push(tool.aliasInMetadata);
  push(tool.release);
  push(tool.modelId);
  return [...out];
}

let spellingsCache: Map<string, string[]> | null = null;

function allSpellings(): Map<string, string[]> {
  if (spellingsCache) return spellingsCache;
  spellingsCache = new Map(supportTools().map((tool) => [tool.id, spellings(tool)]));
  return spellingsCache;
}

/**
 * The id of the tool a credit names, or `null` when it names none of them.
 *
 * A name is matched by containment, because credits carry more than the tool's name: a
 * review is written as `Space Bunny Free (OpenCode) — re-scored 2026-10-04 after an
 * ellipsis-marker audit`, and the tool is named inside it. Containment is also why
 * `GLM-5.3 Flash (ZCode)` resolves to `glm-5-3-flash` while the declaration spells it
 * `GLM 5.3 Flash` — punctuation and spacing differ between the two, not the tool.
 */
export function toolIdentityFor(credit: string): string | null {
  const needle = normalise(credit);
  if (!needle) return null;
  for (const [id, forms] of allSpellings()) {
    if (forms.some((form) => needle.includes(form))) return id;
  }
  return null;
}

/**
 * The credits present in both lists, compared as tools rather than as strings.
 *
 * Returns the original strings from `b` that name a tool `a` also names. A credit naming no
 * declared tool is only shared when the identical string is in both — the old behaviour,
 * kept so that human names and project names still match on equality.
 */
export function sharedCredit(a: readonly string[], b: readonly string[]): string[] {
  const fromA = new Set(a.map((credit) => toolIdentityFor(credit)).filter((id): id is string => id !== null));
  const plainA = new Set(a);
  return b.filter((credit) => {
    const id = toolIdentityFor(credit);
    return id !== null ? fromA.has(id) : plainA.has(credit);
  });
}
