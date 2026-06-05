import { useEffect, useMemo, useState } from 'react';
import { appropriatenessTopics } from '../../data/appropriateness';
import type { AppropriatenessCategory, AppropriatenessTopic, RadiationLevel, ReviewStatus } from '../../data/appropriateness';
import { searchClinicalMappings, type ClinicalComplaintMapping } from '../../data/appropriateness/clinicalMappings';
import { radiationLegend, reviewStatusLabel, reviewStatusSummary, searchAppropriatenessLayer } from '../../utils/appropriatenessSearch';
import { CopyButton } from '../radrep/RadRepComponents';

const GUIDE_SELECTION_KEY = 'radreppilot.pendingImagingGuideSelection';

type ProcedureType = 'CT' | 'MRI' | 'Ultrasound' | 'X-ray' | 'Mammography' | 'Nuclear/PET' | 'Fluoroscopy/IR' | 'Other';

interface TopicResultGroup {
  id: string;
  title: string;
  helper: string;
  topics: AppropriatenessTopic[];
}

const radiationRank: Record<RadiationLevel, number> = {
  O: 0,
  '☢': 1,
  '☢☢': 2,
  '☢☢☢': 3,
  '☢☢☢☢': 4,
  '☢☢☢☢☢': 5,
  Varies: 6,
};

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

function topicOptions(topic: AppropriatenessTopic) {
  return topic.variants.flatMap((variant) => variant.imagingOptions);
}

function inferProcedureType(procedure: string): ProcedureType {
  const normalized = procedure.toLowerCase();
  if (/\bpet\b|pet\/ct|spect|scintigraphy|nuclear/.test(normalized)) return 'Nuclear/PET';
  if (/mammography|mammogram|tomosynthesis|breast us/.test(normalized)) return 'Mammography';
  if (/\bus\b|ultrasound|sonography/.test(normalized)) return 'Ultrasound';
  if (/\bmri?\b|magnetic resonance/.test(normalized)) return 'MRI';
  if (/\bct\b|cta|ctpa|computed tomography/.test(normalized)) return 'CT';
  if (/radiograph|x-ray|xray|xr\b/.test(normalized)) return 'X-ray';
  if (/fluoro|fluoroscopy|angiography|venography|arteriography|catheter|intervention/.test(normalized)) return 'Fluoroscopy/IR';
  return 'Other';
}

function procedureTypesForTopic(topic: AppropriatenessTopic): ProcedureType[] {
  return Array.from(new Set(topicOptions(topic).map((option) => inferProcedureType(option.procedure)))).sort();
}

function topicRadiationSummary(topic: AppropriatenessTopic) {
  const levels = Array.from(new Set(topicOptions(topic).map((option) => option.radiationLevel))).filter(Boolean) as RadiationLevel[];
  if (!levels.length) return 'Radiation not listed';
  if (levels.length === 1) return `Radiation ${levels[0]}`;

  const nonVariableLevels = levels.filter((level) => level !== 'Varies').sort((a, b) => radiationRank[a] - radiationRank[b]);
  if (!nonVariableLevels.length) return 'Radiation varies';

  const min = nonVariableLevels[0];
  const max = nonVariableLevels[nonVariableLevels.length - 1];
  const range = min === max ? min : `${min} to ${max}`;
  return levels.includes('Varies') ? `Radiation ${range}; varies` : `Radiation ${range}`;
}

function statusNoteForTopic(topic: AppropriatenessTopic) {
  if (topic.reviewStatus === 'manually_curated') return 'Curated clinical summary available.';
  if (topic.reviewStatus === 'reviewed') return 'Reviewed appropriateness table available.';
  return 'Appropriateness table extracted. Clinical summary pending.';
}

function topicSearchText(topic: AppropriatenessTopic) {
  return [
    topic.id,
    topic.title,
    topic.year,
    topic.clinicalArea,
    topic.sourceLabel,
    topic.sourceNote,
    ...topic.keywords,
    ...procedureTypesForTopic(topic),
    ...topic.variants.flatMap((variant) => [
      variant.id,
      variant.title,
      variant.clinicalScenario,
      ...variant.imagingOptions.flatMap((option) => [
        option.procedure,
        option.appropriatenessCategory,
        option.radiationLevel,
        option.shortRationale,
      ]),
    ]),
  ]
    .join(' ')
    .toLowerCase();
}

