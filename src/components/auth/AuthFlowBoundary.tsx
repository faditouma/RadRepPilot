import { useEffect, useState, type ReactNode } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { initialRecoveryPending, setRecoveryPending } from '../../lib/authRecovery';
import { AuthCallback } from '../../pages/AuthCallback';
export function AuthFlowBoundary({ children }: { children: ReactNode }) {
  const [recovery, setRecovery] = useState(initialRecoveryPending);
  useEffect(() => {
    const subscription = supabase?.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setRecoveryPending(true);
        setRecovery(true);
      }
      if (event === 'SIGNED_OUT') {
        setRecoveryPending(false);
        setRecovery(false);
      }
    });
    return () => subscription?.data.subscription.unsubscribe();
  }, []);
  return recovery || window.location.pathname.endsWith('/auth/callback')
    ? <AuthCallback forceRecovery={recovery} /> : children;
}
