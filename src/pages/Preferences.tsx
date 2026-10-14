import { Link } from 'react-router-dom';
import { type FormEvent, useEffect, useState } from 'react';
import { useSupabaseSession } from '../components/auth/useSupabaseSession';
import {
  defaultPreferencesForm,
  defaultProfileForm,
  languageOptions,
  loadPreferences,
  loadProfile,
  preferencesToForm,
  reportingStyleOptions,
  roleOptions,
  structureOptions,
  type PreferencesFormState,
  type ProfileFormState,
  profileToForm,
  upsertPreferences,
  upsertProfile,
} from '../lib/userData';
import { PageShell } from './PageShell';

export function Preferences() {
  const { isLoading, session } = useSupabaseSession();
  const [profile, setProfile] = useState<ProfileFormState>(defaultProfileForm);
  const [preferences, setPreferences] = useState<PreferencesFormState>(defaultPreferencesForm);
  const [message, setMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadSettings() {
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
        if (active) setMessage(error instanceof Error ? error.message : 'Unable to load preferences.');
      }
    }

    void loadSettings();

    return () => {
      active = false;
    };
  }, [isLoading, session]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage('');

    if (!session) {
      setMessage('Please sign in before saving preferences.');
      return;
    }

    if (!profile.full_name.trim()) {
      setMessage('Please enter your full name before saving.');
      return;
    }

    setIsSaving(true);
    try {
      await upsertProfile(session.user.id, profile);
      await upsertPreferences(session.user.id, preferences);
      setMessage('Preferences saved.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to save preferences.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <PageShell
      eyebrow="Settings"
      title="Profile and Preferences"
      description="Manage your educational profile and default reporting preferences for RadRepPilot."
    >
      <p>Your account stores your sign-in email and password. Your learning profile stores your name, learner role and preferences; saving this form creates or updates it.</p>
      <p><Link to="/account/security">Change password</Link> · <Link to="/learn">Learning library</Link></p>
      {message ? <div className="auth-notice" role="status">{message}</div> : null}

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
          <h2>Reporting defaults</h2>
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
          {isSaving ? 'Saving...' : 'Save preferences'}
        </button>
      </form>
    </PageShell>
  );
}

