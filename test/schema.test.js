import { test } from 'node:test';
import assert from 'node:assert/strict';
import { compileCourse } from '../scripts/compile.js';
import { validateCourse } from '../scripts/schema.js';
const course = await compileCourse();
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

test('step diagrams reject invalid callouts and unlabeled arrows', () => {
  const copy = structuredClone(course);
  const section = copy.chapters[0].lessons[0].sections[0];
  section.callouts = [[99, 'Invalid component']];
  assert.throws(() => validateCourse(copy), /Invalid diagram callouts/);
  section.callouts = [[0, 'Browser cache is empty']];
  section.links = [[0, 1, '']];
  assert.throws(() => validateCourse(copy), /Invalid links/);
});

test('URL shortener progresses through twelve steps to a decision recap', () => {
  const lesson = course.chapters.flatMap(chapter => chapter.lessons).find(item => item.id === 'design-url-shortener');
  assert.equal(lesson.sections.length, 12);
  assert.match(lesson.sections.at(-1).title, /Recap/);
  assert.match(lesson.sections[1].body, /3 TB/);
  assert.ok(lesson.nodes.some(([name]) => name === 'ID allocator'));
  assert.ok(lesson.sections.at(-1).links.some(([, , label]) => label.includes('302')));
});

test('expanded walkthroughs end with a recap and progress on one board', () => {
  const lessons = course.chapters.flatMap(chapter => chapter.lessons);
  for (const id of ['latency-throughput', 'napkin-math', 'hld-lld', 'design-news-feed', 'design-chat']) {
    const lesson = lessons.find(item => item.id === id);
    assert.ok(lesson.sections.length >= 7, id);
    assert.match(lesson.sections.at(-1).title, /Recap/, id);
    assert.ok(lesson.sections.every(section => section.callouts.length && !section.nodes), id);
    assert.notDeepEqual(lesson.sections.at(-1).links, lesson.sections[0].links, id);
  }
});


test('diagram layout requires a distinct position for each component', () => {
  const copy = structuredClone(course);
  const lesson = copy.chapters[0].lessons[0];
  lesson.layout[0] = lesson.layout[1];
  assert.throws(() => validateCourse(copy), /Invalid diagram layout/);
});
