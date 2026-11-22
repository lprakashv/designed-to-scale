export const boxWidth = 180;
export const boxHeight = 132;
const dx = boxWidth + 182;
const dy = boxHeight + 92;
const margin = 36;

export function boardPositions(lesson, visible) {
  const columns = Math.min(3, lesson.nodes.length);
  const slots = lesson.layout ?? lesson.nodes.map((_, i) => {
    const row = Math.floor(i / columns);
    const column = i % columns;
    return [row % 2 ? columns - 1 - column : column, row];
  });
  const span = 2 * margin + boxWidth + Math.max(...slots.map(([x]) => x)) * dx;
  const height = 2 * margin + boxHeight + Math.max(...Array.from(visible, i => slots[i][1])) * dy;
  const width = Math.max(1024, span, height + margin);
  const left = margin + (width - span) / 2;
  const points = slots.map(([column, row]) => [left + boxWidth / 2 + column * dx, margin + boxHeight / 2 + row * dy]);
  return { points, width, height };
}

const distance = ([x, y], [u, v]) => Math.hypot(u - x, v - y);
const segments = points => points.slice(0, -1).map((point, i) => [point, points[i + 1]]);
const cross = ([x, y], [u, v]) => x * v - y * u;
const subtract = ([x, y], [u, v]) => [x - u, y - v];
const outside = (x, a, b) => x < Math.min(a, b) || x > Math.max(a, b);

export function pointDistance(point, [a, b]) {
  const delta = subtract(b, a);
  const offset = subtract(point, a);
  const fraction = Math.max(0, Math.min(1, (delta[0] * offset[0] + delta[1] * offset[1]) / distance(a, b) ** 2));
  return distance(point, [a[0] + fraction * delta[0], a[1] + fraction * delta[1]]);
}

// Shared or nearly parallel strokes are harder to follow than a single clean crossing.
export function segmentConflict([a, b], [c, d]) {
  const ab = subtract(b, a);
  const cd = subtract(d, c);
  const ac = subtract(c, a);
  const divisor = cross(ab, cd);
  const length = distance(a, b);
  if (Math.abs(divisor) < length * distance(c, d) * .12) {
    const axis = Math.abs(ab[0]) > Math.abs(ab[1]) ? 0 : 1;
    const overlap = Math.min(Math.max(a[axis], b[axis]), Math.max(c[axis], d[axis]))
      - Math.max(Math.min(a[axis], b[axis]), Math.min(c[axis], d[axis]));
    if (overlap > 10 && ([a, b].some(point => pointDistance(point, [c, d]) < 9)
        || [c, d].some(point => pointDistance(point, [a, b]) < 9))) return 2;
  }
  if (!divisor) return 0;
  const t = cross(ac, cd) / divisor;
  const u = cross(ac, ab) / divisor;
  return t >= 0 && t <= 1 && u >= 0 && u <= 1 ? 1 : 0;
}

export function segmentHitsBox(line, [x, y], padding = 0) {
  return segmentHitsRect(line, [x - boxWidth / 2, y - boxHeight / 2, boxWidth, boxHeight], padding);
}

export function segmentHitsRect([a, b], [x, y, width, height], padding = 0) {
  const left = x - padding;
  const right = x + width + padding;
  const top = y - padding;
  const bottom = y + height + padding;
  if ([a, b].some(([u, v]) => u >= left && u <= right && v >= top && v <= bottom)) return true;
  if (Math.max(a[0], b[0]) < left || Math.min(a[0], b[0]) > right
      || Math.max(a[1], b[1]) < top || Math.min(a[1], b[1]) > bottom) return false;
  const [u, v] = subtract(b, a);
  return (u !== 0 && [left, right].some(x => !outside(x, a[0], b[0])
    && !outside(a[1] + v * (x - a[0]) / u, top, bottom)))
    || (v !== 0 && [top, bottom].some(y => !outside(y, a[1], b[1])
      && !outside(a[0] + u * (y - a[1]) / v, left, right)));
}

function port([x, y], toward, shift) {
  const [u, v] = subtract(toward, [x, y]);
  const length = Math.hypot(u, v);
  const ox = -v * shift / length;
  const oy = u * shift / length;
  const scale = Math.min((boxWidth / 2 + 5 - Math.sign(u) * ox) / Math.abs(u),
    (boxHeight / 2 + 5 - Math.sign(v) * oy) / Math.abs(v));
  return [Math.round(x + ox + u * scale), Math.round(y + oy + v * scale)];
}

function routeCandidates(a, b, boxes, preferredShift) {
  const wrap = [];
  const rails = [new Set(), new Set()];
  for (const [x, y] of boxes) {
    for (const u of [x - boxWidth / 2 - 20, x + boxWidth / 2 + 20]) {
      rails[0].add(u);
      for (const v of [y - boxHeight / 2 - 20, y + boxHeight / 2 + 20]) wrap.push([[u, v]]);
    }
    rails[1].add(y - boxHeight / 2 - 20).add(y + boxHeight / 2 + 20);
  }
  for (const x of rails[0]) wrap.push([[x, a[1]], [x, b[1]]]);
  for (const y of rails[1]) wrap.push([[a[0], y], [b[0], y]]);
  wrap.push([[a[0], b[1]]], [[b[0], a[1]]]);

  const routes = [];
  const seen = new Set();
  for (const waypoints of [[], ...wrap]) {
    if (waypoints.some(point => distance(point, a) <= 1 || distance(point, b) <= 1)) continue;
    for (const shift of [preferredShift, 0, 14, -14, 27, -27, 40, -40]) {
      const start = port(a, waypoints[0] ?? b, shift);
      const end = port(b, waypoints.at(-1) ?? a, -shift);
      const points = [start, ...waypoints, end].filter((point, i, path) => !i || distance(point, path[i - 1]) > 1);
      const lines = segments(points);
      const key = points.join(';');
      if (points.length < 2 || seen.has(key)
          || lines.some(line => boxes.some(box => segmentHitsBox(line, box, box === a || box === b ? 2 : 9)))) continue;
      seen.add(key);
      const length = lines.reduce((total, [p, q]) => total + distance(p, q), 0);
      routes.push({ points, lines, cost: length + (points.length - 2) * 32 + Math.abs(shift - preferredShift) * 1.3 });
    }
  }
  return routes.sort((first, second) => first.cost - second.cost);
}

