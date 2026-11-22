import { validateCourse } from './scripts/schema.js';
import { diagram, escapeHtml } from './scripts/diagram.js';
import { setupViewport } from './scripts/diagram-viewport.js';
import { setupPanes } from './scripts/panes.js';

const $ = selector => document.querySelector(selector);
const course = await fetch('./content/course.json')
  .then(async response => {
    if (response.status === 500) throw new Error(await response.text());
    if (!response.ok) throw new Error('Course data is unavailable.');
    const data = await response.json();
    validateCourse(data);
    return data;
  })
  .catch(error => {
    const message = document.createElement('p');
    message.setAttribute('role', 'alert');
    message.textContent = `Could not load the course. ${error.message}`;
    $('#main').append(message);
    throw error;
  });

const lessons = course.chapters.flatMap((chapter, chapterIndex) =>
  chapter.lessons.map((lesson, lessonIndex) => ({ ...lesson, chapter, chapterIndex, lessonIndex })));
const search = $('#search');
const motion = matchMedia('(prefers-reduced-motion: reduce)');
const openChapters = new Set();
let displayedLesson;
let readView;

function read(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
}

function write(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

const syncPanes = setupPanes($('.layout'), read('course-pane-widths', {}), widths => write('course-pane-widths', widths));
const link = (lesson, step = 0) => `#/${lesson.id}/${step + 1}`;

function trackPageView() {
  window.gtag?.('event', 'page_view', {
    page_title: document.title,
    page_location: location.href,
    page_path: `${location.pathname}${location.hash}`,
  });
}

function route() {
  const hash = location.hash || read('course-position', '');
  const match = typeof hash === 'string' && hash.match(/^#\/([a-z0-9-]+)(?:\/(\d+))?\/?$/);
  const index = match ? lessons.findIndex(lesson => lesson.id === match[1]) : -1;
  if (index < 0) return { index: 0, lesson: lessons[0], step: 0 };
  const lesson = lessons[index];
  const step = Math.max(0, Math.min(lesson.sections.length - 1, Number(match[2] || 1) - 1));
  return { index, lesson, step };
}

function renderNav(lesson) {
  const query = search.value.trim().toLowerCase();
  $('#course').innerHTML = course.chapters.map((chapter, index) => {
    const matches = chapter.lessons.filter(item => [
      chapter.title, item.title, item.summary, ...(item.statusLabels ?? []),
      ...item.sections.flatMap(section => [section.title, section.body, section.visualNote, ...section.callouts.map(([, note]) => note)]),
    ].join(' ').toLowerCase().includes(query));
    if (!matches.length) return '';
    const expanded = query || openChapters.has(index);
    return `<details data-chapter="${index}" ${index === lesson.chapterIndex ? 'class="active-chapter"' : ''} ${expanded ? 'open' : ''}>
      <summary><span>${escapeHtml(chapter.title)}</span>
      </summary>
      <ul>${matches.map(item => `
        <li><a href="${link(item)}" ${item.id === lesson.id ? 'class="selected" aria-current="page"' : ''}>
          ${escapeHtml(item.title)}
        </a></li>`).join('')}</ul>
    </details>`;
  }).join('') || '<p class="empty">No lessons match your search.</p>';
}

const controlLabel = (text, symbol) => `<span class="control-caption">${text}</span><span class="control-symbol" aria-hidden="true">${symbol}</span>`;

function openSearch() {
  $('.course-header').classList.add('search-open');
  $('#search-toggle').setAttribute('aria-expanded', 'true');
  search.focus();
}

function closeSearch() {
  $('.course-header').classList.remove('search-open');
  $('#search-toggle').setAttribute('aria-expanded', 'false');
  if (search.value) {
    search.value = '';
    renderNav(route().lesson);
  }
  search.blur();
}

function render() {
  const { index, lesson, step } = route();
  const section = lesson.sections[step];
  const previousView = displayedLesson === lesson ? readView?.() : undefined;
  const previousStatus = lesson.sections[step - 1]?.status;
  const stepsOpen = $('.timeline')?.open;
  const focusId = document.activeElement.id;
  if (displayedLesson !== lesson) {
    if (displayedLesson?.chapterIndex !== lesson.chapterIndex) openChapters.clear();
    openChapters.add(lesson.chapterIndex);
    renderNav(lesson);
    displayedLesson = lesson;
  }
  document.title = `${lesson.title} · System Design`;
  const current = link(lesson, step);
  if (!location.hash) history.replaceState(null, '', current);
  write('course-position', current);

  const last = step === lesson.sections.length - 1;
  const previous = step > 0 ? link(lesson, step - 1)
    : lessons[index - 1] && link(lessons[index - 1], lessons[index - 1].sections.length - 1);
  const next = last ? lessons[index + 1] && link(lessons[index + 1]) : link(lesson, step + 1);
  const animated = !!section.links?.length && !motion.matches;
  $('#main').innerHTML = `
    <header class="lesson-title-row">
      <h1 id="lesson-title" tabindex="-1">${escapeHtml(lesson.title)}</h1>
      <nav id="lesson-controls" class="lesson-controls" aria-label="Lesson navigation">
        ${previous ? `<a id="back" class="button" href="${previous}" aria-label="${step ? 'Previous step' : 'Previous lesson'}" title="Back">${controlLabel('Back', '←')}</a>` : `<button id="back" class="button" aria-label="Back" disabled>${controlLabel('Back', '←')}</button>`}
        <details class="timeline" ${stepsOpen ? 'open' : ''}>
          <summary id="step-menu" class="button" aria-label="Lesson steps, step ${step + 1} of ${lesson.sections.length}" title="Lesson steps">
            ${controlLabel(`Step ${step + 1} of ${lesson.sections.length}`, `${step + 1}/${lesson.sections.length}`)}
          </summary>
          <ol class="steps" aria-label="Lesson steps">${lesson.sections.map((item, i) => `
            <li><a class="step" href="${link(lesson, i)}" ${i === step ? 'aria-current="step"' : ''}>
              <span>${i + 1}</span>${escapeHtml(item.title)}
            </a></li>`).join('')}</ol>
        </details>
        ${next ? `<a id="next" class="button primary" href="${next}" aria-label="${last ? 'Next lesson' : 'Next step'}" title="Next">${controlLabel('Next', '→')}</a>` : `<button id="next" class="button primary" aria-label="Next" disabled>${controlLabel('Next', '→')}</button>`}
      </nav>
    </header>
    <div class="lesson-head">
      <div class="lesson-meta">
        <p>${escapeHtml(lesson.chapter.title)} · Lesson ${lesson.lessonIndex + 1} of ${lesson.chapter.lessons.length}</p>
      </div>
      <p>${escapeHtml(lesson.summary)}</p>
    </div>
    <h2 class="stage-heading" id="step-title" tabindex="-1">${escapeHtml(section.title)}</h2>
    <div class="lesson-workspace">
      <figure class="visual card" aria-labelledby="diagram-title">
        <div class="visual-head">
          <h3 id="diagram-title">Whiteboard</h3>
          <div class="board-tools" role="group" aria-label="Diagram zoom">
            <button class="button" id="zoom-out" type="button" aria-label="Zoom out" title="Zoom out">−</button>
            <span id="zoom-level">100%</span>
            <button class="button" id="zoom-in" type="button" aria-label="Zoom in" title="Zoom in">+</button>
            <button class="button" id="zoom-fit" type="button" aria-label="Fit diagram" title="Fit the full diagram">Fit</button>
          </div>
        </div>
        ${lesson.statusLabels ? `<dl class="visual-status" aria-label="Example state">${lesson.statusLabels.map((label, i) => `
          <div ${previousStatus && previousStatus[i] !== section.status[i] ? 'class="status-changed"' : ''}>
            <dt>${escapeHtml(label)}</dt>
            <dd>${escapeHtml(section.status[i])}</dd>
          </div>`).join('')}</dl>` : ''}
        <div id="diagram-view" class="diagram" role="region" tabindex="0" aria-label="System diagram" aria-describedby="diagram-instructions">${diagram(lesson, step, { animated })}</div>
        <span class="sr-only" id="diagram-instructions">Use plus and minus to zoom and zero to fit. While zoomed in, drag or use the arrow keys to pan.</span>
        <figcaption>
          ${section.visualNote ? `<p class="visual-note">${escapeHtml(section.visualNote)}</p>` : ''}
          <div class="legend"><span class="focus-key">In focus</span><span class="context-key">Context</span></div>
        </figcaption>
      </figure>
      <div id="reading-divider" class="pane-divider" data-resize="reading" role="separator" aria-orientation="vertical" aria-label="Lesson text width" aria-controls="lesson-reading" tabindex="0"></div>
      <section class="guide card" id="lesson-reading" aria-labelledby="step-title">
        <div class="reading">
          ${section.bodyHtml ?? section.body.split('\n\n').map(paragraph => `<p>${escapeHtml(paragraph)}</p>`).join('')}
          ${section.note ? `<div class="note"><strong>Key idea</strong><p>${escapeHtml(section.note)}</p></div>` : ''}
        </div>
      </section>
    </div>`;

  readView = setupViewport($('.diagram'), $('.board-tools'), previousView);
  syncPanes();
  const restore = ['lesson-title', 'step-title', 'back', 'next', 'step-menu', 'reading-divider', 'zoom-out', 'zoom-in', 'zoom-fit', 'diagram-view'].includes(focusId)
    && document.getElementById(focusId);
  if (restore && !restore.disabled) restore.focus({ preventScroll: true });
}

$('#course').addEventListener('click', event => {
  const summary = event.target.closest('summary');
  if (summary && !search.value.trim()) {
    const chapter = summary.parentElement;
    const index = Number(chapter.dataset.chapter);
    if (chapter.open) openChapters.delete(index);
    else openChapters.add(index);
  }
});
$('#search-toggle').addEventListener('click', openSearch);
function dismissSearch() {
  closeSearch();
  $('#search-toggle').focus();
}

$('#search-close').addEventListener('click', dismissSearch);
search.addEventListener('input', () => {
  renderNav(route().lesson);
});
search.addEventListener('keydown', event => {
  if (event.key === 'Enter') $('#course a')?.click();
  if (event.key === 'Escape') dismissSearch();
});

document.addEventListener('click', event => {
  const steps = $('.timeline[open]');
  if (steps && (!steps.contains(event.target) || event.target.closest('.step'))) steps.open = false;
  const anchor = event.target.closest('a[href^="#/"]');
  if (!anchor || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  const courseLink = anchor.closest('#course');
  if (courseLink) closeSearch();
  if (anchor.hash === location.hash) {
    $(courseLink || anchor.matches('.brand') ? '#lesson-title' : '#step-title').focus();
  }
});

$('#theme').addEventListener('click', () => {
  const dark = document.documentElement.classList.toggle('dark');
  write('course-theme', dark ? 'dark' : 'light');
});
document.documentElement.classList.toggle('dark', read('course-theme', 'light') === 'dark');

window.addEventListener('hashchange', () => {
  const sameLesson = displayedLesson === route().lesson;
  const board = $('.diagram').getBoundingClientRect();
  const headerBottom = $('.lesson-title-row').getBoundingClientRect().bottom;
  $('.timeline').open = false;
  const readingBoard = sameLesson && window.scrollY > 0
    && board.top < innerHeight && board.bottom > headerBottom;
  render();
  if (readingBoard) {
    const nextTop = $('.diagram').getBoundingClientRect().top;
    window.scrollBy(0, nextTop - Math.max(board.top, headerBottom + 8));
  } else {
    window.scrollTo(0, 0);
  }
  trackPageView();
  $(sameLesson ? '#step-title' : '#lesson-title').focus({ preventScroll: true });
});
motion.addEventListener('change', render);
window.addEventListener('keydown', event => {
  if (event.defaultPrevented) return;
  const openSteps = event.target.closest('.timeline[open]');
  if (event.key === 'Escape' && openSteps) {
    openSteps.open = false;
    $('#step-menu').focus();
    return;
  }
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault();
    openSearch();
    return;
  }
  if (event.target.matches('input, textarea, select, [contenteditable]') || event.ctrlKey || event.metaKey || event.altKey) return;
  if (event.key === '/') {
    event.preventDefault();
    openSearch();
  } else if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
    const target = $(event.key === 'ArrowRight' ? '#next' : '#back');
    if (!target?.hash) return;
    event.preventDefault();
    location.hash = target.hash;
  }
});
render();
trackPageView();
