/**
 * The per-sutta "Tóm tắt & diễn giải" section stays inside its editorial contract.
 *
 * Every Trung Bộ and Trường Bộ text the site renders carries a summary section the
 * reader is meant to trust as a bounded, plain-prose orientation: present for each
 * sutta, at most 500 words (the cap the brief for the section set), long enough to be
 * substantive, split into paragraphs the page can render as <p> elements, and free of
 * markup — the summary is shown as plain text, so a stray "-" or "#" line would read
 * as literal punctuation to the reader.
 *
 * A summary silently growing past the cap, or slipping a hard line break into what is
 * rendered as one paragraph, changes what readers see without anyone deciding to. This
 * test is that decision's enforcement.
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { existsSync, readFileSync } from 'node:fs';
import YAML from 'yaml';

const MAX_WORDS = 500;
const MIN_WORDS = 50;
const MIN_PARAGRAPHS = 2;

/** The two collections the summary section is written for. */
const SUITES: Array<{ collection: string; suttas: number }> = [
  { collection: 'dn', suttas: 34 },
  { collection: 'mn', suttas: 152 },
];

function words(text: string): string[] {
  return text.split(/\s+/).filter((word) => word.length > 0);
}

for (const { collection, suttas } of SUITES) {
  for (let n = 1; n <= suttas; n += 1) {
    const uid = `${collection}${n}`;
    const file = `content/meta/sutta/${collection}/${uid}.yaml`;

    test(`${uid}: summary present and within its editorial contract`, () => {
      assert.ok(existsSync(file), `${file} exists`);
      const meta = YAML.parse(readFileSync(file, 'utf8')) as { summary?: unknown };
      assert.ok(
        typeof meta.summary === 'string' && meta.summary.trim().length > 0,
        `${uid}: has a non-empty summary`,
      );
      const summary = String(meta.summary);

      const count = words(summary).length;
      assert.ok(
        count <= MAX_WORDS,
        `${uid}: summary is ${count} words, over the ${MAX_WORDS}-word cap`,
      );
      assert.ok(
        count >= MIN_WORDS,
        `${uid}: summary is ${count} words, under the ${MIN_WORDS}-word floor`,
      );

      const paragraphs = summary
        .split(/\n{2,}/)
        .map((para) => para.trim())
        .filter((para) => para.length > 0);
      assert.ok(
        paragraphs.length >= MIN_PARAGRAPHS,
        `${uid}: summary has at least ${MIN_PARAGRAPHS} paragraphs, got ${paragraphs.length}`,
      );
      for (const para of paragraphs) {
        assert.ok(
          !para.includes('\n'),
          `${uid}: a paragraph contains a hard line break; a paragraph is one line`,
        );
        assert.ok(
          !/^[-*#>|]/.test(para),
          `${uid}: a paragraph starts with a markup marker; the summary renders as plain prose`,
        );
      }
    });
  }
}
