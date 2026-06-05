import { useMemo, useState } from 'react';
import { incidentalFindingsRegistry } from '../../data/incidentalFindingsRegistry';
import type { WorkflowIncidentalOption } from '../../data/reportingWorkflowSchemas';
import type { IncidentalFindingDefinition, InsertTarget, PrimaryCareFieldDefinition } from '../../radrep/types';
import { generateIncidentalFindingSentence, type IncidentalValueMap } from '../../utils/incidentalFindingGenerators';
import { getHelperRouteLabel } from '../../utils/helperRouting';
import { scoreFollowUpSafety } from '../../utils/qualityMetrics';
import { QualityMetricBadge } from '../quality/QualityMetricBadge';
import { CopyButton } from '../radrep/RadRepComponents';

interface IncidentalFindingsPanelProps {
  options: WorkflowIncidentalOption[];
  value: string;
  onChange: (value: string) => void;
  onInsert?: (target: InsertTarget, text: string) => void;
  onOpenHelper?: (helperId: string) => void;
}

function appendText(existing: string, sentence: string): string {
  return existing.trim() ? `${existing.trim()}\n${sentence}` : sentence;
}

const helperLabelsByFindingId: Record<string, string> = {
  'incidental-pulmonary-nodule': 'Fleischner / Lung-RADS context',
  'incidental-adrenal-nodule': 'Adrenal washout helper',
  'incidental-renal-lesion': 'Bosniak helper',
  'incidental-thyroid-nodule': 'TI-RADS helper',
  'incidental-liver-lesion': 'LI-RADS context',
  'incidental-adnexal-cyst': 'O-RADS helper',
  'incidental-pancreatic-cyst': 'Pancreatic cyst follow-up placeholder',
  'aortic-aneurysm': 'Vascular follow-up placeholder',
};

const helperIdsByFindingId: Record<string, string[]> = {
  'incidental-pulmonary-nodule': ['fleischner', 'lungrads'],
  'incidental-adrenal-nodule': ['adrenal-washout'],
  'incidental-renal-lesion': ['bosniak'],
  'incidental-thyroid-nodule': ['tirads'],
  'incidental-liver-lesion': ['lirads'],
  'incidental-adnexal-cyst': ['orads'],
  'aortic-aneurysm': ['cadrads'],
};

const helperIdsByOptionLabel: Record<string, string[]> = {
  'Pulmonary nodule at lung bases': ['fleischner', 'lungrads'],
  'Bone lesion': ['bonerads'],
  'Coronary calcification': ['cadrads'],
};

const followUpActions = [
  { value: '', label: 'Select follow-up plan' },
  { value: 'none', label: 'No follow-up needed' },
  { value: 'imaging-3-months', label: 'Follow-up imaging in 3 months' },
  { value: 'imaging-6-months', label: 'Follow-up imaging in 6 months' },
  { value: 'imaging-9-months', label: 'Follow-up imaging in 9 months' },
  { value: 'imaging-12-months', label: 'Follow-up imaging in 12 months' },
  { value: 'local-protocol', label: 'Follow-up per local protocol' },
  { value: 'characterize-now', label: 'Further characterization now' },
  { value: 'specialist-correlation', label: 'Specialist correlation' },
  { value: 'custom', label: 'Custom' },
];

const followUpModalities = [
  { value: 'CT', label: 'CT' },
  { value: 'MRI', label: 'MRI' },
  { value: 'Ultrasound', label: 'Ultrasound' },
  { value: 'PET/CT', label: 'PET/CT' },
  { value: 'X-ray', label: 'X-ray' },
  { value: 'same modality', label: 'Same modality' },
  { value: 'custom', label: 'Other/custom' },
];

const imagingFollowUpActions = new Set(['imaging-3-months', 'imaging-6-months', 'imaging-9-months', 'imaging-12-months', 'local-protocol', 'characterize-now']);

