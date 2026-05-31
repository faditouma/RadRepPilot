import { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { isSupabaseConfigured, supabase } from '../../lib/supabaseClient';

type AuthState = 'checking' | 'authenticated' | 'unauthenticated';

export function ProtectedRoute() {
  const location = useLocation();
  const [authState, setAuthState] = useState<AuthState>('checking');

  useEffect(() => {
    let active = true;

    async function checkSession() {
      if (!isSupabaseConfigured || !supabase) {
        setAuthState('unauthenticated');
        return;
      }

      const { data } = await supabase.auth.getSession();
      if (active) {
        setAuthState(data.session ? 'authenticated' : 'unauthenticated');
      }
    }

    void checkSession();

    if (!supabase) {
      return () => {
        active = false;
      };
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) {
        setAuthState(session ? 'authenticated' : 'unauthenticated');
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  if (authState === 'checking') {
    return (
      <main className="route-page">
        <section className="route-panel">
          <span className="eyebrow">Account</span>
          <h1>Checking access</h1>
          <p>Preparing the RadRepPilot workspace.</p>
        </section>
      </main>
    );
  }

  if (authState === 'unauthenticated') {
    return <Navigate replace state={{ from: location }} to="/login" />;
  }

  return <Outlet />;
}

