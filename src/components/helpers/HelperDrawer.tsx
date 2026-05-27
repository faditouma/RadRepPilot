import { useEffect, useMemo, useState } from 'react';
import { calculatorRegistry } from '../../radrep/calculatorRegistry';
import type { CalculatorFieldDefinition, CalculatorValueMap, InsertTarget } from '../../radrep/types';
import { CopyButton } from '../radrep/RadRepComponents';

interface HelperDrawerProps {
  helperId: string;
  onClose: () => void;
  onInsertText: (text: string, label: string, target: InsertTarget) => void;
}

const insertTargets: Array<{ target: InsertTarget; label: string }> = [
  { target: 'findings', label: 'Findings' },
  { target: 'impression', label: 'Impression' },
  { target: 'incidentalFindings', label: 'Incidental follow-up' },
  { target: 'recommendations', label: 'Recommendations' },
];

function HelperField({
  field,
  value,
  onChange,
}: {
  field: CalculatorFieldDefinition;
  value: string | string[] | undefined;
  onChange: (value: string | string[]) => void;
}) {
  if (field.type === 'select') {
    return (
      <label className="field">
        {field.label}
        <select value={typeof value === 'string' ? value : ''} onChange={(event) => onChange(event.target.value)}>
          {(field.options ?? []).map((option) => (
            <option value={option.value} key={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
    );
  }

  if (field.type === 'checkbox-group') {
    const selected = Array.isArray(value) ? value : [];
    return (
      <div className="field wide-field">
        {field.label}
        <div className="checkbox-grid">
          {(field.options ?? []).map((option) => (
            <label key={option.value}>
              <input
                checked={selected.includes(option.value)}
                onChange={() =>
                  onChange(selected.includes(option.value) ? selected.filter((item) => item !== option.value) : [...selected, option.value])
                }
                type="checkbox"
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      </div>
    );
  }

  if (field.type === 'lesion-tracker') {
    return (
      <div className="lesion-tracker wide-field">
        <div className="lesion-row lesion-header">
          <span>Lesion/site</span>
          <span>Baseline mm</span>
          <span>Current mm</span>
        </div>
        {Array.from({ length: 5 }, (_, index) => index + 1).map((index) => (
          <div className="lesion-row" key={index}>
            <input
              value={typeof value === 'string' ? value : ''}
              onChange={() => undefined}
              hidden
              aria-hidden="true"
            />
          </div>
        ))}
      </div>
    );
  }

  return (
    <label className="field">
      {field.label}
      <input
        value={typeof value === 'string' ? value : ''}
        onChange={(event) => onChange(event.target.value)}
        placeholder={field.placeholder}
        type={field.type === 'number' ? 'number' : 'text'}
        step={field.type === 'number' ? '0.1' : undefined}
      />
    </label>
  );
}

function LesionTracker({
  values,
  onChange,
}: {
  values: CalculatorValueMap;
  onChange: (fieldId: string, value: string | string[]) => void;
}) {
  return (
    <div className="lesion-tracker wide-field">
      <div className="lesion-row lesion-header">
        <span>Lesion/site</span>
        <span>Baseline mm</span>
        <span>Current mm</span>
      </div>
      {Array.from({ length: 5 }, (_, index) => index + 1).map((index) => (
        <div className="lesion-row" key={index}>
          <input
            value={typeof values[`lesion${index}Name`] === 'string' ? (values[`lesion${index}Name`] as string) : ''}
            onChange={(event) => onChange(`lesion${index}Name`, event.target.value)}
            placeholder={`Target lesion ${index}`}
            aria-label={`Target lesion ${index}`}
          />
          <input
            value={typeof values[`lesion${index}Baseline`] === 'string' ? (values[`lesion${index}Baseline`] as string) : ''}
            onChange={(event) => onChange(`lesion${index}Baseline`, event.target.value)}
            type="number"
            step="0.1"
            aria-label={`Target lesion ${index} baseline`}
          />
          <input
            value={typeof values[`lesion${index}Current`] === 'string' ? (values[`lesion${index}Current`] as string) : ''}
            onChange={(event) => onChange(`lesion${index}Current`, event.target.value)}
            type="number"
            step="0.1"
            aria-label={`Target lesion ${index} current`}
          />
        </div>
      ))}
    </div>
  );
}

export function HelperDrawer({ helperId, onClose, onInsertText }: HelperDrawerProps) {
  const helper = calculatorRegistry.find((item) => item.id === helperId);
  const [values, setValues] = useState<CalculatorValueMap>({});
  const [editedSentence, setEditedSentence] = useState('');

  useEffect(() => {
    if (!helper) return;
    setValues(helper.defaultValues ?? {});
    setEditedSentence('');
  }, [helper]);

  const result = useMemo(() => helper?.compute?.(values), [helper, values]);
  const sentence = editedSentence || result?.sentence || 'Enter values to generate a report-ready helper sentence.';

  const updateValue = (fieldId: string, value: string | string[]) => {
    setValues((existing) => ({ ...existing, [fieldId]: value }));
    setEditedSentence('');
  };

  if (!helper) return null;

  return (
    <div className="helper-drawer-backdrop" role="presentation" onMouseDown={onClose}>
      <aside className="helper-drawer" role="dialog" aria-modal="true" aria-label={`${helper.name} helper`} onMouseDown={(event) => event.stopPropagation()}>
        <div className="helper-drawer-header">
          <div>
            <span className="eyebrow">Associated helper</span>
            <h2>{helper.name}</h2>
            <p>{helper.description}</p>
          </div>
          <button className="ghost-button" onClick={onClose} type="button">
            Close
          </button>
        </div>

        <div className="helper-drawer-body">
          <div className="calculator-field-grid">
            {helper.fields.map((field) =>
              field.type === 'lesion-tracker' ? (
                <LesionTracker values={values} onChange={updateValue} key={field.id} />
              ) : (
                <HelperField field={field} value={values[field.id]} onChange={(nextValue) => updateValue(field.id, nextValue)} key={field.id} />
              ),
            )}
          </div>

          {result?.warning || helper.applicabilityWarning ? (
            <div className="warning-card">{result?.warning ?? helper.applicabilityWarning}</div>
          ) : null}

          <label className="field">
            Report-ready sentence
            <textarea value={sentence} onChange={(event) => setEditedSentence(event.target.value)} />
          </label>

          <div className="button-row generated-actions">
            <CopyButton text={sentence} label="Copy result" />
            {insertTargets.map((target) => (
              <button
                className="secondary-button"
                onClick={() => onInsertText(sentence, helper.name, target.target)}
                type="button"
                key={target.target}
              >
                Insert: {target.label}
              </button>
            ))}
          </div>

          <details className="preview-details">
            <summary>How this works / limitations</summary>
            <p>
              This drawer uses simplified prototype logic from user-entered values. Verify measurements, applicability, current
              criteria, and final wording before clinical use.
            </p>
          </details>
        </div>
      </aside>
    </div>
  );
}
