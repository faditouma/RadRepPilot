import { useEffect, useMemo, useState } from 'react';
import type { PrimaryCareContentTemplate, ReferralFormState } from '../../radrep/types';
import type { AppropriatenessTopic } from '../../data/appropriateness';
import { clinicalComplaintMappings } from '../../data/appropriateness/clinicalMappings';
import { getTopicById, reviewStatusLabel } from '../../utils/appropriatenessSearch';
import { classifyRequestedImaging, type RequestedImagingCheck } from '../../utils/appropriatenessValidation';
import { buildClinicalQuestion, cleanVariantTitle, findRequisitionTopicMatches } from '../../utils/requisitionTopicMatching';
import { RequisitionGuidedDrawer } from './RequisitionGuidedDrawer';
import { useI18n } from '../../i18n/I18nContext';
import { normalizeClinicalSearchQuery } from '../../i18n/clinicalFrench';

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
  const { clinicalText, language, text } = useI18n();
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

  const matchingQuery = useMemo(
    () => normalizeClinicalSearchQuery(clinicalProblemQuery, language),
    [clinicalProblemQuery, language]
  );

  const matchResult = useMemo(
    () => findRequisitionTopicMatches(matchingQuery, { age, sex }),
    [age, matchingQuery, sex]
  );

  const topicMatches = matchResult.topics;
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
          <span className="eyebrow">{text('Imaging request')}</span>
          <h3>{text('Start with the clinical problem')}</h3>
        </div>
      </div>

      {!clinicalProblemQuery ? (
        <div className="complaint-starter-grid compact" aria-label={text('Common imaging request complaints')}>
          {curatedComplaintStarters.map((mapping) => (
            <button
              className="complaint-starter-card"
              type="button"
              onClick={() => startComplaintFlow(mapping.complaint)}
              key={mapping.id}
            >
              <span className="complaint-card-kicker">{text('Flow')}</span>
              <strong>{clinicalText(mapping.complaint)}</strong>
            </button>
          ))}
        </div>
      ) : null}

      <div className="guided-main-fields">
        <label className="field">
          {text('Clinical problem / indication')}
          <input
            value={clinicalProblem}
            onChange={(event) => onClinicalProblemChange?.(event.target.value)}
            placeholder={text('e.g. headache, low back pain, suspected PE, hematuria')}
          />
        </label>

        <label className="field">
          {text('Age')}
          <input
            value={age}
            onChange={(event) => onUpdateValue?.('age', event.target.value)}
            placeholder="67"
          />
        </label>

        <label className="field">
          {text('Sex/gender')}
          <select value={sex} onChange={(event) => onUpdateValue?.('sex', event.target.value)}>
            <option value="">{text('Not specified')}</option>
            <option value="M">M</option>
            <option value="F">F</option>
            <option value="X">{text('X/other')}</option>
            <option value="Prefer not to specify">{text('Prefer not to specify')}</option>
          </select>
        </label>
      </div>

      <div className="button-row">
        <button
          className="primary-button"
          type="button"
          onClick={() => setDrawerOpen(true)}
          disabled={!clinicalProblemQuery}
        >
          {text('Open guided questions')}
        </button>

        {selectedVariant ? (
          <button className="secondary-button" type="button" onClick={() => setDrawerOpen(true)}>
            {text('Edit answers')}
          </button>
        ) : null}
      </div>

      {selectedVariant ? (
        <section className="selected-requisition-summary">
          <div>
            <span>{text('Answers')}</span>
            <strong>{text('Guided questions complete')}</strong>
          </div>

          <div>
            <span>{text('Exam')}</span>
            <strong>{clinicalText(String(form.values.requestedProcedure || 'Not chosen'))}</strong>
            <small>
              {appropriatenessCheck?.match
                ? [
                    clinicalText(appropriatenessCheck.match.appropriatenessCategory),
                    appropriatenessCheck.match.radiationLevel
                      ? `${text('Relative radiation')}: ${appropriatenessCheck.match.radiationLevel}`
                      : '',
                  ]
                    .filter(Boolean)
                    .join(' · ')
                : appropriatenessCheck
                  ? clinicalText(appropriatenessCheck.message)
                  : clinicalText(topicReviewSummary(selectedTopic))}
            </small>
          </div>

          {selectedTopic ? (
            <button
              className="ghost-button chip-button"
              type="button"
              onClick={() => onOpenGuide?.(selectedTopic.id, selectedVariant.id)}
            >
              {text('Source summary')}
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
