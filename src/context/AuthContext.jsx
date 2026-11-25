import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  deleteUser,
  sendPasswordResetEmail,
  reauthenticateWithCredential,
  updatePassword,
  EmailAuthProvider,
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { APPROVAL_ROLES, ROLE, ROLE_OPTIONS, USER_STATUS, isActiveProfile } from '../utils/roles';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // user:    undefined = still checking, null = signed out, object = signed in
  // profile: undefined = still loading,  null = no users/{uid} document, object = loaded
  const [user, setUser] = useState(undefined);
  const [profile, setProfile] = useState(null);
  const [profileError, setProfileError] = useState(null);
  const [signingUp, setSigningUp] = useState(false);

  // Track the signed-in Firebase user.
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setProfile(u ? undefined : null);
      setProfileError(null);
      setUser(u);
    });
    return unsub;
  }, []);

  // Keep the Firestore profile (role / status) live. If a Super Admin changes
  // this user's role or approves/suspends the account, the UI updates at once.
  const uid = user?.uid;
  useEffect(() => {
    if (!uid) return undefined;
    const unsub = onSnapshot(
      doc(db, 'users', uid),
      (snap) => {
        setProfile(snap.exists() ? snap.data() : null);
        setProfileError(null);
      },
      (err) => {
        console.error('Failed to load user profile:', err);
        setProfile(null);
        setProfileError(err);
      }
    );
    return unsub;
  }, [uid]);

  // Records that a Super Admin exists (meta/bootstrap). The create-super-admin
  // script writes it; this also heals installs whose Super Admin pre-dates it,
  // so nobody else can claim the "first Super Admin" slot.
  const isSA = isActiveProfile(profile) && profile.role === ROLE.SUPER_ADMIN;
  useEffect(() => {
    if (!uid || !isSA) return;
    const ref = doc(db, 'meta', 'bootstrap');
    getDoc(ref)
      .then((snap) => (snap.exists() ? null : setDoc(ref, { uid, createdAt: new Date().toISOString() })))
      .catch(() => {});
  }, [uid, isSA]);

  const login = (email, password) =>
    signInWithEmailAndPassword(auth, email.trim(), password);

  const signup = async (email, password, name, role, department) => {
    // Super Admin can't be self-registered (the UI doesn't offer it either).
    if (!ROLE_OPTIONS.some((r) => r.value === role)) {
      throw Object.assign(new Error('Invalid role'), { code: 'app/invalid-role' });
    }
    setSigningUp(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      try {
        await updateProfile(cred.user, { displayName: name });

        // Sign-ups wait for a Super Admin's approval.
        const needsApproval = APPROVAL_ROLES.includes(role);

        const profileData = {
          name: name.trim(),
          email: cred.user.email,
          role,
          department: department || '',
          status: needsApproval ? USER_STATUS.PENDING : USER_STATUS.ACTIVE,
          createdAt: new Date().toISOString(),
        };

        await setDoc(doc(db, 'users', cred.user.uid), profileData);
      } catch (err) {
        // Don't leave a half-created account (auth user without a profile).
        await deleteUser(cred.user).catch(() => signOut(auth));
        throw err;
      }
      return cred;
    } finally {
      setSigningUp(false);
    }
  };

  const logout = () => {
    // The next person to sign in starts on the dashboard.
    window.history.replaceState(null, '', window.location.pathname);
    window.dispatchEvent(new Event('popstate'));
    return signOut(auth);
  };

  const resetPassword = (email) => sendPasswordResetEmail(auth, email.trim());

  // Firebase requires a recent sign-in before a password change.
  const changePassword = async (currentPassword, newPassword) => {
    const current = auth.currentUser;
    await reauthenticateWithCredential(current, EmailAuthProvider.credential(current.email, currentPassword));
    await updatePassword(current, newPassword);
  };

  // Users may change only their own name and department (see firestore.rules).
  const updateOwnProfile = async ({ name, department }) => {
    const current = auth.currentUser;
    await updateDoc(doc(db, 'users', current.uid), { name: name.trim(), department: department || '' });
    await updateProfile(current, { displayName: name.trim() });
  };

  const value = useMemo(
    () => ({ user, profile, profileError, signingUp, login, signup, logout, resetPassword, changePassword, updateOwnProfile }),
    // the actions are stable in behaviour; they only close over setters
    [user, profile, profileError, signingUp]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
