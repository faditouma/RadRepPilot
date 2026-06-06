import { useEffect, useMemo, useState } from 'react';
import type { PrimaryCareContentTemplate, ReferralFormState } from '../../radrep/types';
import type { AppropriatenessTopic } from '../../data/appropriateness';
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
  onSelectScenario?: (scenario: { topicTitle: string; variantTitle: string; clinicalScenario: string; suggestedQuestion?: string }) => void;
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
  const clinicalProblem = String(form.values.mainSymptom || form.values.indication || form.values.positiveSymptoms || '');
  const clinicalProblemQuery = clinicalProblem.trim();
  const age = typeof form.values.age === 'string' ? form.values.age : '';
  const sex = typeof form.values.sex === 'string' ? form.values.sex : '';
  const directTopicId = selectedTopicId(selectedComplaintId);
  const selectedTopic = directTopicId ? getTopicById(directTopicId) : undefined;
  const selectedVariant = selectedTopic?.variants.find((variant) => variant.id === preferredVariantId);
  const matchResult = useMemo(() => findRequisitionTopicMatches(clinicalProblemQuery), [clinicalProblemQuery]);
  const topicMatches = matchResult.topics;
  const possibleMatchLabels = topicMatches.map((topic) => topic.title);
  const activeOptions = selectedVariant?.imagingOptions ?? [];
  const appropriatenessCheck = useMemo(
    () => selectedVariant ? classifyRequestedImaging(String(form.values.requestedProcedure ?? ''), activeOptions) : null,
    [activeOptions, form.values.requestedProcedure, selectedVariant],
  );

  useEffect(() => {
    onAppropriatenessCheckChange?.(appropriatenessCheck);
  }, [appropriatenessCheck, onAppropriatenessCheckChange]);

  return (
    <section className="requisition-appropriateness-panel guided-requisition-panel">
      <div className="guide-section-heading">
        <div>
          <span className="eyebrow">Clinical problem</span>
          <h3>Find appropriate imaging</h3>
        </div>
      </div>

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
          <input value={age} onChange={(event) => onUpdateValue?.('age', event.target.value)} placeholder="67" />
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

      <div className="guided-match-summary">
        <span>Possible ACR matches found</span>
        {clinicalProblemQuery ? (
          topicMatches.length ? (
            <>
              <p>{possibleMatchLabels.join(', ')}</p>
              <small>{topicMatches.length} related topic{topicMatches.length === 1 ? '' : 's'} available for guided matching.</small>
            </>
          ) : (
            <p>No reviewed/extracted topic matched yet. Try a broader problem or diagnosis.</p>
          )
        ) : (
          <p>Enter a clinical problem, then open the guided drawer.</p>
        )}
      </div>

      <div className="button-row">
        <button className="primary-button" type="button" onClick={() => setDrawerOpen(true)} disabled={!clinicalProblemQuery}>
          Find appropriate imaging
        </button>
        {selectedVariant ? (
          <button className="secondary-button" type="button" onClick={() => setDrawerOpen(true)}>
            Edit clinical scenario
          </button>
        ) : null}
      </div>

      {selectedVariant ? (
        <section className="selected-requisition-summary">
          <div>
            <span>Selected scenario</span>
            <strong>{cleanVariantTitle(selectedVariant.title || selectedVariant.clinicalScenario)}</strong>
            <small>{selectedVariant.clinicalScenario}</small>
          </div>
          <div>
            <span>Selected imaging</span>
            <strong>{String(form.values.requestedProcedure || 'Not selected')}</strong>
            <small>{appropriatenessCheck ? appropriatenessCheck.message : topicReviewSummary(selectedTopic)}</small>
          </div>
          {selectedTopic ? (
            <button className="ghost-button chip-button" type="button" onClick={() => onOpenGuide?.(selectedTopic.id, selectedVariant.id)}>
              Source details
            </button>
          ) : null}
        </section>
      ) : null}

      <details className="guide-section compact" open={false}>
        <summary>View all matching ACR scenarios</summary>
        <div className="guided-alternative-list">
          {topicMatches.flatMap((topic) =>
            topic.variants.slice(0, 4).map((variant) => (
              <button
                className="requisition-match-card"
                onClick={() => {
                  if (onSelectTopicVariant) {
                    onSelectTopicVariant(topic.id, variant.id);
                  } else {
                    onSelectComplaint(selectionKeyForTopic(topic.id));
                  }
                  onSelectScenario?.({
                    topicTitle: topic.title,
                    variantTitle: cleanVariantTitle(variant.title),
                    clinicalScenario: variant.clinicalScenario,
                    suggestedQuestion: variant.requisitionSuggestions[0] || buildClinicalQuestion(topic, variant),
                  });
                }}
                type="button"
                key={`${topic.id}-${variant.id}`}
              >
                <span>{topic.title}</span>
                <strong>{cleanVariantTitle(variant.title)}</strong>
                <small>{variant.clinicalScenario}</small>
              </button>
            )),
          )}
        </div>
      </details>

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
