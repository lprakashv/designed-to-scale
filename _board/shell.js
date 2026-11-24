export function setPageTitle(course, route, pageTitle) {
  const lesson = route?.lesson ?? null;
  const step = route?.step ?? null;
  const fallback = lesson ? `${lesson.title} · ${course.title}` : course.title;
  try {
    const title = pageTitle?.({ course, lesson, step });
    document.title = typeof title === 'string' && title.trim() ? title : fallback;
  } catch (error) {
    document.title = fallback;
    console.warn('The course page title hook failed.', error);
  }
}

export function createCourseShell({ readRoute, storageKey, target = window }) {
  return {
    route: () => readRoute(target.location.hash),
    readState(fallback) {
      try {
        return JSON.parse(target.localStorage.getItem(storageKey)) ?? fallback;
      } catch {
        return fallback;
      }
    },
    writeState(value) {
      try {
        target.localStorage.setItem(storageKey, JSON.stringify(value));
      } catch {
        // The course still works when storage is unavailable.
      }
    },
    start({ render, onNavigate = render }) {
      render();
      target.addEventListener('hashchange', onNavigate);
      return () => target.removeEventListener('hashchange', onNavigate);
    },
  };
}
