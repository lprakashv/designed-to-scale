import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { validateCourse } from '../scripts/schema.js';
const course = JSON.parse(await readFile(new URL('../content/course.json', import.meta.url)));
test('the course follows its content contract', () => assert.doesNotThrow(() => validateCourse(course)));
test('duplicate lesson IDs are rejected', () => {
  const copy = structuredClone(course);
  copy.chapters[0].lessons[1].id = copy.chapters[0].lessons[0].id;
  assert.throws(() => validateCourse(copy), /duplicate/);
});
test('invalid diagram node references are rejected', () => {
  const copy = structuredClone(course);
  copy.chapters[0].lessons[0].sections[0].active = [99];
  assert.throws(() => validateCourse(copy), /Invalid section/);
});
test('the original lesson flag must be a boolean when present', () => {
  const copy = structuredClone(course);
  copy.chapters[0].lessons[0].original = 'true';
  assert.throws(() => validateCourse(copy), /Invalid original lesson flag/);
});
test('diagram status values must match the lesson labels', () => {
  const copy = structuredClone(course);
  copy.chapters[0].lessons[0].sections[0].status.pop();
  assert.throws(() => validateCourse(copy), /Invalid diagram status/);
});

test('diagram notes must contain text when present', () => {
  const copy = structuredClone(course);
  copy.chapters[0].lessons[0].sections[0].visualNote = ' ';
  assert.throws(() => validateCourse(copy), /Invalid diagram note/);
});
