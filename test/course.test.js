import assert from 'node:assert/strict';
import { cp, mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { pathToFileURL } from 'node:url';
import { buildSite, parseLesson } from '@lprakashv/course-board';

test('Course Board reads the authoring example in the README', async () => {
  const readme = await readFile(new URL('../README.md', import.meta.url), 'utf8');
  const example = readme.match(/^````markdown\n([\s\S]*?)^````$/m)[1];
  const [step] = parseLesson(example, 'dns-lookup').steps;

  assert.equal(step.title, 'Ask the resolver');
  assert.equal(step.diagram.type, 'svg');
  await readFile(new URL(`../public/${step.diagram.src}`, import.meta.url));
});

test('the learner build serves a migrated board at a published step link', async t => {
  const root = await mkdtemp(join(tmpdir(), 'designed-to-scale-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  await Promise.all(['content', 'public'].map(path =>
    cp(new URL(`../${path}`, import.meta.url), join(root, path), { recursive: true })));

  const site = await buildSite(root, { analytics: {} });
  const course = JSON.parse(await readFile(join(site, 'course.json'), 'utf8'));
  const lessons = course.chapters.flatMap(chapter => chapter.lessons);
  const { getRoute } = await import(pathToFileURL(join(site, '_board/navigation.js')));
  assert.equal(getRoute('', lessons), null);
  assert.equal(getRoute('#/', lessons), null);
  const route = getRoute('#/request-lifecycle/2', lessons);
  const step = route.lesson.steps[route.step];

  assert.equal(route.lesson.id, 'request-lifecycle');
  assert.equal(step.title, 'Find the address');
  assert.match(step.html, /<strong>Key idea\.<\/strong>/);
  assert.match(step.html, /<td><strong>Address found<\/strong><\/td>/);
  assert.equal(step.diagram.type, 'svg');
  assert.match(await readFile(join(site, 'media', step.diagram.src), 'utf8'), /<svg[^>]*xmlns=/);
  assert.doesNotMatch(await readFile(join(site, 'index.html'), 'utf8'), /googletagmanager\.com/);

  await buildSite(root, { analytics: { GOOGLE_TAG_ID: 'G-TEST123' } });
  const html = await readFile(join(site, 'index.html'), 'utf8');
  assert.match(html, /googletagmanager\.com\/gtag\/js\?id=G-TEST123/);
  assert.match(html, /addEventListener\('hashchange'.*page_view/);
});
