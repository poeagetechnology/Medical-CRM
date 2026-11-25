import React, { useState } from 'react';
import { ArrowRight, MailCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { errorMessage } from '../../utils/errors';
import { Button, Notice } from '../../components/ui';
import AuthLayout, { PasswordInput } from './AuthLayout';

export default function Login({ onSwitchToSignup }) {
  const { login, resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setInfo('');
    if (!email.trim() || !password) { setError('Enter your email and password.'); return; }
    setError('');
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(errorMessage(err, 'Sign in failed. Please try again.'));
      setLoading(false);
    }
  };

  const forgot = async () => {
    setError('');
    setInfo('');
    if (!email.trim()) { setError('Enter your email above, then choose "Forgot password?".'); return; }
    try {
      await resetPassword(email);
      setInfo(`If an account exists for ${email.trim()}, a password reset link is on its way.`);
    } catch (err) {
      setError(errorMessage(err, 'Could not send the reset email.'));
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to continue to your workspace."
      footer={
        <>
          New to MedCRM?{' '}
          <button type="button" onClick={onSwitchToSignup} className="font-bold text-brand-600 hover:underline">Create an account</button>
        </>
      }
    >
      <form onSubmit={submit} noValidate className="space-y-4">
        {error && <Notice tone="red"><span role="alert">{error}</span></Notice>}
        {info && <Notice tone="green" icon={MailCheck}>{info}</Notice>}
        <div>
          <label htmlFor="login-email" className="label">Work email</label>
          <input id="login-email" type="email" autoComplete="email" autoFocus value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@hospital.com" className="input" />
        </div>
        <div>
          <div className="flex items-center justify-between">
            <label htmlFor="login-password" className="label">Password</label>
            <button type="button" onClick={forgot} className="text-xs font-semibold text-brand-600 hover:underline mb-1.5">Forgot password?</button>
          </div>
          <PasswordInput id="login-password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Your password" />
        </div>
        <Button type="submit" variant="primary" size="lg" loading={loading} iconRight={ArrowRight} className="w-full">
          {loading ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>
    </AuthLayout>
  );
}
