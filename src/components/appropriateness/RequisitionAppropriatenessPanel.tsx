import { useMemo } from 'react';
import type { PrimaryCareContentTemplate, ReferralFormState } from '../../radrep/types';
import { allClinicalMappings, radiationLegend, reviewStatusLabel, reviewStatusSummary } from '../../utils/appropriatenessSearch';
import {
  generateAppropriatenessAwareRequisitionSentence,
  getComplaintMappingById,
  getDefaultComplaintId,
  resolveAppropriatenessForComplaint,
} from '../../utils/requisitionAppropriateness';
import { CopyButton } from '../radrep/RadRepComponents';

interface RequisitionAppropriatenessPanelProps {
  template: PrimaryCareContentTemplate;
  form: ReferralFormState;
  selectedComplaintId: string;
  onSelectComplaint: (complaintId: string) => void;
  onApplyWording: (text: string) => void;
}

export function RequisitionAppropriatenessPanel({
  template,
  form,
  selectedComplaintId,
  onSelectComplaint,
  onApplyWording,
}: RequisitionAppropriatenessPanelProps) {
  const defaultComplaintId = useMemo(() => getDefaultComplaintId(template), [template]);
  const effectiveComplaintId = selectedComplaintId || defaultComplaintId;
  const mapping = getComplaintMappingById(effectiveComplaintId);
  const support = resolveAppropriatenessForComplaint(mapping);
  const firstProcedure = support.relatedTopics.flatMap((topic) => topic.topOptions)[0]?.procedure;
  const draftWording = generateAppropriatenessAwareRequisitionSentence(form, template, firstProcedure);

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
        Search/select complaint
        <select value={effectiveComplaintId} onChange={(event) => onSelectComplaint(event.target.value)}>
          <option value="">Select complaint...</option>
          {allClinicalMappings().map((item) => (
            <option value={item.id} key={item.id}>
              {item.complaint}
            </option>
          ))}
        </select>
      </label>

      {support.mapping ? (
        <>
          <div className="guide-complaint-synonyms">
            {support.mapping.synonyms.slice(0, 7).map((synonym) => (
              <span key={synonym}>{synonym}</span>
            ))}
          </div>

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

          {support.relatedTopics.map((item) => (
            <section className="guide-section compact" key={item.topicId}>
              <div className="guide-section-heading">
                <div>
                  <h4>{item.topic?.title ?? item.topicId.replace(/-/g, ' ')}</h4>
                  <p>{item.topic ? reviewStatusSummary(item.topic.reviewStatus) : item.statusMessage}</p>
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
