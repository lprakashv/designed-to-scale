export const courseAsset = 'content/course.json';
export const pageAssets = [
  'index.html', 'styles.css', 'app.js', 'scripts/analytics.js', 'scripts/schema.js', 'scripts/diagram.js', 'scripts/diagram-layout.js', 'scripts/diagram-viewport.js', 'scripts/panes.js',
  'assets/Virgil.woff2', 'assets/Virgil-LICENSE.md',
  'assets/rough.js', 'assets/rough-LICENSE.txt',
];

export function sourceAsset(asset) {
  if (asset === 'assets/rough.js') return 'node_modules/roughjs/bundled/rough.esm.js';
  if (asset === 'assets/rough-LICENSE.txt') return 'node_modules/roughjs/LICENSE';
  return asset;
}
