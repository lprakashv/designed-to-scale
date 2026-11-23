export function escapeHtml(value) {
  const entities = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  return String(value).replace(/[&<>"']/g, character => entities[character]);
}

export function isAssetPath(path) {
  return typeof path === 'string' && path.split('/').every(part =>
    /^[a-zA-Z0-9_-][a-zA-Z0-9_. -]*$/.test(part));
}

export function assetUrl(path, base = './media/') {
  if (!isAssetPath(path)) throw new Error(`Invalid asset path "${path}"`);
  return base + path.split('/').map(encodeURIComponent).join('/');
}

export function renderDiagram(diagram, { assetBase, renderers = {} } = {}) {
  if (!diagram) return '';
  const alt = escapeHtml(diagram.alt);
  const asset = path => assetUrl(path, assetBase);

  switch (diagram.type) {
    case 'ascii':
      return `<pre class="cb-ascii" role="img" aria-label="${alt}">${escapeHtml(diagram.text)}</pre>`;
    case 'image':
    case 'svg':
    case 'excalidraw':
      return `<img class="cb-image" src="${escapeHtml(asset(diagram.src))}" alt="${alt}">`;
    case 'html':
      return `<iframe class="cb-html" src="${escapeHtml(asset(diagram.src))}" title="${alt}" sandbox></iframe>`;
    case 'custom': {
      const render = Object.hasOwn(renderers, diagram.name) && renderers[diagram.name];
      if (typeof render !== 'function') throw new Error(`Missing diagram renderer "${diagram.name}"`);
      const markup = render(diagram, { asset, escapeHtml });
      if (typeof markup !== 'string') throw new Error(`Renderer "${diagram.name}" must return HTML`);
      return markup;
    }
    default:
      throw new Error(`Unknown diagram type "${diagram.type}"`);
  }
}
