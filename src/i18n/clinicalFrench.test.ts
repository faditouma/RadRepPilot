import { describe, expect, it } from 'vitest';
import { normalizeClinicalSearchQuery, translateClinicalDisplayText } from './clinicalFrench';
import { translateClinicalInterfaceText } from './I18nContext';

describe('French clinical presentation translations', () => {
  it('translates ACR condition titles without changing their source values', () => {
    const source = 'Abnormal Liver Function Tests';
    expect(translateClinicalDisplayText(source, 'fr')).toBe('Tests de fonction hépatique anormaux');
    expect(source).toBe('Abnormal Liver Function Tests');
  });

  it('uses curated French for a complete ACR clinical scenario', () => {
    expect(
      translateClinicalDisplayText(
        'Sudden onset severe headache that reaches maximal severity within one hour',
        'fr',
      ),
    ).toBe("Céphalée soudaine et intense atteignant son maximum en moins d'une heure");
  });

  it('translates procedure and appropriateness display terminology', () => {
    expect(translateClinicalDisplayText('CT head without IV contrast', 'fr')).toBe(
      'TDM tête sans contraste IV',
    );
    expect(translateClinicalDisplayText('Usually Appropriate', 'fr')).toBe(
      'Habituellement approprié',
    );
  });

  it('lets the shared interface translator translate schema-derived clinical labels', () => {
    expect(translateClinicalInterfaceText('Pulmonary embolism', 'fr')).toBe('Embolie pulmonaire');
    expect(translateClinicalInterfaceText('Clinical presentation', 'fr')).toBe('Présentation clinique');
    expect(translateClinicalInterfaceText('Pulmonary arterial contrast opacification', 'fr')).toBe(
      'Opacification des artères pulmonaires',
    );
  });

  it('uses curated French for workflow navigation instead of mixed word substitution', () => {
    expect(translateClinicalDisplayText('CT Pulmonary Angiography', 'fr')).toBe(
      'Angiographie pulmonaire par TDM',
    );
    expect(translateClinicalDisplayText('Bilateral acute PE', 'fr')).toBe(
      'Embolie pulmonaire aiguë bilatérale',
    );
  });

  it('translates dynamic local-draft status text without changing its timestamp', () => {
    expect(translateClinicalDisplayText('Draft saved locally at 10:47 PM', 'fr')).toBe(
      'Brouillon enregistré localement à 10:47 PM',
    );
  });

  it('normalizes French clinical searches for the unchanged English ACR matching layer', () => {
    expect(normalizeClinicalSearchQuery('céphalée aiguë', 'fr')).toBe('headache aiguë');
    expect(normalizeClinicalSearchQuery('embolie pulmonaire suspectée', 'fr')).toBe(
      'pulmonary embolism suspectée',
    );
    expect(normalizeClinicalSearchQuery('headache', 'en')).toBe('headache');
  });

  it('preserves English display text in English mode', () => {
    expect(translateClinicalDisplayText('CT head without IV contrast', 'en')).toBe(
      'CT head without IV contrast',
    );
  });
});