function conflict(first, second) {
  let cost = 0;
  for (const a of first.lines) for (const b of second.lines) {
    const kind = segmentConflict(a, b);
    cost += kind === 2 ? 10000 : kind * 900;
  }
  return cost;
}

export function arrowRoutes(points, visible, links) {
  const boxes = Array.from(visible, i => points[i]);
  const candidates = links.map(([from, to]) => {
    const reverse = links.some(([a, b]) => a === to && b === from);
    const options = routeCandidates(points[from], points[to], boxes, reverse ? 15 : 0);
    if (!options.length) throw new Error(`No clear diagram route from component ${from} to ${to}`);
    return options;
  });
  const routes = candidates.map(options => options[0]);
  // Revisit congested routes so an early arrow can yield space to a later one.
  for (let pass = 0; pass < 4; pass += 1) {
    let changed = false;
    candidates.forEach((options, i) => {
      const others = routes.filter((_, index) => index !== i);
      const score = candidate => candidate.cost + others.reduce((sum, route) => sum + conflict(candidate, route), 0);
      let best = routes[i];
      let lowest = score(best);
      if (lowest === best.cost && best === options[0]) return;
      for (const option of options) {
        if (option.cost >= lowest) break;
        const value = score(option);
        if (value < lowest) {
          best = option;
          lowest = value;
        }
      }
      if (best !== routes[i]) {
        routes[i] = best;
        changed = true;
      }
    });
    if (!changed) break;
  }
  return routes.map(route => route.points);
}

export function rectsOverlap([x, y, w, h], [u, v, a, b], gap = 0) {
  return x < u + a + gap && u < x + w + gap && y < v + b + gap && v < y + h + gap;
}

function rectDistance(line, [x, y, w, h]) {
  const corners = [[x, y], [x + w, y], [x, y + h], [x + w, y + h]];
  return Math.min(...corners.map(point => pointDistance(point, line)),
    ...line.map(([u, v]) => Math.hypot(Math.max(x - u, u - x - w, 0), Math.max(y - v, v - y - h, 0))));
}

export function arrowLabels(routes, links, positions, visible) {
  const { points, width, height } = positions;
  const boxes = Array.from(visible, i => {
    const [x, y] = points[i];
    return [x - boxWidth / 2, y - boxHeight / 2 - 12, boxWidth, boxHeight + 12];
  });
  const lines = routes.map(segments);
  const strokes = lines.flat();
  const options = links.map(([, , text], index) => {
    const textWidth = Array.from(text).length * 7.8;
    const w = Math.ceil(textWidth) + 12;
    const h = 22;
    const choices = [];
    for (const line of lines[index]) {
      const [[x, y], [u, v]] = line;
      const length = Math.hypot(u - x, v - y);
      const normal = [(y - v) / length, (u - x) / length];
      const directions = [normal.map(value => -value), normal, [0, -1], [0, 1], [-1, 0], [1, 0]];
      for (const fraction of [.5, .34, .66, .2, .8, .1, .9]) {
        const mx = x + (u - x) * fraction;
        const my = y + (v - y) * fraction;
        for (const [i, [nx, ny]] of directions.entries()) {
          for (const gap of [6, 12, 20, 32, 48, 66]) {
            const offset = Math.abs(nx) * w / 2 + Math.abs(ny) * h / 2 + gap;
            const rect = [Math.round(mx + nx * offset - w / 2), Math.round(my + ny * offset - h / 2), w, h];
            if (rect[0] < 5 || rect[1] < 5 || rect[0] + w > width - 5 || rect[1] + h > height - 5
                || boxes.some(box => rectsOverlap(rect, box, 6))
                || strokes.some(stroke => segmentHitsRect(stroke, rect, 4))) continue;
            const clearance = rectDistance(line, rect);
            if (clearance > 25 || lines.some((path, j) => j !== index
              && path.some(other => rectDistance(other, rect) < clearance + 3))) continue;
            choices.push({ rect, textWidth, cost: clearance + Math.abs(fraction - .5) * 28 + i * 2 + 110 / length });
          }
        }
      }
    }
    return choices.sort((a, b) => a.cost - b.cost);
  });

  // Place the labels with the least room first and revisit a choice if it blocks another label.
  const order = options.map((_, i) => i).sort((a, b) => options[a].length - options[b].length);
  const placed = [];
  function place(depth) {
    if (depth === order.length) return true;
    const i = order[depth];
    for (const option of options[i]) {
      if (placed.some(label => rectsOverlap(option.rect, label.rect, 6))) continue;
      placed[i] = option;
      if (place(depth + 1)) return true;
      delete placed[i];
    }
    return false;
  }
  if (!place(0)) throw new Error(`No clear diagram labels for ${links.map(link => link[2]).join(', ')}`);
  return placed;
}
