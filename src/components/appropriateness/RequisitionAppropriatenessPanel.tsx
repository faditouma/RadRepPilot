import { useEffect, useMemo, useState } from 'react';
import type { PrimaryCareContentTemplate, ReferralFormState } from '../../radrep/types';
import type { AppropriatenessTopic } from '../../data/appropriateness';
import {
  reviewStatusLabel,
  searchAppropriatenessLayer,
} from '../../utils/appropriatenessSearch';
import {
  getComplaintMappingById,
  resolveAppropriatenessForComplaint,
  resolveAppropriatenessForTopic,
} from '../../utils/requisitionAppropriateness';
import { classifyRequestedImaging, type RequestedImagingCheck } from '../../utils/appropriatenessValidation';
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

function uniqueTopics(topics: AppropriatenessTopic[]): AppropriatenessTopic[] {
  const seen = new Set<string>();
  const unique: AppropriatenessTopic[] = [];
  topics.forEach((topic) => {
    if (seen.has(topic.id)) return;
    seen.add(topic.id);
    unique.push(topic);
  });
  return unique;
}

function topicKeywords(topics: AppropriatenessTopic[]) {
  const words = topics.flatMap((topic) => [
    topic.title,
    topic.clinicalArea,
    ...topic.keywords,
    ...topic.variants.map((variant) => variant.title),
  ]);
  return Array.from(new Set(words.flatMap((item) => item.split(/[;,/]/)).map((item) => item.trim()).filter(Boolean))).slice(0, 8);
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
  onUpdateValue,
  onSelectImagingOption,
  onAppropriatenessCheckChange,
  onOpenGuide,
}: RequisitionAppropriatenessPanelProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const clinicalProblem = String(form.values.mainSymptom || form.values.indication || form.values.positiveSymptoms || '').trim();
  const age = typeof form.values.age === 'string' ? form.values.age : '';
  const sex = typeof form.values.sex === 'string' ? form.values.sex : '';
  const directTopicId = selectedTopicId(selectedComplaintId);
  const mapping = directTopicId ? undefined : getComplaintMappingById(selectedComplaintId);
  const support = directTopicId ? resolveAppropriatenessForTopic(directTopicId) : resolveAppropriatenessForComplaint(mapping);
  const selectedTopic = directTopicId ? support.relatedTopics.find((item) => item.topicId === directTopicId)?.topic : support.relatedTopics[0]?.topic;
  const selectedVariant = selectedTopic?.variants.find((variant) => variant.id === preferredVariantId)
    ?? support.relatedTopics.flatMap((item) => item.suggestedVariants).find((variant) => variant.id === preferredVariantId)
    ?? selectedTopic?.variants[0];
  const searched = useMemo(() => {
    if (!clinicalProblem) return { complaintMappings: [], topics: [] };
    return searchAppropriatenessLayer(clinicalProblem);
  }, [clinicalProblem]);
  const topicMatches = useMemo(() => {
    const fromComplaints = searched.complaintMappings.flatMap((complaint) =>
      resolveAppropriatenessForComplaint(complaint).relatedTopics.map((item) => item.topic).filter((topic): topic is AppropriatenessTopic => Boolean(topic)),
    );
    return uniqueTopics([...fromComplaints, ...searched.topics]).slice(0, 8);
  }, [searched]);
  const possibleMatchLabels = topicKeywords(topicMatches);
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
            onChange={(event) => onUpdateValue?.('mainSymptom', event.target.value)}
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
        {clinicalProblem ? (
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
        <button className="primary-button" type="button" onClick={() => setDrawerOpen(true)} disabled={!clinicalProblem.trim()}>
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
            <strong>{selectedVariant.title || selectedVariant.clinicalScenario}</strong>
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
                    variantTitle: variant.title,
                    clinicalScenario: variant.clinicalScenario,
                    suggestedQuestion: variant.requisitionSuggestions[0],
                  });
                }}
                type="button"
                key={`${topic.id}-${variant.id}`}
              >
                <span>{topic.title}</span>
                <strong>{variant.title}</strong>
                <small>{variant.clinicalScenario}</small>
              </button>
            )),
          )}
        </div>
      </details>

      <RequisitionGuidedDrawer
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
          onSelectScenario?.({
            topicTitle: topic.title,
            variantTitle: variant.title,
            clinicalScenario: variant.clinicalScenario,
            suggestedQuestion: variant.requisitionSuggestions[0] || `Please assess for findings relevant to ${variant.title || topic.title}.`,
          });
          onSelectImagingOption(option.procedure, variant.requisitionSuggestions[0] || `Please assess for findings relevant to ${variant.title || topic.title}.`);
        }}
      />
    </section>
  );
}
