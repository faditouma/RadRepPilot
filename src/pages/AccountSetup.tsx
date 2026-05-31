import { type FormEvent, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSupabaseSession } from '../components/auth/useSupabaseSession';
import {
  defaultPreferencesForm,
  defaultProfileForm,
  languageOptions,
  preferencesToForm,
  reportingStyleOptions,
  roleOptions,
  structureOptions,
  type PreferencesFormState,
  type ProfileFormState,
  loadPreferences,
  loadProfile,
  profileToForm,
  upsertPreferences,
  upsertProfile,
} from '../lib/userData';
import { PageShell } from './PageShell';

export function AccountSetup() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoading, session } = useSupabaseSession();
  const [profile, setProfile] = useState<ProfileFormState>(defaultProfileForm);
  const [preferences, setPreferences] = useState<PreferencesFormState>(defaultPreferencesForm);
  const [message, setMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const state = location.state as { from?: { pathname?: string }; message?: string } | null;
  const nextPath = state?.from?.pathname && state.from.pathname !== '/account-setup' ? state.from.pathname : '/dashboard';

  useEffect(() => {
    let active = true;

    async function loadExistingSetup() {
      if (isLoading || !session) return;

      try {
        const [savedProfile, savedPreferences] = await Promise.all([
          loadProfile(session.user.id),
          loadPreferences(session.user.id),
        ]);
        if (active) {
          setProfile(profileToForm(savedProfile));
          setPreferences(preferencesToForm(savedPreferences));
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unable to load account setup.';
        if (active) setMessage(errorMessage);
      }
    }

    void loadExistingSetup();

    return () => {
      active = false;
    };
  }, [isLoading, session]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage('');

    if (!session) {
      setMessage('Please sign in before setting up your account.');
      return;
    }

    if (!profile.full_name.trim()) {
      setMessage('Please enter your full name.');
      return;
    }

    setIsSaving(true);
    try {
      await upsertProfile(session.user.id, profile);
      await upsertPreferences(session.user.id, preferences);
      setMessage('Account setup saved.');
      navigate(nextPath, { replace: true });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to save account setup.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <PageShell
      eyebrow="Account setup"
      title="Set up your RadRepPilot workspace"
      description="Add your learning profile and default reporting preferences. Do not enter patient-identifying information."
    >
      {state?.message ? <div className="auth-notice">{state.message}</div> : null}
      {message ? <div className="auth-notice">{message}</div> : null}

      <form className="settings-form" onSubmit={handleSubmit}>
        <section className="settings-section">
          <h2>Profile</h2>
          <div className="settings-grid">
            <label>
              Full name
              <input
                autoComplete="name"
                onChange={(event) => setProfile((current) => ({ ...current, full_name: event.target.value }))}
                required
                value={profile.full_name}
              />
            </label>
            <label>
              Role
              <select
                onChange={(event) => setProfile((current) => ({ ...current, role: event.target.value }))}
                value={profile.role}
              >
                {roleOptions.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Institution <span>optional</span>
              <input
                onChange={(event) => setProfile((current) => ({ ...current, institution: event.target.value }))}
                value={profile.institution}
              />
            </label>
          </div>
        </section>

        <section className="settings-section">
          <h2>Reporting preferences</h2>
          <div className="settings-grid">
            <label>
              Default language
              <select
                onChange={(event) => setPreferences((current) => ({ ...current, default_language: event.target.value }))}
                value={preferences.default_language}
              >
                {languageOptions.map((language) => (
                  <option key={language} value={language}>
                    {language}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Preferred reporting structure
              <select
                onChange={(event) => setPreferences((current) => ({ ...current, preferred_structure: event.target.value }))}
                value={preferences.preferred_structure}
              >
                {structureOptions.map((structure) => (
                  <option key={structure} value={structure}>
                    {structure}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Reporting style
              <select
                onChange={(event) => setPreferences((current) => ({ ...current, reporting_style: event.target.value }))}
                value={preferences.reporting_style}
              >
                {reportingStyleOptions.map((style) => (
                  <option key={style} value={style}>
                    {style}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="settings-checks">
            <label>
              <input
                checked={preferences.include_teaching_points}
                onChange={(event) =>
                  setPreferences((current) => ({ ...current, include_teaching_points: event.target.checked }))
                }
                type="checkbox"
              />
              Include teaching points by default
            </label>
            <label>
              <input
                checked={preferences.include_differential}
                onChange={(event) =>
                  setPreferences((current) => ({ ...current, include_differential: event.target.checked }))
                }
                type="checkbox"
              />
              Include differential diagnosis prompts by default
            </label>
          </div>
        </section>

        <button className="auth-submit" disabled={isSaving || isLoading} type="submit">
          {isSaving ? 'Saving setup...' : 'Save and continue'}
        </button>
      </form>
    </PageShell>
  );
}

