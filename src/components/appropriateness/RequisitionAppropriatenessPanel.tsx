import { useEffect, useMemo, useState } from 'react';
import type { PrimaryCareContentTemplate, ReferralFormState } from '../../radrep/types';
import type { AppropriatenessCategory, AppropriatenessTopic, AppropriatenessVariant } from '../../data/appropriateness';
import type { ClinicalComplaintMapping } from '../../data/appropriateness/clinicalMappings';
import {
  radiationLegend,
  reviewStatusLabel,
  searchAppropriatenessLayer,
} from '../../utils/appropriatenessSearch';
import {
  generateAppropriatenessAwareRequisitionSentence,
  getComplaintMappingById,
  getGroupedRecommendationOptions,
  resolveAppropriatenessForComplaint,
  resolveAppropriatenessForTopic,
} from '../../utils/requisitionAppropriateness';
import { deriveClinicalPrompts, type DerivedClinicalPrompt } from '../../utils/acrPromptDerivation';
import { classifyRequestedImaging, type RequestedImagingCheck } from '../../utils/appropriatenessValidation';
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
  onAppropriatenessCheckChange?: (check: RequestedImagingCheck | null) => void;
  onOpenGuide?: (topicId: string, variantId?: string) => void;
}

interface VariantChoice {
  key: string;
  topicId: string;
  topicTitle: string;
  topic?: AppropriatenessTopic;
  variant: AppropriatenessVariant;
  sourceComplaintId?: string;
  sourceComplaint?: string;
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

function topOptionsForVariant(variant: AppropriatenessVariant): string {
  const options = variant.imagingOptions.filter((option) => option.appropriatenessCategory === 'Usually Appropriate').slice(0, 3);
  if (!options.length) return 'Usually Appropriate options pending';
  return options.map((option) => option.procedure).join(' · ');
}

function uniqueVariantChoices(choices: VariantChoice[], limit = 8): VariantChoice[] {
  const seen = new Set<string>();
  const unique: VariantChoice[] = [];
  choices.forEach((choice) => {
    if (seen.has(choice.key)) return;
    seen.add(choice.key);
    unique.push(choice);
  });
  return unique.slice(0, limit);
}

function promptFromSupportText(prompt: string): DerivedClinicalPrompt {
  return {
    id: prompt.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
    label: prompt,
    type: 'context',
    relevanceReason: 'Added from curated complaint or scenario support.',
    requisitionPhrase: prompt,
  };
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
  onAppropriatenessCheckChange,
  onOpenGuide,
}: RequisitionAppropriatenessPanelProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVariantKey, setSelectedVariantKey] = useState('');
  const [selectedPromptChips, setSelectedPromptChips] = useState<string[]>([]);
  const effectiveComplaintId = selectedComplaintId;
  const directTopicId = selectedTopicId(effectiveComplaintId);
  const mapping = directTopicId ? undefined : getComplaintMappingById(effectiveComplaintId);
  const support = directTopicId ? resolveAppropriatenessForTopic(directTopicId) : resolveAppropriatenessForComplaint(mapping);
  const variantChoices = useMemo<VariantChoice[]>(
    () =>
      uniqueVariantChoices(support.relatedTopics.flatMap((item) =>
        item.suggestedVariants.map((variant) => ({
          key: `${item.topicId}:${variant.id}`,
          topicId: item.topicId,
          topicTitle: item.topic?.title ?? item.topicId.replace(/-/g, ' '),
          topic: item.topic,
          variant,
        })),
      )),
    [support],
  );
  const activeVariantChoice =
    variantChoices.find((item) => item.key === selectedVariantKey) ??
    variantChoices.find((item) => preferredVariantId && item.variant.id === preferredVariantId);
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
  const firstProcedure = activeVariantChoice?.variant.imagingOptions.find((option) => option.appropriatenessCategory === 'Usually Appropriate')?.procedure
    ?? support.relatedTopics.flatMap((topic) => topic.topOptions)[0]?.procedure;
  const draftWording = generateAppropriatenessAwareRequisitionSentence(form, template, firstProcedure);
  const searched = useMemo(() => {
    const query = searchTerm.trim();
    if (!query) {
      return {
        complaintMappings: [],
        topics: [],
      };
    }

    return searchAppropriatenessLayer(query);
  }, [searchTerm]);
  const scenarioMatches = useMemo<VariantChoice[]>(() => {
    const fromComplaints = searched.complaintMappings.flatMap((complaint) => {
      const complaintSupport = resolveAppropriatenessForComplaint(complaint);
      return complaintSupport.relatedTopics.flatMap((item) =>
        item.suggestedVariants.map((variant) => ({
          key: `${item.topicId}:${variant.id}`,
          topicId: item.topicId,
          topicTitle: item.topic?.title ?? item.topicId.replace(/-/g, ' '),
          topic: item.topic,
          variant,
          sourceComplaintId: complaint.id,
          sourceComplaint: complaint.complaint,
        })),
      );
    });
    const fromTopics = searched.topics.flatMap((topic) =>
      topic.variants.map((variant) => ({
        key: `${topic.id}:${variant.id}`,
        topicId: topic.id,
        topicTitle: topic.title,
        topic,
        variant,
      })),
    );
    return uniqueVariantChoices([...fromComplaints, ...fromTopics], 8);
  }, [searched]);
  const selectedLabel =
    mapping?.complaint ??
    activeVariantChoice?.variant.title ??
    support.relatedTopics.find((item) => item.topic)?.topic?.title ??
    (effectiveComplaintId ? effectiveComplaintId.replace(/^topic:/, '').replace(/-/g, ' ') : '');
  const hasSupport = Boolean(mapping || directTopicId || support.relatedTopics.length);
  const clinicalPrompts = useMemo(() => {
    if (!activeVariantChoice) return [];
    const derived = deriveClinicalPrompts(activeVariantChoice.topic, activeVariantChoice.variant, selectedLabel);
    const supportPrompts = support.missingInfoPrompts.map(promptFromSupportText);
    return [...derived, ...supportPrompts].filter((prompt, index, all) => all.findIndex((item) => item.id === prompt.id) === index).slice(0, 12);
  }, [activeVariantChoice, selectedLabel, support.missingInfoPrompts]);
  const appropriatenessCheck = useMemo(
    () =>
      activeVariantChoice
        ? classifyRequestedImaging(String(form.values.requestedProcedure ?? ''), activeVariantChoice.variant.imagingOptions)
        : null,
    [activeVariantChoice, form.values.requestedProcedure],
  );

  useEffect(() => {
    onAppropriatenessCheckChange?.(appropriatenessCheck);
  }, [appropriatenessCheck, onAppropriatenessCheckChange]);

  useEffect(() => {
    setSelectedPromptChips([]);
  }, [effectiveComplaintId]);

  useEffect(() => {
    if (!preferredVariantId || selectedVariantKey) return;
    const match = variantChoices.find((item) => item.variant.id === preferredVariantId);
    if (match) setSelectedVariantKey(match.key);
  }, [preferredVariantId, selectedVariantKey, variantChoices]);

  const togglePromptChip = (prompt: DerivedClinicalPrompt) => {
    setSelectedPromptChips((existing) => {
      const checked = !existing.includes(prompt.id);
      onToggleClinicalPrompt?.(prompt.requisitionPhrase, checked);
      return checked ? [...existing, prompt.id] : existing.filter((item) => item !== prompt.id);
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

      <div className="requisition-match-list" aria-label="Top matching clinical scenarios">
        {scenarioMatches.map((item) => {
          const active = activeVariantChoice?.key === item.key;
          return (
            <button
              className={`requisition-match-card ${active ? 'active' : ''}`}
              onClick={() => {
                onSelectComplaint(item.sourceComplaintId ?? selectionKeyForTopic(item.topicId));
                setSelectedVariantKey(item.key);
              }}
              type="button"
              key={item.key}
            >
              <span>{item.sourceComplaint ? `Clinical problem: ${item.sourceComplaint}` : 'Clinical scenario'}</span>
              <strong>{item.variant.title || item.variant.clinicalScenario}</strong>
              <small>{item.topicTitle}{item.topic ? ` · ${topicSummary(item.topic)}` : ''}</small>
              <em>{topOptionsForVariant(item.variant)}</em>
              <b>Select scenario</b>
            </button>
          );
        })}
      </div>

      {hasSupport ? (
        <>
          {selectedLabel ? (
            <div className="requisition-selected-context">
              <span>Clinical problem</span>
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
                <h4>Select clinical scenario</h4>
                <p>Choose the closest scenario before selecting a requested imaging option.</p>
              </div>
            </div>
          ) : null}

          {variantChoices.length ? (
            <section className="guide-section compact requisition-scenario-card">
              <label className="field">
                Clinical scenario
                <select
                  value={activeVariantChoice?.key ?? ''}
                  onChange={(event) => setSelectedVariantKey(event.target.value)}
                >
                  <option value="">Choose closest clinical scenario...</option>
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

          {clinicalPrompts.length && activeVariantChoice ? (
            <section className="guide-section compact requisition-prompt-card">
              <div className="guide-section-heading">
                <div>
                  <h4>Scenario-specific history prompts</h4>
                  <p>Select relevant context to add it to the requisition draft.</p>
                </div>
              </div>
              <div className="requisition-prompt-chip-grid">
                {clinicalPrompts.map((prompt) => {
                  const checked = selectedPromptChips.includes(prompt.id);
                  return (
                    <button
                      className={`prompt-chip ${checked ? 'active' : ''}`}
                      onClick={() => togglePromptChip(prompt)}
                      type="button"
                      aria-pressed={checked}
                      title={prompt.relevanceReason}
                      key={prompt.id}
                    >
                      {checked ? 'Added: ' : ''}
                      {prompt.label}
                    </button>
                  );
                })}
              </div>
            </section>
          ) : null}

          {activeVariantChoice ? (
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
          ) : (
            <p className="guide-status-note">Select a clinical scenario to view recommended imaging options and appropriateness checks.</p>
          )}

          {activeVariantChoice ? (
          <details className="guide-section compact" open={false}>
            <summary>Missing information checklist</summary>
            <ul className="guide-chip-list">
              {clinicalPrompts.map((prompt) => (
                <li key={prompt.id}>{prompt.label}</li>
              ))}
            </ul>
          </details>
          ) : null}

          {activeVariantChoice ? (
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
          ) : null}

          <details className="guide-section compact" open={false}>
            <summary>Source details</summary>
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
