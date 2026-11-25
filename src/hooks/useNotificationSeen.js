import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';

// Per-user "notifications read up to" marker, kept in localStorage so the
// header badge and the Notifications page agree on what is unread.
const EVENT = 'medcrm:notif-seen';

const read = (uid) => {
  try { return localStorage.getItem(`medcrm_notif_seen_${uid}`) || ''; } catch { return ''; }
};

export function useNotificationSeen() {
  const { user } = useAuth();
  const uid = user?.uid;
  const [seen, setSeen] = useState(() => read(uid));

  useEffect(() => {
    setSeen(read(uid));
    const onChange = () => setSeen(read(uid));
    window.addEventListener(EVENT, onChange);
    return () => window.removeEventListener(EVENT, onChange);
  }, [uid]);

  const markAllRead = useCallback(() => {
    try { localStorage.setItem(`medcrm_notif_seen_${uid}`, new Date().toISOString()); } catch { /* storage blocked */ }
    window.dispatchEvent(new Event(EVENT));
  }, [uid]);

  // A notification is unread when it was created after the marker.
  const isUnread = useCallback((n) => !!n.createdAt && n.createdAt > seen, [seen]);

  return { isUnread, markAllRead };
}
