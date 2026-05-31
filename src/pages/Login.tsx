import { type FormEvent, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSupabaseSession } from '../components/auth/useSupabaseSession';
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient';
import { PageShell } from './PageShell';

export function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { isLoading, session } = useSupabaseSession();

  const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? '/dashboard';

  useEffect(() => {
    if (!isLoading && session) {
      navigate('/dashboard', { replace: true });
    }
  }, [isLoading, navigate, session]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage('');

    if (!supabase) {
      setMessage('Supabase is not configured yet. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your local .env file.');
      return;
    }

    setIsSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setIsSubmitting(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage('Signed in successfully. Opening your dashboard...');
    navigate(from, { replace: true });
  }

  return (
    <PageShell
      eyebrow="Account"
      title="Login"
      description="Sign in to the RadRepPilot workspace. Do not enter patient-identifying information."
    >
      <form className="auth-form" onSubmit={handleSubmit}>
        <label>
          Email
          <input
            autoComplete="email"
            disabled={!isSupabaseConfigured || isSubmitting}
            onChange={(event) => setEmail(event.target.value)}
            required
            type="email"
            value={email}
          />
        </label>

        <label>
          Password
          <input
            autoComplete="current-password"
            disabled={!isSupabaseConfigured || isSubmitting}
            minLength={6}
            onChange={(event) => setPassword(event.target.value)}
            required
            type="password"
            value={password}
          />
        </label>

        {!isSupabaseConfigured ? (
          <div className="auth-notice" role="status">
            Supabase is ready in code, but local environment values are missing. Create a `.env` file from `.env.example`.
          </div>
        ) : null}

        {message ? (
          <div className="auth-notice" role="alert">
            {message}
          </div>
        ) : null}

        <button className="auth-submit" disabled={!isSupabaseConfigured || isSubmitting} type="submit">
          {isSubmitting ? 'Signing in...' : 'Sign in'}
        </button>
      </form>

      <p className="auth-switch">
        Need an account? <Link to="/signup">Create one</Link>
      </p>
    </PageShell>
  );
}
