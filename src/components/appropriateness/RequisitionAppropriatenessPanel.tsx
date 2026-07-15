import { useEffect, useMemo, useState } from 'react';
import type { PrimaryCareContentTemplate, ReferralFormState } from '../../radrep/types';
import type { AppropriatenessTopic } from '../../data/appropriateness';
import { clinicalComplaintMappings } from '../../data/appropriateness/clinicalMappings';
import { getTopicById, reviewStatusLabel } from '../../utils/appropriatenessSearch';
import { classifyRequestedImaging, type RequestedImagingCheck } from '../../utils/appropriatenessValidation';
import { buildClinicalQuestion, cleanVariantTitle, findRequisitionTopicMatches } from '../../utils/requisitionTopicMatching';
import { RequisitionGuidedDrawer } from './RequisitionGuidedDrawer';

interface RequisitionAppropriatenessPanelProps {
  template: PrimaryCareContentTemplate;
  form: ReferralFormState;
  selectedComplaintId: string;
  preferredVariantId?: string;
  onSelectComplaint: (complaintId: string) => void;
  onSelectTopicVariant?: (topicId: string, variantId: string) => void;
  onSelectScenario?: (scenario: {
    topicTitle: string;
    variantTitle: string;
    clinicalScenario: string;
    suggestedQuestion?: string;
  }) => void;
  onApplyClinicalContext?: (phrases: string[]) => void;
  onClinicalProblemChange?: (value: string) => void;
  onUpdateValue?: (fieldId: string, value: string) => void;
  onSelectImagingOption: (procedure: string, suggestedQuestion: string) => void;
  onAppropriatenessCheckChange?: (check: RequestedImagingCheck | null) => void;
  onOpenGuide?: (topicId: string, variantId?: string) => void;
}

function selectedTopicId(selectionId: string) {
  return selectionId.startsWith('topic:') ? selectionId.replace(/^topic:/, '') : '';
}

function selectionKeyForTopic(topicId: string) {
  return `topic:${topicId}`;
}

function topicReviewSummary(topic?: AppropriatenessTopic) {
  if (!topic) return '';
  return `${topic.sourceLabel} · ${reviewStatusLabel(topic.reviewStatus)}`;
}

const curatedComplaintStarterIds = [
  'headache',
  'abdominal-pain',
  'ruq-pain',
  'renal-colic',
  'suspected-pe',
  'suspected-dvt',
  'low-back-pain',
  'hematuria',
  'chest-pain',
  'cough-dyspnea',
  'msk-trauma',
  'acute-pancreatitis',
];

const curatedComplaintStarters = curatedComplaintStarterIds
  .map((id) => clinicalComplaintMappings.find((mapping) => mapping.id === id))
  .filter((mapping): mapping is NonNullable<typeof mapping> => Boolean(mapping));

