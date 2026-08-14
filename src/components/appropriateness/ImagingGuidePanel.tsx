import { useEffect, useMemo, useState } from 'react';
import { appropriatenessTopics } from '../../data/appropriateness';
import type {
  AppropriatenessCategory,
  AppropriatenessTopic,
  RadiationLevel,
  ReviewStatus,
} from '../../data/appropriateness';
import {
  searchClinicalMappings,
  type ClinicalComplaintMapping,
} from '../../data/appropriateness/clinicalMappings';
import {
  radiationLegend,
  reviewStatusLabel,
  reviewStatusSummary,
  searchAppropriatenessLayer,
} from '../../utils/appropriatenessSearch';
import { cleanVariantTitle } from '../../utils/requisitionTopicMatching';
import { CopyButton } from '../radrep/RadRepComponents';
import { translateClinicalInterfaceText, useI18n, type InterfaceLanguage } from '../../i18n/I18nContext';
import { normalizeClinicalSearchQuery } from '../../i18n/clinicalFrench';

const GUIDE_SELECTION_KEY = 'radreppilot.pendingImagingGuideSelection';

type ProcedureType =
  | 'CT'
  | 'MRI'
  | 'Ultrasound'
  | 'X-ray'
  | 'Mammography'
  | 'Nuclear/PET'
  | 'Fluoroscopy/IR'
  | 'Other';

interface TopicResultGroup {
  id: string;
  title: string;
  helper: string;
  topics: AppropriatenessTopic[];
}

const radiationRank: Partial<Record<RadiationLevel, number>> = {
  O: 0,
  '☢': 1,
  '☢☢': 2,
  '☢☢☢': 3,
  '☢☢☢☢': 4,
  '☢☢☢☢☢': 5,
  Varies: 6,
};

const guideStarterSearches = [
  'Headache',
  'Abdominal pain',
  'RUQ pain',
  'Renal colic',
  'Suspected PE',
  'Suspected DVT',
  'Low back pain',
  'Hematuria',
  'Chest pain',
  'Cough / dyspnea',
  'MSK trauma',
  'Acute pancreatitis',
];

function categoryClass(category: AppropriatenessCategory) {
  if (category === 'Usually Appropriate') return 'usually';
  if (category === 'Usually Not Appropriate') return 'not-appropriate';
  if (category.includes('Disagreement')) return 'disagreement';
  return 'may';
}

function ReviewBadge({ topic }: { topic: AppropriatenessTopic }) {
  const { clinicalText } = useI18n();
  return (
    <span className={`guide-review-badge ${topic.reviewStatus}`}>
      {clinicalText(reviewStatusLabel(topic.reviewStatus))}
    </span>
  );
}

