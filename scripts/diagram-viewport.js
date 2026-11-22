const limits = (value, min, max) => Math.max(min, Math.min(max, value));

export function positionView(view, bounds, zoom, from, to = from) {
  const [width, height] = bounds;
  const scale = limits(zoom, 1, 6);
  return {
    zoom: scale,
    x: limits(view.x + width * (from[0] / view.zoom - to[0] / scale), 0, width - width / scale),
    y: limits(view.y + height * (from[1] / view.zoom - to[1] / scale), 0, height - height / scale),
  };
}

export function setupViewport(board, tools, previous = { x: 0, y: 0, zoom: 1 }) {
  const svg = board.querySelector('svg');
  const { width, height } = svg.viewBox.baseVal;
  const bounds = [width, height];
  const out = tools.querySelector('#zoom-out');
  const into = tools.querySelector('#zoom-in');
  const fit = tools.querySelector('#zoom-fit');
  const level = tools.querySelector('#zoom-level');
  const contacts = new Map();
  let view = previous;

  function paint(zoom, from = [.5, .5], to = from) {
    view = positionView(view, bounds, zoom, from, to);
    svg.setAttribute('viewBox', `${view.x} ${view.y} ${width / view.zoom} ${height / view.zoom}`);
    board.classList.toggle('zoomed', view.zoom > 1);
    board.classList.toggle('panning', view.zoom > 1 && contacts.size > 0);
    level.textContent = `${Math.round(view.zoom * 100)}%`;
    out.disabled = fit.disabled = view.zoom === 1;
    into.disabled = view.zoom === 6;
  }

  const zoomIn = () => paint(view.zoom * 1.5);
  const zoomOut = () => paint(view.zoom / 1.5);
  const reset = () => paint(1);
  out.addEventListener('click', zoomOut);
  into.addEventListener('click', zoomIn);
  fit.addEventListener('click', reset);
  paint(view.zoom);

  const point = event => [event.clientX, event.clientY];
  board.addEventListener('pointerdown', event => {
    if (event.button !== 0 || (view.zoom === 1 && event.pointerType !== 'touch') || contacts.size === 2) return;
    contacts.set(event.pointerId, point(event));
    board.setPointerCapture(event.pointerId);
    board.classList.toggle('panning', view.zoom > 1);
  });
  board.addEventListener('pointermove', event => {
    if (!contacts.has(event.pointerId)) return;
    const before = [...contacts.values()];
    contacts.set(event.pointerId, point(event));
    const after = [...contacts.values()];
    const box = svg.getBoundingClientRect();
    const fraction = ([x, y]) => [(x - box.left) / box.width, (y - box.top) / box.height];
    if (after.length === 1) {
      if (view.zoom > 1) paint(view.zoom, fraction(before[0]), fraction(after[0]));
      return;
    }
    const span = ([a, b]) => Math.hypot(a[0] - b[0], a[1] - b[1]);
    const midpoint = ([a, b]) => fraction([(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]);
    const oldSpan = span(before);
    if (oldSpan > 0) paint(view.zoom * span(after) / oldSpan, midpoint(before), midpoint(after));
  });
  function release(event) {
    contacts.delete(event.pointerId);
    if (!contacts.size) board.classList.remove('panning');
  }
  board.addEventListener('pointerup', release);
  board.addEventListener('pointercancel', release);
  board.addEventListener('lostpointercapture', release);
  board.addEventListener('keydown', event => {
    const pan = { ArrowLeft: [.62, .5], ArrowRight: [.38, .5], ArrowUp: [.5, .62], ArrowDown: [.5, .38] };
    if (event.key === '+' || event.key === '=') zoomIn();
    else if (event.key === '-') zoomOut();
    else if (event.key === '0') reset();
    else if (view.zoom > 1 && Object.hasOwn(pan, event.key)) paint(view.zoom, [.5, .5], pan[event.key]);
    else return;
    event.preventDefault();
  });
  return () => view;
}
