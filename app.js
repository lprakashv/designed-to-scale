import { validateCourse } from './scripts/schema.js';
import { diagram, escapeHtml } from './scripts/diagram.js';

const course = await fetch('./content/course.json').then(response => {
  if (!response.ok) throw new Error('Could not load course content');
  return response.json();
});
validateCourse(course);

const lessons = course.chapters.flatMap((chapter, chapterIndex) =>
  chapter.lessons.map((lesson, lessonIndex) => ({ ...lesson, chapter, chapterIndex, lessonIndex })));
const $ = selector => document.querySelector(selector);
const search = $('#search');
const courseMenu = $('#course-menu');
const motion = matchMedia('(prefers-reduced-motion: reduce)');
const narrow = matchMedia('(max-width: 42rem)');
const compactDiagram = matchMedia('(max-width: 60rem), (min-width: 76rem)');
const openChapters = new Set();
let displayedLesson;
let displayedSection;
let previousStatus;
let paused = false;

function read(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
}

function write(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

const saved = read('course-completed', []);
const completed = new Set(lessons.filter(lesson => Array.isArray(saved) && saved.includes(lesson.id)).map(lesson => lesson.id));
const link = (lesson, step = 0) => `#/${lesson.id}/${step + 1}`;

function route() {
  const match = location.hash.match(/^#\/([a-z0-9-]+)(?:\/(\d+))?\/?$/);
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
      ...item.sections.flatMap(section => [section.title, section.body, section.visualNote]),
    ].join(' ').toLowerCase().includes(query));
    if (!matches.length) return '';
    const expanded = query || openChapters.has(index);
    return `<details data-chapter="${index}" ${expanded ? 'open' : ''}>
      <summary><span>${String(index + 1).padStart(2, '0')}. ${escapeHtml(chapter.title)}</span> <small></small>
      </summary>
      <ul>${matches.map(item => `
        <li><a href="${link(item)}" ${item.id === lesson.id ? 'class="selected" aria-current="page"' : ''}>
          ${escapeHtml(item.title)}
        </a></li>`).join('')}</ul>
    </details>`;
  }).join('') || '<p class="empty">No lessons match your search.</p>';
  updateProgress();
}

function updateProgress() {
  document.querySelectorAll('#course details').forEach(item => {
    const chapter = course.chapters[Number(item.dataset.chapter)];
    const count = chapter.lessons.filter(lesson => completed.has(lesson.id)).length;
    item.querySelector('small').textContent = `${count}/${chapter.lessons.length}`;
  });
  $('#progress').innerHTML = `<strong>Progress</strong><span>${completed.size} / ${lessons.length}</span>`;
}

function applyPlayback() {
  const svg = $('.diagram svg');
  if (paused || motion.matches) svg.pauseAnimations();
  else svg.unpauseAnimations();
  const button = $('#pause');
  button.textContent = paused ? '▶ Play' : 'Ⅱ Pause';
}

function togglePlayback() {
  if ($('#pause').disabled) return;
  paused = !paused;
  applyPlayback();
}

function replay() {
  if ($('#replay').disabled) return;
  $('.diagram svg').setCurrentTime(0);
  paused = false;
  applyPlayback();
}

