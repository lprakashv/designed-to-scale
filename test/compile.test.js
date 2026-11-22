import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { parseLesson } from '../scripts/compile.js';
import { validateCourse } from '../scripts/schema.js';

const readme = await readFile(new URL('../README.md', import.meta.url), 'utf8');
const example = readme.match(/^````markdown\n([\s\S]*?)^````$/m)[1];

test('compiles the documented authoring example with its diagram, notes, and state', () => {
  const lesson = parseLesson(example, 'cache-example');
  const [first, second] = lesson.sections;
  assert.doesNotThrow(() => validateCourse({ chapters: [{ title: 'Examples', lessons: [lesson] }] }));
  assert.equal(lesson.id, 'cache-example');
  assert.equal(first.title, 'Read from the cache');
  assert.deepEqual(first.active, [0, 1]);
  assert.deepEqual(first.links, [[0, 1, 'Look up record'], [1, 0, 'Return cached record']]);
  assert.deepEqual(first.callouts, [[1, 'Fresh entry']]);
  assert.deepEqual(first.status, ['Hit']);
  assert.equal(first.note, 'A hit can avoid a database read.');
  assert.equal(first.visualNote, 'The request stops at the cache.');
  assert.match(first.bodyHtml, /<strong>fresh entry<\/strong>/);
  assert.deepEqual(second.status, ['Miss']);
});

test('keeps fenced headings in the step and renders embedded HTML as text', () => {
  const source = example + '\n```text\n## A heading inside code\n```\n\n<div>Example</div>\n';
  const { sections } = parseLesson(source, 'cache-example');
  assert.equal(sections.length, 2);
  assert.match(sections[1].bodyHtml, /## A heading inside code/);
  assert.match(sections[1].bodyHtml, /&lt;div&gt;Example&lt;\/div&gt;/);
});

test('reports invalid step metadata with the source filename and step number', () => {
  const source = example.replace('visualNote:', 'visualnote:');
  assert.throws(() => parseLesson(source, 'cache-example'), /cache-example\.md, step 1: unknown fields visualnote/);
});


test('styles a warning while preserving its visible label', () => {
  const source = example + '\n\n> **Warning.** Do not serve a stale result.\n\n> **Note.** Read the source on a miss.\n';
  const { sections } = parseLesson(source, 'cache-example');
  assert.match(sections[1].bodyHtml, /<blockquote class="warning">\s+<p><strong>Warning\.<\/strong>/);
  assert.match(sections[1].bodyHtml, /<blockquote>\s+<p><strong>Note\.<\/strong>/);
});
