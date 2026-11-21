import { test } from 'node:test';
import assert from 'node:assert/strict';
import { diagram } from '../scripts/diagram.js';
import { validateCourse } from '../scripts/schema.js';

const lesson = { id: 'example', title: 'Example', summary: 'Example', nodes: ['Client', 'Store'], sections: [{ title: 'Read', body: 'Read data.', active: [0, 1], links: [[0, 1]] }] };
test('draws only authored links and escapes labels', () => {
  const svg = diagram({ ...lesson, nodes: ['<Client>', 'Store'] }, lesson.sections[0]);
  assert.match(svg, /&lt;Client&gt;/);
  assert.match(svg, /class="packet"/);
  assert.doesNotMatch(diagram(lesson, { active: [0, 1] }), /class="packet"/);
});
test('rejects invalid links', () => {
  const course = { chapters: [{ title: 'Example', lessons: [structuredClone(lesson)] }] };
  assert.doesNotThrow(() => validateCourse(course));
  course.chapters[0].lessons[0].sections[0].links = [[0, 2]];
  assert.throws(() => validateCourse(course), /Invalid links/);
});

test('keeps directional links when motion is disabled', () => {
  const svg = diagram(lesson, lesson.sections[0], { animated: false, compact: true });
  assert.match(svg, /viewBox="0 0 430 220"/);
  assert.match(svg, /marker-end="url\(#flow-arrow\)"/);
  assert.match(svg, /Client to Store/);
  assert.doesNotMatch(svg, /animateMotion/);
});
