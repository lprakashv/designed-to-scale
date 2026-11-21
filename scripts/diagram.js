export const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);

function kind(label) {
  if (/dns|balancer|router|gateway|limiter/i.test(label)) return 'network';
  if (/browser|client|user|reader|sender|recipient|caller|author/i.test(label)) return 'client';
  if (/database|store|storage|disk|rows|shards|replica/i.test(label)) return 'data';
  if (/queue|broker|event/i.test(label)) return 'queue';
  return 'service';
}

function illustration(type) {
  if (type === 'client') return `<path class="device-side" d="M-43 20v10l43 22 43-22V20L0 40Z"/><path class="device-top" d="M-43 20 0-2l43 22L0 40Z"/><path class="screen-side" d="M-21 9v-46l39-20v46Z"/><path class="screen" d="M-18 5v-38l33-17v38Z"/><path class="screen-detail" d="m-13-30 22-11m-22 17 18-9"/><path class="device-detail" d="m-25 20 19 10m-11-14 19 10m-9-15 19 10"/>`;
  if (type === 'data') return `<path class="data-side" d="M-40-30v51c0 12 18 21 40 21s40-9 40-21v-51Z"/><ellipse class="data-top" cy="-30" rx="40" ry="20"/><path class="device-detail" d="M-40-5c0 12 18 21 40 21S40 7 40-5M-40 10c0 12 18 21 40 21s40-9 40-21"/><ellipse class="data-inner" cy="-30" rx="18" ry="7"/>`;
  if (type === 'queue') return `<path class="block-side" d="M-48-16v48L0 56V8Z"/><path class="block-right" d="M0 8v48l48-24v-48Z"/><path class="block-top" d="M-48-16 0-40l48 24L0 8Z"/><path class="queue-mark" d="m-25 17 15 8m-5-18 15 8m-5-18 15 8"/><path class="queue-mark" d="m12 19 21-10m-21 20 21-10"/>`;
  if (type === 'network') return `<path class="network-side" d="M-47-17v40Q-47 31-38 35L0 55l38-20q9-4 9-12v-40L0 7Z"/><path class="network-top" d="M-43-22-7-41Q0-45 7-41l36 19q8 5 0 10L7 7Q0 11-7 7l-36-19q-8-5 0-10Z"/><path class="network-mark" d="M-13-17h26m-9-7 9 7-9 7m-8-14-9 7 9 7"/>`;
  return `<path class="block-side" d="M-47-20v52L0 56V4Z"/><path class="block-right" d="M0 4v52l47-24v-52Z"/><path class="block-top" d="M-47-20 0-44l47 24L0 4Z"/><path class="server-icon" d="M-12-29h24v8h-24zm0 12h24v8h-24z"/><circle class="server-dot" cx="-7" cy="-25" r="1.5"/><circle class="server-dot" cx="-7" cy="-13" r="1.5"/><path class="device-detail" d="M-5-25h12m-12 12h12"/>`;
}

function scenePositions(lesson, compact) {
  if (compact) {
    const positions = [{ x: 110, y: 65 }, { x: 320, y: 77 }, { x: 110, y: 234 }, { x: 320, y: 246 }];
    return positions.slice(0, lesson.nodes.length);
  }
  // Two backends share a column so their routes visibly split at the balancer.
  if (lesson.id === 'load-balancing' && lesson.nodes.length === 4) {
    return [{ x: 130, y: 200 }, { x: 368, y: 155 }, { x: 630, y: 85 }, { x: 630, y: 246 }];
  }
  const count = lesson.nodes.length;
  const spacing = Math.min(240, 550 / (count - 1));
  return lesson.nodes.map((_, i) => ({
    x: 390 + (i - (count - 1) / 2) * spacing,
    y: i % 2 ? 115 : 198,
  }));
}

