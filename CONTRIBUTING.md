# Contributing

Thanks for helping improve the course. Small, focused changes are easier to review.

## Get started

1. Fork and clone the repository.
2. Install Node.js 20.19 or later and run `npm ci`.
3. Run `npm run dev` and open <http://127.0.0.1:4173>.
4. Create a branch for your change.

See the [README](README.md#add-content) for the lesson format and the [project map](README.md#project-map) for the code structure. Read [AGENTS.md](AGENTS.md) for the conventions that apply to all contributors.

## Make a change

- Keep lesson IDs stable: they are part of the saved position and direct links. Keep step order stable where possible; links use step numbers.
- Write original lesson text and diagrams. Check facts and state assumptions. Do not copy course material or assets without permission.
- Keep examples concise and diagrams legible. Check keyboard navigation, screen reader labels, reduced motion, and both narrow and wide layouts when relevant.
- Update the README or other affected documentation when behavior or commands change. Add or update tests for behavior changes.
- Do not edit `dist/`: the build generates it. Never put secrets in lesson files; the compiled course is public.

## Check and submit

Run `npm run lint`, `npm test`, and `npm run build`. Run `npm run coverage` when assessing test coverage. For a UI change, also check the affected flow in the browser. See the README for the static preview commands.

Open a pull request with the problem, the change, and the checks you ran. Include screenshots for visible changes. CI runs the checks for pull requests; the Pages workflow deploys pushes to `main`.
