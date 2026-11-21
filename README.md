# System Design Study Course

A local, editable system design course with 40 introductory lessons in nine chapters. The chapter names, lesson names, and lesson order follow Dilum Sanjaya’s [Designed to Scale course](https://designed-to-scale.vercel.app/). Select **Original lesson** for the source walkthrough. The local text and diagrams are independently written. The request and load-balancing lessons cover 10 and 12 steps, respectively. The other lessons give three-step introductions.

On a wide screen, the guide and diagram appear side by side. On a narrow screen, the guide appears above the diagram. Open **Course** to browse the chapters on a phone. Use **Lesson steps**, **Back**, **Next**, or the arrow keys to move through the material. Use **Replay** or R to restart traffic, and **Pause** or Space to pause or resume it. Steps without a flow and browsers set to reduce motion show static diagrams. Use / or Ctrl+K (Command+K on Mac) to search. Enter opens the first result and Escape clears the search.

The status cards above the diagram show the example state for the current step. A highlight marks each value that changed from the last step you viewed in the lesson. The note below the diagram describes an assumption, a decision, or what to look for. Numeric values are examples for the lesson.

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
  "statusLabels": ["Lookup path", "Cache state"],
  "sections": [
    {
      "title": "First step",
      "body": "Explain this step.",
      "active": [0, 1],
      "links": [[0, 1]],
      "status": ["Cache first", "Hit"],
      "visualNote": "This request can use the cached value."
    }
  ]
}
```

Set `statusLabels` on a lesson to show status cards. Give each step one `status` string per label in the same order. Use the optional `visualNote` for the text below the diagram.

Use `\n\n` between paragraphs in a step body. Add a lesson to an existing chapter or add another chapter to `chapters`. Save the file, run `npm run build`, and reload the browser. IDs form links and identify completed lessons. Keep existing IDs stable. Set `"original": true` only if Designed to Scale has a lesson with the same ID. This adds a link to the first step of the original lesson. Step numbers in local links follow the current section order. Progress and theme are stored in the current browser’s local storage. Mark or unmark a lesson on its last step.

## Checks

```sh
npm run lint
npm run build
npm test
npm run coverage
```

`lint` and `build` validate the course content contract; they do not run a JavaScript style linter or bundle the app. Tests cover the content contract and invalid data.
