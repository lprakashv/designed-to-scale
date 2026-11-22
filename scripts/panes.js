const clamp = (size, minimum, maximum) => Math.max(minimum, Math.min(size, maximum));

export function fitPanes(available, preferred, minimums) {
  const nav = clamp(preferred.nav, minimums.nav, available - minimums.reading - minimums.board);
  const reading = clamp(preferred.reading, minimums.reading, available - nav - minimums.board);
  return { nav, reading };
}

export function setupPanes(layout, saved, save) {
  const style = getComputedStyle(layout);
  const pixels = name => Number.parseFloat(style.getPropertyValue(name));
  const minimums = { nav: pixels('--nav-min'), reading: pixels('--reading-min'), board: pixels('--board-min') };
  const divider = pixels('--divider');
  const preferred = {
    nav: Number.isFinite(saved?.nav) ? saved.nav : pixels('--nav-default'),
    reading: Number.isFinite(saved?.reading) ? saved.reading : pixels('--reading-default'),
  };
  const adjacent = { nav: 'reading', reading: 'nav' };
  let available = 0;
  let widths;
  let dragging;

  const maximum = key => available - widths[adjacent[key]] - minimums.board;
  function sync() {
    const { paddingLeft, paddingRight } = getComputedStyle(layout);
    available = Math.floor(layout.clientWidth - Number.parseFloat(paddingLeft) - Number.parseFloat(paddingRight) - 2 * divider);
    widths = fitPanes(available, preferred, minimums);
    for (const key of Object.keys(adjacent)) {
      layout.style.setProperty(`--${key}-width`, `${widths[key]}px`);
      const handle = layout.querySelector(`[data-resize="${key}"]`);
      if (!handle) continue;
      handle.setAttribute('aria-valuemin', minimums[key]);
      handle.setAttribute('aria-valuemax', Math.max(minimums[key], maximum(key)));
      handle.setAttribute('aria-valuenow', widths[key]);
      handle.setAttribute('aria-valuetext', `${widths[key]} pixels`);
    }
  }

  function change(key, size) {
    preferred[adjacent[key]] = widths[adjacent[key]];
    preferred[key] = clamp(Math.round(size), minimums[key], maximum(key));
    sync();
  }

  layout.addEventListener('pointerdown', event => {
    const handle = event.target.closest('[data-resize]');
    if (!handle || event.button !== 0 || dragging) return;
    const key = handle.dataset.resize;
    dragging = { id: event.pointerId, key, x: event.clientX, width: widths[key] };
    handle.setPointerCapture(event.pointerId);
    handle.focus({ preventScroll: true });
    layout.classList.add('resizing');
    event.preventDefault();
  });
  layout.addEventListener('pointermove', event => {
    if (dragging?.id === event.pointerId) change(dragging.key, dragging.width + event.clientX - dragging.x);
  });

  function stop(event) {
    if (dragging?.id !== event.pointerId) return;
    dragging = undefined;
    layout.classList.remove('resizing');
    save(preferred);
  }

  layout.addEventListener('pointerup', stop);
  layout.addEventListener('pointercancel', stop);
  layout.addEventListener('lostpointercapture', stop);
  layout.addEventListener('keydown', event => {
    const key = event.target.dataset.resize;
    if (!key) return;
    const amount = event.shiftKey ? 32 : 12;
    const sizes = { ArrowLeft: widths[key] - amount, ArrowRight: widths[key] + amount, Home: minimums[key], End: maximum(key) };
    if (!Object.hasOwn(sizes, event.key)) return;
    event.preventDefault();
    change(key, sizes[event.key]);
    save(preferred);
  });

  new ResizeObserver(entries => {
    if (Math.floor(entries[0].contentRect.width - 2 * divider) !== available) sync();
  }).observe(layout);
  sync();
  return sync;
}
