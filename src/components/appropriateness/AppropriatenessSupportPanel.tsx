import type { DraftType, InsertTarget, ReferralFormState } from '../../radrep/types';
import { generateAppropriatenessSentence, matchAppropriatenessEntry } from '../../utils/appropriatenessMatcher';
import { CopyButton } from '../radrep/RadRepComponents';
import { useI18n } from '../../i18n/I18nContext';

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
  const { clinicalText, text } = useI18n();
  const entry = matchAppropriatenessEntry(form);
  const sentence = generateAppropriatenessSentence(entry);

  return (
    <section className="appropriateness-support-panel">
      <div className="card-topline">
        <span>{text('ACR Appropriateness Criteria prototype')}</span>
        <span className="status-badge partial">{text('Framework')}</span>
      </div>
      <h3>{clinicalText(entry?.acrTopicName ?? 'Topic mapping pending')}</h3>
      <p>{clinicalText(sentence)}</p>
      {entry ? (
        <details className="preview-details">
          <summary>{text('Variant details to verify')}</summary>
          <div className="preview-stack">
            <div className="preview-list">
              <span>{text('Key clinical questions')}</span>
              <ul>
                {entry.keyClinicalQuestions.map((item) => (
                  <li key={item}>{clinicalText(item)}</li>
                ))}
              </ul>
            </div>
            <div className="preview-list">
              <span>{text('Radiology needs to know')}</span>
              <ul>
                {entry.whatRadiologyNeedsToKnow.map((item) => (
                  <li key={item}>{clinicalText(item)}</li>
                ))}
              </ul>
            </div>
            <div className="source-badges">
              <a href={entry.acrTopicUrl} target="_blank" rel="noreferrer">
                {text('Official ACR AC verification')}
              </a>
            </div>
          </div>
        </details>
      ) : null}
      <div className="button-row generated-actions">
        <CopyButton text={sentence} label={text('Copy ACR note')} />
        {insertTargets.map((item) => (
          <button className="secondary-button" onClick={() => onInsertText(sentence, 'ACR Appropriateness support', item.target)} type="button" key={item.target}>
            {text('Insert')}: {text(item.label)}
          </button>
        ))}
        <button className="secondary-button" onClick={() => onSaveText('ACR appropriateness support', 'referral', sentence, { entry, form })} type="button">
          {text('Save note')}
        </button>
      </div>
    </section>
  );
}
