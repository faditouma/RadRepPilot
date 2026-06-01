import { supabase } from './supabaseClient';

export const roleOptions = [
  'Medical student',
  'Resident',
  'Fellow',
  'Radiologist',
  'Referring clinician',
  'Other',
] as const;

export const languageOptions = ['English', 'French'] as const;

export const structureOptions = [
  'Findings and Impression',
  'Indication, Technique, Findings, Impression',
  'Structured template',
] as const;

export const reportingStyleOptions = ['Concise', 'Standard', 'Detailed'] as const;

export type UserProfile = {
  user_id: string;
  full_name: string;
  role: string;
  institution: string | null;
};

export type UserPreferences = {
  user_id: string;
  default_language: string;
  preferred_structure: string;
  reporting_style: string;
  include_teaching_points: boolean;
  include_differential: boolean;
};

export type ProfileFormState = {
  full_name: string;
  role: string;
  institution: string;
};

export type PreferencesFormState = {
  default_language: string;
  preferred_structure: string;
  reporting_style: string;
  include_teaching_points: boolean;
  include_differential: boolean;
};

export const defaultProfileForm: ProfileFormState = {
  full_name: '',
  role: 'Medical student',
  institution: '',
};

export const defaultPreferencesForm: PreferencesFormState = {
  default_language: 'English',
  preferred_structure: 'Indication, Technique, Findings, Impression',
  reporting_style: 'Standard',
  include_teaching_points: false,
  include_differential: false,
};

export async function loadProfile(userId: string) {
  if (!supabase) throw new Error('Supabase is not configured.');

  const { data, error } = await supabase
    .from('profiles')
    .select('user_id, full_name, role, institution')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  return data as UserProfile | null;
}

export async function upsertProfile(userId: string, profile: ProfileFormState) {
  if (!supabase) throw new Error('Supabase is not configured.');

  const { data, error } = await supabase
    .from('profiles')
    .upsert(
      {
        user_id: userId,
        full_name: profile.full_name.trim(),
        role: profile.role,
        institution: profile.institution.trim() || null,
      },
      { onConflict: 'user_id' },
    )
    .select('user_id, full_name, role, institution')
    .single();

  if (error) throw error;
  return data as UserProfile;
}

export async function loadPreferences(userId: string) {
  if (!supabase) throw new Error('Supabase is not configured.');

  const { data, error } = await supabase
    .from('user_preferences')
    .select(
      'user_id, default_language, preferred_structure, reporting_style, include_teaching_points, include_differential',
    )
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  return data as UserPreferences | null;
}

export async function upsertPreferences(userId: string, preferences: PreferencesFormState) {
  if (!supabase) throw new Error('Supabase is not configured.');

  const { data, error } = await supabase
    .from('user_preferences')
    .upsert(
      {
        user_id: userId,
        default_language: preferences.default_language,
        preferred_structure: preferences.preferred_structure,
        reporting_style: preferences.reporting_style,
        include_teaching_points: preferences.include_teaching_points,
        include_differential: preferences.include_differential,
      },
      { onConflict: 'user_id' },
    )
    .select(
      'user_id, default_language, preferred_structure, reporting_style, include_teaching_points, include_differential',
    )
    .single();

  if (error) throw error;
  return data as UserPreferences;
}

export function profileToForm(profile: UserProfile | null): ProfileFormState {
  if (!profile) return defaultProfileForm;
  return {
    full_name: profile.full_name ?? '',
    role: profile.role || defaultProfileForm.role,
    institution: profile.institution ?? '',
  };
}

export function preferencesToForm(preferences: UserPreferences | null): PreferencesFormState {
  if (!preferences) return defaultPreferencesForm;
  return {
    default_language: preferences.default_language || defaultPreferencesForm.default_language,
    preferred_structure: preferences.preferred_structure || defaultPreferencesForm.preferred_structure,
    reporting_style: preferences.reporting_style || defaultPreferencesForm.reporting_style,
    include_teaching_points: Boolean(preferences.include_teaching_points),
    include_differential: Boolean(preferences.include_differential),
  };
}