export function RequisitionAppropriatenessPanel({
  template,
  form,
  selectedComplaintId,
  preferredVariantId,
  onSelectComplaint,
  onSelectTopicVariant,
  onSelectScenario,
  onApplyClinicalContext,
  onClinicalProblemChange,
  onUpdateValue,
  onSelectImagingOption,
  onAppropriatenessCheckChange,
  onOpenGuide,
}: RequisitionAppropriatenessPanelProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const clinicalProblem = String(
    form.values.mainSymptom || form.values.indication || form.values.positiveSymptoms || ''
  );

  const clinicalProblemQuery = clinicalProblem.trim();
  const age = typeof form.values.age === 'string' ? form.values.age : '';
  const sex = typeof form.values.sex === 'string' ? form.values.sex : '';

  const directTopicId = selectedTopicId(selectedComplaintId);
  const selectedTopic = directTopicId ? getTopicById(directTopicId) : undefined;
  const selectedVariant = selectedTopic?.variants.find((variant) => variant.id === preferredVariantId);

  const matchResult = useMemo(
    () => findRequisitionTopicMatches(clinicalProblemQuery, { age, sex }),
    [age, clinicalProblemQuery, sex]
  );

  const topicMatches = matchResult.topics;
  const possibleMatchLabels = topicMatches.map((topic) => topic.title);
  const activeOptions = selectedVariant?.imagingOptions ?? [];

  const appropriatenessCheck = useMemo(
    () =>
      selectedVariant
        ? classifyRequestedImaging(String(form.values.requestedProcedure ?? ''), activeOptions)
        : null,
    [activeOptions, form.values.requestedProcedure, selectedVariant]
  );

  useEffect(() => {
    onAppropriatenessCheckChange?.(appropriatenessCheck);
  }, [appropriatenessCheck, onAppropriatenessCheckChange]);

  const startComplaintFlow = (complaint: string) => {
    onClinicalProblemChange?.(complaint);
    window.setTimeout(() => setDrawerOpen(true), 0);
  };

  return (
    <section className="requisition-appropriateness-panel guided-requisition-panel">
      <div className="clinical-intake-heading">
        <div>
          <span className="eyebrow">Clinical intake</span>
          <h3>Start with a complaint</h3>
        </div>
      </div>

      <details className="complaint-starter-disclosure" open={!clinicalProblemQuery}>
        <summary>Common presentations</summary>
        <div className="complaint-starter-grid" aria-label="Common imaging requisition complaint flows">
          {curatedComplaintStarters.map((mapping) => (
            <button
              className="complaint-starter-card"
              type="button"
              onClick={() => startComplaintFlow(mapping.complaint)}
              key={mapping.id}
            >
              <span className="complaint-card-kicker">Flow</span>
              <strong>{mapping.complaint}</strong>
            </button>
          ))}
        </div>
      </details>

      <div className="guided-main-fields">
        <label className="field">
          Clinical problem / indication
          <input
            value={clinicalProblem}
            onChange={(event) => onClinicalProblemChange?.(event.target.value)}
            placeholder="e.g. headache, low back pain, suspected PE, hematuria"
          />
        </label>

        <label className="field">
          Age
          <input
            value={age}
            onChange={(event) => onUpdateValue?.('age', event.target.value)}
            placeholder="67"
          />
        </label>

        <label className="field">
          Sex/gender
          <select value={sex} onChange={(event) => onUpdateValue?.('sex', event.target.value)}>
            <option value="">Not specified</option>
            <option value="M">M</option>
            <option value="F">F</option>
            <option value="X">X/other</option>
            <option value="Prefer not to specify">Prefer not to specify</option>
          </select>
        </label>
      </div>

      {clinicalProblemQuery ? (
        <div className="guided-match-summary">
          <span>Matching imaging pathways</span>
          {topicMatches.length ? (
            <p>{possibleMatchLabels.slice(0, 5).join(', ')}{possibleMatchLabels.length > 5 ? `, +${possibleMatchLabels.length - 5} more` : ''}</p>
          ) : (
            <p>No matching pathway yet.</p>
          )}
        </div>
      ) : null}

      <div className="button-row">
        <button
          className="primary-button"
          type="button"
          onClick={() => setDrawerOpen(true)}
          disabled={!clinicalProblemQuery}
        >
          Open questionnaire
        </button>

        {selectedVariant ? (
          <button className="secondary-button" type="button" onClick={() => setDrawerOpen(true)}>
            Edit answers
          </button>
        ) : null}
      </div>

      {selectedVariant ? (
        <section className="selected-requisition-summary">
          <div>
            <span>Matched clinical situation</span>
            <strong>
              {cleanVariantTitle(selectedVariant.title || selectedVariant.clinicalScenario)}
            </strong>
          </div>

          <div>
            <span>Selected imaging</span>
            <strong>{String(form.values.requestedProcedure || 'Not selected')}</strong>
            <small>
              {appropriatenessCheck?.match
                ? [
                    `Listed as ${appropriatenessCheck.match.appropriatenessCategory}`,
                    appropriatenessCheck.match.radiationLevel
                      ? `Relative radiation: ${appropriatenessCheck.match.radiationLevel}`
                      : '',
                  ]
                    .filter(Boolean)
                    .join(' · ')
                : appropriatenessCheck
                  ? appropriatenessCheck.message
                  : topicReviewSummary(selectedTopic)}
            </small>
          </div>

          {selectedTopic ? (
            <button
              className="ghost-button chip-button"
              type="button"
              onClick={() => onOpenGuide?.(selectedTopic.id, selectedVariant.id)}
            >
              Source details
            </button>
          ) : null}
        </section>
      ) : null}

      <RequisitionGuidedDrawer
        key={`${clinicalProblemQuery}:${drawerOpen ? 'open' : 'closed'}`}
        open={drawerOpen}
        clinicalProblem={clinicalProblem}
        age={age}
        sex={sex}
        topicMatches={topicMatches}
        onClose={() => setDrawerOpen(false)}
        onSelect={({ topic, variant, option, answerPhrases }) => {
          if (onSelectTopicVariant) {
            onSelectTopicVariant(topic.id, variant.id);
          } else {
            onSelectComplaint(selectionKeyForTopic(topic.id));
          }

          onApplyClinicalContext?.(answerPhrases);

          const suggestedQuestion = variant.requisitionSuggestions[0] || buildClinicalQuestion(topic, variant);

          onSelectScenario?.({
            topicTitle: topic.title,
            variantTitle: cleanVariantTitle(variant.title),
            clinicalScenario: variant.clinicalScenario,
            suggestedQuestion,
          });

          onSelectImagingOption(option.procedure, suggestedQuestion);
        }}
      />
    </section>
  );
}
