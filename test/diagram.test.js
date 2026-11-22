import { test } from 'node:test';
import assert from 'node:assert/strict';
import { diagram, diagramState } from '../scripts/diagram.js';
import { compileCourse } from '../scripts/compile.js';
import { arrowRoutes, rectsOverlap, segmentConflict, segmentHitsBox, segmentHitsRect, boxWidth, boxHeight } from '../scripts/diagram-layout.js';

const lesson = {
  nodes: [['<Client>', 'Sends requests'], ['API', 'Handles requests'], ['Store', 'Durable data']],
  sections: [
    { active: [0, 1], callouts: [[0, 'Send <one> request']], links: [[0, 1, 'Send request']] },
    { active: [1, 2], callouts: [[2, 'Read the record']], links: [[1, 2, 'Read data']] },
    { active: [2], callouts: [[2, 'Simulate write failure']] },
  ],
};

test('escapes text and draws only the arrows authored for a step', () => {
  const svg = diagram(lesson, 0);
  assert.match(svg, /&lt;Client&gt;/);
  assert.match(svg, /Send &lt;one&gt; request/);
  assert.doesNotMatch(svg, /Durable data/);
  assert.equal(svg.match(/class="packet"/g).length, 1);
  assert.doesNotMatch(svg, /repeatCount="indefinite"/);
  assert.doesNotMatch(diagram(lesson, 2), /class="packet"/);
});

test('keeps earlier components and their positions and marks additions only on their first step', () => {
  const first = diagram(lesson, 0);
  const second = diagram(lesson, 1);
  const shape = /data-node="0">\s*(<rect[^>]+)/;
  assert.equal(first.match(shape)[1], second.match(shape)[1]);
  assert.deepEqual([...diagramState(lesson, 2)], [[0, 0], [1, 0], [2, 1]]);
  assert.match(second, /class="board-node is-active is-new" data-node="2"/);
  assert.doesNotMatch(diagram(lesson, 2), /is-new/);
});

test('keeps directed arrows and their labels when motion is disabled', () => {
  const svg = diagram(lesson, 0, { animated: false });
  assert.match(svg, /class="arrow-ink"/);
  assert.match(svg, /class="arrow-label"/);
  assert.match(svg, /Flow: &lt;Client&gt; to API: Send request/);
  assert.doesNotMatch(svg, /animateMotion|class="packet"/);
});

test('prefers a straight route and bends to clear an intervening component', () => {
  const points = [[126, 102], [382, 102], [638, 102]];
  const link = [[0, 2, 'Direct request']];
  assert.equal(arrowRoutes(points, [0, 2], link)[0].length, 2);
  const [around] = arrowRoutes(points, [0, 1, 2], link);
  assert.equal(around.length, 4);
  assert.ok(around.slice(1).every((point, i) => !segmentHitsBox([around[i], point], points[1])));
});

test('draws every step on a landscape board with clear arrows and labels', async () => {
  const course = await compileCourse();
  for (const { lessons } of course.chapters) {
    for (const lesson of lessons) {
      lesson.sections.forEach((section, step) => {
        const key = `${lesson.id}, step ${step + 1}`;
        const svg = diagram(lesson, step);
        assert.doesNotMatch(svg, /(?:NaN|Infinity)/, key);
        const [, width, height] = svg.match(/viewBox="0 0 (\d+) (\d+)"/).map(Number);
        assert.equal(width, 1024, `Different diagram scale in ${key}`);
        assert.ok(width > height, `Portrait board in ${key}`);
        const routes = [...svg.matchAll(/class="arrow-halo" d="M([^"]+)"/g)].map(([, path]) => {
          const points = path.split(' L').map(point => point.split(' ').map(Number));
          return points.slice(1).map((end, i) => [points[i], end]);
        });
        const boxes = [...svg.matchAll(/class="node-paper" x="([^"]+)" y="([^"]+)"/g)]
          .map(([, x, y]) => [Number(x), Number(y), boxWidth, boxHeight]);
        const labels = [...svg.matchAll(/class="arrow-label"><rect x="([^"]+)" y="([^"]+)" width="([^"]+)" height="([^"]+)"/g)]
          .map(match => match.slice(1).map(Number));
        assert.equal(routes.length, section.links?.length ?? 0, key);
        assert.equal(routes.length, labels.length, key);
        routes.forEach((lines, index) => {
          for (const line of lines) {
            assert.ok(boxes.every(box => !segmentHitsRect(line, box)), `Arrow through a box in ${key}`);
            assert.ok(routes.slice(0, index).flat().every(other => segmentConflict(line, other) === 0), `Arrow conflict in ${key}`);
          }
          const rect = labels[index];
          const [x, y, w, h] = rect;
          assert.ok(x >= 0 && y >= 0 && x + w <= width && y + h <= height, `Clipped label in ${key}`);
          assert.ok(boxes.every(box => !rectsOverlap(rect, box)), `Label on a box in ${key}`);
          assert.ok(labels.slice(0, index).every(other => !rectsOverlap(rect, other)), `Label overlap in ${key}`);
          assert.ok(routes.flat().every(line => !segmentHitsRect(line, rect, 3)), `Label on an arrow in ${key}`);
        });
        assert.equal(svg.match(/class="node-note"/g)?.length ?? 0, section.callouts.length, key);
      });
    }
  }
});