function scoreTopic(topic: AppropriatenessTopic, query: string, mappedTopicIds: Set<string>) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return mappedTopicIds.has(topic.id) ? 20 : 0;

  const haystack = topicSearchText(topic);
  const terms = normalized.split(/\s+/).filter(Boolean);
  let score = mappedTopicIds.has(topic.id) ? 80 : 0;

  if (topic.title.toLowerCase().includes(normalized)) score += 90;
  if (topic.keywords.some((keyword) => keyword.toLowerCase().includes(normalized))) score += 55;
  if (topic.clinicalArea.toLowerCase().includes(normalized)) score += 25;
  if (topic.variants.some((variant) => variant.title.toLowerCase().includes(normalized))) score += 45;
  if (topic.variants.some((variant) => variant.clinicalScenario.toLowerCase().includes(normalized))) score += 45;
  if (topicOptions(topic).some((option) => option.procedure.toLowerCase().includes(normalized))) score += 40;
  if (terms.length && terms.every((term) => haystack.includes(term))) score += 25;

  return score;
}

function uniqueTopics(topics: AppropriatenessTopic[]) {
  const seen = new Set<string>();
  return topics.filter((topic) => {
    if (seen.has(topic.id)) return false;
    seen.add(topic.id);
    return true;
  });
}

function topicMatchesFilters(
  topic: AppropriatenessTopic,
  clinicalAreaFilter: string,
  procedureTypeFilter: string,
  categoryFilter: 'All' | AppropriatenessCategory,
  radiationFilter: 'All' | RadiationLevel,
  reviewStatusFilter: 'All' | ReviewStatus,
) {
  const options = topicOptions(topic);
  const matchesArea = clinicalAreaFilter === 'All' || topic.clinicalArea === clinicalAreaFilter;
  const matchesProcedureType = procedureTypeFilter === 'All' || procedureTypesForTopic(topic).includes(procedureTypeFilter as ProcedureType);
  const matchesCategory = categoryFilter === 'All' || options.some((option) => option.appropriatenessCategory === categoryFilter);
  const matchesRadiation = radiationFilter === 'All' || options.some((option) => option.radiationLevel === radiationFilter);
  const matchesReviewStatus = reviewStatusFilter === 'All' || topic.reviewStatus === reviewStatusFilter;

  return matchesArea && matchesProcedureType && matchesCategory && matchesRadiation && matchesReviewStatus;
}

