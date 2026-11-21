import { readFile } from 'node:fs/promises';
import { validateCourse } from './schema.js';
validateCourse(JSON.parse(await readFile(new URL('../content/course.json', import.meta.url))));
console.log('Course content is valid.');
