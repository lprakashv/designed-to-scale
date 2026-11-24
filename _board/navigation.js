export function lessonHref(id, step = 0) {
  return `#/${id}/${typeof step === 'string' ? step : step + 1}`;
}

export function getRoute(hash, lessons) {
  if (!lessons.length || !hash || hash === '#' || hash === '#/') return null;
  const match = /^#\/([a-z0-9-]+)(?:\/([a-z0-9-]+))?\/?$/.exec(hash);
  const index = lessons.findIndex(lesson => lesson.id === match?.[1]);
  if (index < 0) return { lesson: lessons[0], index: 0, step: 0 };
  const lesson = lessons[index];
  const target = match[2] ?? '1';
  if (/^\d+$/.test(target)) {
    const stepNumber = Math.min(lesson.steps.length, Math.max(1, Number(target)));
    return { lesson, index, step: stepNumber - 1 };
  }
  const step = Math.max(0, lesson.steps.findIndex(item => item.id === target));
  return { lesson, index, step };
}
