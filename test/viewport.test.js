import { test } from 'node:test';
import assert from 'node:assert/strict';
import { positionView } from '../scripts/diagram-viewport.js';

const bounds = [800, 400];
const center = [.5, .5];
const fit = { x: 0, y: 0, zoom: 1 };

test('zoom preserves the specified point and fit restores the whole board', () => {
  const zoomed = positionView(fit, bounds, 2, [.75, .25]);
  assert.deepEqual(zoomed, { x: 300, y: 50, zoom: 2 });
  assert.deepEqual(positionView(zoomed, bounds, 1, center), fit);
});

test('panning stops at the board edges and zoom stays within the controls’ range', () => {
  const zoomed = { x: 200, y: 100, zoom: 2 };
  assert.deepEqual(positionView(zoomed, bounds, 2, center, [-1, 2]), { x: 400, y: 0, zoom: 2 });
  assert.equal(positionView(zoomed, bounds, 10, center).zoom, 6);
});
