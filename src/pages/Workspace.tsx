import App from '../App';
import { useSupabaseSession } from '../components/auth/useSupabaseSession';

export function Workspace() {
  const { session } = useSupabaseSession();

  return (
    <main className="workspace-route">
      <section className="workspace-route-header">
        <span className="eyebrow">Workspace</span>
        <h1>RadRepPilot reporting workspace</h1>
        <p>
          Practise structured reporting, draft impressions, use calculators, and build clearer educational requisitions without
          signing in.
        </p>
        <div className="workspace-account-note">
          {session
            ? 'Signed in. Saved reports and preferences are available from the dashboard.'
            : 'You can use this workspace without an account. Create a free account to save reports and preferences.'}
        </div>
      </section>

      <App embedded initialPage="modules" />
    </main>
  );
}
