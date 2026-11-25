/* One-off bootstrap: creates the first Super Admin account.
 *
 *   npm run create-super-admin
 *   SUPER_ADMIN_EMAIL=me@x.com SUPER_ADMIN_PASSWORD=secret npm run create-super-admin
 *
 * Reads the Firebase config from .env / .env.local (REACT_APP_FIREBASE_*).
 * With no password given, a random one is generated and printed ONCE.
 * Run it after deploying firestore.rules.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

for (const f of ['.env', '.env.local']) {
  const p = path.join(__dirname, '..', f);
  if (!fs.existsSync(p)) continue;
  for (const line of fs.readFileSync(p, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}

const { initializeApp } = require('firebase/app');
const { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } = require('firebase/auth');
const { getFirestore, doc, getDoc, writeBatch } = require('firebase/firestore');

const E = process.env;
const app = initializeApp({
  apiKey: E.REACT_APP_FIREBASE_API_KEY,
  authDomain: E.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: E.REACT_APP_FIREBASE_PROJECT_ID,
  appId: E.REACT_APP_FIREBASE_APP_ID,
});
const auth = getAuth(app);
const db = getFirestore(app);

const email = (E.SUPER_ADMIN_EMAIL || 'superadmin@medcrm.local').trim().toLowerCase();
const generated = !E.SUPER_ADMIN_PASSWORD;
const password =
  E.SUPER_ADMIN_PASSWORD ||
  crypto.randomBytes(12).toString('base64').replace(/[+/=]/g, 'x') + 'A1!';

(async () => {
  if (!E.REACT_APP_FIREBASE_API_KEY) throw new Error('Firebase env vars missing (.env).');

  let cred;
  try {
    cred = await createUserWithEmailAndPassword(auth, email, password);
  } catch (e) {
    if (e.code !== 'auth/email-already-in-use') throw e;
    console.log('Auth user already exists - signing in with the given password.');
    cred = await signInWithEmailAndPassword(auth, email, password);
  }
  await updateProfile(cred.user, { displayName: 'Super Admin' });

  const existing = await getDoc(doc(db, 'users', cred.user.uid));
  if (existing.exists() && existing.data().role === 'Super Admin' && existing.data().status === 'Active') {
    console.log('This account is already an active Super Admin.');
  } else {
    const now = new Date().toISOString();
    const batch = writeBatch(db);
    batch.set(doc(db, 'users', cred.user.uid), {
      name: 'Super Admin', email: cred.user.email, role: 'Super Admin',
      department: 'Administration', status: 'Active', createdAt: now,
    });
    batch.set(doc(db, 'meta', 'bootstrap'), { uid: cred.user.uid, createdAt: now });
    await batch.commit();
  }

  console.log('\n=== Super Admin ready ===');
  console.log('Email   :', email);
  console.log('Password:', generated ? password : '(the one you supplied)');
  console.log('Sign in on the Login page, then change the password.\n');
  process.exit(0);
})().catch((e) => {
  console.error('\nFailed:', e.code || '', e.message);
  if (e.code === 'permission-denied' || /PERMISSION_DENIED/.test(e.message)) {
    console.error('Firestore refused the write. A Super Admin may already exist, or the rules are not what this script expects.');
  }
  process.exit(1);
});
