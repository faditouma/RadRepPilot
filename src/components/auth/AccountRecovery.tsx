import { useState } from "react";
import { supabase } from "../../lib/supabaseClient";
export function AccountRecovery({ email }: { email: string }) {
  const [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  async function send(kind: "confirmation" | "password") {
    if (!email.trim()) {
      setMessage("Enter your email address above first.");
      return;
    }
    setBusy(true);
    try {
      const redirectTo = `${location.origin}/auth/callback${kind === "password" ? "?mode=recovery" : ""}`;
      const result =
        kind === "confirmation"
          ? await supabase!.auth.resend({
              type: "signup",
              email: email.trim(),
              options: { emailRedirectTo: redirectTo },
            })
          : await supabase!.auth.resetPasswordForEmail(email.trim(), {
              redirectTo,
            });
      setMessage(
        result.error
          ? result.error.message
          : kind === "confirmation"
            ? "If confirmation is needed, check your inbox and spam folder for the confirmation email. After confirming, return here to sign in."
            : "If this address has an account, check your email for a password-reset link.",
      );
    } catch {
      setMessage("Unable to reach account services. Please try again.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="auth-recovery">
      <p>
        Confirm your email after signup. If you already have an account, use
        password recovery instead of creating another account.
      </p>
      <div className="button-row">
        <button
          type="button"
          disabled={busy || !supabase}
          onClick={() => send("confirmation")}
        >
          Resend confirmation email
        </button>
        <button
          type="button"
          disabled={busy || !supabase}
          onClick={() => send("password")}
        >
          Forgot password
        </button>
      </div>
      {message ? <p role="status">{message}</p> : null}
    </section>
  );
}
