import { useI18n } from '../../i18n/I18nContext';

export function LanguageToggle() {
  const { language, setLanguage, text } = useI18n();

  return (
    <div className="language-toggle" role="group" aria-label={text('Choose interface language')}>
      <button
        aria-pressed={language === 'en'}
        className={language === 'en' ? 'active' : ''}
        onClick={() => setLanguage('en')}
        title={text('English')}
        type="button"
      >
        EN
      </button>
      <button
        aria-pressed={language === 'fr'}
        className={language === 'fr' ? 'active' : ''}
        onClick={() => setLanguage('fr')}
        title={text('French')}
        type="button"
      >
        FR
      </button>
    </div>
  );
}
