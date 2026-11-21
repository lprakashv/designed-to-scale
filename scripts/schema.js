export function validateCourse(course) {
  const ids = new Set();
  const text = value => typeof value === 'string' && value.trim().length > 0;
  if (!Array.isArray(course?.chapters) || !course.chapters.length) throw new Error('Course needs at least one chapter');
  for (const chapter of course.chapters) {
    if (!text(chapter.title) || !Array.isArray(chapter.lessons) || !chapter.lessons.length) throw new Error('Each chapter needs a title and lessons');
    for (const lesson of chapter.lessons) {
      if (!text(lesson.id) || !/^[a-z0-9-]+$/.test(lesson.id) || ids.has(lesson.id)) throw new Error(`Invalid or duplicate lesson ID: ${lesson.id}`);
      ids.add(lesson.id);
      if (!text(lesson.title) || !text(lesson.summary) || !Array.isArray(lesson.nodes) || lesson.nodes.length < 2 || lesson.nodes.length > 4 || !lesson.nodes.every(text)) throw new Error(`Invalid lesson: ${lesson.id}`);
      if (!Array.isArray(lesson.sections) || !lesson.sections.length) throw new Error(`Lesson needs sections: ${lesson.id}`);
      for (const section of lesson.sections) {
        if (!text(section.title) || !text(section.body) || (section.note !== undefined && !text(section.note)) || !Array.isArray(section.active) || !section.active.length || !section.active.every(i => Number.isInteger(i) && i >= 0 && i < lesson.nodes.length)) throw new Error(`Invalid section in ${lesson.id}`);
        if (section.links !== undefined && (!Array.isArray(section.links) || !section.links.every(link => Array.isArray(link) && link.length === 2 && link[0] !== link[1] && link.every(i => Number.isInteger(i) && i >= 0 && i < lesson.nodes.length)))) throw new Error(`Invalid links in ${lesson.id}`);
      }
    }
  }
}
