export function validateCourse(course) {
  const ids = new Set();
  const text = value => typeof value === 'string' && value.trim().length > 0;
  if (!Array.isArray(course?.chapters) || !course.chapters.length) throw new Error('Course needs at least one chapter');
  for (const chapter of course.chapters) {
    if (!text(chapter.title) || !Array.isArray(chapter.lessons) || !chapter.lessons.length) throw new Error('Each chapter needs a title and lessons');
    for (const lesson of chapter.lessons) {
      if (!text(lesson.id) || !/^[a-z0-9-]+$/.test(lesson.id) || ids.has(lesson.id)) throw new Error(`Invalid or duplicate lesson ID: ${lesson.id}`);
      ids.add(lesson.id);
      if (lesson.original !== undefined && typeof lesson.original !== 'boolean') throw new Error(`Invalid original lesson flag: ${lesson.id}`);
      const { nodes } = lesson;
      if (!text(lesson.title) || !text(lesson.summary) || !Array.isArray(nodes) || nodes.length < 2
          || !nodes.every(node => Array.isArray(node) && node.length === 2 && node.every(text))
          || new Set(nodes.map(([name]) => name)).size !== nodes.length) throw new Error(`Invalid lesson: ${lesson.id}`);
      const slots = lesson.layout;
      if (slots !== undefined && (!Array.isArray(slots) || slots.length !== nodes.length || !slots.every((slot, i) =>
        Array.isArray(slot) && slot.length === 2 && slot.every(value => typeof value === 'number'
          && Number.isInteger(value * 2) && value >= 0 && value <= nodes.length)
        && slots.slice(0, i).every(([x, y]) => Math.abs(x - slot[0]) >= 1 || Math.abs(y - slot[1]) >= 1)))) {
        throw new Error(`Invalid diagram layout in ${lesson.id}`);
      }
      const nodeIndex = value => Number.isInteger(value) && value >= 0 && value < nodes.length;
      const labels = lesson.statusLabels;
      if (labels !== undefined && (!Array.isArray(labels) || !labels.length || !labels.every(text))) throw new Error(`Invalid status labels: ${lesson.id}`);
      if (!Array.isArray(lesson.sections) || !lesson.sections.length) throw new Error(`Lesson needs sections: ${lesson.id}`);
      for (const section of lesson.sections) {
        if (!text(section.title) || !text(section.body) || (section.note !== undefined && !text(section.note)) || !Array.isArray(section.active) || !section.active.length || !section.active.every(nodeIndex)) throw new Error(`Invalid section in ${lesson.id}`);
        if (section.bodyHtml !== undefined && !text(section.bodyHtml)) throw new Error(`Invalid rendered prose in ${lesson.id}: ${section.title}`);
        const links = section.links === undefined ? [] : section.links;
        if (!Array.isArray(links)
            || !links.every(link => Array.isArray(link) && link.length === 3 && nodeIndex(link[0]) && nodeIndex(link[1])
              && link[0] !== link[1] && text(link[2]))
            || new Set(links.map(([from, to]) => `${from}>${to}`)).size !== links.length) {
          throw new Error(`Invalid links in ${lesson.id}: ${section.title}`);
        }
        const { callouts } = section;
        if (!Array.isArray(callouts) || !callouts.length
            || !callouts.every(note => Array.isArray(note) && note.length === 2 && nodeIndex(note[0]) && text(note[1]))
            || new Set(callouts.map(([node]) => node)).size !== callouts.length) {
          throw new Error(`Invalid diagram callouts in ${lesson.id}: ${section.title}`);
        }
        if ((labels || section.status !== undefined) &&
            (!Array.isArray(section.status) || section.status.length !== labels?.length || !section.status.every(text))) {
          throw new Error(`Invalid diagram status in ${lesson.id}: ${section.title}`);
        }
        if (!text(section.visualNote)) throw new Error(`Invalid diagram note in ${lesson.id}: ${section.title}`);
      }
    }
  }
}
