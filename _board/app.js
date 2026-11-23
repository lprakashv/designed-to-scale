import { assetUrl, escapeHtml as text, renderDiagram } from './diagrams.js';
import { getRoute, lessonHref } from './navigation.js';
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
  if (course.preset) document.documentElement.dataset.theme = course.preset;
  const extension = course.extension ? await import(`../${assetUrl(course.extension)}`) : {};
  if (course.theme) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = assetUrl(course.theme);
    document.head.append(link);
  }

  const chapters = course.chapters;
  const lessons = chapters.flatMap(chapter => chapter.lessons.map(lesson => ({ ...lesson, chapter })));
  const stepHref = (lesson, index = 0) => lessonHref(lesson.id, lesson.steps[index].id ?? index);
  const storageKey = `course-board:${location.pathname.replace(/index\.html$/, '')}:${course.id}:completed`;
  const shell = createCourseShell({ storageKey, readRoute: hash => getRoute(hash, lessons) });
  const saved = shell.readState([]);
  const completed = new Set(Array.isArray(saved) ? saved : []);

  $('course-name').textContent = course.title;
  $('mobile-course-name').textContent = course.title;
  $('course-description').textContent = course.description ?? '';
  $('progress').max = lessons.length;

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

  function render() {
    const { lesson, index, step } = shell.route();
    const active = lesson.steps[step];
    const previousLesson = lessons[index - 1];
    const nextLesson = lessons[index + 1];
    const previous = step > 0 ? stepHref(lesson, step - 1)
      : previousLesson && stepHref(previousLesson, previousLesson.steps.length - 1);
    const next = step + 1 < lesson.steps.length ? stepHref(lesson, step + 1)
      : nextLesson && stepHref(nextLesson);

    document.title = `${lesson.title} · ${course.title}`;
    $('breadcrumb').textContent = lesson.chapter.title;
    $('lesson-count').textContent = `Lesson ${index + 1} of ${lessons.length}`;
    renderOutline(lesson);

    const spec = active.diagram;
    let board = '';
    if (spec) {
      let art;
      try {
        art = renderDiagram(spec, { renderers: extension.diagrams });
      } catch (error) {
        art = `<p role="alert">${text(error.message)}</p>`;
      }
      board = `<figure class="board">
        <div class="board-head">Whiteboard</div>
        <div class="diagram">${art}</div>
        ${spec.caption || spec.source ? `<figcaption>
          ${spec.caption ? `<span>${text(spec.caption)}</span>` : ''}
          ${spec.source ? `<a href="${assetUrl(spec.source)}" download>Download scene</a>` : ''}
        </figcaption>` : ''}
      </figure>`;
    }

    main.innerHTML = `<header class="lesson-intro">
      <h1>${text(lesson.title)}</h1>
      ${lesson.summary ? `<p>${text(lesson.summary)}</p>` : ''}
    </header>
    <nav class="steps" aria-label="Steps">
      ${lesson.steps.map((item, i) =>
        `<a href="${stepHref(lesson, i)}" ${i === step ? 'aria-current="step"' : ''}>
          <span aria-hidden="true">${i + 1}</span>${text(item.title)}
        </a>`).join('')}
    </nav>
    <div class="step-layout ${board ? 'has-board' : ''}">
      <article class="reading" aria-labelledby="step-title">
        <p class="step-count">Step ${step + 1} of ${lesson.steps.length}</p>
        <h2 id="step-title" tabindex="-1">${text(active.title)}</h2>
        <div class="prose">${active.html}</div>
      </article>
      ${board}
    </div>
    <footer class="lesson-footer">
      ${previous ? `<a class="button" id="previous" href="${previous}">← Previous</a>` : '<button class="button" disabled>← Previous</button>'}
      ${step === lesson.steps.length - 1
        ? `<button class="button completion" id="complete" type="button" aria-pressed="${completed.has(lesson.id)}">${completed.has(lesson.id) ? 'Completed ✓' : 'Mark complete'}</button>` : ''}
      ${next ? `<a class="button primary" id="next" href="${next}">Next →</a>` : ''}
    </footer>`;
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
    if (focusStep) $('step-title').focus();
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
      $('step-title').focus();
    } else {
      focusStep = true;
    }
  });
  document.addEventListener('keydown', event => {
    if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey ||
      event.target.closest('input, select, textarea, [contenteditable], .diagram')) return;
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
