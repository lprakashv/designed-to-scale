import MarkdownIt from 'markdown-it';
import { fileURLToPath } from 'node:url';
import { compileCourse as compileBoard, parseLesson as parseBoardLesson } from '@lprakashv/course-board';
import { validateCourse } from './schema.js';

const markdown = new MarkdownIt({ html: false });
markdown.renderer.rules.blockquote_open = (tokens, index, options, _env, renderer) => {
  const children = tokens[index + 2]?.children;
  if (children?.[1]?.type === 'strong_open' && children[2]?.content === 'Warning.') {
    tokens[index].attrJoin('class', 'warning');
  }
  return renderer.renderToken(tokens, index, options);
};

function fields(data, allowed, location) {
  const value = data ?? {};
  const unknown = Object.keys(value).filter(key => !allowed.includes(key));
  if (unknown.length) throw new Error(`${location}: unknown fields ${unknown.join(', ')}`);
  return value;
}

function adaptLesson(lesson) {
  const metadata = fields(lesson.data, ['original', 'nodes', 'statusLabels', 'layout'], `${lesson.id}.md`);
  const sections = lesson.steps.map((step, index) => {
    const settings = fields(step.data, ['active', 'links', 'callouts', 'status', 'note', 'visualNote'], `${lesson.id}.md, step ${index + 1}`);
    if (step.diagram) throw new Error(`${lesson.id}.md, step ${index + 1}: use data for the system diagram`);
    return { ...settings, title: step.title, body: step.text, bodyHtml: markdown.render(step.text) };
  });
  return { title: lesson.title, summary: lesson.summary, ...metadata, id: lesson.id, sections };
}

export function parseLesson(source, id) {
  return adaptLesson(parseBoardLesson(source, id));
}

export function adaptCourse(course) {
  const chapters = course.chapters.map(chapter => ({
    title: chapter.title,
    color: fields(chapter.data, ['color'], `Chapter ${chapter.title}`).color,
    lessons: chapter.lessons.map(adaptLesson),
  }));
  const adapted = { chapters };
  validateCourse(adapted);
  return adapted;
}

export async function compileCourse() {
  return adaptCourse(await compileBoard(fileURLToPath(new URL('../', import.meta.url))));
}
