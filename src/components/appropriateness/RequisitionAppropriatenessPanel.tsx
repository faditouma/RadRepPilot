import { useMemo, useState } from 'react';
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
  onSelectComplaint: (complaintId: string) => void;
  onApplyWording: (text: string) => void;
  onSelectImagingOption: (procedure: string, suggestedQuestion: string) => void;
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

export function RequisitionAppropriatenessPanel({
  template,
  form,
  selectedComplaintId,
  onSelectComplaint,
  onApplyWording,
  onSelectImagingOption,
}: RequisitionAppropriatenessPanelProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const defaultComplaintId = useMemo(() => getDefaultComplaintId(template), [template]);
  const effectiveComplaintId = selectedComplaintId || defaultComplaintId;
  const directTopicId = selectedTopicId(effectiveComplaintId);
  const mapping = directTopicId ? undefined : getComplaintMappingById(effectiveComplaintId);
  const support = directTopicId ? resolveAppropriatenessForTopic(directTopicId) : resolveAppropriatenessForComplaint(mapping);
  const groupedOptions = useMemo(() => getGroupedRecommendationOptions(support), [support]);
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

  return (
    <section className="requisition-appropriateness-panel">
      <div className="guide-disclaimer" role="note">
        Educational appropriateness summary. Confirm with local protocols, radiology guidance, and the original criteria when needed.
      </div>

      <div className="guide-section-heading">
        <div>
          <span className="eyebrow">Appropriateness support</span>
          <h3>Clinical complaint to imaging options</h3>
        </div>
      </div>

      <label className="field">
        Search complaint, topic, variant, or procedure
        <input
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="e.g. headache, renal colic, PE, ultrasound, CT abdomen..."
        />
      </label>

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

          <section className="guide-section compact">
            <div className="guide-section-heading">
              <h4>Missing clinical details to include</h4>
            </div>
            <ul className="guide-chip-list">
              {support.missingInfoPrompts.slice(0, 10).map((prompt) => (
                <li key={prompt}>{prompt}</li>
              ))}
            </ul>
          </section>

          <section className="guide-section compact guide-requisition">
            <div className="guide-section-heading">
              <h4>Requisition-ready wording</h4>
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
          </section>

          <section className="guide-section compact">
            <div className="guide-section-heading">
              <div>
                <h4>Recommended imaging options</h4>
                <p>Grouped by extracted/curated appropriateness category. Select one to populate the requested modality/procedure.</p>
              </div>
            </div>
            <div className="requisition-recommendation-groups">
              {categoryOrder.map((category) => {
                const options = groupedOptions[category].slice(0, 8);
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
                          item.option.shortRationale ||
                          `Assess whether ${item.option.procedure} is appropriate for the provided clinical scenario.`;
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

          {support.relatedTopics.map((item) => (
            <section className="guide-section compact" key={item.topicId}>
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

          <section className="guide-section compact">
            <div className="guide-section-heading">
              <h4>Radiation legend</h4>
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
      ) : (
        <p>Choose a complaint to see missing information prompts, appropriateness tables where available, and requisition wording.</p>
      )}
    </section>
  );
}
