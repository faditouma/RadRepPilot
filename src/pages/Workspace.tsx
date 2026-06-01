import App from '../App';
import { useSupabaseSession } from '../components/auth/useSupabaseSession';

export function Workspace() {
  const { session } = useSupabaseSession();

  return (
    <main className="workspace-route">
      <section className="workspace-route-header">
        <span className="eyebrow">Workspace</span>
        <h1>Reporting Workspace</h1>
        <p>
          Draft structured educational reports, use focused calculators, and build clearer imaging requisitions without entering
          patient-identifying information.
        </p>
        <div className="workspace-account-note">
          {session
            ? 'Signed in. Preferences and saved reports are available from your dashboard.'
            : 'Use the workspace without an account. Sign in to save reports and preferences.'}
        </div>
      </section>

      <App embedded initialPage="modules" />
    </main>
  );
}
