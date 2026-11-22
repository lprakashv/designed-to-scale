import rough from 'roughjs';
import { arrowLabels, arrowRoutes, boardPositions, boxWidth, boxHeight } from './diagram-layout.js';

export const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);

const pen = rough.generator();
export function diagramState(lesson, step) {
  const introduced = new Map();
  lesson.sections.slice(0, step + 1).forEach((section, index) => {
    const references = [
      ...section.active,
      ...(section.links ?? []).flatMap(([from, to]) => [from, to]),
      ...section.callouts.map(([node]) => node),
    ];
    for (const node of references) {
      if (!introduced.has(node)) introduced.set(node, index);
    }
  });
  return introduced;
}

function draw(stroke, className) {
  return pen.toPaths(stroke).map(({ d }) => `<path class="${className}" d="${d}"/>`).join('');
}

function arrow(points, index, count, animated) {
  const path = `M${points.map(point => point.join(' ')).join(' L')}`;
  const [before, tip] = points.slice(-2);
  const angle = Math.atan2(tip[1] - before[1], tip[0] - before[0]);
  const wing = bend => [tip[0] - 11 * Math.cos(angle + bend), tip[1] - 11 * Math.sin(angle + bend)];
  const lineOptions = { seed: index + 1, roughness: .7, strokeWidth: 2, preserveVertices: true };
  const drawn = draw(pen.linearPath(points, lineOptions), 'arrow-ink')
    + draw(pen.linearPath([wing(-.52), tip, wing(.52)], lineOptions), 'arrow-ink');
  const duration = Math.min(5, count * .8 + .9);
  const slot = (duration - .35) / count;
  const begin = (.15 + index * slot) / duration;
  const end = (.15 + (index + .9) * slot) / duration;
  const packet = animated ? `<circle class="packet" r="5" opacity="0"><animate attributeName="opacity" dur="${duration}s" calcMode="discrete" values="0;1;0;0" keyTimes="0;${begin};${end};1"/><animateMotion path="${path}" dur="${duration}s" calcMode="linear" keyPoints="0;0;1;1" keyTimes="0;${begin};${end};1"/></circle>` : '';
  return { drawn: `<path class="arrow-halo" d="${path}"/>${drawn}`, packet };
}

export function diagram(lesson, step, { animated = true } = {}) {
  const section = lesson.sections[step];
  const introduced = diagramState(lesson, step);
  const positions = boardPositions(lesson, introduced.keys());
  const { points, width, height } = positions;
  const links = section.links ?? [];
  const routes = arrowRoutes(points, introduced.keys(), links);
  const arrows = routes.map((path, index) => arrow(path, index, links.length, animated));
  const labels = arrowLabels(routes, links, positions, introduced.keys()).map(({ rect, textWidth }, i) => {
    const [x, y, w, h] = rect;
    return `<g class="arrow-label"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="4"/><text x="${x + w / 2}" y="${y + 15.5}" text-anchor="middle" textLength="${textWidth}" lengthAdjust="spacingAndGlyphs">${escapeHtml(links[i][2])}</text></g>`;
  }).join('');
  const callouts = new Map(section.callouts);
  const ordered = [...introduced].sort(([a], [b]) => a - b);
  const nodes = ordered.map(([index, firstStep]) => {
    const [name, caption] = lesson.nodes[index];
    const [x, y] = points[index];
    const active = section.active.includes(index);
    const added = step > 0 && firstStep === step;
    const note = callouts.get(index);
    const left = x - boxWidth / 2;
    const top = y - boxHeight / 2;
    const outline = draw(pen.rectangle(left, top, boxWidth, boxHeight, { seed: index + 1, roughness: .95, strokeWidth: 2 }), 'node-stroke');
    return `<g class="board-node${active ? ' is-active' : ''}${added ? ' is-new' : ''}" data-node="${index}">
      <rect class="node-paper" x="${left}" y="${top}" width="${boxWidth}" height="${boxHeight}"/>${outline}
      <foreignObject x="${left + 8}" y="${top + 7}" width="${boxWidth - 16}" height="${boxHeight - 14}">
        <div xmlns="http://www.w3.org/1999/xhtml" class="node-copy">
          <div class="node-name">${escapeHtml(name)}</div><div class="node-caption">${escapeHtml(caption)}</div>
          ${note ? `<div class="node-note">${escapeHtml(note)}</div>` : ''}
        </div>
      </foreignObject>
      ${animated && added ? '<animate attributeName="opacity" from=".15" to="1" dur=".24s"/>' : ''}
      ${added ? `<g class="node-added" transform="translate(${left + 12} ${top - 8})"><rect width="58" height="18" y="-3" rx="3"/><text x="29" y="10" text-anchor="middle">Added</text></g>` : ''}
    </g>`;
  }).join('');
  const descriptions = ordered.map(([index, firstStep]) => {
    const [name, caption] = lesson.nodes[index];
    const added = step > 0 && firstStep === step;
    return `${name}${added ? ' (added)' : ''}${section.active.includes(index) ? ' (in focus)' : ' (context)'}: ${caption}.${callouts.has(index) ? ` ${callouts.get(index)}.` : ''}`;
  }).join(' ');
  const flow = links.map(([from, to, label]) => `${lesson.nodes[from][0]} to ${lesson.nodes[to][0]}: ${label}.`).join(' ');
  const accessible = flow ? `${descriptions} Flow: ${flow}` : descriptions;
  return `<svg viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img" aria-label="${escapeHtml(accessible)}"><g aria-hidden="true">${arrows.map(item => item.drawn).join('')}${nodes}${arrows.map(item => item.packet).join('')}${labels}</g></svg>`;
}
