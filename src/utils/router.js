// Tiny hash router: "#/patients?status=Critical" <-> { page, params }.
// Hash routing gives working back/forward buttons, refresh and deep links
// without any server configuration.

export function parseHash(hash = window.location.hash) {
  const clean = String(hash || '').replace(/^#\/?/, '');
  const [path, qs = ''] = clean.split('?');
  const params = Object.fromEntries(new URLSearchParams(qs));
  return {
    page: decodeURIComponent(path || ''),
    params: Object.keys(params).length ? params : null,
  };
}

export function buildHash(page, params) {
  const entries = Object.entries(params || {}).filter(
    ([, v]) => v !== undefined && v !== null && v !== ''
  );
  const qs = entries.length ? `?${new URLSearchParams(entries).toString()}` : '';
  return `#/${page}${qs}`;
}
