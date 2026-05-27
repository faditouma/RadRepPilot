import type { DraftType, InsertTarget, ReferralFormState } from '../../radrep/types';
import { generateAppropriatenessSentence, matchAppropriatenessEntry } from '../../utils/appropriatenessMatcher';
import { CopyButton } from '../radrep/RadRepComponents';

interface AppropriatenessSupportPanelProps {
  form: ReferralFormState;
  onInsertText: (text: string, label: string, target?: InsertTarget) => void;
  onSaveText: (title: string, type: DraftType, text: string, structuredData?: unknown) => void;
}

const insertTargets: Array<{ target: InsertTarget; label: string }> = [
  { target: 'indication', label: 'Indication' },
  { target: 'recommendations', label: 'Recommendations' },
  { target: 'internalNotes', label: 'Internal notes' },
];

export function AppropriatenessSupportPanel({ form, onInsertText, onSaveText }: AppropriatenessSupportPanelProps) {
  const entry = matchAppropriatenessEntry(form);
  const sentence = generateAppropriatenessSentence(entry);

  return (
    <section className="appropriateness-support-panel">
      <div className="card-topline">
        <span>ACR Appropriateness Criteria prototype</span>
        <span className="status-badge partial">Framework</span>
      </div>
      <h3>{entry?.acrTopicName ?? 'Topic mapping pending'}</h3>
      <p>{sentence}</p>
      {entry ? (
        <details className="preview-details">
          <summary>Variant details to verify</summary>
          <div className="preview-stack">
            <div className="preview-list">
              <span>Key clinical questions</span>
              <ul>
                {entry.keyClinicalQuestions.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div className="preview-list">
              <span>Radiology needs to know</span>
              <ul>
                {entry.whatRadiologyNeedsToKnow.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div className="source-badges">
              <a href={entry.acrTopicUrl} target="_blank" rel="noreferrer">
                Official ACR AC verification
              </a>
            </div>
          </div>
        </details>
      ) : null}
      <div className="button-row generated-actions">
        <CopyButton text={sentence} label="Copy ACR note" />
        {insertTargets.map((item) => (
          <button className="secondary-button" onClick={() => onInsertText(sentence, 'ACR Appropriateness support', item.target)} type="button" key={item.target}>
            Insert: {item.label}
          </button>
        ))}
        <button className="secondary-button" onClick={() => onSaveText('ACR appropriateness support', 'referral', sentence, { entry, form })} type="button">
          Save note
        </button>
      </div>
    </section>
  );
}
