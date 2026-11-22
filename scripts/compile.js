import { readFile } from 'node:fs/promises';
import MarkdownIt from 'markdown-it';
import { parseDocument } from 'yaml';
import { validateCourse } from './schema.js';

const markdown = new MarkdownIt({ html: false });
markdown.renderer.rules.blockquote_open = (tokens, index, options, _env, renderer) => {
  const children = tokens[index + 2]?.children;
  if (children?.[1]?.type === 'strong_open' && children[2]?.content === 'Warning.') {
    tokens[index].attrJoin('class', 'warning');
  }
  return renderer.renderToken(tokens, index, options);
};
const lessonFields = ['title', 'summary', 'original', 'nodes', 'statusLabels', 'layout'];
const stepFields = ['active', 'links', 'callouts', 'status', 'note', 'visualNote'];
const sourceDirectory = new URL('../content/', import.meta.url);

function readMetadata(source, fields, location) {
  const document = parseDocument(source, { stringKeys: true });
  const problem = document.errors[0] ?? document.warnings[0];
  if (problem) throw new Error(`${location}: ${problem.message}`);

  let metadata;
  try {
    metadata = document.toJS({ maxAliasCount: 0 });
  } catch (error) {
    throw new Error(`${location}: ${error.message}`, { cause: error });
  }
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
    throw new Error(`${location}: expected a YAML mapping`);
  }
  const unknown = Object.keys(metadata).filter(key => !fields.includes(key));
  if (unknown.length) throw new Error(`${location}: unknown fields ${unknown.join(', ')}`);
  return metadata;
}

export function parseLesson(source, id) {
  const file = `${id}.md`;
  const normalized = source.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
  const frontMatter = normalized.match(/^---\n([\s\S]*?)\n---(?:\n|$)/);
  if (!frontMatter) throw new Error(`${file}: expected YAML front matter between --- lines`);

  const lesson = readMetadata(frontMatter[1], lessonFields, file);
  const content = normalized.slice(frontMatter[0].length);
  const lines = content.split('\n');
  const tokens = markdown.parse(content, {});
  const headings = tokens.flatMap((token, index) =>
    token.type === 'heading_open' && token.level === 0 && token.markup === '##' ? [index] : []);
  if (headings[0] !== 0) throw new Error(`${file}: start the lesson body with a ## step heading`);

  const sections = headings.map((index, i) => {
    const [, heading, , fence] = tokens.slice(index, index + 4);
    const location = `${file}, step ${i + 1}`;
    if (fence?.type !== 'fence' || fence.info.trim() !== 'step') {
      throw new Error(`${location}: expected a fenced step block after the heading`);
    }
    const step = readMetadata(fence.content, stepFields, location);
    const nextHeading = tokens[headings[i + 1]];
    const body = lines.slice(fence.map[1], nextHeading?.map[0]).join('\n').trim();
    if (!body) throw new Error(`${location}: expected Markdown prose after the step block`);
    return { ...step, title: heading.content, body, bodyHtml: markdown.render(body) };
  });
  return { ...lesson, id, sections };
}

export async function compileCourse(directory = sourceDirectory) {
  const index = await readFile(new URL('index.json', directory), 'utf8');
  let manifest;
  try {
    manifest = JSON.parse(index);
  } catch (error) {
    throw new Error(`content/index.json: ${error.message}`, { cause: error });
  }
  if (!Array.isArray(manifest?.chapters)) throw new Error('content/index.json: expected a chapters array');

  const chapters = [];
  for (const [index, chapter] of manifest.chapters.entries()) {
    if (!Array.isArray(chapter?.lessons)) {
      throw new Error(`content/index.json: expected a lesson ID list for chapter ${index + 1}`);
    }
    const lessons = await Promise.all(chapter.lessons.map(async id => {
      if (typeof id !== 'string' || !/^[a-z0-9-]+$/.test(id)) {
        throw new Error(`content/index.json: invalid lesson ID ${JSON.stringify(id)}`);
      }
      const document = await readFile(new URL(`lessons/${id}.md`, directory), 'utf8');
      return parseLesson(document, id);
    }));
    chapters.push({ title: chapter.title, color: chapter.color, lessons });
  }

  const course = { chapters };
  validateCourse(course);
  return course;
}
