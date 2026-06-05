import { useEffect, useMemo, useState } from 'react';
import type { PrimaryCareContentTemplate, ReferralFormState } from '../../radrep/types';
import type { AppropriatenessCategory, AppropriatenessTopic } from '../../data/appropriateness';
import type { ClinicalComplaintMapping } from '../../data/appropriateness/clinicalMappings';
import {
  allClinicalMappings,
  radiationLegend,
  reviewStatusLabel,
  searchAppropriatenessLayer,
} from '../../utils/appropriatenessSearch';
import {
  generateAppropriatenessAwareRequisitionSentence,
  getComplaintMappingById,
  getDefaultComplaintId,
  getGroupedRecommendationOptions,
  resolveAppropriatenessForComplaint,
  resolveAppropriatenessForTopic,
} from '../../utils/requisitionAppropriateness';
import { CopyButton } from '../radrep/RadRepComponents';

interface RequisitionAppropriatenessPanelProps {
  template: PrimaryCareContentTemplate;
  form: ReferralFormState;
  selectedComplaintId: string;
  preferredVariantId?: string;
  onSelectComplaint: (complaintId: string) => void;
  onSelectScenario?: (scenario: { topicTitle: string; variantTitle: string; clinicalScenario: string; suggestedQuestion?: string }) => void;
  onToggleClinicalPrompt?: (prompt: string, checked: boolean) => void;
  onApplyWording: (text: string) => void;
  onSelectImagingOption: (procedure: string, suggestedQuestion: string) => void;
  onOpenGuide?: (topicId: string, variantId?: string) => void;
}

const categoryOrder: AppropriatenessCategory[] = [
  'Usually Appropriate',
  'May Be Appropriate',
  'May Be Appropriate (Disagreement)',
  'Usually Not Appropriate',
];

function categoryClass(category: AppropriatenessCategory) {
  if (category === 'Usually Appropriate') return 'usually';
  if (category === 'Usually Not Appropriate') return 'not-appropriate';
  if (category === 'May Be Appropriate (Disagreement)') return 'disagreement';
  return 'may';
}

function selectionKeyForTopic(topicId: string) {
  return `topic:${topicId}`;
}

function selectedTopicId(selectionId: string) {
  return selectionId.startsWith('topic:') ? selectionId.replace(/^topic:/, '') : '';
}

function topicSummary(topic: AppropriatenessTopic) {
  return [
    topic.clinicalArea,
    topic.year ? `${topic.year}` : undefined,
    `${topic.variants.length} variant${topic.variants.length === 1 ? '' : 's'}`,
  ]
    .filter(Boolean)
    .join(' · ');
}

function complaintSummary(mapping: ClinicalComplaintMapping) {
  return mapping.synonyms.slice(0, 3).join(' · ');
}

function topOptionsForMapping(mapping: ClinicalComplaintMapping): string {
  const support = resolveAppropriatenessForComplaint(mapping);
  const options = support.relatedTopics.flatMap((topic) => topic.topOptions).slice(0, 3);
  if (!options.length) return 'Recommendations pending';
  return options.map((option) => option.procedure).join(' · ');
}

function topOptionsForTopic(topic: AppropriatenessTopic): string {
  const options = topic.variants.flatMap((variant) => variant.imagingOptions).filter((option) => option.appropriatenessCategory === 'Usually Appropriate').slice(0, 3);
  if (!options.length) return 'Usually Appropriate options pending';
  return options.map((option) => option.procedure).join(' · ');
}

