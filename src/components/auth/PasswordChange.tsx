import { useState, type FormEvent } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { setRecoveryPending } from '../../lib/authRecovery';
import { useSupabaseSession } from './useSupabaseSession';
export function PasswordChange() {
  const { session, isLoading } = useSupabaseSession();
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  async function update(event: FormEvent) {
    event.preventDefault();
    setMessage('');
    if (!session || !supabase) { setMessage('Sign in or open a fresh password-reset link first.'); return; }
    if (password !== confirmation) { setMessage('Passwords do not match.'); return; }
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) { setMessage(error.message); return; }
      setRecoveryPending(false);
      setPassword(''); setConfirmation(''); setDone(true);
    } catch { setMessage('Unable to reach account services. Your password change was not confirmed. Please try again.'); }
    finally { setBusy(false); }
  }
  if (isLoading) return <p role="status">Checking your sign-in…</p>;
  if (!session) return <p>Sign in or request a fresh reset link from <a href="/?auth=signin#/login" onClick={() => setRecoveryPending(false)}>the sign-in page</a>.</p>;
  if (done) return <section><p role="status">Your password has been updated.</p><a href="/?auth=complete#/learn">Continue to learning</a><p><a href="/?auth=complete#/preferences">Set up or edit your profile</a></p></section>;
  return <form className="auth-form" onSubmit={update}>
    <p>You are signed in. Enter and confirm a new password to finish changing it.</p>
    <label>New password<input type="password" autoComplete="new-password" required minLength={6} value={password} onChange={e => setPassword(e.target.value)} disabled={busy} /></label>
    <label>Confirm new password<input type="password" autoComplete="new-password" required minLength={6} value={confirmation} onChange={e => setConfirmation(e.target.value)} disabled={busy} /></label>
    {message ? <p role="alert">{message}</p> : null}
    <button type="submit" disabled={busy}>{busy ? 'Updating password…' : 'Update password'}</button>
  </form>;
}
