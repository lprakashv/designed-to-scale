import { randomUUID } from 'node:crypto';
import { copyFile, mkdir, rename, rm, writeFile } from 'node:fs/promises';
import { compileCourse } from './compile.js';
import { courseAsset, pageAssets, sourceAsset } from './site.js';

async function build(course) {
  const root = new URL('../', import.meta.url);
  const output = new URL('dist/', root);
  for (const asset of pageAssets) {
    const target = new URL(asset, output);
    await mkdir(new URL('.', target), { recursive: true });
    await copyFile(new URL(sourceAsset(asset), root), target);
  }

  const target = new URL(courseAsset, output);
  await mkdir(new URL('.', target), { recursive: true });
  const staging = new URL(`.${randomUUID()}.json`, target);
  try {
    await writeFile(staging, JSON.stringify(course) + '\n');
    await rename(staging, target);
  } finally {
    await rm(staging, { force: true });
  }
}

try {
  const course = await compileCourse();
  if (process.argv.includes('--build')) {
    await build(course);
    console.log('Built the static course in dist/.');
  } else {
    console.log('Course documents are valid.');
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
