# Clone of Designed to Scale

A local, editable system design course inspired by [Designed to Scale](https://designed-to-scale.vercel.app/), created by Dilum Sanjaya. It has 40 introductory lessons in nine chapters. Each lesson has short steps and a responsive isometric diagram. Every lesson includes at least one step with animated traffic. Use the timeline, Back and Next, or the arrow keys to move through steps and between lessons. Use Replay or R to restart traffic. Pause or Space freezes traffic until you resume it. Steps without a flow and browsers set to reduce motion show static diagrams. Use / or Ctrl+K (Command+K on Mac) to search. Enter opens the first result and Escape clears the search.

This is an independent implementation. Its lesson text, diagrams, and step counts differ from the original. The original site's Practice and Design Lab features showed “coming soon” during review; this version does not include them. The course is an introduction, not a complete interview preparation syllabus.

## Requirements

Node.js 20 or later. There are no external dependencies.

## Run locally

```sh
npm run dev
```

Open <http://127.0.0.1:4173>. Press `Ctrl+C` to stop the server. Set `PORT` to use another port, for example:

```sh
PORT=4174 npm run dev
```

## Deploy

The site is static. Pushes to `main` run the GitHub Actions workflow, validate the course, and publish the website files to `gh-pages`. GitHub Pages serves the `gh-pages` branch at <https://www.lprakashv.com/designed-to-scale/>. The server below is for local use and listens only on the loopback interface:

```sh
npm run build
npm start
```

The build command validates content; it does not generate files. For production, use a static host with HTTPS and its own access controls if the course contains private material. Do not put secrets in the content: the browser downloads it.

## Add content

Edit [content/course.json](content/course.json). A chapter contains `title`, optional `color`, and `lessons`. Each lesson has a unique URL-safe lowercase `id`, `title`, `summary`, two to four short diagram `nodes`, and one or more `sections`. Each section has `title`, `body`, optional `note`, and an `active` array of zero-based node indexes. Keep node labels short so they fit the diagram. The diagram uses illustrated component types based on the node labels. The optional `links` array lists pairs of zero-based node indexes to connect for that section. Add links only when the lesson describes a relationship; each dot travels from the first node to the second. The dots illustrate direction. The order in the file is the order in the course.

```json
{
  "id": "example-topic",
  "title": "Example Topic",
  "summary": "A short overview.",
  "nodes": ["Client", "Service", "Store"],
  "sections": [
    {"title": "First step", "body": "Explain this step.", "active": [0, 1], "links": [[0, 1]], "note": "An optional detail."}
  ]
}
```

Add a lesson to an existing chapter or add another chapter to `chapters`. Save the file, run `npm run build`, and reload the browser. IDs form links and identify completed lessons; keep existing IDs stable. Progress and theme are stored in the current browser's local storage, not synced between devices. Mark or unmark a lesson on its last step.

## Checks

```sh
npm run lint
npm run build
npm test
npm run coverage
```

`lint` and `build` validate the course content contract; they do not run a JavaScript style linter or bundle the app. Tests cover the content contract and invalid data.
