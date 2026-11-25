import React from 'react';
import { useAuth } from '../context/AuthContext';
import { RecordForm } from './ui';
import { errorMessage } from '../utils/errors';

export default function ChangePassword({ onClose }) {
  const { changePassword } = useAuth();

  const submit = async ({ current, next }) => {
    try {
      await changePassword(current, next);
    } catch (err) {
      const wrong = err?.code === 'auth/invalid-credential' || err?.code === 'auth/wrong-password';
      throw new Error(wrong ? 'Your current password is incorrect.' : errorMessage(err));
    }
  };

  return (
    <RecordForm
      width="max-w-md"
      title="Change password"
      submitLabel="Update password"
      successMessage="Password changed"
      fields={[
        { name: 'current', label: 'Current password', type: 'password', required: true, full: true },
        { name: 'next', label: 'New password', type: 'password', required: true, full: true, hint: 'At least 8 characters.' },
        { name: 'confirm', label: 'Confirm new password', type: 'password', required: true, full: true },
      ]}
      validate={(v) =>
        v.next.length < 8 ? 'The new password must be at least 8 characters.'
          : v.next !== v.confirm ? 'The new passwords do not match.'
            : v.next === v.current ? 'The new password must be different from the current one.'
              : null}
      onSubmit={submit}
      onClose={onClose}
    />
  );
}