export function RequisitionAppropriatenessPanel({
  template,
  form,
  selectedComplaintId,
  preferredVariantId,
  onSelectComplaint,
  onSelectScenario,
  onToggleClinicalPrompt,
  onApplyWording,
  onSelectImagingOption,
  onOpenGuide,
}: RequisitionAppropriatenessPanelProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVariantKey, setSelectedVariantKey] = useState('');
  const [selectedPromptChips, setSelectedPromptChips] = useState<string[]>([]);
  const effectiveComplaintId = selectedComplaintId;
  const directTopicId = selectedTopicId(effectiveComplaintId);
  const mapping = directTopicId ? undefined : getComplaintMappingById(effectiveComplaintId);
  const support = directTopicId ? resolveAppropriatenessForTopic(directTopicId) : resolveAppropriatenessForComplaint(mapping);
  const variantChoices = useMemo(
    () =>
      support.relatedTopics.flatMap((item) =>
        item.suggestedVariants.map((variant) => ({
          key: `${item.topicId}:${variant.id}`,
          topicId: item.topicId,
          topicTitle: item.topic?.title ?? item.topicId.replace(/-/g, ' '),
          topic: item.topic,
          variant,
        })),
      ),
    [support],
  );
  const activeVariantChoice =
    variantChoices.find((item) => item.key === selectedVariantKey) ??
    variantChoices.find((item) => preferredVariantId && item.variant.id === preferredVariantId) ??
    variantChoices.find((item) => item.variant.imagingOptions.length) ??
    variantChoices[0];
  const scenarioSupport = useMemo(() => {
    if (!activeVariantChoice) return support;

    return {
      ...support,
      relatedTopics: support.relatedTopics.map((topic) =>
        topic.topicId === activeVariantChoice.topicId
          ? {
              ...topic,
              suggestedVariants: topic.suggestedVariants.filter((variant) => variant.id === activeVariantChoice.variant.id),
            }
          : {
              ...topic,
              suggestedVariants: [],
            },
      ),
    };
  }, [activeVariantChoice, support]);
  const groupedOptions = useMemo(() => getGroupedRecommendationOptions(scenarioSupport), [scenarioSupport]);
  const firstProcedure = support.relatedTopics.flatMap((topic) => topic.topOptions)[0]?.procedure;
  const draftWording = generateAppropriatenessAwareRequisitionSentence(form, template, firstProcedure);
  const searched = useMemo(() => {
    const query = searchTerm.trim();
    if (!query) {
      return {
        complaintMappings: allClinicalMappings().slice(0, 8),
        topics: [],
      };
    }

    return searchAppropriatenessLayer(query);
  }, [searchTerm]);
  const selectedLabel =
    mapping?.complaint ??
    support.relatedTopics.find((item) => item.topic)?.topic?.title ??
    (effectiveComplaintId ? effectiveComplaintId.replace(/^topic:/, '').replace(/-/g, ' ') : '');
  const hasSupport = Boolean(mapping || directTopicId || support.relatedTopics.length);

  useEffect(() => {
    setSelectedVariantKey('');
    setSelectedPromptChips([]);
  }, [effectiveComplaintId]);

  useEffect(() => {
    if (!preferredVariantId || selectedVariantKey) return;
    const match = variantChoices.find((item) => item.variant.id === preferredVariantId);
    if (match) setSelectedVariantKey(match.key);
  }, [preferredVariantId, selectedVariantKey, variantChoices]);

  const togglePromptChip = (prompt: string) => {
    setSelectedPromptChips((existing) => {
      const checked = !existing.includes(prompt);
      onToggleClinicalPrompt?.(prompt, checked);
      return checked ? [...existing, prompt] : existing.filter((item) => item !== prompt);
    });
  };

  const useActiveScenario = () => {
    if (!activeVariantChoice) return;
    onSelectScenario?.({
      topicTitle: activeVariantChoice.topicTitle,
      variantTitle: activeVariantChoice.variant.title,
      clinicalScenario: activeVariantChoice.variant.clinicalScenario,
      suggestedQuestion: support.requisitionLanguage || activeVariantChoice.variant.requisitionSuggestions[0],
    });
  };

  return (
    <section className="requisition-appropriateness-panel">
      <div className="guide-disclaimer" role="note">
        Educational appropriateness summary. Confirm with local protocols, radiology guidance, and the original criteria when needed.
      </div>

      <div className="guide-section-heading">
        <div>
          <span className="eyebrow">Educational appropriateness summary</span>
          <h3>Clinical complaint to ACR imaging options</h3>
        </div>
      </div>

      <label className="field">
        Search complaint, diagnosis, clinical scenario, or procedure
        <input
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Search complaint, diagnosis, clinical scenario, or procedure..."
        />
      </label>

      {!searchTerm.trim() ? (
        <div className="requisition-starting-points" aria-label="Common starting points">
          {['headache', 'low back pain', 'suspected PE', 'DVT', 'abdominal pain', 'hematuria', 'renal colic', 'pancreatitis'].map((chip) => (
            <button className="ghost-button chip-button" onClick={() => setSearchTerm(chip)} type="button" key={chip}>
              {chip}
            </button>
          ))}
        </div>
      ) : null}

      <div className="requisition-match-list" aria-label="Top matching complaint and topic options">
        {searched.complaintMappings.slice(0, 5).map((item) => (
          <button
            className={`requisition-match-card ${effectiveComplaintId === item.id ? 'active' : ''}`}
            onClick={() => onSelectComplaint(item.id)}
            type="button"
            key={item.id}
          >
            <span>Complaint</span>
            <strong>{item.complaint}</strong>
            <small>{complaintSummary(item)}</small>
            <em>{topOptionsForMapping(item)}</em>
            <b>Use this scenario</b>
          </button>
        ))}
        {searched.topics.slice(0, 5).map((topic) => (
          <button
            className={`requisition-match-card ${effectiveComplaintId === selectionKeyForTopic(topic.id) ? 'active' : ''}`}
            onClick={() => onSelectComplaint(selectionKeyForTopic(topic.id))}
            type="button"
            key={topic.id}
          >
            <span>ACR topic</span>
            <strong>{topic.title}</strong>
            <small>{topicSummary(topic)}</small>
            <em>{topOptionsForTopic(topic)}</em>
            <b>Use this scenario</b>
          </button>
        ))}
      </div>

      {hasSupport ? (
        <>
          {selectedLabel ? (
            <div className="requisition-selected-context">
              <span>Selected support path</span>
              <strong>{selectedLabel}</strong>
            </div>
          ) : null}

          {support.mapping ? (
            <div className="guide-complaint-synonyms">
              {support.mapping.synonyms.slice(0, 7).map((synonym) => (
                <span key={synonym}>{synonym}</span>
              ))}
            </div>
          ) : null}

          {variantChoices.length ? (
            <div className="guide-section-heading">
              <div>
                <h4>Selected ACR scenario</h4>
                <p>Choose the closest extracted variant before selecting a requested imaging option.</p>
              </div>
            </div>
          ) : null}

          {variantChoices.length ? (
            <section className="guide-section compact requisition-scenario-card">
              <label className="field">
                Clinical scenario / variant
                <select
                  value={activeVariantChoice?.key ?? ''}
                  onChange={(event) => setSelectedVariantKey(event.target.value)}
                >
                  {variantChoices.map((item) => (
                    <option value={item.key} key={item.key}>
                      {item.topicTitle} - {item.variant.title}
                    </option>
                  ))}
                </select>
              </label>
              {activeVariantChoice ? (
                <>
                  <p>{activeVariantChoice.variant.clinicalScenario}</p>
                  <div className="guide-action-row">
                    <button className="primary-button" onClick={useActiveScenario} type="button">
                      Use this scenario
                    </button>
                    <button
                      className="secondary-button"
                      onClick={() => onOpenGuide?.(activeVariantChoice.topicId, activeVariantChoice.variant.id)}
                      type="button"
                    >
                      Open in Imaging Guide
                    </button>
                    <span className={`guide-review-badge ${activeVariantChoice.topic?.reviewStatus ?? 'pending'}`}>
                      {activeVariantChoice.topic ? reviewStatusLabel(activeVariantChoice.topic.reviewStatus) : 'Clinical summary pending'}
                    </span>
                  </div>
                </>
              ) : null}
            </section>
          ) : null}

          {support.missingInfoPrompts.length ? (
            <section className="guide-section compact requisition-prompt-card">
              <div className="guide-section-heading">
                <div>
                  <h4>Short clinical prompts</h4>
                  <p>Select relevant context to add it to the requisition draft.</p>
                </div>
              </div>
              <div className="requisition-prompt-chip-grid">
                {support.missingInfoPrompts.slice(0, 10).map((prompt) => {
                  const checked = selectedPromptChips.includes(prompt);
                  return (
                    <button
                      className={`prompt-chip ${checked ? 'active' : ''}`}
                      onClick={() => togglePromptChip(prompt)}
                      type="button"
                      aria-pressed={checked}
                      key={prompt}
                    >
                      {checked ? 'Added: ' : ''}
                      {prompt}
                    </button>
                  );
                })}
              </div>
            </section>
          ) : null}

          <section className="guide-section compact">
            <div className="guide-section-heading">
              <div>
                <h4>Recommended imaging options</h4>
                <p>Usually Appropriate options are expanded by default. Other categories are available when you need context.</p>
              </div>
            </div>
            <div className="requisition-recommendation-groups">
              {categoryOrder.map((category) => {
                const options = groupedOptions[category].slice(0, category === 'Usually Not Appropriate' ? 20 : 10);
                if (!options.length) return null;

                return (
                  <details className="requisition-recommendation-group" open={category === 'Usually Appropriate'} key={category}>
                    <summary>
                      <span className={`guide-category-badge ${categoryClass(category)}`}>{category}</span>
                      <small>{options.length} option{options.length === 1 ? '' : 's'}</small>
                    </summary>
                    <div className="requisition-option-list">
                      {options.map((item) => {
                        const suggestedQuestion =
                          support.requisitionLanguage && support.requisitionLanguage !== 'Requisition wording pending for this topic.'
                            ? support.requisitionLanguage
                            : `Please assess for findings relevant to ${item.variantTitle}.`;
                        return (
                          <article className="requisition-option-card" key={`${item.topicId}-${item.variantId}-${item.option.procedure}`}>
                            <div>
                              <strong>{item.option.procedure}</strong>
                              <span>{item.topicTitle} · {item.variantTitle}</span>
                            </div>
                            <div className="requisition-option-badges">
                              <span className={`guide-category-badge ${categoryClass(item.option.appropriatenessCategory)}`}>
                                {item.option.appropriatenessCategory}
                              </span>
                              <span className="guide-radiation-badge">{item.option.radiationLevel}</span>
                            </div>
                            <p>{item.option.shortRationale}</p>
                            <small className="guide-status-note">
                              {item.reviewStatus === 'manually_curated' || item.reviewStatus === 'reviewed'
                                ? 'Curated requisition support available.'
                                : 'Extracted ACR table. Validate against source before clinical use.'}
                            </small>
                            <button
                              className="secondary-button"
                              onClick={() => onSelectImagingOption(item.option.procedure, suggestedQuestion)}
                              type="button"
                            >
                              Select as requested modality
                            </button>
                          </article>
                        );
                      })}
                    </div>
                  </details>
                );
              })}
            </div>
          </section>

          <details className="guide-section compact" open={false}>
            <summary>Missing information checklist</summary>
            <ul className="guide-chip-list">
              {support.missingInfoPrompts.slice(0, 12).map((prompt) => (
                <li key={prompt}>{prompt}</li>
              ))}
            </ul>
          </details>

          <details className="guide-section compact guide-requisition" open={false}>
            <summary>Requisition wording support</summary>
            <div className="guide-section-heading">
              <h4>Suggested wording</h4>
              <CopyButton text={support.requisitionLanguage} label="Copy wording" />
            </div>
            <p>{support.requisitionLanguage}</p>
            <div className="button-row">
              <button className="secondary-button" onClick={() => onApplyWording(support.requisitionLanguage)} type="button">
                Use as radiology question
              </button>
              <button className="secondary-button" onClick={() => onApplyWording(draftWording)} type="button">
                Use personalized draft
              </button>
            </div>
          </details>

          <details className="guide-section compact" open={false}>
            <summary>View full extracted ACR table and source details</summary>
            {support.relatedTopics.map((item) => (
              <section className="guide-source-topic-detail" key={item.topicId}>
                <div className="guide-section-heading">
                  <div>
                  <h4>{item.topic?.title ?? item.topicId.replace(/-/g, ' ')}</h4>
                  <p>
                    {item.topic
                      ? item.topic.reviewStatus === 'manually_curated' || item.topic.reviewStatus === 'reviewed'
                        ? 'Curated requisition support available.'
                        : 'Appropriateness table extracted. Requisition wording may require local adaptation.'
                      : item.statusMessage}
                  </p>
                </div>
                <span className={`guide-review-badge ${item.topic?.reviewStatus ?? 'pending'}`}>
                  {item.topic ? reviewStatusLabel(item.topic.reviewStatus) : 'Clinical summary pending'}
                </span>
              </div>
              {item.topOptions.length ? (
                <div className="guide-mini-option-list stacked">
                  {item.topOptions.map((option) => (
                    <span key={`${item.topicId}-${option.procedure}`}>
                      <strong>{option.procedure}</strong>
                      {option.appropriatenessCategory} · {option.radiationLevel}
                    </span>
                  ))}
                </div>
              ) : (
                <p>Appropriateness table not extracted yet for this topic. Clinical summary pending.</p>
              )}
              {item.suggestedVariants.length ? (
                <div className="guide-complaint-synonyms">
                  {item.suggestedVariants.slice(0, 4).map((variant) => (
                    <span key={variant.id}>{variant.title}</span>
                  ))}
                </div>
              ) : null}
              </section>
            ))}
          </details>

          <details className="guide-section compact" open={false}>
            <summary>Radiation legend</summary>
            <div className="guide-radiation-legend">
              {radiationLegend.map((item) => (
                <span key={item.level}>
                  <strong>{item.level}</strong> = {item.label}
                </span>
              ))}
            </div>
          </details>
        </>
      ) : (
        <p>Choose a complaint to see missing information prompts, appropriateness tables where available, and requisition wording.</p>
      )}
    </section>
  );
}
