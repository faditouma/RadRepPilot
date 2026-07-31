import { describe, expect, it } from 'vitest';
import { i18nStorageKey, translateInterfaceText } from './I18nContext';

describe('bilingual interface translations', () => {
  it('returns Canadian French for core navigation and reporting controls', () => {
    expect(translateInterfaceText('Workspace', 'fr')).toBe('Espace de travail');
    expect(translateInterfaceText('Reporting workflows', 'fr')).toBe('Parcours de rédaction');
    expect(translateInterfaceText('Findings', 'fr')).toBe('Constatations');
    expect(translateInterfaceText('Impression', 'fr')).toBe('Conclusion');
  });

  it('preserves English and safely falls back for untranslated clinical text', () => {
    expect(translateInterfaceText('Workspace', 'en')).toBe('Workspace');
    expect(translateInterfaceText('User-entered clinical phrase', 'fr')).toBe('User-entered clinical phrase');
  });

  it('uses a dedicated preference key that does not overlap draft storage', () => {
    expect(i18nStorageKey).toBe('radreppilot-interface-language');
    expect(i18nStorageKey).not.toContain('draft');
  });
});
