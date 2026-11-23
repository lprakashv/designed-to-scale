import { assetUrl, escapeHtml as text, renderDiagram } from './diagrams.js';
import { getRoute, lessonHref } from './navigation.js';
import { setupPaneResize } from './panes.js';
import { createCourseShell } from './shell.js';

async function mountDefaultShell() {
const $ = id => document.getElementById(id);
const outline = $('outline');
const toggle = $('outline-toggle');
const search = $('search');
const main = $('lesson');
let focusStep = false;

try {
  const response = await fetch('./course.json');
  if (!response.ok) throw new Error('Could not read course.json.');
  const course = await response.json();
  const extension = course.extension ? await import(`../${assetUrl(course.extension)}`) : {};

  const chapters = course.chapters;
  const lessons = chapters.flatMap(chapter => chapter.lessons.map(lesson => ({ ...lesson, chapter })));
  const stepHref = (lesson, index = 0) => lessonHref(lesson.id, lesson.steps[index].id ?? index);
  const storagePrefix = `course-board:${location.pathname.replace(/index\.html$/, '')}:${course.id}`;
  const shell = createCourseShell({ storageKey: `${storagePrefix}:completed`, readRoute: hash => getRoute(hash, lessons) });
  const saved = shell.readState([]);
  const completed = new Set(Array.isArray(saved) ? saved : []);
  const paneState = createCourseShell({ storageKey: `${storagePrefix}:panes` });
  const savedWidths = paneState.readState({});
  const widths = { outline: savedWidths?.outline, reading: savedWidths?.reading };

  $('course-name').textContent = course.title;
  $('mobile-course-name').textContent = course.title;
  $('course-description').textContent = course.description ?? '';
  $('progress').max = lessons.length;
  main.innerHTML = `<header class="lesson-intro"><h1 id="lesson-title"></h1><p id="lesson-summary" hidden></p></header>
    <nav id="steps" class="steps" aria-label="Steps"></nav>
    <div id="step-layout" class="step-layout">
      <article id="reading" class="reading" aria-labelledby="step-title">
        <p id="step-count" class="step-count"></p>
        <h2 id="step-title" tabindex="-1"></h2>
        <div id="prose" class="prose"></div>
      </article>
      <div id="reading-divider" class="pane-divider" role="separator" aria-label="Step content width"
        aria-orientation="vertical" aria-controls="reading" tabindex="0"></div>
      <figure id="board" class="board" hidden>
        <div class="board-head">Whiteboard</div>
        <dl id="board-state" class="board-state" aria-label="Example state" hidden></dl>
        <figcaption id="board-caption" hidden></figcaption>
      </figure>
    </div>
    <footer id="lesson-footer" class="lesson-footer"></footer>`;
  for (const pane of ['outline', 'reading']) {
    setupPaneResize($(`${pane}-divider`), $(pane), {
      width: widths[pane],
      save(width) {
        widths[pane] = width;
        paneState.writeState(widths);
      },
    });
  }

  const steps = $('steps');
  const board = $('board');
  const boardState = $('board-state');
  const prose = $('prose');
  const caption = $('board-caption');
  const boards = new Map();
  let currentLesson;
  let visibleState;

  function setOutline(open) {
    outline.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
  }

  function renderOutline(current) {
    const query = search.value.trim().toLowerCase();
    const markup = chapters.map(chapter => {
      const matches = chapter.lessons.filter(lesson =>
        [chapter.title, lesson.title, lesson.summary, ...lesson.steps.map(step => step.title)]
          .join(' ').toLowerCase().includes(query));
      if (!matches.length) return '';
      return `<section class="chapter"><h2>${text(chapter.title)}</h2><ul>
        ${matches.map(lesson => {
          const done = completed.has(lesson.id);
          return `<li><a href="${stepHref(lesson)}" ${lesson.id === current.id ? 'aria-current="page"' : ''}>
            <span class="lesson-dot ${done ? 'done' : ''}" aria-hidden="true">${done ? '✓' : ''}</span>
            <span>${text(lesson.title)}</span>${done ? '<span class="sr-only"> (complete)</span>' : ''}
          </a></li>`;
        }).join('')}
      </ul></section>`;
    }).join('');
    $('chapters').innerHTML = markup || '<p class="empty">No lessons match.</p>';
    const count = lessons.filter(lesson => completed.has(lesson.id)).length;
    $('progress').value = count;
    $('progress-text').textContent = `${count} / ${lessons.length}`;
  }

  function renderBoard(active, previous, next) {
    const nearby = [previous, next].filter(spec => spec?.src);
    const visible = Boolean(active);
    for (const [spec, diagram] of boards) {
      if (spec === active || nearby.includes(spec)) diagram.hidden = spec !== active;
      else {
        diagram.remove();
        boards.delete(spec);
      }
    }
    for (const spec of [active, ...nearby]) {
      if (!spec || boards.has(spec)) continue;
      const diagram = document.createElement('div');
      diagram.className = 'diagram';
      diagram.hidden = spec !== active;
      try {
        diagram.innerHTML = renderDiagram(spec, { renderers: extension.diagrams });
      } catch (error) {
        diagram.innerHTML = `<p role="alert">${text(error.message)}</p>`;
      }
      // Keep nearby frames mounted so they retain their loaded documents.
      caption.before(diagram);
      boards.set(spec, diagram);
    }
    board.hidden = !visible;
    $('step-layout').classList.toggle('has-board', visible);
    caption.hidden = !(active?.caption || active?.source);
    caption.innerHTML = caption.hidden ? '' : `
      ${active.caption ? `<span>${text(active.caption)}</span>` : ''}
      ${active.source ? `<a href="${assetUrl(active.source)}" download>Download scene</a>` : ''}`;
  }

  function renderBoardState(previous) {
    boardState.replaceChildren();
    boardState.hidden = true;
    const table = prose.querySelector(':scope > table[data-board-state]');
    const rows = Array.from(table?.tBodies[0]?.rows ?? []);
    if (!rows.length || table.tHead?.rows[0]?.cells.length !== 2) return new Map();

    const values = new Map(rows.map(({ cells }) => [cells[0].textContent.trim(), cells[1].textContent.trim()]));
    if (values.size !== rows.length || values.has('')) return new Map();

    const cards = rows.map(({ cells: [label, value] }) => {
      const key = label.textContent.trim();
      const card = document.createElement('div');
      const term = document.createElement('dt');
      const description = document.createElement('dd');
      term.append(...label.childNodes);
      description.append(...value.childNodes);
      if (previous && previous.get(key) !== values.get(key)) {
        card.className = 'is-changed';
        const update = document.createElement('span');
        update.className = 'board-state-update';
        update.textContent = 'Updated';
        term.append(' ', update);
      }
      card.append(term, description);
      return card;
    });

    table.previousElementSibling.remove();
    table.remove();
    boardState.replaceChildren(...cards);
    boardState.hidden = false;
    return values;
  }

  function focusActiveStep() {
    $('step-title').focus({ preventScroll: true });
    const { top, bottom } = steps.getBoundingClientRect();
    if (bottom < 0 || top >= window.innerHeight) steps.scrollIntoView({ block: 'start' });
  }

  function render() {
    const { lesson, index, step } = shell.route();
    const active = lesson.steps[step];
    const previousLesson = lessons[index - 1];
    const nextLesson = lessons[index + 1];
    const previous = step > 0 ? stepHref(lesson, step - 1)
      : previousLesson && stepHref(previousLesson, previousLesson.steps.length - 1);
    const next = step + 1 < lesson.steps.length ? stepHref(lesson, step + 1)
      : nextLesson && stepHref(nextLesson);

    if (lesson !== currentLesson) {
      currentLesson = lesson;
      visibleState = undefined;
      document.title = `${lesson.title} · ${course.title}`;
      $('breadcrumb').textContent = lesson.chapter.title;
      $('lesson-count').textContent = `Lesson ${index + 1} of ${lessons.length}`;
      $('lesson-title').textContent = lesson.title;
      $('lesson-summary').textContent = lesson.summary ?? '';
      $('lesson-summary').hidden = !lesson.summary;
      renderOutline(lesson);
      steps.innerHTML = lesson.steps.map((item, i) => `<a href="${stepHref(lesson, i)}">
        <span aria-hidden="true">${i + 1}</span>${text(item.title)}</a>`).join('');
      steps.scrollLeft = 0;
    }

    steps.querySelector('[aria-current]')?.removeAttribute('aria-current');
    const tab = steps.children[step];
    tab.setAttribute('aria-current', 'step');
    const { left, right } = tab.getBoundingClientRect();
    const row = steps.getBoundingClientRect();
    steps.scrollLeft += left < row.left ? left - row.left : Math.max(0, right - row.right);
    $('step-count').textContent = `Step ${step + 1} of ${lesson.steps.length}`;
    $('step-title').textContent = active.title;
    prose.innerHTML = active.html;
    renderBoard(active.diagram,
      (lesson.steps[step - 1] ?? previousLesson?.steps.at(-1))?.diagram,
      (lesson.steps[step + 1] ?? nextLesson?.steps[0])?.diagram);
    visibleState = renderBoardState(visibleState);

    $('lesson-footer').innerHTML = `
      ${previous ? `<a class="button" id="previous" href="${previous}">← Previous</a>` : '<button class="button" disabled>← Previous</button>'}
      ${step === lesson.steps.length - 1
        ? `<button class="button completion" id="complete" type="button" aria-pressed="${completed.has(lesson.id)}">${completed.has(lesson.id) ? 'Completed ✓' : 'Mark complete'}</button>` : ''}
      ${next ? `<a class="button primary" id="next" href="${next}">Next →</a>` : ''}`;
    main.removeAttribute('aria-busy');

    $('complete')?.addEventListener('click', event => {
      if (completed.has(lesson.id)) completed.delete(lesson.id);
      else completed.add(lesson.id);
      const done = completed.has(lesson.id);
      shell.writeState([...completed]);
      event.currentTarget.setAttribute('aria-pressed', String(done));
      event.currentTarget.textContent = done ? 'Completed ✓' : 'Mark complete';
      renderOutline(lesson);
    });
    if (focusStep) focusActiveStep();
    focusStep = false;
    extension.onNavigate?.({ course, lesson, step });
  }

  toggle.addEventListener('click', () => setOutline(!outline.classList.contains('is-open')));
  search.addEventListener('input', () => renderOutline(shell.route().lesson));
  document.querySelector('.skip').addEventListener('click', event => {
    event.preventDefault();
    main.focus();
  });
  document.addEventListener('click', event => {
    const link = event.target.closest('a[href^="#/"]');
    if (!link || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    setOutline(false);
    if (link.hash === location.hash) {
      event.preventDefault();
      focusActiveStep();
    } else {
      focusStep = true;
    }
  });
  document.addEventListener('keydown', event => {
    if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey ||
      event.target.closest('input, select, textarea, [contenteditable], .diagram, .pane-divider')) return;
    const link = event.key === 'ArrowLeft' ? $('previous') : event.key === 'ArrowRight' ? $('next') : null;
    if (!link) return;
    event.preventDefault();
    focusStep = true;
    location.hash = link.hash;
  });
  if (!location.hash) history.replaceState(null, '', stepHref(lessons[0]));
  shell.start({ render });
} catch (error) {
  const message = document.createElement('p');
  message.setAttribute('role', 'alert');
  message.textContent = `Could not open the course. ${error.message}`;
  main.replaceChildren(message);
  main.removeAttribute('aria-busy');
}

}

const adapter = document.querySelector('script[type="module"][data-course-board-adapter]');
if (adapter) await import(new URL(adapter.dataset.courseBoardAdapter, import.meta.url));
else await mountDefaultShell();
