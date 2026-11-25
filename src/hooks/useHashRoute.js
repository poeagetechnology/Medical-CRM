import { useCallback, useEffect, useState } from 'react';
import { buildHash, parseHash } from '../utils/router';

// go(page, params, { replace }) + the current { page, params } from the URL.
export function useHashRoute() {
  const [route, setRoute] = useState(() => parseHash());

  useEffect(() => {
    const sync = () => setRoute(parseHash());
    window.addEventListener('hashchange', sync);
    window.addEventListener('popstate', sync);
    return () => {
      window.removeEventListener('hashchange', sync);
      window.removeEventListener('popstate', sync);
    };
  }, []);

  const go = useCallback((page, params = null, { replace = false } = {}) => {
    const hash = buildHash(page, params);
    if (hash !== window.location.hash) {
      window.history[replace ? 'replaceState' : 'pushState'](null, '', hash);
      if (!replace) window.scrollTo?.(0, 0);
    }
    setRoute(parseHash(hash));
  }, []);

  return { page: route.page, params: route.params, go };
}
