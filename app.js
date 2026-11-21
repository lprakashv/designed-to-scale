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
const motion = matchMedia('(prefers-reduced-motion: reduce)');
const compact = matchMedia('(max-width: 650px)');
const openChapters = new Set();
let displayedLesson;
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
      chapter.title, item.title, item.summary, ...item.sections.flatMap(section => [section.title, section.body]),
    ].join(' ').toLowerCase().includes(query));
    if (!matches.length) return '';
    const expanded = query || openChapters.has(index);
    return `<details data-chapter="${index}" ${expanded ? 'open' : ''}>
      <summary><span class="folder ${escapeHtml(chapter.color || '')}">▰</span>
        ${String(index + 1).padStart(2, '0')}. ${escapeHtml(chapter.title)} <small></small>
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
  $('#progress').innerHTML = `<strong>PROGRESS</strong><span>${completed.size} / ${lessons.length}</span>`;
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
    <div class="lesson-head">
      <div>
        <div class="eyebrow">${escapeHtml(lesson.chapter.title)} / Lesson ${lesson.lessonIndex + 1} of ${lesson.chapter.lessons.length}</div>
        <h1 id="lesson-title" tabindex="-1">${escapeHtml(lesson.title)}</h1>
        <p>${escapeHtml(lesson.summary)}</p>
      </div>
    </div>
    <div class="visual card">
      <div class="visual-top">
        <span class="visual-label">${escapeHtml(section.title)}</span>
        <div class="playback">
          <button id="replay" title="Replay this step (R)" ${animated ? '' : 'disabled'}>↻ Replay</button>
          <button id="pause" title="Pause or resume traffic (Space)" ${animated ? '' : 'disabled'}></button>
        </div>
      </div>
      <div class="diagram">${diagram(lesson, section, { animated, compact: compact.matches })}</div>
      <div class="legend"><span class="focus-key">● In focus</span><span>○ Context</span>
        ${section.links?.length ? '<span class="traffic-key">● Traffic →</span>' : ''}
      </div>
    </div>
    <nav class="timeline card" aria-label="Lesson steps">
      <div class="timeline-head"><strong>IN THIS LESSON</strong><span>Step ${step + 1} of ${lesson.sections.length}</span></div>
      <div class="steps">${lesson.sections.map((item, i) => `
        <a class="step ${i === step ? 'current' : ''} ${i < step ? 'past' : ''}" href="${link(lesson, i)}" ${i === step ? 'aria-current="step"' : ''}>
          <span>${i + 1}</span><small>${escapeHtml(item.title)}</small>
        </a>`).join('')}</div>
    </nav>`;

  $('#guide').innerHTML = `
    <div class="guide card">
      <div class="guide-top"><strong>STEP ${step + 1} / ${lesson.sections.length}</strong></div>
      <h2 id="step-title" tabindex="-1">${escapeHtml(section.title)}</h2>
      <p>${escapeHtml(section.body)}</p>
      ${section.note ? `<div class="note"><strong>GOOD TO KNOW</strong><p>${escapeHtml(section.note)}</p></div>` : ''}
      <div class="guide-actions">
        ${previous ? `<a id="back" class="button" href="${previous}">← ${step ? 'Back' : 'Previous lesson'}</a>` : '<button disabled>← Back</button>'}
        ${next ? `<a id="next" class="button primary" href="${next}">${last ? 'Next lesson' : 'Next'} →<small>${escapeHtml(nextTitle)}</small></a>` : ''}
      </div>
      ${last ? '<button id="complete" class="complete"></button>' : ''}
      <div class="shortcuts">← → Step · R Replay · Space Pause</div>
    </div>
    <div class="goals card"><strong>LESSON OUTLINE</strong>
      <ul>${lesson.sections.map((item, i) => `<li><span>${i === step ? '●' : i < step ? '✓' : '○'}</span> ${escapeHtml(item.title)}</li>`).join('')}</ul>
    </div>`;
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
  const restore = ['back', 'next', 'pause', 'replay'].includes(focusId) && document.getElementById(focusId);
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
search.addEventListener('input', () => renderNav(route().lesson));
search.addEventListener('keydown', event => {
  if (event.key === 'Enter') $('#course a')?.click();
  if (event.key === 'Escape') {
    search.value = '';
    renderNav(route().lesson);
    search.blur();
  }
});

let anchorSection;
document.addEventListener('click', event => {
  const anchor = event.target.closest('a[href^="#/"]');
  if (!anchor || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  anchorSection = anchor.closest('#course, .brand') ? '#lesson-title'
    : anchor.closest('.steps') ? '.step.current' : null;
  if (anchor.closest('#course') && search.value) {
    search.value = '';
    renderNav(route().lesson);
  }
  if (anchor.hash === location.hash && anchorSection) {
    $(anchorSection)?.focus();
    anchorSection = null;
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
  if (previousLesson !== displayedLesson) $('#lesson-title').focus();
  else if (anchorSection) $(anchorSection)?.focus();
  anchorSection = null;
});
motion.addEventListener('change', render);
compact.addEventListener('change', render);
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
