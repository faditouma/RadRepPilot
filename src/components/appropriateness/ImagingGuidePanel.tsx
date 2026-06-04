import { useMemo, useState } from 'react';
import { appropriatenessTopics, searchAppropriatenessTopics } from '../../data/appropriateness';
import type { AppropriatenessCategory, AppropriatenessTopic } from '../../data/appropriateness';
import { searchClinicalMappings, type ClinicalComplaintMapping } from '../../data/appropriateness/clinicalMappings';
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

function humanizeTopicId(topicId: string) {
  return topicId
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function ComplaintMappingCard({
  mapping,
  topicById,
}: {
  mapping: ClinicalComplaintMapping;
  topicById: Map<string, AppropriatenessTopic>;
}) {
  const relatedTopics = mapping.relatedTopicIds.map((topicId) => ({
    topicId,
    topic: topicById.get(topicId),
  }));

  return (
    <article className="guide-complaint-card">
      <div className="guide-section-heading">
        <div>
          <span className="eyebrow">Matching complaint</span>
          <h3>{mapping.complaint}</h3>
        </div>
      </div>
      <div className="guide-complaint-synonyms">
        {mapping.synonyms.slice(0, 6).map((synonym) => (
          <span key={synonym}>{synonym}</span>
        ))}
      </div>
      <div className="guide-two-column">
        <div>
          <h4>Missing information prompts</h4>
          <ul>
            {mapping.missingInfoPrompts.map((prompt) => (
              <li key={prompt}>{prompt}</li>
            ))}
          </ul>
        </div>
        <div>
          <div className="guide-section-heading">
            <h4>Requisition wording</h4>
            <CopyButton text={mapping.commonRequisitionLanguage} label="Copy wording" />
          </div>
          <p>{mapping.commonRequisitionLanguage}</p>
        </div>
      </div>
      <div className="guide-related-topics">
        <h4>Related topics</h4>
        {relatedTopics.map(({ topicId, topic }) => (
          <div className="guide-related-topic" key={topicId}>
            <div>
              <strong>{topic?.title ?? humanizeTopicId(topicId)}</strong>
              <span>{topic ? `${topic.sourceLabel} · ${topic.year}` : 'Topic not curated yet'}</span>
            </div>
            {topic ? <ReviewBadge topic={topic} /> : <span className="guide-review-badge unreviewed">Topic not curated yet</span>}
          </div>
        ))}
      </div>
      {relatedTopics.some(({ topic }) => topic) ? (
        <div className="guide-reviewed-recommendations">
          <h4>Reviewed ACR-style recommendations</h4>
          {relatedTopics
            .filter((item): item is { topicId: string; topic: AppropriatenessTopic } => Boolean(item.topic))
            .map(({ topic }) => {
              const candidateVariants = mapping.suggestedVariantIds?.length
                ? topic.variants.filter((variant) => mapping.suggestedVariantIds?.includes(variant.id))
                : topic.variants.slice(0, 1);
              const variantsToShow = candidateVariants.length ? candidateVariants : topic.variants.slice(0, 1);

              return variantsToShow.map((variant) => (
                <div className="guide-reviewed-variant" key={`${topic.id}-${variant.id}`}>
                  <strong>{variant.title}</strong>
                  <div className="guide-mini-option-list">
                    {variant.imagingOptions.slice(0, 4).map((option) => (
                      <span key={option.procedure}>
                        {option.procedure} · {option.appropriatenessCategory} · {option.radiationLevel}
                      </span>
                    ))}
                  </div>
                </div>
              ));
            })}
        </div>
      ) : null}
    </article>
  );
}

export function ImagingGuidePanel() {
  const [query, setQuery] = useState('');
  const [selectedTopicId, setSelectedTopicId] = useState(appropriatenessTopics[0]?.id ?? '');
  const visibleTopics = useMemo(() => searchAppropriatenessTopics(query), [query]);
  const matchingClinicalMappings = useMemo(() => searchClinicalMappings(query), [query]);
  const topicById = useMemo(() => new Map(appropriatenessTopics.map((topic) => [topic.id, topic])), []);
  const selectedTopic = visibleTopics.find((topic) => topic.id === selectedTopicId) ?? visibleTopics[0];
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
          <div className="guide-topic-count" role="status">
            <strong>{appropriatenessTopics.length}</strong>
            <span>reviewed topics available</span>
          </div>
          <div className="guide-topic-list" aria-label="Imaging guide topics">
            {visibleTopics.map((topic) => (
              <button
                className={selectedTopic && topic.id === selectedTopic.id ? 'active' : ''}
                key={topic.id}
                onClick={() => selectTopic(topic.id)}
                type="button"
              >
                <span>{topic.clinicalArea}</span>
                <strong>{topic.title}</strong>
                <small>{topic.sourceLabel}</small>
                <div className="guide-topic-meta">
                  <small>{topic.year}</small>
                  <ReviewBadge topic={topic} />
                </div>
              </button>
            ))}
            {!visibleTopics.length ? <p>No reviewed topic found. Try a different symptom, diagnosis, or modality.</p> : null}
          </div>
        </aside>

        {matchingClinicalMappings.length ? (
          <div className="guide-content">
            <div className="guide-topic-header">
              <div>
                <span className="eyebrow">Complaint mapping</span>
                <h2>Clinical complaint matches</h2>
                <p>
                  Complaint mappings help translate everyday clinical language into reviewed Imaging Guide topics when available.
                  If a topic is not curated yet, it is intentionally not shown as a recommendation.
                </p>
              </div>
            </div>
            <div className="guide-complaint-grid">
              {matchingClinicalMappings.map((mapping) => (
                <ComplaintMappingCard mapping={mapping} topicById={topicById} key={mapping.id} />
              ))}
            </div>
            {selectedTopic ? (
              <details className="guide-section">
                <summary>Show reviewed topic match</summary>
                <p>{selectedTopic.title}</p>
              </details>
            ) : null}
          </div>
        ) : selectedTopic ? (
          <div className="guide-content">
          <div className="guide-topic-header">
            <div>
              <span className="eyebrow">Imaging Guide reviewed topic</span>
              <h2>{selectedTopic.title}</h2>
              <div className="guide-source-meta">
                <span>{selectedTopic.sourceLabel}</span>
                <span>{selectedTopic.year}</span>
              </div>
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
        ) : (
          <div className="guide-content guide-empty-state">
            <div>
              <span className="eyebrow">Imaging Guide</span>
              <h2>No reviewed topic found</h2>
              <p>Try a different symptom, diagnosis, or modality.</p>
            </div>
            <div className="guide-disclaimer" role="note">
              Unreviewed raw extractions and draft topics are intentionally excluded from the public Imaging Guide. Add reviewed
              curated topics in <code>src/data/appropriateness/topics/</code> and import them through the registry.
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
