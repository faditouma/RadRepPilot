import { AccountRecovery } from "../components/auth/AccountRecovery";
import { type FormEvent, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useSupabaseSession } from "../components/auth/useSupabaseSession";
import { isSupabaseConfigured, supabase } from "../lib/supabaseClient";
import { PageShell } from "./PageShell";
import { useI18n } from "../i18n/I18nContext";

export function Login() {
  const { text } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { isLoading, session } = useSupabaseSession();

  const from =
    (location.state as { from?: { pathname?: string } } | null)?.from
      ?.pathname ?? "/dashboard";

  useEffect(() => {
    if (!isLoading && session) {
      navigate(from, { replace: true });
    }
  }, [isLoading, navigate, session, from]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    if (!supabase) {
      setMessage(
        "Supabase is not configured yet. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your local .env file.",
      );
      return;
    }

    setIsSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setIsSubmitting(false);

    if (error) {
      setMessage(
        error.code === "invalid_credentials"
          ? "The email and password were not accepted. If you recently signed up, confirm your email; otherwise use Forgot password below."
          : error.message,
      );
      return;
    }

    setMessage("Signed in successfully. Opening your dashboard...");
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
          {text("Email")}
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
          {text("Password")}
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
            Supabase is ready in code, but local environment values are missing.
            Create a `.env` file from `.env.example`.
          </div>
        ) : null}

        {message ? (
          <div className="auth-notice" role="alert">
            {message}
          </div>
        ) : null}

        <button
          className="auth-submit"
          disabled={!isSupabaseConfigured || isSubmitting}
          type="submit"
        >
          {text(isSubmitting ? "Signing in..." : "Sign in")}
        </button>
      </form>

      <AccountRecovery email={email} />
      <p className="auth-switch">
        {text("Need an account?")}{" "}
        <Link to="/signup">{text("Create one")}</Link>
      </p>
    </PageShell>
  );
}