function normalize(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function selectedValue(values: IncidentalValueMap, id: string): string {
  const raw = values[id];
  if (typeof raw === 'boolean') return raw ? 'yes' : 'no';
  return raw?.trim() ?? '';
}

function followUpPlanSentence(values: IncidentalValueMap): string {
  const action = selectedValue(values, '_followUpAction');
  const modalityValue = selectedValue(values, '_followUpModality');
  const customModality = selectedValue(values, '_customModality');
  const modality = modalityValue === 'custom' ? customModality || 'custom imaging' : modalityValue;
  const customFollowUp = selectedValue(values, '_customFollowUp');

  switch (action) {
    case 'none':
      return 'Selected follow-up plan: no specific imaging follow-up is suggested.';
    case 'imaging-3-months':
      return `Selected follow-up plan: consider follow-up ${modality || 'imaging'} in 3 months.`;
    case 'imaging-6-months':
      return `Selected follow-up plan: consider follow-up ${modality || 'imaging'} in 6 months.`;
    case 'imaging-9-months':
      return `Selected follow-up plan: consider follow-up ${modality || 'imaging'} in 9 months.`;
    case 'imaging-12-months':
      return `Selected follow-up plan: consider follow-up ${modality || 'imaging'} in 12 months.`;
    case 'local-protocol':
      return `Selected follow-up plan: follow-up ${modality || 'imaging'} per local protocol.`;
    case 'characterize-now':
      return `Selected follow-up plan: consider further characterization now${modality ? ` with ${modality}` : ''}.`;
    case 'specialist-correlation':
      return 'Selected follow-up plan: specialist correlation is recommended/should be considered depending on clinical context.';
    case 'custom':
      return customFollowUp ? `Selected follow-up plan: ${customFollowUp}` : '';
    default:
      return '';
  }
}

function applyFollowUpPlan(baseSentence: string, values: IncidentalValueMap): string {
  const plan = followUpPlanSentence(values);
  const note = 'Follow-up recommendation is simplified educational language and requires radiologist verification against current guidelines and local protocol.';
  return [baseSentence, plan, note].filter((part) => part.trim()).join(' ');
}

function findRegistryMatch(option: WorkflowIncidentalOption): IncidentalFindingDefinition | undefined {
  const label = normalize(option.label);
  return incidentalFindingsRegistry.find((finding) => {
    const name = normalize(finding.name);
    return name.includes(label) || label.includes(name.replace('incidental ', '')) || label.includes(finding.id.replace(/-/g, ' '));
  });
}

function FieldRenderer({
  field,
  value,
  onChange,
}: {
  field: PrimaryCareFieldDefinition;
  value: string | boolean | undefined;
  onChange: (value: string | boolean) => void;
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

  if (field.type === 'checkbox') {
    return (
      <label className="check-toggle field-check">
        <input checked={value === true || value === 'yes'} onChange={(event) => onChange(event.target.checked)} type="checkbox" />
        <span>{field.label}</span>
      </label>
    );
  }

  return (
    <label className="field">
      {field.label}
      <input
        value={typeof value === 'string' ? value : ''}
        onChange={(event) => onChange(event.target.value)}
        placeholder={field.placeholder}
        type={field.label.toLowerCase().includes('size') || field.label.toLowerCase().includes('age') ? 'number' : 'text'}
        step="0.1"
      />
    </label>
  );
}

export function IncidentalFindingsPanel({ options, value, onChange, onOpenHelper }: IncidentalFindingsPanelProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState('');
  const [valuesByLabel, setValuesByLabel] = useState<Record<string, IncidentalValueMap>>({});

  const selectedOption = options.find((option) => option.label === selectedLabel);
  const selectedRegistryFinding = selectedOption ? findRegistryMatch(selectedOption) : undefined;
  const selectedValues = selectedLabel ? valuesByLabel[selectedLabel] ?? {} : {};
  const associatedHelperIds = selectedRegistryFinding
    ? helperIdsByFindingId[selectedRegistryFinding.id] ?? []
    : selectedOption
      ? helperIdsByOptionLabel[selectedOption.label] ?? []
      : [];
  const generatedSentence = useMemo(() => {
    if (!selectedOption) return '';
    const baseSentence = selectedRegistryFinding ? generateIncidentalFindingSentence(selectedRegistryFinding, selectedValues) : selectedOption.sentence;
    return applyFollowUpPlan(baseSentence, selectedValues);
  }, [selectedOption, selectedRegistryFinding, selectedValues]);
  const followUpQuality = generatedSentence ? scoreFollowUpSafety(generatedSentence) : undefined;

  const updateValue = (fieldId: string, nextValue: string | boolean) => {
    if (!selectedLabel) return;
    setValuesByLabel((existing) => ({
      ...existing,
      [selectedLabel]: {
        ...(existing[selectedLabel] ?? {}),
        [fieldId]: nextValue,
      },
    }));
  };

  const selectOption = (label: string) => {
    setSelectedLabel(label);
    setIsAdding(true);
  };

  return (
    <section className="workflow-card">
      <div className="section-heading">
        <span className="eyebrow">Incidental findings / follow-up</span>
        <h3>Add incidental finding if present</h3>
        <p>Use only for radiologist-verified incidental findings. Mini-forms generate editable follow-up language.</p>
      </div>
      {options.length ? (
        <>
          <div className="incidental-compact-row">
            <button className="secondary-button" onClick={() => setIsAdding((open) => !open)} type="button">
              {isAdding ? 'Hide incidental helper' : 'Add incidental finding'}
            </button>
            <label className="field compact-select">
              Select finding type
              <select value={selectedLabel} onChange={(event) => selectOption(event.target.value)}>
                <option value="">Select...</option>
                {options.map((option) => (
                  <option value={option.label} key={option.label}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {isAdding && selectedOption ? (
            <div className="incidental-mini-form">
              <div className="card-topline">
                <span>{selectedRegistryFinding?.organSystem ?? 'Context-aware helper'}</span>
                <span className="status-badge partial">Educational draft</span>
              </div>
              <h4>{selectedRegistryFinding?.name ?? selectedOption.label}</h4>
              {selectedRegistryFinding ? (
                <div className="workflow-form-grid">
                  {selectedRegistryFinding.keyInputs.map((field) => (
                    <FieldRenderer
                      field={field}
                      value={selectedValues[field.id]}
                      onChange={(nextValue) => updateValue(field.id, nextValue)}
                      key={field.id}
                    />
                  ))}
                </div>
              ) : (
                <div className="inline-note">This workflow uses a simple educational sentence for this incidental finding.</div>
              )}
              {selectedRegistryFinding ? (
                <div className="inline-note">
                  Linked helper: {helperLabelsByFindingId[selectedRegistryFinding.id] ?? 'Related calculator/classification helper when applicable'}.
                </div>
              ) : associatedHelperIds.length ? (
                <div className="inline-note">
                  Linked helper: {associatedHelperIds.map(getHelperRouteLabel).join(', ')}.
                </div>
              ) : null}
              <section className="follow-up-selector-panel">
                <span className="mini-heading">Follow-up recommendation</span>
                <div className="workflow-form-grid">
                  <label className="field">
                    Follow-up plan
                    <select value={selectedValue(selectedValues, '_followUpAction')} onChange={(event) => updateValue('_followUpAction', event.target.value)}>
                      {followUpActions.map((action) => (
                        <option value={action.value} key={action.value}>
                          {action.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  {imagingFollowUpActions.has(selectedValue(selectedValues, '_followUpAction')) ? (
                    <>
                      <label className="field">
                        Modality
                        <select value={selectedValue(selectedValues, '_followUpModality')} onChange={(event) => updateValue('_followUpModality', event.target.value)}>
                          <option value="">Select modality</option>
                          {followUpModalities.map((modality) => (
                            <option value={modality.value} key={modality.value}>
                              {modality.label}
                            </option>
                          ))}
                        </select>
                      </label>
                      {selectedValue(selectedValues, '_followUpModality') === 'custom' ? (
                        <label className="field">
                          Custom modality
                          <input value={selectedValue(selectedValues, '_customModality')} onChange={(event) => updateValue('_customModality', event.target.value)} placeholder="e.g. adrenal protocol CT" />
                        </label>
                      ) : null}
                    </>
                  ) : null}
                  {selectedValue(selectedValues, '_followUpAction') === 'custom' ? (
                    <label className="field wide-field">
                      Custom follow-up recommendation
                      <textarea
                        value={selectedValue(selectedValues, '_customFollowUp')}
                        onChange={(event) => updateValue('_customFollowUp', event.target.value)}
                        placeholder="e.g. Compare with outside imaging; follow local incidental finding pathway."
                      />
                    </label>
                  ) : null}
                </div>
              </section>
              <label className="field">
                Generated incidental sentence
                <textarea value={generatedSentence} readOnly />
              </label>
              {followUpQuality ? <QualityMetricBadge score={followUpQuality} /> : null}
              <div className="button-row generated-actions">
                <button className="primary-button" onClick={() => onChange(appendText(value, generatedSentence))} type="button">
                  Add to draft
                </button>
                <button className="secondary-button" onClick={() => onChange(generatedSentence)} type="button">
                  Replace draft text
                </button>
                <CopyButton text={generatedSentence} label="Copy sentence" />
                {associatedHelperIds.map((helperId) => (
                  <button className="secondary-button" onClick={() => onOpenHelper?.(helperId)} type="button" key={helperId}>
                    Open {getHelperRouteLabel(helperId)}
                  </button>
                ))}
                <button className="ghost-button" onClick={() => setSelectedLabel('')} type="button">
                  Remove incidental finding
                </button>
              </div>
            </div>
          ) : null}
        </>
      ) : (
        <div className="inline-note">No dedicated incidental helper is attached to this workflow. Free-text follow-up can still be entered below.</div>
      )}
      <label className="field">
        Incidental findings / follow-up text
        <textarea value={value} onChange={(event) => onChange(event.target.value)} placeholder="e.g. Incidental renal cyst/mass follow-up language..." />
      </label>
    </section>
  );
}
