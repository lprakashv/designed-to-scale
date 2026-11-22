# Agent and contributor guide

## Project

This is a static system design course. It uses vanilla browser JavaScript, CSS, Markdown with YAML metadata, Markdown-it, YAML, and Rough.js. Keep changes small and use the existing modules and dependencies. Avoid adding a framework or a dependency for a small task.

## Find the right place

- `content/index.json` sets chapter and lesson order; `content/lessons/*.md` holds the source lessons.
- `scripts/compile.js` parses lessons; `scripts/schema.js` validates their shared contract in Node and the browser.
- `app.js` handles navigation, search, saved preferences, and lesson rendering. `scripts/diagram*.js` handles the board; `scripts/panes.js` handles resizing.
- `scripts/site.js` lists the assets served and copied into `dist/`. Add browser assets there when needed. `scripts/serve.js` serves development and built previews.
- `test/` covers the compiler, contract, diagrams, panes, and viewport. The README authoring example is also a test fixture.

## Constraints

- Keep lesson IDs and existing direct links stable. Step numbers come from heading order. The browser stores the position, theme, and pane widths locally.
- Write original course prose and diagrams. The chapter and lesson structure follows the credited source; do not copy its content or assume its license applies here.
- Preserve keyboard access, semantic labels, reduced-motion behavior, responsive layouts, and safe text rendering. Never put secrets in course content.
- Prefer readable, modular code and plain, concise documentation. Record assumptions in the relevant content. Update parent documentation when behavior changes.
- Do not edit generated `dist/` or `node_modules/`. Preserve third-party license notices. Keep the private LinkedIn draft under `.private-showcase/` out of Git.
- Before changing a shared contract, check its callers, authoring example, tests, and asset list. Add focused tests for behavior changes.

## Verify

Run `npm run lint`, `npm test`, and `npm run build`. Use `npm run coverage` to assess coverage. For interface changes, inspect the affected flow in the browser, including the relevant screen sizes and keyboard behavior. See [CONTRIBUTING.md](CONTRIBUTING.md) for the contribution workflow and [README.md](README.md) for setup and authoring.
