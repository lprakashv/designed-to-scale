export function setupPaneResize(divider, pane, { width, save }) {
  const grid = divider.parentElement;
  const style = getComputedStyle(grid);
  let activeDrag;

  function widthLimits() {
    const pixels = property => Number.parseFloat(style.getPropertyValue(property));
    const minimum = pixels('--pane-min');
    const available = grid.clientWidth - pixels('--divider-width') - pixels('--other-min');
    const maximum = Math.max(minimum, Math.min(pixels('--pane-max'), available));
    return { minimum, maximum };
  }

  function updateRange() {
    if (!divider.offsetWidth) return;
    const { minimum, maximum } = widthLimits();
    const current = Math.round(pane.getBoundingClientRect().width);
    divider.setAttribute('aria-valuemin', minimum);
    divider.setAttribute('aria-valuemax', maximum);
    divider.setAttribute('aria-valuenow', current);
    divider.setAttribute('aria-valuetext', `${current} pixels`);
  }

  function resize(value) {
    const { minimum, maximum } = widthLimits();
    width = Math.max(minimum, Math.min(Math.round(value), maximum));
    grid.style.setProperty('--pane-width', `${width}px`);
  }

  if (Number.isFinite(width)) grid.style.setProperty('--pane-width', `${width}px`);
  const observer = new ResizeObserver(updateRange);
  observer.observe(grid);
  observer.observe(divider);
  observer.observe(pane);

  divider.addEventListener('pointerdown', event => {
    if (event.button !== 0 || activeDrag) return;
    activeDrag = { pointerId: event.pointerId, startX: event.clientX, width: pane.getBoundingClientRect().width };
    divider.setPointerCapture(event.pointerId);
    divider.focus({ preventScroll: true });
    divider.classList.add('is-dragging');
    event.preventDefault();
  });
  divider.addEventListener('pointermove', event => {
    if (activeDrag?.pointerId === event.pointerId) {
      resize(activeDrag.width + event.clientX - activeDrag.startX);
    }
  });
  for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) {
    divider.addEventListener(type, event => {
      if (activeDrag?.pointerId !== event.pointerId) return;
      activeDrag = undefined;
      divider.classList.remove('is-dragging');
      if (Number.isFinite(width)) save(width);
    });
  }

  divider.addEventListener('keydown', event => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    const { minimum, maximum } = widthLimits();
    const current = pane.getBoundingClientRect().width;
    const increment = event.shiftKey ? 32 : 12;
    const widths = { ArrowLeft: current - increment, ArrowRight: current + increment, Home: minimum, End: maximum };
    if (!Object.hasOwn(widths, event.key)) return;
    event.preventDefault();
    resize(widths[event.key]);
    save(width);
  });
}
