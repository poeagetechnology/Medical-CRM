import { useState, useEffect, useCallback } from 'react';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, writeBatch } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { canReadCollection, canWriteCollection, canDeleteCollection } from '../utils/roles';

const denied = (action, name) =>
  Promise.reject(new Error(`Your role is not allowed to ${action} "${name}".`));

// Fired when a live query fails; the app shell shows a banner.
export const READ_ERROR = 'medcrm:read-error';

// Firestore allows at most 500 writes per batch.
const BATCH_SIZE = 450;

async function inBatches(items, apply) {
  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const batch = writeBatch(db);
    items.slice(i, i + BATCH_SIZE).forEach((item) => apply(batch, item));
    await batch.commit();
  }
}

export function useCollection(collectionName) {
  const { user, profile } = useAuth();
  const uid = user?.uid;
  const role = profile?.role;
  const status = profile?.status;

  // Only subscribe to collections this role may read. Anything else returns an
  // empty list instead of a Firestore "permission-denied" error.
  const canRead = canReadCollection(profile, collectionName);
  const canWrite = canWriteCollection(profile, collectionName);
  const canDelete = canDeleteCollection(profile, collectionName);

  // Audit fields. The `users` collection is managed by Super Admin rules and
  // is left untouched.
  const skipAudit = collectionName === 'users';

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(canRead);
  const [error, setError] = useState(null);

  useEffect(() => {
    setError(null);
    if (!canRead) {
      setData([]);
      setLoading(false);
      return undefined;
    }
    setLoading(true);
    const unsub = onSnapshot(
      collection(db, collectionName),
      (snap) => {
        setData(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (err) => {
        console.error(`Failed to read "${collectionName}":`, err);
        window.dispatchEvent(new CustomEvent(READ_ERROR, { detail: { name: collectionName, code: err.code } }));
        setError(err);
        setData([]);
        setLoading(false);
      }
    );
    return unsub;
    // role/status are part of canRead; listed so a role change re-subscribes
  }, [collectionName, canRead, role, status]);

  const created = useCallback(
    (item) => (skipAudit ? item : { ...item, createdAt: new Date().toISOString(), createdBy: uid || null }),
    [skipAudit, uid]
  );
  const updated = useCallback(
    (changes) => (skipAudit ? changes : { ...changes, updatedAt: new Date().toISOString(), updatedBy: uid || null }),
    [skipAudit, uid]
  );

  const add = useCallback(
    (item) =>
      canWrite ? addDoc(collection(db, collectionName), created(item)) : denied('add to', collectionName),
    [canWrite, collectionName, created]
  );

  const addMany = useCallback(
    (items) =>
      canWrite
        ? inBatches(items, (batch, item) => batch.set(doc(collection(db, collectionName)), created(item)))
        : denied('add to', collectionName),
    [canWrite, collectionName, created]
  );

  const update = useCallback(
    (id, changes) =>
      canWrite ? updateDoc(doc(db, collectionName, id), updated(changes)) : denied('update', collectionName),
    [canWrite, collectionName, updated]
  );

  const updateMany = useCallback(
    (ids, changes) =>
      canWrite
        ? inBatches(ids, (batch, id) => batch.update(doc(db, collectionName, id), updated(changes)))
        : denied('update', collectionName),
    [canWrite, collectionName, updated]
  );

  const remove = useCallback(
    (id) => (canDelete ? deleteDoc(doc(db, collectionName, id)) : denied('delete from', collectionName)),
    [canDelete, collectionName]
  );

  const removeMany = useCallback(
    (ids) =>
      canDelete
        ? inBatches(ids, (batch, id) => batch.delete(doc(db, collectionName, id)))
        : denied('delete from', collectionName),
    [canDelete, collectionName]
  );

  return { data, loading, error, add, addMany, update, updateMany, remove, removeMany, canRead, canWrite, canDelete };
}
