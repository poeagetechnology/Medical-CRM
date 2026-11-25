import { useCallback, useEffect, useState } from 'react';

// Light / dark / system. The saved value is also applied by public/index.html
// before React loads, so there is no flash of the wrong theme.
const KEY = 'medcrm_theme';
const EVENT = 'medcrm:theme';

const read = () => {
  try { return localStorage.getItem(KEY) || 'light'; } catch { return 'light'; }
};

const media = () => window.matchMedia?.('(prefers-color-scheme: dark)');

const resolve = (theme) => (theme === 'system' ? (media()?.matches ? 'dark' : 'light') : theme);

const apply = (theme) => document.documentElement.classList.toggle('dark', resolve(theme) === 'dark');

export function useTheme() {
  const [theme, setThemeState] = useState(read);

  useEffect(() => {
    const sync = () => setThemeState(read());
    window.addEventListener(EVENT, sync);
    return () => window.removeEventListener(EVENT, sync);
  }, []);

  useEffect(() => {
    apply(theme);
    if (theme !== 'system') return undefined;
    const m = media();
    const onChange = () => apply('system');
    m?.addEventListener?.('change', onChange);
    return () => m?.removeEventListener?.('change', onChange);
  }, [theme]);

  const setTheme = useCallback((next) => {
    try { localStorage.setItem(KEY, next); } catch { /* storage blocked */ }
    setThemeState(next);
    apply(next);
    window.dispatchEvent(new Event(EVENT));
  }, []);

  return { theme, isDark: resolve(theme) === 'dark', setTheme };
}
