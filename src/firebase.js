import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
};

if (process.env.NODE_ENV !== 'production' && !firebaseConfig.apiKey) {
  // eslint-disable-next-line no-console
  console.error('Missing Firebase env vars. Copy .env.example to .env.local and fill it in.');
}

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
// Firebase 12 streams Firestore over fetch() by default in the browser. Every
// time a listener closes, that transport aborts its fetch and leaks an
// unhandled "AbortError: signal is aborted without reason" rejection, which
// the dev overlay shows as a crash. The XHR transport has no such leak and
// behaves identically for onSnapshot/reads/writes.
export const db = initializeFirestore(app, { useFetchStreams: false });
export default app;