function connection(a, b, curved) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  if (dx === 0) {
    // Route vertical links around the component and its label.
    const side = a.x < 215 ? -1 : 1;
    const port = a.x + side * 64;
    return `M${port} ${a.y + 48} Q${port + side * 34} ${(a.y + b.y) / 2 + 48} ${port} ${b.y + 48}`;
  }
  const angle = Math.atan2(dy, dx);
  const insetX = 64 * Math.cos(angle);
  const insetY = 35 * Math.sin(angle);
  const start = [a.x + insetX, a.y + 48 + insetY];
  const end = [b.x - insetX, b.y + 48 - insetY];
  if (!curved) return `M${start.join(' ')} L${end.join(' ')}`;
  const bend = dx > 0 ? 40 : -40;
  return `M${start.join(' ')} Q${(start[0] + end[0]) / 2} ${(start[1] + end[1]) / 2 + bend} ${end.join(' ')}`;
}

export function diagram(lesson, section, { animated = true, compact = false } = {}) {
  const width = compact ? 430 : 780;
  const height = compact && lesson.nodes.length === 2 ? 220 : 400;
  const points = scenePositions(lesson, compact);
  const pairs = section.links ?? [];
  const links = pairs.map(([from, to], i) => {
    const reverse = pairs.some(([otherFrom, otherTo]) => otherFrom === to && otherTo === from);
    const curved = reverse || (Math.abs(from - to) > 1 && lesson.id !== 'load-balancing');
    const path = connection(points[from], points[to], curved);
    const packet = animated ? `<circle class="packet" r="6" visibility="hidden"><set attributeName="visibility" to="visible" begin="0s"/><animateMotion path="${path}" begin="${-(i % 3) * 0.45}s" dur="2.1s" repeatCount="indefinite"/></circle>` : '';
    return `<path class="connection-shadow" d="${path}"/><path class="connection" d="${path}" marker-end="url(#flow-arrow)"/>${packet}`;
  }).join('');
  const nodes = lesson.nodes.map((label, i) => {
    const point = points[i], active = section.active.includes(i), type = kind(label);
    const labelWidth = Math.max(90, Math.min(172, label.length * 9 + 24));
    return `<g class="scene-node ${type} ${active ? 'is-active' : ''}" transform="translate(${point.x} ${point.y})"><ellipse class="node-shadow" cy="74" rx="65" ry="16"/>${active ? '<path class="platform-halo" d="M-73 55 0 18l73 37L0 92Z"/>' : ''}<path class="platform-side" d="M-65 48v9L0 90l65-33v-9L0 81Z"/><path class="platform" d="M-65 48 0 15l65 33L0 81Z"/>${illustration(type)}<g class="node-label" transform="translate(0 106)"><rect x="-${labelWidth / 2}" y="-14" width="${labelWidth}" height="28" rx="14"/><text text-anchor="middle" dominant-baseline="central" textLength="${Math.min(label.length * 9, labelWidth - 18)}" lengthAdjust="spacingAndGlyphs">${escapeHtml(label)}</text></g>${active ? '<circle class="status" cx="49" cy="-37" r="6"/>' : ''}</g>`;
  }).join('');
  const active = section.active.map(i => lesson.nodes[i]).join(', ');
  const connections = pairs.map(([from, to]) => `${lesson.nodes[from]} to ${lesson.nodes[to]}`).join(', ');
  return `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeHtml(`Components: ${lesson.nodes.join(', ')}. Highlighted in this step: ${active}.${connections ? ` Illustrated connections: ${connections}.` : ''}`)}"><defs><marker id="flow-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path class="arrowhead" d="M0 0 8 4 0 8Z"/></marker><pattern id="scene-grid" width="28" height="28" patternUnits="userSpaceOnUse" patternTransform="matrix(1 .5 -1 .5 0 0)"><path d="M28 0H0V28" fill="none" stroke="currentColor" stroke-opacity=".19" stroke-width="1"/></pattern><radialGradient id="scene-fade"><stop offset="20%" stop-color="white"/><stop offset="77%" stop-color="white" stop-opacity="0"/></radialGradient><mask id="scene-mask"><rect width="${width}" height="${height}" fill="url(#scene-fade)"/></mask></defs><rect width="${width}" height="${height}" fill="url(#scene-grid)" mask="url(#scene-mask)"/><g aria-hidden="true">${links}${nodes}</g></svg>`;
}
