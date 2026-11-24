# System Design Study Course

Study system design in 40 lessons across nine chapters. Follow requests through a system, compare ways to store and share data, and design a URL shortener, news feed, and chat service.

**[Open the course](https://www.lprakashv.com/designed-to-scale/)** · [Run locally](#run-locally) · [Edit in Studio](#edit-in-studio) · [Contribute](CONTRIBUTING.md)

![The Course Board learner view for the request lifecycle lesson](showcase/request-lifecycle.jpg)

The chapter names, lesson names, and lesson order follow Dilum Sanjaya’s [Designed to Scale course](https://designed-to-scale.vercel.app/). The lesson text and diagrams are independently written.

## Use the course

Select a lesson on the home page or in the outline. Select **Home** to return to the course index. Use the step links, **Previous**, **Next**, or the arrow keys to move between steps. On a narrow screen, select **Outline** to open the outline.

Use **Find a lesson** to search chapters, lessons, and step titles. Select **Mark complete** at the end of a lesson. Course Board saves the completion status in your browser. Use the display controls to change the theme. On a wide screen, drag the pane dividers or use the arrow keys to resize the panes.

Share a step with a link such as [Find the address](https://www.lprakashv.com/designed-to-scale/#/request-lifecycle/2). The course uses one whiteboard image for each existing step. The diagrams keep the component positions across steps. Green marks a component that first appears in that step. Purple marks a component in focus.

## Run locally

Install Node.js 20.19 or later and npm.

```sh
npm ci
npm run dev
```

Open [the development preview](http://127.0.0.1:4173/). Save a source file and reload the page to build it again. Set `PORT` to use a different port.

The lockfile pins [Course Board v0.3.5, commit `7cc9105`](https://github.com/lprakashv/course-board/commit/7cc91059153fad3950601aca8b69e7b2d52fcfc1).

## Edit in Studio

Use a separate Course Board source checkout at the pinned commit. Install its editor dependencies and pass the path to this course. This example assumes both checkouts have the same parent directory.

```sh
cd ../course-board
npm ci
node src/cli.js author ../designed-to-scale
```

Open [Course Board Studio](http://127.0.0.1:4175/). Edit the outline, lesson text, diagrams, and course settings. Select **Save course** to write the source files. Reload the learner preview to see the saved changes.

The existing whiteboards are SVG attachments. To add an editable whiteboard, open the Excalidraw editor in Studio and apply the board. Studio saves the Excalidraw scene and its SVG export when you save the course. [Course Board authoring guide](https://github.com/lprakashv/course-board/blob/7cc91059153fad3950601aca8b69e7b2d52fcfc1/docs/authoring.md#edit-a-course-in-the-browser).

## Add content

Set the title, description, chapter order, and theme preset in [the course manifest](content/course.json). For an optional theme, put a CSS file under `public/` and set its relative path in the manifest's `theme` field. Use the [Course Board theme properties](https://github.com/lprakashv/course-board/blob/7cc91059153fad3950601aca8b69e7b2d52fcfc1/src/browser/course.css).

Add a Markdown file in `content/lessons/` and list its ID in the chapter that will contain it. Use a top-level `##` heading for each step. Put an optional fenced `step` block just after the heading. A diagram `src` is relative to `public/`.

````markdown
---
title: DNS Lookup
summary: Follow a browser as it finds a server address.
---

## Ask the resolver

```step
diagram:
  type: svg
  alt: The browser asks the resolver for the server address.
  src: diagrams/request-lifecycle/2.svg
```

If the browser has no valid cache entry, it asks a DNS resolver for the server address.
````

Keep lesson IDs and the order of published steps stable to preserve numbered links. For a new step, add an optional `id` in its step block to give it a link that follows the step when it moves.

### Import a course bundle

Use the [Course Board bundle format](https://github.com/lprakashv/course-board/blob/9e76c08de42190571454631d64c8f90572bcc89f/docs/authoring.md#import-a-course-from-the-cli) to supply the complete outline, lessons, and asset mappings. Import into a separate directory to review the result before updating the course.

```sh
npm run ingest -- /path/to/course-bundle.json /path/to/review-course
```

Use `.` as the target to apply the bundle to this checkout. The import replaces the outline and updates the lessons and assets listed in the bundle. Course Board validates the new files before it writes them.

## Build and deploy

```sh
npm run lint
npm test
npm run coverage
npm run build
npm start
```

Open [the production preview](http://127.0.0.1:4174/). The build writes the learner site to `dist/`. Publish that directory to a static host. The Pages workflow builds on pushes to `main` and publishes `dist/` to the `gh-pages` branch.

The Pages build reads the `GOOGLE_TAG_ID` GitHub Actions repository secret. Set it to a GA4 measurement ID to enable Google Analytics. An empty value disables analytics. The published HTML contains the ID. Course Board records the initial page view and views for step link changes. Disable GA4 enhanced measurement for browser history changes if it also records these views.

The integration tests check the course data and the learner build. Run `npm run coverage` in the Course Board source checkout to measure Course Board's code coverage.

## Project map

| Path | Purpose |
| --- | --- |
| `content/course.json` | Course title, theme preset, and outline |
| `content/lessons/` | Lesson text, steps, and diagram references |
| `public/diagrams/` | Whiteboard images |
| `test/` | Course Board integration checks |
| `showcase/` | Course screenshots and recordings |
| `.github/workflows/` | CI and GitHub Pages deployment |

See [CONTRIBUTING.md](CONTRIBUTING.md) and [AGENTS.md](AGENTS.md) for contribution guidelines.

## License

The original work in this repository is available under the [MIT License](LICENSE). See [the Virgil license notice](assets/Virgil-LICENSE.md) for the font in earlier showcase images.
