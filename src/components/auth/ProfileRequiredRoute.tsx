import { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { loadProfile } from '../../lib/userData';
import { useSupabaseSession } from './useSupabaseSession';

type ProfileState = 'checking' | 'ready' | 'missing';

export function ProfileRequiredRoute() {
  const location = useLocation();
  const { isLoading, session } = useSupabaseSession();
  const [profileState, setProfileState] = useState<ProfileState>('checking');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let active = true;

    async function checkProfile() {
      if (isLoading) return;
      if (!session) {
        setProfileState('missing');
        return;
      }

      try {
        const profile = await loadProfile(session.user.id);
        if (active) setProfileState(profile ? 'ready' : 'missing');
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to load profile.';
        if (active) {
          setErrorMessage(message);
          setProfileState('missing');
        }
      }
    }

    void checkProfile();

    return () => {
      active = false;
    };
  }, [isLoading, session]);

  if (isLoading || profileState === 'checking') {
    return (
      <main className="route-page">
        <section className="route-panel">
          <span className="eyebrow">Account</span>
          <h1>Loading profile</h1>
          <p>Checking your RadRepPilot workspace setup.</p>
        </section>
      </main>
    );
  }

  if (profileState === 'missing') {
    return <Navigate replace state={{ from: location, message: errorMessage }} to="/account-setup" />;
  }

  return <Outlet />;
}

