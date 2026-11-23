export function setupPaneResize(divider, pane, { width, save }) {
  const grid = divider.parentElement;
  const style = getComputedStyle(grid);
  let drag;

  function limits() {
    const pixels = property => Number.parseFloat(style.getPropertyValue(property));
    return [pixels('--pane-min'), Math.min(pixels('--pane-max'),
      grid.clientWidth - pixels('--divider-width') - pixels('--other-min'))];
  }

  function updateRange() {
    if (!divider.offsetWidth) return;
    const [minimum, maximum] = limits();
    const current = Math.round(pane.getBoundingClientRect().width);
    divider.setAttribute('aria-valuemin', minimum);
    divider.setAttribute('aria-valuemax', maximum);
    divider.setAttribute('aria-valuenow', current);
    divider.setAttribute('aria-valuetext', `${current} pixels`);
  }

  function resize(value) {
    const [minimum, maximum] = limits();
    width = Math.max(minimum, Math.min(Math.round(value), maximum));
    grid.style.setProperty('--pane-width', `${width}px`);
  }

  if (Number.isFinite(width)) grid.style.setProperty('--pane-width', `${width}px`);
  const observer = new ResizeObserver(updateRange);
  observer.observe(grid);
  observer.observe(divider);
  observer.observe(pane);

  divider.addEventListener('pointerdown', event => {
    if (event.button !== 0 || drag) return;
    drag = { id: event.pointerId, start: event.clientX, width: pane.getBoundingClientRect().width };
    divider.setPointerCapture(event.pointerId);
    divider.focus({ preventScroll: true });
    divider.classList.add('is-dragging');
    event.preventDefault();
  });
  divider.addEventListener('pointermove', event => {
    if (drag?.id === event.pointerId) resize(drag.width + event.clientX - drag.start);
  });
  for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) {
    divider.addEventListener(type, event => {
      if (drag?.id !== event.pointerId) return;
      drag = undefined;
      divider.classList.remove('is-dragging');
      if (Number.isFinite(width)) save(width);
    });
  }

  divider.addEventListener('keydown', event => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    const [minimum, maximum] = limits();
    const current = pane.getBoundingClientRect().width;
    const increment = event.shiftKey ? 32 : 12;
    const widths = { ArrowLeft: current - increment, ArrowRight: current + increment, Home: minimum, End: maximum };
    if (!Object.hasOwn(widths, event.key)) return;
    event.preventDefault();
    resize(widths[event.key]);
    save(width);
  });
}
