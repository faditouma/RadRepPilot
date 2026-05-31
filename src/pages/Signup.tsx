import { type FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient';
import { PageShell } from './PageShell';

export function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage('');

    if (!supabase) {
      setMessage('Supabase is not configured yet. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your local .env file.');
      return;
    }

    setIsSubmitting(true);
    const { error } = await supabase.auth.signUp({ email, password });
    setIsSubmitting(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage('Signup request sent. Check email confirmation settings in Supabase before using this clinically.');
  }

  return (
    <PageShell
      eyebrow="Account"
      title="Signup"
      description="Create a RadRepPilot workspace account. This remains prototype-only and must not store PHI."
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
            autoComplete="new-password"
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
          <div className="auth-notice" role="status">
            {message}
          </div>
        ) : null}

        <button className="auth-submit" disabled={!isSupabaseConfigured || isSubmitting} type="submit">
          {isSubmitting ? 'Creating account...' : 'Create account'}
        </button>
      </form>

      <p className="auth-switch">
        Already have an account? <Link to="/login">Sign in</Link>
      </p>
    </PageShell>
  );
}
