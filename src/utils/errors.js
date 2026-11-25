// Turns Firebase / app errors into sentences a user can act on.
const MESSAGES = {
  'permission-denied': 'The server refused this action. Your role may not allow it, or the latest firestore.rules are not deployed.',
  unavailable: 'Cannot reach the server. Check your connection and try again.',
  'not-found': 'This record no longer exists. It may have been deleted by someone else.',
  'auth/network-request-failed': 'Network error. Check your connection and try again.',
  'auth/too-many-requests': 'Too many attempts. Please wait a moment and try again.',
  'auth/invalid-credential': 'The email or password is incorrect.',
  'auth/wrong-password': 'The password is incorrect.',
  'auth/user-not-found': 'No account was found with this email.',
  'auth/invalid-email': 'That email address is not valid.',
  'auth/email-already-in-use': 'This email is already registered.',
  'auth/weak-password': 'Choose a stronger password (at least 6 characters).',
  'auth/requires-recent-login': 'Please sign out, sign in again and retry.',
  'auth/user-disabled': 'This account has been disabled.',
};

export const errorMessage = (err, fallback = 'Something went wrong. Please try again.') =>
  MESSAGES[err?.code] || (err?.code ? fallback : err?.message) || fallback;
