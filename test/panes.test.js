import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fitPanes } from '../scripts/panes.js';

const minimums = { nav: 144, reading: 224, board: 480 };

test('keeps the preferred pane widths when the workspace has room', () => {
  assert.deepEqual(fitPanes(1000, { nav: 190, reading: 280 }, minimums), { nav: 190, reading: 280 });
});

test('reserves the reading and diagram minimum widths when the navigation is oversized', () => {
  assert.deepEqual(fitPanes(940, { nav: 450, reading: 450 }, minimums), { nav: 236, reading: 224 });
});

test('clamps the navigation minimum and caps reading to leave room for the diagram', () => {
  assert.deepEqual(fitPanes(940, { nav: 90, reading: 450 }, minimums), { nav: 144, reading: 316 });
});
