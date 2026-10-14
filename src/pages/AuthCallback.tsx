import { useEffect, useState } from 'react';
import { useSupabaseSession } from '../components/auth/useSupabaseSession';
import { PasswordChange } from '../components/auth/PasswordChange';
import { isRecoveryLocation, setRecoveryPending } from '../lib/authRecovery';
export function AuthCallback({ forceRecovery = false }: { forceRecovery?: boolean }) {
  const { session, isLoading } = useSupabaseSession();
  const [error, setError] = useState('');
  const recovery = forceRecovery || isRecoveryLocation(location.search, location.hash);
  useEffect(() => {
    const params = new URLSearchParams(location.hash.slice(1));
    setError(params.get('error_description') || new URLSearchParams(location.search).get('error_description') || '');
  }, []);
  return <main className="route-page"><section className="route-panel">
    <h1>{recovery ? 'Set a new password' : 'Confirm RadRepPilot account'}</h1>
    {error ? <p role="alert">{error}</p> : null}
    {isLoading ? <p role="status">Checking the email link…</p> : session ? recovery ? <PasswordChange /> : <><p>Your account is signed in.</p><a href="/#/learn">Open the learning library</a><p><a href="/#/account/security">Change your password</a></p></> : <><p>This link may be expired or already used.</p><a href="/?auth=signin#/login" onClick={() => setRecoveryPending(false)}>Return to sign-in to request a fresh link</a></>}
  </section></main>;
}
