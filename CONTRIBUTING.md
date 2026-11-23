# Contributing

## Get started

1. Fork and clone the repository.
2. Install Node.js 20.19 or later and run `npm ci`.
3. Run `npm run dev` and open [the learner preview](http://127.0.0.1:4173/).
4. Create a branch for your change.

See [Edit in Studio](README.md#edit-in-studio) to edit the course in your browser. See [Add content](README.md#add-content) for the Markdown format and CLI import. Read [AGENTS.md](AGENTS.md) for the project guidelines.

## Make a change

- Keep lesson IDs and the order of published steps stable. Readers use both in direct links.
- Write original text and diagrams. Check facts and state assumptions. Check permissions before you use external content.
- Use short examples and legible diagrams. Add alternative text to each diagram.
- Update the README and affected tests when a command or behavior changes. Edit the source files. Course Board generates `dist/` from them.

## Check and submit

Run `npm run lint`, `npm test`, and `npm run build`. Run `npm run coverage` to check test coverage. For a visible change, check the result in the learner preview with the keyboard and at wide and narrow screen sizes.

Open a pull request with the problem, the change, and the checks you ran. Include screenshots for visible changes. CI checks pull requests, and the Pages workflow deploys pushes to `main`.
