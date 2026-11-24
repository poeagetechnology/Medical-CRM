import { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';

export function useCollection(collectionName) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ref = collection(db, collectionName);
    const unsub = onSnapshot(ref, (snap) => {
      setData(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, [collectionName]);

  const add = (item) => addDoc(collection(db, collectionName), item);

  const update = (id, changes) => updateDoc(doc(db, collectionName, id), changes);

  const remove = (id) => deleteDoc(doc(db, collectionName, id));

  return { data, loading, add, update, remove };
}
