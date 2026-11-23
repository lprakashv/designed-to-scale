# Agent and contributor guide

This repository contains the Designed to Scale course. Course Board imports course bundles, validates and builds the saved source, and provides the learner interface and Studio. Use its existing data formats and CLI.

## Find the source

- `content/course.json` sets the title, theme preset, chapter order, and lesson order.
- `content/lessons/*.md` holds the lesson text, step settings, and diagram references.
- `public/diagrams/` holds the whiteboards. Studio can save Excalidraw scenes and SVG exports here.
- `package-lock.json` pins Course Board. Use the matching Course Board source checkout for Studio.
- `test/` checks the build and compatibility with published links.

## Make changes

- Keep lesson IDs and numbered step links stable. Add stable IDs to new steps when useful.
- Write original text and diagrams. The chapter and lesson structure follows the source credited in the README. Check permissions before you reuse external material.
- Use the Course Board manifest, Markdown, supported diagram types, and theme settings for course changes.
- Preserve keyboard access and check layouts on narrow and wide screens. Add alternative text to every diagram.
- Keep secrets out of lesson files and public assets. Keep `dist/`, `node_modules/`, and the private LinkedIn draft under `.private-showcase/` out of Git. Preserve third-party license notices.
- Record assumptions in the relevant content. Update parent documentation when commands, behavior, or formats change. Use ASD-STE100 style.

## Verify

Run `npm run lint`, `npm test`, and `npm run build`. Run `npm run coverage` to check test coverage. For interface changes, check the affected pages at wide and narrow screen sizes. Check keyboard navigation and a direct step link. See the [README](README.md) and [CONTRIBUTING.md](CONTRIBUTING.md).
