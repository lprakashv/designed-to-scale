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