function buildTopicGroups(
  topics: AppropriatenessTopic[],
  query: string,
  mappedTopicIds: Set<string>,
): TopicResultGroup[] {
  const groups: TopicResultGroup[] = [];
  const usedTopicIds = new Set<string>();
  const sortedTopics = [...topics].sort((a, b) => scoreTopic(b, query, mappedTopicIds) - scoreTopic(a, query, mappedTopicIds));

  function addGroup(id: string, title: string, helper: string, groupTopics: AppropriatenessTopic[]) {
    const uniqueGroupTopics = groupTopics.filter((topic) => !usedTopicIds.has(topic.id));
    if (!uniqueGroupTopics.length) return;
    uniqueGroupTopics.forEach((topic) => usedTopicIds.add(topic.id));
    groups.push({ id, title, helper, topics: uniqueGroupTopics });
  }

  if (query.trim()) {
    addGroup(
      'best',
      'Best matches',
      'Ranked by title, variant, procedure, keyword, and complaint mapping matches.',
      sortedTopics.filter((topic) => scoreTopic(topic, query, mappedTopicIds) > 0).slice(0, 10),
    );
  }

  addGroup(
    'related',
    'Related topics',
    'Topics connected through clinical complaint mappings.',
    sortedTopics.filter((topic) => mappedTopicIds.has(topic.id)),
  );
  addGroup(
    'curated',
    'Curated clinical summaries',
    'Reviewed or manually curated topics with clinical summary content.',
    sortedTopics.filter((topic) => topic.reviewStatus === 'reviewed' || topic.reviewStatus === 'manually_curated'),
  );
  addGroup(
    'extracted',
    'Extracted table summaries',
    'App-readable table summaries awaiting clinical summary validation.',
    sortedTopics.filter((topic) => topic.reviewStatus === 'extracted' || topic.reviewStatus === 'needs_validation'),
  );
  addGroup('other', 'Other matches', 'Additional topics matching the current filters.', sortedTopics);

  return groups;
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
          <p>{mapping.commonRequisitionLanguage || 'Requisition wording pending for this topic.'}</p>
        </div>
      </div>
      <div className="guide-related-topics">
        <h4>Related topics</h4>
        {relatedTopics.map(({ topicId, topic }) => (
          <div className="guide-related-topic" key={topicId}>
            <div>
              <strong>{topic?.title ?? humanizeTopicId(topicId)}</strong>
              <span>{topic ? `${topic.sourceLabel} · ${topic.year}` : 'Appropriateness table not extracted yet. Clinical summary pending.'}</span>
            </div>
            {topic ? <ReviewBadge topic={topic} /> : <span className="guide-review-badge pending">Summary pending</span>}
          </div>
        ))}
      </div>
      {relatedTopics.some(({ topic }) => topic) ? (
        <div className="guide-reviewed-recommendations">
          <h4>ACR-style recommendations</h4>
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

function TopicResultCard({
  topic,
  active,
  onSelect,
}: {
  topic: AppropriatenessTopic;
  active: boolean;
  onSelect: (topicId: string) => void;
}) {
  const procedureTypes = procedureTypesForTopic(topic);

  return (
    <button className={`guide-topic-card ${active ? 'active' : ''}`} onClick={() => onSelect(topic.id)} type="button">
      <div className="guide-topic-card-topline">
        <span>{topic.clinicalArea}</span>
        <ReviewBadge topic={topic} />
      </div>
      <strong>{topic.title}</strong>
      <small>{topic.sourceLabel}</small>
      <div className="guide-topic-card-stats">
        {topic.year && topic.year !== 'unknown' ? <span>{topic.year}</span> : null}
        <span>{topic.variants.length} variants</span>
        <span>{procedureTypes.slice(0, 3).join(', ') || 'Procedure type pending'}</span>
      </div>
      <div className="guide-topic-card-summary">
        <span>{topicRadiationSummary(topic)}</span>
        <span>{statusNoteForTopic(topic)}</span>
      </div>
    </button>
  );
}

function TopicResultGroups({
  groups,
  selectedTopic,
  onSelectTopic,
}: {
  groups: TopicResultGroup[];
  selectedTopic?: AppropriatenessTopic;
  onSelectTopic: (topicId: string) => void;
}) {
  if (!groups.length) {
    return <p className="guide-no-results">No reviewed or extracted topic found. Try a different symptom, diagnosis, or modality.</p>;
  }

  return (
    <>
      {groups.map((group) => (
        <section className="guide-result-group" key={group.id}>
          <div className="guide-result-group-header">
            <div>
              <h3>{group.title}</h3>
              <p>{group.helper}</p>
            </div>
            <span>{group.topics.length}</span>
          </div>
          <div className="guide-topic-list" aria-label={`${group.title} imaging guide topics`}>
            {group.topics.map((topic) => (
              <TopicResultCard
                active={Boolean(selectedTopic && topic.id === selectedTopic.id)}
                key={`${group.id}-${topic.id}`}
                onSelect={onSelectTopic}
                topic={topic}
              />
            ))}
          </div>
        </section>
      ))}
    </>
  );
}

interface ImagingGuidePanelProps {
  onUseInRequisition?: (topicId: string, variantId?: string) => void;
}

export function ImagingGuidePanel({ onUseInRequisition }: ImagingGuidePanelProps = {}) {
  const [query, setQuery] = useState('');
  const [clinicalAreaFilter, setClinicalAreaFilter] = useState('All');
  const [procedureTypeFilter, setProcedureTypeFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState<'All' | AppropriatenessCategory>('All');
  const [radiationFilter, setRadiationFilter] = useState<'All' | RadiationLevel>('All');
  const [reviewStatusFilter, setReviewStatusFilter] = useState<'All' | ReviewStatus>('All');
  const [selectedTopicId, setSelectedTopicId] = useState(appropriatenessTopics[0]?.id ?? '');
  const [selectedVariantId, setSelectedVariantId] = useState('');

  const matchingClinicalMappings = useMemo(() => searchClinicalMappings(query), [query]);
  const mappedTopicIds = useMemo(
    () => new Set(matchingClinicalMappings.flatMap((mapping) => mapping.relatedTopicIds)),
    [matchingClinicalMappings],
  );
  const topicById = useMemo(() => new Map(appropriatenessTopics.map((topic) => [topic.id, topic])), []);
  const clinicalAreas = useMemo(() => Array.from(new Set(appropriatenessTopics.map((topic) => topic.clinicalArea))).sort(), []);
  const procedureTypes = useMemo(
    () => Array.from(new Set(appropriatenessTopics.flatMap((topic) => procedureTypesForTopic(topic)))).sort(),
    [],
  );

  const visibleTopics = useMemo(() => {
    const searchResults = searchAppropriatenessLayer(query).topics;
    const candidateTopics = query.trim()
      ? uniqueTopics([
          ...searchResults,
          ...appropriatenessTopics.filter((topic) => mappedTopicIds.has(topic.id)),
        ])
      : appropriatenessTopics;

    return candidateTopics.filter((topic) =>
      topicMatchesFilters(topic, clinicalAreaFilter, procedureTypeFilter, categoryFilter, radiationFilter, reviewStatusFilter),
    );
  }, [categoryFilter, clinicalAreaFilter, mappedTopicIds, procedureTypeFilter, query, radiationFilter, reviewStatusFilter]);

  const groupedTopics = useMemo(() => buildTopicGroups(visibleTopics, query, mappedTopicIds), [mappedTopicIds, query, visibleTopics]);
  const selectedTopic = visibleTopics.find((topic) => topic.id === selectedTopicId) ?? visibleTopics[0];
  const selectedVariant =
    selectedTopic?.variants.find((variant) => variant.id === selectedVariantId) ?? selectedTopic?.variants[0];
  const requisitionText = selectedVariant?.requisitionSuggestions.join('\n\n') ?? 'Requisition wording pending for this topic.';
  const extractedTopicCount = appropriatenessTopics.filter(
    (topic) => topic.reviewStatus === 'extracted' || topic.reviewStatus === 'needs_validation',
  ).length;
  const curatedTopicCount = appropriatenessTopics.length - extractedTopicCount;

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const pending = window.localStorage.getItem(GUIDE_SELECTION_KEY);
    if (!pending) return;

    try {
      const parsed = JSON.parse(pending) as { topicId?: string; variantId?: string };
      if (parsed.topicId && appropriatenessTopics.some((topic) => topic.id === parsed.topicId)) {
        setSelectedTopicId(parsed.topicId);
        setSelectedVariantId(parsed.variantId ?? '');
      }
    } catch {
      // Ignore malformed handoff state.
    } finally {
      window.localStorage.removeItem(GUIDE_SELECTION_KEY);
    }
  }, []);

  function selectTopic(topicId: string) {
    const topic = appropriatenessTopics.find((item) => item.id === topicId);
    setSelectedTopicId(topicId);
    setSelectedVariantId(topic?.variants[0]?.id ?? '');
  }

  return (
    <section className="imaging-guide-panel">
      <div className="guide-disclaimer" role="note">
        Educational summary. Confirm with original criteria, local protocols, and radiologist judgment.
      </div>

      <div className="guide-layout">
        <aside className="guide-topic-panel">
          <label className="guide-search-label" htmlFor="imaging-guide-search">
            Search topic, complaint, variant, procedure, or keyword
          </label>
          <input
            id="imaging-guide-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="e.g. headache, CT, suspected PE, ultrasound, low back pain..."
          />
          <div className="guide-topic-count" role="status">
            <strong>{visibleTopics.length}</strong>
            <span>of {appropriatenessTopics.length} topics shown</span>
          </div>
          <div className="guide-library-count" role="status">
            <strong>{extractedTopicCount}</strong>
            <span>extracted ACR table topics available</span>
            {curatedTopicCount ? <small>{curatedTopicCount} curated/validated summary topic{curatedTopicCount === 1 ? '' : 's'}</small> : null}
          </div>
          <details className="guide-filter-disclosure">
            <summary>Filters</summary>
            <div className="guide-filter-grid">
              <label>
                Clinical area
                <select value={clinicalAreaFilter} onChange={(event) => setClinicalAreaFilter(event.target.value)}>
                  <option value="All">All</option>
                  {clinicalAreas.map((area) => (
                    <option value={area} key={area}>
                      {area}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Modality/procedure
                <select value={procedureTypeFilter} onChange={(event) => setProcedureTypeFilter(event.target.value)}>
                  <option value="All">All</option>
                  {procedureTypes.map((type) => (
                    <option value={type} key={type}>
                      {type}
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
                  <option value="extracted">Extracted table</option>
                  <option value="needs_validation">Needs validation</option>
                  <option value="reviewed">Reviewed</option>
                  <option value="manually_curated">Manually curated summary</option>
                </select>
              </label>
            </div>
          </details>
          <div className="guide-result-list" aria-label="Grouped Imaging Guide results">
            <TopicResultGroups groups={groupedTopics} onSelectTopic={selectTopic} selectedTopic={selectedTopic} />
          </div>
        </aside>

        <div className="guide-content">
          {matchingClinicalMappings.length ? (
            <section className="guide-section">
              <div className="guide-topic-header compact">
                <div>
                  <span className="eyebrow">Complaint mapping</span>
                  <h2>Clinical complaint matches</h2>
                  <p>
                    Complaint mappings connect everyday clinical language to extracted or curated Imaging Guide topics when available.
                  </p>
                </div>
              </div>
              <div className="guide-complaint-grid">
                {matchingClinicalMappings.map((mapping) => (
                  <ComplaintMappingCard mapping={mapping} topicById={topicById} key={mapping.id} />
                ))}
              </div>
            </section>
          ) : null}

          {selectedTopic ? (
            <>
              <div className="guide-topic-header">
                <div>
                  <span className="eyebrow">Imaging Guide topic</span>
                  <h2>{selectedTopic.title}</h2>
                  <div className="guide-source-meta">
                    <span>{selectedTopic.sourceLabel}</span>
                    {selectedTopic.year && selectedTopic.year !== 'unknown' ? <span>{selectedTopic.year}</span> : null}
                    <span>{selectedTopic.variants.length} variants</span>
                    <span>{topicRadiationSummary(selectedTopic)}</span>
                  </div>
                  <p>
                    {statusNoteForTopic(selectedTopic)} {reviewStatusSummary(selectedTopic.reviewStatus)}
                  </p>
                </div>
                <ReviewBadge topic={selectedTopic} />
              </div>
              <div className="guide-action-row">
                <button
                  className="primary-button"
                  onClick={() => onUseInRequisition?.(selectedTopic.id, selectedVariant?.id)}
                  type="button"
                >
                  Use in requisition
                </button>
                <CopyButton
                  text={`${selectedTopic.title}${selectedVariant ? ` - ${selectedVariant.title}` : ''}`}
                  label="Copy topic/variant"
                  className="secondary-button"
                />
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
                      <h3>Recommendation table</h3>
                      <span>Procedure, category, radiation, rationale</span>
                    </div>
                    {selectedVariant.imagingOptions.length ? (
                      <div className="guide-table-wrap">
                        <table className="guide-recommendation-table">
                          <thead>
                            <tr>
                              <th>Procedure</th>
                              <th>Appropriateness</th>
                              <th>Radiation</th>
                              <th>Short rationale</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedVariant.imagingOptions.map((option) => (
                              <tr key={option.procedure}>
                                <td>{option.procedure}</td>
                                <td>
                                  <span className={`guide-category-badge ${categoryClass(option.appropriatenessCategory)}`}>
                                    {option.appropriatenessCategory}
                                  </span>
                                </td>
                                <td>
                                  <span className="guide-radiation-badge">{option.radiationLevel}</span>
                                </td>
                                <td>{option.shortRationale}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p>Recommendation table pending for this variant.</p>
                    )}
                    <details className="guide-status-note source-detail-disclosure">
                      <summary>Source and extraction details</summary>
                      <p>{statusNoteForTopic(selectedTopic)} Source/status note: {selectedTopic.sourceNote}</p>
                    </details>
                  </section>

                  {selectedVariant.missingInformationPrompts.length ? (
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
                  ) : null}

                  <section className="guide-section guide-requisition">
                    <div className="guide-section-heading">
                      <h3>Requisition-ready wording</h3>
                      <CopyButton text={requisitionText} label="Copy wording" />
                    </div>
                    <p>{requisitionText}</p>
                  </section>

                  {(selectedVariant.reportingPearls.length || selectedVariant.cautions.length) ? (
                    <section className="guide-two-column">
                      {selectedVariant.reportingPearls.length ? (
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
                      ) : null}
                      {selectedVariant.cautions.length ? (
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
                      ) : null}
                    </section>
                  ) : null}

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
            </>
          ) : (
            <div className="guide-empty-state">
              <div>
                <span className="eyebrow">Imaging Guide</span>
                <h2>No reviewed or extracted topic found</h2>
                <p>Try a different symptom, diagnosis, modality, or review-status filter.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
