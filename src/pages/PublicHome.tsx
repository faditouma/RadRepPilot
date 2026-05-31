import { Link } from 'react-router-dom';

const featureCards = [
  {
    title: 'Structured reporting practice',
    text: 'Draft findings and impressions in a focused educational workspace.',
  },
  {
    title: 'Saved reports',
    text: 'Keep a personal library of anonymized practice drafts.',
  },
  {
    title: 'Preferences',
    text: 'Customize language, reporting style, and default structure.',
  },
];

export function PublicHome() {
  return (
    <main className="public-home">
      <section className="public-hero">
        <span className="eyebrow">RadRepPilot</span>
        <h1>Radiology reporting practice, organized.</h1>
        <p>
          RadRepPilot is a free educational platform that helps learners practise structured radiology reporting, save draft
          reports, and customize reporting preferences.
        </p>
        <div className="public-safety-line" role="note">
          Educational use only. Do not enter patient-identifying information. RadRepPilot does not interpret images or provide
          diagnoses.
        </div>
        <div className="public-home-actions">
          <Link className="button-link" to="/signup">
            Create free account
          </Link>
          <Link className="secondary-link" to="/about">
            Learn more
          </Link>
        </div>
      </section>

      <section className="public-feature-grid" aria-label="RadRepPilot features">
        {featureCards.map((card) => (
          <article className="public-feature-card" key={card.title}>
            <h2>{card.title}</h2>
            <p>{card.text}</p>
          </article>
        ))}
      </section>
    </main>
  );
}

