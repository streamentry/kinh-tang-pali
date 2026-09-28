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
