import { Link } from 'react-router-dom';
import { useI18n } from '../i18n/I18nContext';

const featureCards = [
  {
    title: 'Structured reporting practice',
    text: 'Draft findings and impressions in a focused educational workspace.',
  },
  {
    title: 'Saved reports',
    text: 'Create an account to keep a personal library of anonymized practice drafts.',
  },
  {
    title: 'Preferences',
    text: 'Customize language, reporting style, and default structure when signed in.',
  },
];

export function PublicHome() {
  const { text } = useI18n();
  return (
    <main className="public-home">
      <section className="public-hero">
        <span className="eyebrow">RadRepPilot</span>
        <h1>{text('Radiology reporting practice, organized.')}</h1>
        <p>{text('RadRepPilot is a free educational platform that helps learners practise structured radiology reporting, save draft reports, and customize reporting preferences.')}</p>
        <div className="public-safety-line" role="note">
          {text('Educational use only. Do not enter patient-identifying information. RadRepPilot does not interpret images or provide diagnoses.')}
        </div>
        <div className="public-home-actions">
          <Link className="button-link" to="/workspace/requisitions">
            {text('Start using RadRepPilot')}
          </Link>
          <Link className="button-link" to="/signup">
            {text('Create free account')}
          </Link>
          <Link className="secondary-link" to="/about">
            {text('Learn more')}
          </Link>
        </div>
      </section>

      <section className="public-feature-grid" aria-label={text('RadRepPilot features')}>
        {featureCards.map((card) => (
          <article className="public-feature-card" key={card.title}>
            <h2>{text(card.title)}</h2>
            <p>{text(card.text)}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
