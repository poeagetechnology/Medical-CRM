import { useEffect, useRef, useState } from 'react';

// State that starts from, and follows, a URL parameter (e.g. ?q= or ?status=).
export function useParamState(params, key, fallback = '') {
  const incoming = params?.[key];
  const [value, setValue] = useState(incoming ?? fallback);
  useEffect(() => {
    if (incoming !== undefined) setValue(incoming);
  }, [incoming]);
  return [value, setValue];
}

// "?new=1" opens the page's create form (used by quick actions), then removes
// the flag so a refresh does not reopen it.
export function useCreateIntent({ params, navigate, page, allowed, open }) {
  const wants = params?.new;
  const openRef = useRef(open);
  openRef.current = open;

  useEffect(() => {
    if (!wants || !allowed) return;
    openRef.current();
    navigate?.(page, null, { replace: true });
  }, [wants, allowed, page, navigate]);
}