function render() {
  const { index, lesson, step } = route();
  const section = lesson.sections[step];
  if (displayedSection !== section) {
    previousStatus = displayedLesson === lesson ? displayedSection?.status : undefined;
    displayedSection = section;
  }
  const focusId = document.activeElement.id;
  if (displayedLesson !== lesson) {
    openChapters.add(lesson.chapterIndex);
    renderNav(lesson);
    displayedLesson = lesson;
  }
  document.title = `${lesson.title} · System Design`;

  const last = step === lesson.sections.length - 1;
  const previous = step > 0 ? link(lesson, step - 1)
    : lessons[index - 1] && link(lessons[index - 1], lessons[index - 1].sections.length - 1);
  const next = last ? lessons[index + 1] && link(lessons[index + 1]) : link(lesson, step + 1);
  const nextTitle = last ? lessons[index + 1]?.title : lesson.sections[step + 1].title;
  const animated = !!section.links?.length && !motion.matches;
  $('#main').innerHTML = `
    <header class="lesson-head">
      <div class="lesson-meta">
        <p>${escapeHtml(lesson.chapter.title)} · Lesson ${lesson.lessonIndex + 1} of ${lesson.chapter.lessons.length}</p>
        ${lesson.original === true ? `<a href="https://designed-to-scale.vercel.app/${link(lesson)}">Original lesson <span aria-hidden="true">↗</span></a>` : ''}
      </div>
      <h1 id="lesson-title" tabindex="-1">${escapeHtml(lesson.title)}</h1>
      <p>${escapeHtml(lesson.summary)}</p>
    </header>
    <div class="lesson-workspace">
      <section class="guide card" aria-labelledby="step-title">
        <p class="step-count">Step ${step + 1} of ${lesson.sections.length}</p>
        <h2 id="step-title" tabindex="-1">${escapeHtml(section.title)}</h2>
        <div class="reading">
          ${section.body.split('\n\n').map(paragraph => `<p>${escapeHtml(paragraph)}</p>`).join('')}
          ${section.note ? `<div class="note"><strong>Key idea</strong><p>${escapeHtml(section.note)}</p></div>` : ''}
        </div>
        <div class="guide-actions">
          ${previous ? `<a id="back" class="button" href="${previous}">← ${step ? 'Back' : 'Previous lesson'}</a>` : '<button class="button" disabled>← Back</button>'}
          ${next ? `<a id="next" class="button primary" href="${next}">${last ? 'Next lesson' : 'Next'} →<small>${escapeHtml(nextTitle)}</small></a>` : ''}
        </div>
        ${last ? '<button id="complete" class="button complete"></button>' : ''}
      </section>
      <figure class="visual card">
        <div class="visual-top">
          <h2>Diagram</h2>
          <div class="playback">
            <button class="button" id="replay" title="Replay this step (R)" ${animated ? '' : 'disabled'}>↻ Replay</button>
            <button class="button" id="pause" title="Pause or resume traffic (Space)" ${animated ? '' : 'disabled'}></button>
          </div>
        </div>
        ${lesson.statusLabels ? `<dl class="visual-status" aria-label="Example state">${lesson.statusLabels.map((label, i) => `
          <div ${previousStatus && previousStatus[i] !== section.status[i] ? 'class="status-changed"' : ''}>
            <dt>${escapeHtml(label)}</dt>
            <dd>${escapeHtml(section.status[i])}</dd>
          </div>`).join('')}</dl>` : ''}
        <div class="diagram">${diagram(lesson, section, { animated, compact: compactDiagram.matches })}</div>
        <figcaption>
          ${section.visualNote ? `<p class="visual-note">${escapeHtml(section.visualNote)}</p>` : ''}
          <div class="legend"><span class="focus-key">● In focus</span><span>○ Context</span>
            ${section.links?.length ? '<span class="traffic-key">● Traffic →</span>' : ''}
          </div>
        </figcaption>
      </figure>
    </div>
    <nav class="timeline card" aria-label="Lesson steps">
      <h2>Lesson steps</h2>
      <ol class="steps">${lesson.sections.map((item, i) => `
        <li><a class="step" href="${link(lesson, i)}" ${i === step ? 'aria-current="step"' : ''}>
          <span>${i + 1}</span>${escapeHtml(item.title)}
        </a></li>`).join('')}</ol>
    </nav>`;

  applyPlayback();
  $('#pause').addEventListener('click', togglePlayback);
  $('#replay').addEventListener('click', replay);
  const complete = $('#complete');
  if (complete) {
    const sync = () => {
      complete.textContent = completed.has(lesson.id) ? '✓ Completed' : 'Mark lesson complete';
      complete.setAttribute('aria-pressed', completed.has(lesson.id));
    };
    sync();
    complete.addEventListener('click', () => {
      if (!completed.delete(lesson.id)) completed.add(lesson.id);
      write('course-completed', [...completed]);
      sync();
      updateProgress();
    });
  }
  const restore = ['lesson-title', 'step-title', 'back', 'next', 'pause', 'replay', 'complete'].includes(focusId)
    && document.getElementById(focusId);
  if (restore && !restore.disabled) restore.focus({ preventScroll: true });
}

$('#lesson-count').textContent = `${lessons.length} lessons`;
$('#course').addEventListener('click', event => {
  const summary = event.target.closest('summary');
  if (summary && !search.value.trim()) {
    const chapter = summary.parentElement;
    const index = Number(chapter.dataset.chapter);
    if (chapter.open) openChapters.delete(index);
    else openChapters.add(index);
  }
});
narrow.addEventListener('change', () => { courseMenu.open = !narrow.matches; });
courseMenu.open = !narrow.matches;
search.addEventListener('input', () => {
  courseMenu.open = true;
  renderNav(route().lesson);
});
search.addEventListener('keydown', event => {
  if (event.key === 'Enter') $('#course a')?.click();
  if (event.key === 'Escape') {
    search.value = '';
    renderNav(route().lesson);
    search.blur();
  }
});

document.addEventListener('click', event => {
  const anchor = event.target.closest('a[href^="#/"]');
  if (!anchor || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  const courseLink = anchor.closest('#course');
  if (courseLink) {
    if (narrow.matches) courseMenu.open = false;
    if (search.value) {
      search.value = '';
      renderNav(route().lesson);
    }
  }
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
  const previousLesson = displayedLesson;
  render();
  $(previousLesson !== displayedLesson ? '#lesson-title' : '#step-title').focus();
});
motion.addEventListener('change', render);
compactDiagram.addEventListener('change', render);
window.addEventListener('keydown', event => {
  if (event.defaultPrevented) return;
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault();
    search.focus();
    return;
  }
  if (event.target.matches('input, textarea, select, [contenteditable]') || event.ctrlKey || event.metaKey || event.altKey) return;
  if (event.key === '/') {
    event.preventDefault();
    search.focus();
  } else if (event.key.toLowerCase() === 'r') {
    replay();
  } else if (event.code === 'Space' && !event.target.closest('a, button, summary')) {
    if ($('#pause').disabled) return;
    event.preventDefault();
    togglePlayback();
  } else if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
    const target = $(event.key === 'ArrowRight' ? '#next' : '#back');
    if (!target) return;
    event.preventDefault();
    location.hash = target.hash;
  }
});
render();
