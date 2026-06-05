import { useMemo, useState } from 'react';
import { appropriatenessTopics, searchAppropriatenessTopics } from '../../data/appropriateness';
import type { AppropriatenessCategory, AppropriatenessTopic, RadiationLevel, ReviewStatus } from '../../data/appropriateness';
import { searchClinicalMappings, type ClinicalComplaintMapping } from '../../data/appropriateness/clinicalMappings';
import { radiationLegend, reviewStatusLabel, reviewStatusSummary } from '../../utils/appropriatenessSearch';
import { CopyButton } from '../radrep/RadRepComponents';

function categoryClass(category: AppropriatenessCategory) {
  if (category === 'Usually Appropriate') return 'usually';
  if (category === 'Usually Not Appropriate') return 'not-appropriate';
  if (category.includes('Disagreement')) return 'disagreement';
  return 'may';
}

function ReviewBadge({ topic }: { topic: AppropriatenessTopic }) {
  return <span className={`guide-review-badge ${topic.reviewStatus}`}>{reviewStatusLabel(topic.reviewStatus)}</span>;
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
              <span>{topic ? `${topic.sourceLabel} · ${topic.year}` : 'Appropriateness table pending. Clinical summary pending.'}</span>
            </div>
            {topic ? <ReviewBadge topic={topic} /> : <span className="guide-review-badge pending">Summary pending</span>}
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
  const [clinicalAreaFilter, setClinicalAreaFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState<'All' | AppropriatenessCategory>('All');
  const [radiationFilter, setRadiationFilter] = useState<'All' | RadiationLevel>('All');
  const [reviewStatusFilter, setReviewStatusFilter] = useState<'All' | ReviewStatus>('All');
  const [selectedTopicId, setSelectedTopicId] = useState(appropriatenessTopics[0]?.id ?? '');
  const visibleTopics = useMemo(() => {
    return searchAppropriatenessTopics(query).filter((topic) => {
      const options = topic.variants.flatMap((variant) => variant.imagingOptions);
      const matchesArea = clinicalAreaFilter === 'All' || topic.clinicalArea === clinicalAreaFilter;
      const matchesCategory = categoryFilter === 'All' || options.some((option) => option.appropriatenessCategory === categoryFilter);
      const matchesRadiation = radiationFilter === 'All' || options.some((option) => option.radiationLevel === radiationFilter);
      const matchesReviewStatus = reviewStatusFilter === 'All' || topic.reviewStatus === reviewStatusFilter;
      return matchesArea && matchesCategory && matchesRadiation && matchesReviewStatus;
    });
  }, [categoryFilter, clinicalAreaFilter, query, radiationFilter, reviewStatusFilter]);
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
        Summarized appropriateness-style data for educational use. Not a substitute for original criteria, local protocol, or
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
            <span>topics available with status labels</span>
          </div>
          <div className="guide-filter-grid">
            <label>
              Clinical area
              <select value={clinicalAreaFilter} onChange={(event) => setClinicalAreaFilter(event.target.value)}>
                <option value="All">All</option>
                {Array.from(new Set(appropriatenessTopics.map((topic) => topic.clinicalArea))).map((area) => (
                  <option value={area} key={area}>
                    {area}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Category
              <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value as never)}>
                <option value="All">All</option>
                <option value="Usually Appropriate">Usually Appropriate</option>
                <option value="May Be Appropriate">May Be Appropriate</option>
                <option value="May Be Appropriate (Disagreement)">May Be Appropriate (Disagreement)</option>
                <option value="Usually Not Appropriate">Usually Not Appropriate</option>
              </select>
            </label>
            <label>
              Radiation
              <select value={radiationFilter} onChange={(event) => setRadiationFilter(event.target.value as never)}>
                <option value="All">All</option>
                {radiationLegend.map((item) => (
                  <option value={item.level} key={item.level}>
                    {item.level}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Review status
              <select value={reviewStatusFilter} onChange={(event) => setReviewStatusFilter(event.target.value as never)}>
                <option value="All">All</option>
                <option value="extracted">Extracted</option>
                <option value="needs_validation">Needs validation</option>
                <option value="reviewed">Reviewed</option>
                <option value="manually_curated">Manually curated</option>
              </select>
            </label>
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
            {!visibleTopics.length ? <p>No matching appropriateness topic found. Try a different symptom, diagnosis, or modality.</p> : null}
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
              <p>{reviewStatusSummary(selectedTopic.reviewStatus)} {selectedTopic.sourceNote}</p>
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

              {selectedVariant.followUpPearls?.length ? (
                <section className="guide-section">
                  <div className="guide-section-heading">
                    <h3>Follow-up pearls</h3>
                    <span>Educational only; verify local protocol</span>
                  </div>
                  <ul>
                    {selectedVariant.followUpPearls.map((pearl) => (
                      <li key={pearl}>{pearl}</li>
                    ))}
                  </ul>
                </section>
              ) : null}

              <section className="guide-section">
                <div className="guide-section-heading">
                  <h3>Radiation legend</h3>
                </div>
                <div className="guide-radiation-legend">
                  {radiationLegend.map((item) => (
                    <span key={item.level}>
                      <strong>{item.level}</strong> = {item.label}
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
              Extracted tables, validated summaries, and manually curated topics can all appear here with clear status labels. Add
              structured topics in <code>src/data/appropriateness/topics/</code> and import them through the registry.
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
