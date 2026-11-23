import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildSite } from '@lprakashv/course-board';
import { adaptCourse, compileCourse } from './compile.js';
import { courseAsset, pageAssets, sourceAsset } from './site.js';

async function shell({ root, site, course }) {
  const data = adaptCourse(course);
  for (const asset of pageAssets) {
    const target = join(site, asset);
    await mkdir(dirname(target), { recursive: true });
    const source = join(root, sourceAsset(asset));
    if (asset === 'scripts/analytics.js') {
      const contents = await readFile(source, 'utf8');
      const marker = '/* GOOGLE_TAG_ID */ \'\'';
      if (!contents.includes(marker)) throw new Error('Google tag ID build marker is missing.');
      await writeFile(target, contents.replace(marker, JSON.stringify(process.env.GOOGLE_TAG_ID || '')));
    } else {
      await copyFile(source, target);
    }
  }
  const target = join(site, courseAsset);
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, JSON.stringify(data) + '\n');
  await writeFile(join(site, '.nojekyll'), '');
}

try {
  if (process.argv.includes('--build')) {
    await buildSite(fileURLToPath(new URL('../', import.meta.url)), { shell });
    console.log('Built the static course in dist/.');
  } else {
    await compileCourse();
    console.log('Course documents are valid.');
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
