import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "../lib/supabaseClient";
import { useSupabaseSession } from "../components/auth/useSupabaseSession";
export function AuthCallback() {
  const { session, isLoading } = useSupabaseSession();
  const [password, setPassword] = useState(""),
    [confirmation, setConfirmation] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  const recovery =
    new URLSearchParams(location.search).get("mode") === "recovery";
  useEffect(() => {
    const params = new URLSearchParams(location.hash.slice(1));
    const error =
      params.get("error_description") ||
      new URLSearchParams(location.search).get("error_description");
    if (error) setMessage(error);
  }, []);
  async function update(e: FormEvent) {
    e.preventDefault();
    if (password !== confirmation) {
      setMessage("Passwords do not match.");
      return;
    }
    setBusy(true);
    const { error } = await supabase!.auth.updateUser({ password });
    setBusy(false);
    if (error) setMessage(error.message);
    else location.replace("/#/learn");
  }
  return (
    <main className="edu-case-library">
      <h1>{recovery ? "Set a new password" : "Confirm RadRepPilot account"}</h1>
      {message ? <p role="alert">{message}</p> : null}
      {isLoading ? (
        <p role="status">Checking the email link…</p>
      ) : session ? (
        recovery ? (
          <form className="auth-form" onSubmit={update}>
            <label>
              New password
              <input
                type="password"
                autoComplete="new-password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
            <label>
              Confirm new password
              <input
                type="password"
                autoComplete="new-password"
                required
                minLength={6}
                value={confirmation}
                onChange={(e) => setConfirmation(e.target.value)}
              />
            </label>
            <button disabled={busy}>Update password</button>
          </form>
        ) : (
          <>
            <p>Your account is signed in.</p>
            <a href="/#/learn">Open the learning library</a>
          </>
        )
      ) : (
        <>
          <p>
            This link may be expired or already used. Return to sign-in to
            request a new confirmation or reset email.
          </p>
          <a href="/#/login">Return to sign-in</a>
        </>
      )}
    </main>
  );
}
