import type { Session } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';
import { isSupabaseConfigured, supabase } from '../../lib/supabaseClient';

export function useSupabaseSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function readSession() {
      if (!isSupabaseConfigured || !supabase) {
        setIsLoading(false);
        return;
      }

      const { data } = await supabase.auth.getSession();
      if (active) {
        setSession(data.session);
        setIsLoading(false);
      }
    }

    void readSession();

    if (!supabase) {
      return () => {
        active = false;
      };
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (active) {
        setSession(nextSession);
        setIsLoading(false);
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  async function signOut() {
    if (!supabase) return;
    await supabase.auth.signOut();
    setSession(null);
  }

  return {
    isConfigured: isSupabaseConfigured,
    isLoading,
    session,
    signOut,
  };
}