function humanizeTopicId(topicId: string) {
  return topicId
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function topicOptions(topic: AppropriatenessTopic) {
  return (topic.variants ?? []).flatMap((variant) => variant.imagingOptions ?? []);
}

function inferProcedureType(procedure: string): ProcedureType {
  const normalized = procedure.toLowerCase();

  if (/\bpet\b|pet\/ct|spect|scintigraphy|nuclear/.test(normalized)) return 'Nuclear/PET';
  if (/mammography|mammogram|tomosynthesis|breast us/.test(normalized)) return 'Mammography';
  if (/\bus\b|ultrasound|sonography/.test(normalized)) return 'Ultrasound';
  if (/\bmri?\b|magnetic resonance/.test(normalized)) return 'MRI';
  if (/\bct\b|cta|ctpa|computed tomography/.test(normalized)) return 'CT';
  if (/radiograph|x-ray|xray|xr\b/.test(normalized)) return 'X-ray';
  if (/fluoro|fluoroscopy|angiography|venography|arteriography|catheter|intervention/.test(normalized)) {
    return 'Fluoroscopy/IR';
  }

  return 'Other';
}

function procedureTypesForTopic(topic: AppropriatenessTopic): ProcedureType[] {
  return Array.from(
    new Set(topicOptions(topic).map((option) => inferProcedureType(option.procedure)))
  ).sort();
}

function topicRadiationSummary(topic: AppropriatenessTopic) {
  const levels = Array.from(
    new Set(topicOptions(topic).map((option) => option.radiationLevel))
  ).filter(Boolean) as RadiationLevel[];

  if (!levels.length) return 'Radiation not listed';
  if (levels.length === 1) return `Radiation ${levels[0]}`;

  const nonVariableLevels = levels
    .filter((level) => level !== 'Varies')
    .sort((a, b) => (radiationRank[a] ?? 99) - (radiationRank[b] ?? 99));

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

function topicSearchText(topic: AppropriatenessTopic, language: InterfaceLanguage) {
  const sourceValues = [
    topic.id,
    topic.title,
    topic.year ?? '',
    topic.clinicalArea,
    topic.sourceLabel,
    topic.sourceNote ?? '',
    ...(topic.keywords ?? []),
    ...procedureTypesForTopic(topic),
    ...(topic.variants ?? []).flatMap((variant) => [
      variant.id,
      variant.title,
      variant.clinicalScenario,
      ...(variant.imagingOptions ?? []).flatMap((option) => [
        option.procedure,
        option.appropriatenessCategory,
        option.radiationLevel,
        option.shortRationale ?? '',
      ]),
    ]),
  ];

  return [...sourceValues, ...sourceValues.map((value) => translateClinicalInterfaceText(String(value), language))]
    .join(' ')
    .toLowerCase();
}

function scoreTopic(topic: AppropriatenessTopic, query: string, mappedTopicIds: Set<string>, language: InterfaceLanguage) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return mappedTopicIds.has(topic.id) ? 20 : 0;

  const haystack = topicSearchText(topic, language);
  const terms = normalized.split(/\s+/).filter(Boolean);
  let score = mappedTopicIds.has(topic.id) ? 80 : 0;

  if (topic.title.toLowerCase().includes(normalized) || translateClinicalInterfaceText(topic.title, language).toLowerCase().includes(normalized)) score += 90;
  if ((topic.keywords ?? []).some((keyword) => keyword.toLowerCase().includes(normalized))) score += 55;
  if (topic.clinicalArea.toLowerCase().includes(normalized)) score += 25;
  if ((topic.variants ?? []).some((variant) => variant.title.toLowerCase().includes(normalized))) score += 45;
  if ((topic.variants ?? []).some((variant) => variant.clinicalScenario.toLowerCase().includes(normalized))) score += 45;
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
  reviewStatusFilter: 'All' | ReviewStatus
) {
  const options = topicOptions(topic);
  const matchesArea = clinicalAreaFilter === 'All' || topic.clinicalArea === clinicalAreaFilter;
  const matchesProcedureType =
    procedureTypeFilter === 'All' ||
    procedureTypesForTopic(topic).includes(procedureTypeFilter as ProcedureType);
  const matchesCategory =
    categoryFilter === 'All' || options.some((option) => option.appropriatenessCategory === categoryFilter);
  const matchesRadiation =
    radiationFilter === 'All' || options.some((option) => option.radiationLevel === radiationFilter);
  const matchesReviewStatus = reviewStatusFilter === 'All' || topic.reviewStatus === reviewStatusFilter;

  return matchesArea && matchesProcedureType && matchesCategory && matchesRadiation && matchesReviewStatus;
}

function buildTopicGroups(
  topics: AppropriatenessTopic[],
  query: string,
  mappedTopicIds: Set<string>,
  language: InterfaceLanguage
): TopicResultGroup[] {
  const groups: TopicResultGroup[] = [];
  const usedTopicIds = new Set<string>();

  const sortedTopics = [...topics].sort(
    (a, b) => scoreTopic(b, query, mappedTopicIds, language) - scoreTopic(a, query, mappedTopicIds, language)
  );

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
      'Ranked by title, presentation, procedure, keyword, and complaint mapping matches.',
      sortedTopics.filter((topic) => scoreTopic(topic, query, mappedTopicIds, language) > 0).slice(0, 10)
    );
  }

  addGroup(
    'related',
    'Related topics',
    'Topics connected through clinical complaint mappings.',
    sortedTopics.filter((topic) => mappedTopicIds.has(topic.id))
  );

  addGroup(
    'curated',
    'Curated clinical summaries',
    'Reviewed or manually curated topics with clinical summary content.',
    sortedTopics.filter((topic) => topic.reviewStatus === 'reviewed' || topic.reviewStatus === 'manually_curated')
  );

  addGroup(
    'extracted',
    'Extracted table summaries',
    'App-readable table summaries awaiting clinical summary validation.',
    sortedTopics.filter((topic) => topic.reviewStatus === 'extracted' || topic.reviewStatus === 'needs_validation')
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
  const { clinicalText, text } = useI18n();
  const relatedTopics = mapping.relatedTopicIds.map((topicId) => ({
    topicId,
    topic: topicById.get(topicId),
  }));

  return (
    <article className="guide-complaint-card">
      <div className="guide-section-heading">
        <div>
          <span className="eyebrow">{text('Matching complaint')}</span>
          <h3>{clinicalText(mapping.complaint)}</h3>
        </div>
      </div>

      <div className="guide-complaint-synonyms">
        {mapping.synonyms.slice(0, 6).map((synonym) => (
          <span key={synonym}>{clinicalText(synonym)}</span>
        ))}
      </div>

      <div className="guide-two-column">
        <div>
          <h4>{text('Missing information prompts')}</h4>
          <ul>
            {mapping.missingInfoPrompts.map((prompt) => (
              <li key={prompt}>{clinicalText(prompt)}</li>
            ))}
          </ul>
        </div>

        <div>
          <div className="guide-section-heading">
            <h4>{text('Requisition wording')}</h4>
            <CopyButton text={mapping.commonRequisitionLanguage} label={text('Copy wording')} />
          </div>
          <p>{clinicalText(mapping.commonRequisitionLanguage || 'Requisition wording pending for this topic.')}</p>
        </div>
      </div>

      <div className="guide-related-topics">
        <h4>{text('Related topics')}</h4>
        {relatedTopics.map(({ topicId, topic }) => (
          <div className="guide-related-topic" key={topicId}>
            <div>
              <strong>{clinicalText(topic?.title ?? humanizeTopicId(topicId))}</strong>
              <span>
                {topic
                  ? `${clinicalText(topic.sourceLabel)}${topic.year ? ` · ${topic.year}` : ''}`
                  : text('Appropriateness table not extracted yet. Clinical summary pending.')}
              </span>
            </div>
            {topic ? (
              <ReviewBadge topic={topic} />
            ) : (
              <span className="guide-review-badge pending">{text('Summary pending')}</span>
            )}
          </div>
        ))}
      </div>

      {relatedTopics.some(({ topic }) => topic) ? (
        <div className="guide-reviewed-recommendations">
          <h4>{text('Imaging recommendations')}</h4>
          {relatedTopics
            .filter((item): item is { topicId: string; topic: AppropriatenessTopic } => Boolean(item.topic))
            .map(({ topic }) => {
              const candidateVariants = mapping.suggestedVariantIds?.length
                ? topic.variants.filter((variant) => mapping.suggestedVariantIds?.includes(variant.id))
                : topic.variants.slice(0, 1);

              const variantsToShow = candidateVariants.length ? candidateVariants : topic.variants.slice(0, 1);

              return variantsToShow.map((variant) => (
                <div className="guide-reviewed-variant" key={`${topic.id}-${variant.id}`}>
                  <strong>{clinicalText(cleanVariantTitle(variant.title))}</strong>
                  <div className="guide-mini-option-list">
                    {(variant.imagingOptions ?? []).slice(0, 4).map((option) => (
                      <span key={option.procedure}>
                        {clinicalText(option.procedure)} · {clinicalText(option.appropriatenessCategory)} · {option.radiationLevel}
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
  const { clinicalText, text } = useI18n();
  const procedureTypes = procedureTypesForTopic(topic);

  return (
    <button
      className={`guide-topic-card ${active ? 'active' : ''}`}
      onClick={() => onSelect(topic.id)}
      type="button"
    >
      <div className="guide-topic-card-topline">
        <span>{clinicalText(topic.clinicalArea)}</span>
        <ReviewBadge topic={topic} />
      </div>

      <strong>{clinicalText(topic.title)}</strong>
      <small>{clinicalText(topic.sourceLabel)}</small>

      <div className="guide-topic-card-stats">
        {topic.year && topic.year !== 'unknown' ? <span>{topic.year}</span> : null}
        <span>{topic.variants.length} {text('recommendation sets')}</span>
        <span>{procedureTypes.slice(0, 3).map(clinicalText).join(', ') || text('Procedure type pending')}</span>
      </div>

      <div className="guide-topic-card-summary">
        <span>{clinicalText(topicRadiationSummary(topic))}</span>
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
  const { text } = useI18n();
  if (!groups.length) {
    return (
      <p className="guide-no-results">
        {text('No reviewed or extracted topic found. Try a different symptom, diagnosis, or modality.')}
      </p>
    );
  }

  return (
    <>
      {groups.map((group) => (
        <section className="guide-result-group" key={group.id}>
          <div className="guide-result-group-header">
            <div>
              <h3>{text(group.title)}</h3>
            </div>
            <span>{group.topics.length}</span>
          </div>

          <div className="guide-topic-list" aria-label={`${text(group.title)} ${text('imaging guide topics')}`}>
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
  onUseInRequisition?: (
    topicId: string,
    variantId?: string,
    handoff?: { scenarioTitle?: string; procedure?: string }
  ) => void;
}

export function ImagingGuidePanel({ onUseInRequisition }: ImagingGuidePanelProps = {}) {
  const { clinicalText, language, text } = useI18n();
  const [query, setQuery] = useState('');
  const [clinicalAreaFilter, setClinicalAreaFilter] = useState('All');
  const [procedureTypeFilter, setProcedureTypeFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState<'All' | AppropriatenessCategory>('All');
  const [radiationFilter, setRadiationFilter] = useState<'All' | RadiationLevel>('All');
  const [reviewStatusFilter, setReviewStatusFilter] = useState<'All' | ReviewStatus>('All');
  const [selectedTopicId, setSelectedTopicId] = useState(appropriatenessTopics[0]?.id ?? '');
  const [selectedVariantId, setSelectedVariantId] = useState('');

  const sourceQuery = useMemo(() => normalizeClinicalSearchQuery(query, language), [language, query]);

  const matchingClinicalMappings = useMemo(() => searchClinicalMappings(sourceQuery), [sourceQuery]);

  const mappedTopicIds = useMemo(
    () => new Set(matchingClinicalMappings.flatMap((mapping) => mapping.relatedTopicIds)),
    [matchingClinicalMappings]
  );

  const topicById = useMemo(
    () => new Map(appropriatenessTopics.map((topic) => [topic.id, topic])),
    []
  );

  const clinicalAreas = useMemo(
    () => Array.from(new Set(appropriatenessTopics.map((topic) => topic.clinicalArea))).sort(),
    []
  );

  const procedureTypes = useMemo(
    () => Array.from(new Set(appropriatenessTopics.flatMap((topic) => procedureTypesForTopic(topic)))).sort(),
    []
  );

  const hasSearch = Boolean(query.trim());
  const hasActiveFilter =
    clinicalAreaFilter !== 'All' ||
    procedureTypeFilter !== 'All' ||
    categoryFilter !== 'All' ||
    radiationFilter !== 'All' ||
    reviewStatusFilter !== 'All';

  const visibleTopics = useMemo(() => {
    const searchResults = hasSearch ? searchAppropriatenessLayer(sourceQuery).topics : [];
    const translatedSearchResults = hasSearch
      ? appropriatenessTopics.filter((topic) => scoreTopic(topic, query, mappedTopicIds, language) > 0)
      : [];
    const candidateTopics = hasSearch
      ? uniqueTopics([
          ...searchResults,
          ...translatedSearchResults,
          ...appropriatenessTopics.filter((topic) => mappedTopicIds.has(topic.id)),
        ])
      : hasActiveFilter
        ? appropriatenessTopics
        : [];

    return candidateTopics.filter((topic) =>
      topicMatchesFilters(
        topic,
        clinicalAreaFilter,
        procedureTypeFilter,
        categoryFilter,
        radiationFilter,
        reviewStatusFilter
      )
    );
  }, [
    categoryFilter,
    clinicalAreaFilter,
    hasActiveFilter,
    hasSearch,
    language,
    mappedTopicIds,
    procedureTypeFilter,
    query,
    radiationFilter,
    reviewStatusFilter,
    sourceQuery,
  ]);

  const groupedTopics = useMemo(
    () => buildTopicGroups(visibleTopics, query, mappedTopicIds, language),
    [language, mappedTopicIds, query, visibleTopics]
  );

  const selectedTopic = visibleTopics.find((topic) => topic.id === selectedTopicId) ?? visibleTopics[0];

  const selectedVariant =
    selectedTopic?.variants.find((variant) => variant.id === selectedVariantId) ?? selectedTopic?.variants[0];

  const selectedVariantImagingOptions = selectedVariant?.imagingOptions ?? [];
  const selectedVariantMissingInformationPrompts = selectedVariant?.missingInformationPrompts ?? [];
  const selectedVariantReportingPearls = selectedVariant?.reportingPearls ?? [];
  const selectedVariantCautions = selectedVariant?.cautions ?? [];
  const selectedVariantFollowUpPearls = selectedVariant?.followUpPearls ?? [];
  const selectedVariantRequisitionSuggestions = selectedVariant?.requisitionSuggestions ?? [];

  const requisitionText = selectedVariantRequisitionSuggestions.length
    ? selectedVariantRequisitionSuggestions.join('\n\n')
    : 'Requisition wording pending for this extracted table. Use the selected imaging option to generate a focused request.';

  const extractedTopicCount = appropriatenessTopics.filter(
    (topic) => topic.reviewStatus === 'extracted' || topic.reviewStatus === 'needs_validation'
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
        {text('Educational summary. Confirm with original criteria, local protocols, and radiologist judgment.')}
      </div>

      <div className="guide-layout">
        <aside className="guide-topic-panel">
          <label className="guide-search-label" htmlFor="imaging-guide-search">
            {text('Search complaint, topic, presentation, procedure, or keyword')}
          </label>

          <input
            id="imaging-guide-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={text('e.g. headache, CT, suspected PE, ultrasound, low back pain...')}
          />

          {!hasSearch ? (
            <div className="guide-starter-searches" aria-label={text('Common Imaging Guide searches')}>
              <span>{text('Common searches')}</span>
              <div>
                {guideStarterSearches.map((starterSearch) => (
                  <button
                    className="guide-starter-chip"
                    type="button"
                    onClick={() => {
                      setQuery(text(starterSearch));
                      setSelectedTopicId('');
                      setSelectedVariantId('');
                    }}
                    key={starterSearch}
                  >
                    {text(starterSearch)}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <div className="guide-topic-count" role="status">
            <strong>{visibleTopics.length}</strong>
            <span>{text('of')} {appropriatenessTopics.length} {text('topics shown')}</span>
          </div>

          <div className="guide-library-count" role="status">
            <strong>{extractedTopicCount}</strong>
            <span>{text('extracted ACR table topics available')}</span>
            {curatedTopicCount ? (
              <small>
                {curatedTopicCount} {text(curatedTopicCount === 1 ? 'curated/validated summary topic' : 'curated/validated summary topics')}
              </small>
            ) : null}
          </div>

          <details className="guide-filter-disclosure">
            <summary>{text('Filters')}</summary>

            <div className="guide-filter-grid">
              <label>
                {text('Clinical area')}
                <select value={clinicalAreaFilter} onChange={(event) => setClinicalAreaFilter(event.target.value)}>
                  <option value="All">{text('All')}</option>
                  {clinicalAreas.map((area) => (
                    <option value={area} key={area}>
                      {clinicalText(area)}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                {text('Modality/procedure')}
                <select value={procedureTypeFilter} onChange={(event) => setProcedureTypeFilter(event.target.value)}>
                  <option value="All">{text('All')}</option>
                  {procedureTypes.map((type) => (
                    <option value={type} key={type}>
                      {clinicalText(type)}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                {text('Category')}
                <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value as never)}>
                  <option value="All">{text('All')}</option>
                  <option value="Usually Appropriate">{text('Usually Appropriate')}</option>
                  <option value="May Be Appropriate">{text('May Be Appropriate')}</option>
                  <option value="May Be Appropriate (Disagreement)">{text('May Be Appropriate (Disagreement)')}</option>
                  <option value="Usually Not Appropriate">{text('Usually Not Appropriate')}</option>
                </select>
              </label>

              <label>
                {text('Radiation')}
                <select value={radiationFilter} onChange={(event) => setRadiationFilter(event.target.value as never)}>
                  <option value="All">{text('All')}</option>
                  {radiationLegend.map((item) => (
                    <option value={item.level} key={item.level}>
                      {text(item.level)}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                {text('Review status')}
                <select value={reviewStatusFilter} onChange={(event) => setReviewStatusFilter(event.target.value as never)}>
                  <option value="All">{text('All')}</option>
                  <option value="extracted">{text('Extracted table')}</option>
                  <option value="needs_validation">{text('Needs validation')}</option>
                  <option value="reviewed">{text('Reviewed')}</option>
                  <option value="manually_curated">{text('Manually curated summary')}</option>
                </select>
              </label>
            </div>
          </details>

          <div className="guide-result-list" aria-label={text('Grouped Imaging Guide results')}>
            {!hasSearch && !hasActiveFilter ? (
              <p className="guide-no-results">
                {text('Search a complaint, diagnosis, modality, or procedure to view matching extracted recommendations.')}
              </p>
            ) : (
              <TopicResultGroups groups={groupedTopics} onSelectTopic={selectTopic} selectedTopic={selectedTopic} />
            )}
          </div>
        </aside>

        <div className="guide-content">
          {matchingClinicalMappings.length ? (
            <section className="guide-section">
              <div className="guide-topic-header compact">
                <div>
                  <span className="eyebrow">{text('Complaint mapping')}</span>
                  <h2>{text('Clinical complaint matches')}</h2>
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
                  <span className="eyebrow">{text('Imaging Guide topic')}</span>
                  <h2>{clinicalText(selectedTopic.title)}</h2>

                  <div className="guide-source-meta">
                    <span>{clinicalText(selectedTopic.sourceLabel)}</span>
                    {selectedTopic.year && selectedTopic.year !== 'unknown' ? <span>{selectedTopic.year}</span> : null}
                    <span>{selectedTopic.variants.length} {text('recommendation sets')}</span>
                    <span>{clinicalText(topicRadiationSummary(selectedTopic))}</span>
                  </div>

                  <p>
                    {clinicalText(statusNoteForTopic(selectedTopic))} {clinicalText(reviewStatusSummary(selectedTopic.reviewStatus))}
                  </p>
                </div>

                <ReviewBadge topic={selectedTopic} />
              </div>

              <div className="guide-action-row">
                <button
                  className="primary-button"
                  onClick={() => {
                    const usuallyAppropriate = selectedVariantImagingOptions.find(
                      (option) => option.appropriatenessCategory === 'Usually Appropriate'
                    );

                    onUseInRequisition?.(selectedTopic.id, selectedVariant?.id, {
                      scenarioTitle: selectedVariant
                        ? cleanVariantTitle(selectedVariant.title || selectedVariant.clinicalScenario)
                        : undefined,
                      procedure: usuallyAppropriate?.procedure,
                    });
                  }}
                  type="button"
                >
                  {text('Use in requisition')}
                </button>

                <CopyButton
                  text={`${selectedTopic.title}${selectedVariant ? ` - ${cleanVariantTitle(selectedVariant.title)}` : ''}`}
                  label={text('Copy guide item')}
                  className="secondary-button"
                />
              </div>

              {selectedTopic.sourceUrl ? (
                <a className="guide-source-link" href={selectedTopic.sourceUrl} target="_blank" rel="noreferrer">
                  {text('Verify against official ACR Appropriateness Criteria')}
                </a>
              ) : null}

              <section className="guide-section">
                <label className="guide-search-label" htmlFor="imaging-guide-variant">
                  {text('Clinical presentation')}
                </label>

                <select
                  id="imaging-guide-variant"
                  value={selectedVariant?.id ?? ''}
                  onChange={(event) => setSelectedVariantId(event.target.value)}
                >
                  {selectedTopic.variants.map((variant) => (
                    <option key={variant.id} value={variant.id}>
                      {clinicalText(cleanVariantTitle(variant.title))}
                    </option>
                  ))}
                </select>

                {selectedVariant ? <p>{clinicalText(selectedVariant.clinicalScenario)}</p> : null}
              </section>

              {selectedVariant ? (
                <>
                  <section className="guide-section">
                    <div className="guide-section-heading">
                      <h3>{text('Recommendation table')}</h3>
                    </div>

                    {selectedVariantImagingOptions.length ? (
                      <div className="guide-table-wrap">
                        <table className="guide-recommendation-table">
                          <thead>
                            <tr>
                              <th>{text('Procedure')}</th>
                              <th>{text('Appropriateness')}</th>
                              <th>{text('Radiation')}</th>
                              <th>{text('Short rationale')}</th>
                            </tr>
                          </thead>

                          <tbody>
                            {selectedVariantImagingOptions.map((option) => (
                              <tr key={option.procedure}>
                                <td>{clinicalText(option.procedure)}</td>
                                <td>
                                  <span className={`guide-category-badge ${categoryClass(option.appropriatenessCategory)}`}>
                                    {clinicalText(option.appropriatenessCategory)}
                                  </span>
                                </td>
                                <td>
                                  <span className="guide-radiation-badge">{option.radiationLevel}</span>
                                </td>
                                <td>{clinicalText(option.shortRationale ?? '')}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p>{text('Recommendation table pending for this presentation.')}</p>
                    )}

                    <details className="guide-status-note source-detail-disclosure">
                      <summary>{text('Provenance')}</summary>
                      <p>
                        {clinicalText(statusNoteForTopic(selectedTopic))}{' '}
                        {clinicalText(selectedTopic.sourceNote || 'No additional source note available.')}
                      </p>
                    </details>
                  </section>

                  {selectedVariantMissingInformationPrompts.length ? (
                    <section className="guide-section">
                      <div className="guide-section-heading">
                        <h3>{text('Missing clinical information')}</h3>
                      </div>
                      <ul className="guide-chip-list">
                        {selectedVariantMissingInformationPrompts.map((prompt) => (
                          <li key={prompt}>{clinicalText(prompt)}</li>
                        ))}
                      </ul>
                    </section>
                  ) : null}

                  <section className="guide-section guide-requisition">
                    <div className="guide-section-heading">
                      <h3>{text('Requisition-ready wording')}</h3>
                      <CopyButton text={requisitionText} label={text('Copy wording')} />
                    </div>
                    <p>{clinicalText(requisitionText)}</p>
                  </section>

                  {selectedVariantReportingPearls.length || selectedVariantCautions.length ? (
                    <section className="guide-two-column">
                      {selectedVariantReportingPearls.length ? (
                        <div className="guide-section">
                          <div className="guide-section-heading">
                            <h3>{text('Reporting pearls')}</h3>
                          </div>
                          <ul>
                            {selectedVariantReportingPearls.map((pearl) => (
                              <li key={pearl}>{clinicalText(pearl)}</li>
                            ))}
                          </ul>
                        </div>
                      ) : null}

                      {selectedVariantCautions.length ? (
                        <div className="guide-section caution">
                          <div className="guide-section-heading">
                            <h3>{text('Cautions')}</h3>
                          </div>
                          <ul>
                            {selectedVariantCautions.map((caution) => (
                              <li key={caution}>{clinicalText(caution)}</li>
                            ))}
                          </ul>
                        </div>
                      ) : null}
                    </section>
                  ) : null}

                  {selectedVariantFollowUpPearls.length ? (
                    <section className="guide-section">
                      <div className="guide-section-heading">
                        <h3>{text('Follow-up pearls')}</h3>
                        <span>{text('Educational only; verify local protocol')}</span>
                      </div>
                      <ul>
                        {selectedVariantFollowUpPearls.map((pearl) => (
                          <li key={pearl}>{clinicalText(pearl)}</li>
                        ))}
                      </ul>
                    </section>
                  ) : null}

                  <section className="guide-section">
                    <div className="guide-section-heading">
                      <h3>{text('Radiation legend')}</h3>
                    </div>

                    <div className="guide-radiation-legend">
                      {radiationLegend.map((item) => (
                        <span key={item.level}>
                          <strong>{clinicalText(item.level)}</strong> = {clinicalText(item.label)}
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
                <span className="eyebrow">{text('Search-first guide')}</span>
                {!hasSearch && !hasActiveFilter ? (
                  <>
                    <h2>{text('Search a complaint to begin.')}</h2>
                    <p>
                      {text('The Imaging Guide contains extracted appropriateness tables, but it only shows matches after you search or apply filters so the page stays readable.')}
                    </p>
                  </>
                ) : (
                  <>
                    <h2>{text('No reviewed or extracted topic found')}</h2>
                    <p>{text('Try a different symptom, diagnosis, modality, or review-status filter.')}</p>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
