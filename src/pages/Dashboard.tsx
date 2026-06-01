import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSupabaseSession } from '../components/auth/useSupabaseSession';
import {
  type UserPreferences,
  type UserProfile,
  loadPreferences,
  loadProfile,
} from '../lib/userData';
import { formatReportDate, loadSavedReportSummaries, type SavedReportSummary } from '../lib/savedReports';
import { PageShell } from './PageShell';

export function Dashboard() {
  const { session } = useSupabaseSession();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [recentReports, setRecentReports] = useState<SavedReportSummary[]>([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      if (!session) return;

      try {
        const [savedProfile, savedPreferences] = await Promise.all([
          loadProfile(session.user.id),
          loadPreferences(session.user.id),
        ]);
        if (active) {
          setProfile(savedProfile);
          setPreferences(savedPreferences);
        }
      } catch (error) {
        if (active) setMessage(error instanceof Error ? error.message : 'Unable to load dashboard.');
      }
    }

    void loadDashboard();
    setRecentReports(loadSavedReportSummaries(3));

    return () => {
      active = false;
    };
  }, [session]);

  const firstName = profile?.full_name?.trim().split(/\s+/)[0];
  const hasCompleteProfile = Boolean(profile?.full_name?.trim());
  const hasPreferences = Boolean(preferences);
  const dashboardTitle = hasCompleteProfile && firstName ? `Welcome back, ${firstName}.` : 'Welcome to your RadRepPilot workspace';
  const dashboardDescription =
    'Use this workspace to draft educational radiology reports, review saved reports, and manage your reporting preferences.';
  const profileLine = [profile?.role, profile?.institution].filter(Boolean).join(' · ');
  const showSetupPrompt = !hasCompleteProfile || !hasPreferences;

  return (
    <PageShell
      eyebrow="Workspace"
      title={dashboardTitle}
      description={dashboardDescription}
    >
      {message ? <div className="auth-notice">{message}</div> : null}

      <div className="workspace-safety-note" role="note">
        Do not enter patient-identifying information. RadRepPilot is for educational reporting practice only and does not
        interpret images or provide diagnoses.
      </div>

      {showSetupPrompt ? (
        <section className="dashboard-summary setup-card">
          <div>
            <h2>Complete your setup</h2>
            <p>Add your role and reporting preferences to personalize your workspace.</p>
          </div>
          <Link className="dashboard-card-link" to="/account-setup">
            Set up preferences
          </Link>
        </section>
      ) : null}

      {profileLine ? (
        <section className="dashboard-summary">
          <div>
            <h2>Profile</h2>
            <p>{profileLine}</p>
          </div>
          <Link className="dashboard-card-link" to="/preferences">
            Edit profile and preferences
          </Link>
        </section>
      ) : null}

      <section className="quick-link-grid" aria-label="Quick links">
        <article className="workspace-action-card">
          <h2>New Report</h2>
          <p>Start a structured reporting draft.</p>
          <Link to="/reports/new">Create report</Link>
        </article>
        <article className="workspace-action-card">
          <h2>Saved Reports</h2>
          <p>Review and manage your saved drafts.</p>
          <Link to="/reports">View reports</Link>
        </article>
        <article className="workspace-action-card">
          <h2>Preferences</h2>
          <p>Customize your reporting style and default settings.</p>
          <Link to="/preferences">Edit preferences</Link>
        </article>
      </section>

      <section className="dashboard-detail-grid">
        <article className="settings-section">
        <h2>Current preferences</h2>
        {hasPreferences && preferences ? (
          <div className="preference-summary-grid">
            <div>
              <span>Default language</span>
              <strong>{preferences.default_language}</strong>
            </div>
            <div>
              <span>Reporting style</span>
              <strong>{preferences.reporting_style}</strong>
            </div>
            <div>
              <span>Preferred structure</span>
              <strong>{preferences.preferred_structure}</strong>
            </div>
            <div>
              <span>Teaching points</span>
              <strong>{preferences.include_teaching_points ? 'On' : 'Off'}</strong>
            </div>
            <div>
              <span>Differential prompts</span>
              <strong>{preferences.include_differential ? 'On' : 'Off'}</strong>
            </div>
          </div>
        ) : (
          <div className="soft-empty-state">
            <p>Preferences not configured yet.</p>
            <Link className="dashboard-card-link" to="/preferences">
              Configure preferences
            </Link>
          </div>
        )}
        </article>

        <article className="settings-section">
          <h2>Recent reports</h2>
          {recentReports.length > 0 ? (
            <div className="recent-report-list">
              {recentReports.map((report) => (
                <div className="recent-report-row" key={report.id}>
                  <div>
                    <strong>{report.title}</strong>
                    <span>
                      {report.modality} · {report.bodyRegion}
                    </span>
                  </div>
                  <time dateTime={report.createdAt}>{formatReportDate(report.createdAt)}</time>
                </div>
              ))}
            </div>
          ) : (
            <div className="soft-empty-state">
              <p>No saved reports yet.</p>
              <Link className="dashboard-card-link" to="/reports/new">
                Create your first report
              </Link>
            </div>
          )}
        </article>
      </section>
    </PageShell>
  );
}
