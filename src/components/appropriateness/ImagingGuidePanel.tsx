import { useMemo, useState } from 'react';
import { appropriatenessTopics, searchAppropriatenessTopics } from '../../data/appropriateness';
import type { AppropriatenessCategory, AppropriatenessTopic } from '../../data/appropriateness';
import { CopyButton } from '../radrep/RadRepComponents';

const radiationLegend = [
  ['O', 'no ionizing radiation'],
  ['☢', 'very low'],
  ['☢☢', 'low'],
  ['☢☢☢', 'moderate'],
  ['☢☢☢☢', 'higher'],
  ['☢☢☢☢☢', 'highest relative range'],
  ['Varies', 'depends on technique/procedure'],
];

function categoryClass(category: AppropriatenessCategory) {
  if (category === 'Usually Appropriate') return 'usually';
  if (category === 'Usually Not Appropriate') return 'not-appropriate';
  if (category.includes('Disagreement')) return 'disagreement';
  return 'may';
}

function ReviewBadge({ topic }: { topic: AppropriatenessTopic }) {
  return <span className={`guide-review-badge ${topic.reviewStatus}`}>{topic.reviewStatus === 'reviewed' ? 'Reviewed' : 'Needs review'}</span>;
}

export function ImagingGuidePanel() {
  const [query, setQuery] = useState('');
  const [selectedTopicId, setSelectedTopicId] = useState(appropriatenessTopics[0]?.id ?? '');
  const visibleTopics = useMemo(() => searchAppropriatenessTopics(query), [query]);
  const selectedTopic = visibleTopics.find((topic) => topic.id === selectedTopicId) ?? visibleTopics[0] ?? appropriatenessTopics[0];
  const [selectedVariantId, setSelectedVariantId] = useState(selectedTopic?.variants[0]?.id ?? '');
  const selectedVariant =
    selectedTopic?.variants.find((variant) => variant.id === selectedVariantId) ?? selectedTopic?.variants[0];
  const requisitionText = selectedVariant?.requisitionSuggestions.join('\n\n') ?? '';

  function selectTopic(topicId: string) {
    const topic = appropriatenessTopics.find((item) => item.id === topicId);
    setSelectedTopicId(topicId);
    setSelectedVariantId(topic?.variants[0]?.id ?? '');
  }

  return (
    <section className="imaging-guide-panel">
      <div className="guide-disclaimer" role="note">
        Educational summary inspired by appropriateness-style criteria. Confirm with original criteria, local protocols, and
        radiologist judgment.
      </div>

      <div className="guide-layout">
        <aside className="guide-topic-panel">
          <label className="guide-search-label" htmlFor="imaging-guide-search">
            Search clinical scenario, symptom, or diagnosis
          </label>
          <input
            id="imaging-guide-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search clinical scenario, symptom, or diagnosis..."
          />
          <div className="guide-topic-list" aria-label="Imaging guide topics">
            {visibleTopics.map((topic) => (
              <button
                className={topic.id === selectedTopic.id ? 'active' : ''}
                key={topic.id}
                onClick={() => selectTopic(topic.id)}
                type="button"
              >
                <span>{topic.clinicalArea}</span>
                <strong>{topic.title}</strong>
                <small>{topic.year}</small>
              </button>
            ))}
            {!visibleTopics.length ? <p>No topics match that search yet.</p> : null}
          </div>
        </aside>

        <div className="guide-content">
          <div className="guide-topic-header">
            <div>
              <span className="eyebrow">Imaging Guide seed topic</span>
              <h2>{selectedTopic.title}</h2>
              <p>{selectedTopic.sourceNote}</p>
            </div>
            <ReviewBadge topic={selectedTopic} />
          </div>

          {selectedTopic.sourceUrl ? (
            <a className="guide-source-link" href={selectedTopic.sourceUrl} target="_blank" rel="noreferrer">
              Verify against official ACR Appropriateness Criteria
            </a>
          ) : null}

          <section className="guide-section">
            <label className="guide-search-label" htmlFor="imaging-guide-variant">
              Clinical variant
            </label>
            <select
              id="imaging-guide-variant"
              value={selectedVariant?.id ?? ''}
              onChange={(event) => setSelectedVariantId(event.target.value)}
            >
              {selectedTopic.variants.map((variant) => (
                <option key={variant.id} value={variant.id}>
                  {variant.title}
                </option>
              ))}
            </select>
            {selectedVariant ? <p>{selectedVariant.clinicalScenario}</p> : null}
          </section>

          {selectedVariant ? (
            <>
              <section className="guide-section">
                <div className="guide-section-heading">
                  <h3>Imaging options</h3>
                  <span>Procedure, category, radiation, rationale</span>
                </div>
                <div className="guide-option-grid">
                  {selectedVariant.imagingOptions.map((option) => (
                    <article className="guide-option-card" key={option.procedure}>
                      <div className="guide-option-topline">
                        <span className={`guide-category-badge ${categoryClass(option.appropriatenessCategory)}`}>
                          {option.appropriatenessCategory}
                        </span>
                        <span className="guide-radiation-badge">{option.radiationLevel}</span>
                      </div>
                      <h4>{option.procedure}</h4>
                      <p>{option.shortRationale}</p>
                    </article>
                  ))}
                </div>
              </section>

              <section className="guide-section">
                <div className="guide-section-heading">
                  <h3>Missing clinical information</h3>
                  <span>Useful details before choosing or protocoling imaging</span>
                </div>
                <ul className="guide-chip-list">
                  {selectedVariant.missingInformationPrompts.map((prompt) => (
                    <li key={prompt}>{prompt}</li>
                  ))}
                </ul>
              </section>

              <section className="guide-section guide-requisition">
                <div className="guide-section-heading">
                  <h3>Requisition-ready wording</h3>
                  <CopyButton text={requisitionText} label="Copy wording" />
                </div>
                <p>{requisitionText}</p>
              </section>

              <section className="guide-two-column">
                <div className="guide-section">
                  <div className="guide-section-heading">
                    <h3>Reporting pearls</h3>
                  </div>
                  <ul>
                    {selectedVariant.reportingPearls.map((pearl) => (
                      <li key={pearl}>{pearl}</li>
                    ))}
                  </ul>
                </div>
                <div className="guide-section caution">
                  <div className="guide-section-heading">
                    <h3>Cautions</h3>
                  </div>
                  <ul>
                    {selectedVariant.cautions.map((caution) => (
                      <li key={caution}>{caution}</li>
                    ))}
                  </ul>
                </div>
              </section>

              <section className="guide-section">
                <div className="guide-section-heading">
                  <h3>Radiation legend</h3>
                </div>
                <div className="guide-radiation-legend">
                  {radiationLegend.map(([level, label]) => (
                    <span key={level}>
                      <strong>{level}</strong> = {label}
                    </span>
                  ))}
                </div>
              </section>
            </>
          ) : null}
        </div>
      </div>
    </section>
  );
}
