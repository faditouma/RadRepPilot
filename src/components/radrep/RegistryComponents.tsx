import { useEffect, useMemo, useState } from 'react';
import { calculatorRegistry } from '../../data/calculatorRegistry';
import { calculatorNavigationTree } from '../../data/calculatorNavigationTree';
import { RequisitionAppropriatenessPanel } from '../appropriateness/RequisitionAppropriatenessPanel';
import { incidentalFindingsRegistry } from '../../data/incidentalFindingsRegistry';
import { primaryCareContentRegistry } from '../../data/primaryCareContentRegistry';
import { radsSystemsRegistry } from '../../data/radsSystemsRegistry';
import { bodySystems, modalities, reportingModules } from '../../data/reportingModules';
import { generateIncidentalFindingSentence, type IncidentalValueMap } from '../../utils/incidentalFindingGenerators';
import { getTopicById } from '../../utils/appropriatenessSearch';
import type { RequestedImagingCheck } from '../../utils/appropriatenessValidation';
import { scoreRequisitionCompleteness } from '../../utils/qualityMetrics';
import { generateReferralText, getMissingEssentials, getPrimaryCareTemplate } from '../../utils/requisitionGenerators';
import { generateRadsPreviewSentence } from '../../utils/radsPreviewGenerators';
import { RadIcon } from '../icons/RadIcon';
import type {
  BodySystem,
  CalculatorDefinition,
  CalculatorFieldDefinition,
  CalculatorValueMap,
  DraftType,
  IncidentalFindingDefinition,
  InsertTarget,
  Modality,
  ModuleType,
  PrimaryCareContentTemplate,
  PrimaryCareFieldDefinition,
  RadsStatus,
  RadsSystemDefinition,
  ReferralFormState,
  RequisitionOutputStyle,
  ReportingModuleDefinition,
} from '../../radrep/types';
import { CopyButton } from './RadRepComponents';

type RegistryStatus = 'implemented' | 'placeholder' | 'partial' | 'planned';

interface GeneratedTextPanelProps {
  title: string;
  subtitle?: string;
  text: string;
  onTextChange?: (text: string) => void;
  onInsert?: () => void;
  onInsertTarget?: (target: InsertTarget) => void;
  onSave: () => void;
  copyLabel?: string;
}

const insertTargets: Array<{ target: InsertTarget; label: string }> = [
  { target: 'indication', label: 'Indication' },
  { target: 'technique', label: 'Technique' },
  { target: 'findings', label: 'Findings' },
  { target: 'impression', label: 'Impression' },
  { target: 'incidentalFindings', label: 'Incidental / follow-up' },
  { target: 'recommendations', label: 'Recommendations' },
  { target: 'internalNotes', label: 'Internal notes' },
];

export function StatusBadge({ status }: { status: RegistryStatus | RadsStatus }) {
  const label =
    status === 'implemented'
      ? 'Implemented'
      : status === 'partial'
        ? 'Partial'
        : status === 'planned'
          ? 'Planned'
          : 'Coming soon';
  return <span className={`status-badge ${status}`}>{label}</span>;
}

export function InsertToReportButton({ onInsert }: { onInsert: () => void }) {
  return (
    <button className="secondary-button" onClick={onInsert} type="button">
      Insert into Report Builder
    </button>
  );
}

export function ApplicabilityWarning({ children }: { children: string }) {
  return children ? <div className="warning-card">{children}</div> : null;
}

export function GeneratedTextPanel({
  title,
  subtitle,
  text,
  onTextChange,
  onInsert,
  onInsertTarget,
  onSave,
  copyLabel = 'Copy',
}: GeneratedTextPanelProps) {
  return (
    <section className="generated-text-panel">
      <div className="output-heading">
        <div>
          <span>{subtitle ?? 'Generated text'}</span>
          <h3>{title}</h3>
        </div>
        <CopyButton text={text} label={copyLabel} />
      </div>
      <textarea value={text} onChange={(event) => onTextChange?.(event.target.value)} readOnly={!onTextChange} />
      <div className="button-row generated-actions">
        <CopyButton text={text} label={copyLabel} className="primary-button" />
        {onInsertTarget ? (
          <div className="insert-button-grid" aria-label="Insert generated text">
            {insertTargets.map((item) => (
              <button className="secondary-button" onClick={() => onInsertTarget(item.target)} type="button" key={item.target}>
                Insert: {item.label}
              </button>
            ))}
          </div>
        ) : onInsert ? (
          <InsertToReportButton onInsert={onInsert} />
        ) : null}
        <button className="secondary-button" onClick={onSave} type="button">
          Save Draft
        </button>
      </div>
    </section>
  );
}

interface ModuleLibraryProps {
  onOpenImplemented: (moduleType: ModuleType) => void;
}

export function ModuleLibrary({ onOpenImplemented }: ModuleLibraryProps) {
  const [search, setSearch] = useState('');
  const [modality, setModality] = useState<'All' | Modality>('All');
  const [bodySystem, setBodySystem] = useState<'All' | BodySystem>('All');
  const [status, setStatus] = useState<'All' | 'implemented' | 'placeholder'>('All');

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return reportingModules.filter((module) => {
      const searchText = [
        module.title,
        module.description,
        module.modality,
        module.bodySystem,
        module.checklistPreview.join(' '),
        module.keyFindings?.join(' '),
        module.sampleImpression,
      ]
        .join(' ')
        .toLowerCase();
      return (
        (!query || searchText.includes(query)) &&
        (modality === 'All' || module.modality === modality) &&
        (bodySystem === 'All' || module.bodySystem === bodySystem) &&
        (status === 'All' || module.status === status)
      );
    });
  }, [bodySystem, modality, search, status]);

  return (
    <section className="registry-panel">
      <div className="filter-bar">
        <label className="field">
          Search modules
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search appendicitis, CHF, knee, LI-RADS..." />
        </label>
        <FilterSelect label="Modality" value={modality} values={['All', ...modalities]} onChange={(value) => setModality(value as never)} />
        <FilterSelect label="Body system" value={bodySystem} values={['All', ...bodySystems]} onChange={(value) => setBodySystem(value as never)} />
        <FilterSelect label="Status" value={status} values={['All', 'implemented', 'placeholder']} onChange={(value) => setStatus(value as never)} />
      </div>

      <div className="library-grid">
        {filtered.map((module) => (
          <ReportingModuleCard module={module} onOpenImplemented={onOpenImplemented} key={module.id} />
        ))}
      </div>
    </section>
  );
}

function ReportingModuleCard({
  module,
  onOpenImplemented,
}: {
  module: ReportingModuleDefinition;
  onOpenImplemented: (moduleType: ModuleType) => void;
}) {
  return (
    <article className="registry-card rich-registry-card">
      <div className="card-topline">
        <span>
          {module.modality} · {module.bodySystem}
        </span>
        <StatusBadge status={module.status} />
      </div>
      <h3>{module.title}</h3>
      <p>{module.description}</p>
      <div className="checklist-preview">
        {module.checklistPreview.map((item) => (
          <span key={item}>{item}</span>
        ))}
      </div>
      <details className="preview-details">
        <summary>View planned workflow</summary>
        <PreviewList title="Clinical scenario" items={module.clinicalScenario ? [module.clinicalScenario] : []} />
        <PreviewList title="Key findings" items={module.keyFindings ?? []} />
        <PreviewList title="Key negatives" items={module.keyNegatives ?? []} />
        <PreviewList title="Complications / red flags" items={module.complicationsRedFlags ?? []} />
        <PreviewList title="Associated calculators / RADS" items={module.associatedCalculators ?? []} />
        <PreviewList title="Associated incidental findings" items={module.associatedIncidentalFindings ?? []} />
        {module.sampleImpression ? (
          <div className="sample-language">
            <span>Sample impression</span>
            <p>{module.sampleImpression}</p>
          </div>
        ) : null}
        <SourceBadges names={module.sourceNames ?? []} links={module.sourceLinks ?? []} />
      </details>
      {module.status === 'implemented' && module.implementedModuleType ? (
        <button className="primary-button" onClick={() => onOpenImplemented(module.implementedModuleType!)} type="button">
          Open workflow
        </button>
      ) : (
        <button className="secondary-button" disabled type="button">
          Coming soon
        </button>
      )}
    </article>
  );
}

interface CalculatorRegistryProps {
  onInsertSentence: (sentence: string, label: string, target?: InsertTarget) => void;
  onSaveText: (title: string, type: DraftType, text: string, structuredData?: unknown) => void;
  initialHelperId?: string;
  onHelperOpened?: () => void;
}

export function CalculatorRegistry({ onInsertSentence, onSaveText, initialHelperId, onHelperOpened }: CalculatorRegistryProps) {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'All' | 'implemented' | 'partial' | 'placeholder'>('All');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [selectedCalculatorId, setSelectedCalculatorId] = useState('');
  const [valuesById, setValuesById] = useState<Record<string, CalculatorValueMap>>(() =>
    Object.fromEntries(calculatorRegistry.map((calculator) => [calculator.id, calculator.defaultValues ?? {}])),
  );
  const [editedSentences, setEditedSentences] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!initialHelperId) return;
    const helper = calculatorRegistry.find((calculator) => calculator.id === initialHelperId);
    if (!helper) return;
    const category = calculatorNavigationTree.find((item) => item.calculatorIds.includes(helper.id));
    setSelectedCategoryId(category?.id ?? '');
    setSelectedCalculatorId(helper.id);
    onHelperOpened?.();
  }, [initialHelperId, onHelperOpened]);

  const selectedCategory = calculatorNavigationTree.find((category) => category.id === selectedCategoryId);
  const selectedCalculator = calculatorRegistry.find((calculator) => calculator.id === selectedCalculatorId);

  const matchesFilter = (calculator: CalculatorDefinition) => {
    const query = search.trim().toLowerCase();
    const matchesSearch =
      !query ||
      [calculator.name, calculator.description, calculator.modality, calculator.bodySystem].join(' ').toLowerCase().includes(query);
    return matchesSearch && (status === 'All' || calculator.status === status);
  };

  const categoryCalculators = (selectedCategory
    ? selectedCategory.calculatorIds
        .map((id) => calculatorRegistry.find((calculator) => calculator.id === id))
        .filter((calculator): calculator is CalculatorDefinition => Boolean(calculator))
    : []
  ).filter(matchesFilter);

  const searchResults = search.trim() ? calculatorRegistry.filter(matchesFilter) : [];

  const updateValue = (calculatorId: string, fieldId: string, valueToSet: string | string[]) => {
    setValuesById((existing) => ({
      ...existing,
      [calculatorId]: {
        ...(existing[calculatorId] ?? {}),
        [fieldId]: valueToSet,
      },
    }));
    setEditedSentences((existing) => {
      const next = { ...existing };
      delete next[calculatorId];
      return next;
    });
  };

  const renderCalculator = (calculator: CalculatorDefinition) => {
    const values = valuesById[calculator.id] ?? calculator.defaultValues ?? {};
    const result = calculator.compute?.(values);
    const sentence = editedSentences[calculator.id] ?? result?.sentence ?? '';

    return (
      <CalculatorRegistryCard
        calculator={calculator}
        values={values}
        sentence={sentence}
        resultSummary={result?.summary}
        resultWarning={result?.warning ?? calculator.applicabilityWarning}
        onChange={(fieldId, valueToSet) => updateValue(calculator.id, fieldId, valueToSet)}
        onSentenceChange={(text) => setEditedSentences((existing) => ({ ...existing, [calculator.id]: text }))}
        onInsertTarget={(target) => onInsertSentence(sentence, calculator.name, target)}
        onSave={() => onSaveText(calculator.name, 'calculator', sentence, { calculatorId: calculator.id, values })}
        key={calculator.id}
      />
    );
  };

  return (
    <section className="registry-panel branching-calculator-workspace">
      <div className="branching-topbar">
        <div>
          <div className="breadcrumb-row">
            <span className="breadcrumb-pill">Guidelines & Calculators</span>
            {selectedCategory ? <span className="breadcrumb-pill">{selectedCategory.name}</span> : null}
            {selectedCalculator ? <span className="breadcrumb-pill">{selectedCalculator.name}</span> : null}
          </div>
          <h2>{selectedCalculator ? selectedCalculator.name : selectedCategory ? 'Select a helper' : 'Select a body system or helper family'}</h2>
          <p>Open an interactive helper first; source details and limitations stay collapsed until needed.</p>
        </div>
        <div className="button-row">
          {selectedCalculator ? (
            <button className="secondary-button" onClick={() => setSelectedCalculatorId('')} type="button">
              Change helper
            </button>
          ) : selectedCategory ? (
            <button className="secondary-button" onClick={() => setSelectedCategoryId('')} type="button">
              Change category
            </button>
          ) : null}
          {(selectedCategory || selectedCalculator) ? (
            <button
              className="ghost-button"
              onClick={() => {
                setSelectedCategoryId('');
                setSelectedCalculatorId('');
              }}
              type="button"
            >
              Reset
            </button>
          ) : null}
        </div>
      </div>

      <div className="filter-bar compact-filter-bar">
        <label className="field">
          Quick search helpers
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search LI-RADS, RECIST, RV/LV..." />
        </label>
        <FilterSelect
          label="Status"
          value={status}
          values={['All', 'implemented', 'partial', 'placeholder']}
          onChange={(value) => setStatus(value as never)}
        />
      </div>

      {selectedCalculator ? (
        <div className="single-helper-shell">{renderCalculator(selectedCalculator)}</div>
      ) : searchResults.length ? (
        <div className="workflow-choice-grid">
          {searchResults.map((calculator) => (
            <HelperChoiceCard calculator={calculator} onOpen={() => setSelectedCalculatorId(calculator.id)} key={calculator.id} />
          ))}
        </div>
      ) : selectedCategory ? (
        <div className="workflow-choice-grid">
          {categoryCalculators.map((calculator) => (
            <HelperChoiceCard calculator={calculator} onOpen={() => setSelectedCalculatorId(calculator.id)} key={calculator.id} />
          ))}
        </div>
      ) : (
        <div className="branch-grid calculator-category-grid">
          {calculatorNavigationTree.map((category) => (
            <button className="branch-card" onClick={() => setSelectedCategoryId(category.id)} type="button" key={category.id}>
              <span>Helper family</span>
              <strong>
                <span className="nav-icon" aria-hidden="true">
                  <RadIcon name={category.iconName} size={24} />
                </span>
                {category.name}
              </strong>
              <small>{category.description}</small>
              <em>{category.calculatorIds.length} helpers</em>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

function HelperChoiceCard({ calculator, onOpen }: { calculator: CalculatorDefinition; onOpen: () => void }) {
  return (
    <article className="workflow-choice-card">
      <div className="card-topline">
        <span>
          {calculator.modality} · {calculator.bodySystem}
        </span>
        <div className="badge-row">
          <StatusBadge status={calculator.status} />
          <span className="content-status-badge small">{calculator.contentStatus ?? 'Educational draft'}</span>
        </div>
      </div>
      <h3>{calculator.name}</h3>
      <p>{calculator.description}</p>
      <button className={calculator.status === 'placeholder' ? 'secondary-button' : 'primary-button'} onClick={onOpen} type="button">
        {calculator.status === 'placeholder' ? 'View planned helper' : 'Open helper'}
      </button>
    </article>
  );
}

const radsIdByCalculatorId: Record<string, string> = {
  lirads: 'li-rads',
  pirads: 'pi-rads',
  birads: 'bi-rads',
  orads: 'o-rads',
  cadrads: 'cad-rads',
  lungrads: 'lung-rads',
  nirads: 'ni-rads',
  virads: 'vi-rads',
  bonerads: 'bone-rads',
};

function CalculatorRegistryCard({
  calculator,
  values,
  sentence,
  resultSummary,
  resultWarning,
  onChange,
  onSentenceChange,
  onInsertTarget,
  onSave,
}: {
  calculator: CalculatorDefinition;
  values: CalculatorValueMap;
  sentence: string;
  resultSummary?: string;
  resultWarning?: string;
  onChange: (fieldId: string, value: string | string[]) => void;
  onSentenceChange: (text: string) => void;
  onInsertTarget: (target: InsertTarget) => void;
  onSave: () => void;
}) {
  const radsPreview = radsSystemsRegistry.find((system) => system.id === radsIdByCalculatorId[calculator.id]);

  return (
    <article className={`calculator-card ${calculator.status === 'placeholder' ? 'placeholder-card' : ''}`}>
      <div className="card-topline">
        <span>
          {calculator.modality} · {calculator.bodySystem}
        </span>
        <StatusBadge status={calculator.status} />
      </div>
      <h3>{calculator.name}</h3>
      <p>{calculator.description}</p>

      {calculator.status !== 'placeholder' ? (
        <>
          <div className="calculator-field-grid">
            {calculator.fields.map((field) =>
              field.type === 'lesion-tracker' ? (
                <LesionTracker values={values} onChange={onChange} key={field.id} />
              ) : (
                <CalculatorField field={field} value={values[field.id]} onChange={(valueToSet) => onChange(field.id, valueToSet)} key={field.id} />
              ),
            )}
          </div>
          {resultWarning ? <ApplicabilityWarning>{resultWarning}</ApplicabilityWarning> : null}
          <GeneratedTextPanel
            title={resultSummary ?? 'Report-ready sentence'}
            subtitle="Calculator output"
            text={sentence}
            onTextChange={onSentenceChange}
            onInsertTarget={onInsertTarget}
            onSave={onSave}
            copyLabel="Copy sentence"
          />
          <details className="preview-details">
            <summary>How this works / limitations</summary>
            <p>
              This helper uses simplified prototype logic from user-entered descriptors. Verify current official criteria,
              measurements, applicability, and final wording before clinical use.
            </p>
            {radsPreview ? <SourceBadges names={radsPreview.sourceNames} links={radsPreview.sourceLinks} /> : null}
          </details>
        </>
      ) : (
        <div className="preview-stack">
          <PreviewList title="Planned inputs" items={radsPreview?.keyInputs ?? ['Structured descriptors', 'Category selection', 'Comparison', 'Report-ready sentence']} />
          {radsPreview ? <PreviewList title="Category concepts" items={radsPreview.categoryConcepts.slice(0, 4)} /> : null}
          <div className="sample-language">
            <span>Preview sentence</span>
            <p>{radsPreview?.reportReadySentenceTemplate ?? 'Future workflow will generate verified classification language from user-entered features.'}</p>
          </div>
        </div>
      )}
    </article>
  );
}

function CalculatorField({
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

interface RadsSystemsPanelProps {
  onInsertSentence: (sentence: string, label: string, target?: InsertTarget) => void;
  onSaveText: (title: string, type: DraftType, text: string, structuredData?: unknown) => void;
}

export function RadsSystemsPanel({ onInsertSentence, onSaveText }: RadsSystemsPanelProps) {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'All' | RadsStatus>('All');
  const [editedSentences, setEditedSentences] = useState<Record<string, string>>({});

  const filtered = radsSystemsRegistry.filter((system) => {
    const query = search.trim().toLowerCase();
    const text = [system.name, system.fullName, system.purpose, system.modality, system.bodySystem, system.keyInputs.join(' ')]
      .join(' ')
      .toLowerCase();
    return (!query || text.includes(query)) && (status === 'All' || system.status === status);
  });

  return (
    <section className="registry-panel">
      <div className="section-heading">
        <span className="eyebrow">RADS / Classification Preview Registry</span>
        <h2>Structured preview cards</h2>
        <p>Planned systems are populated with applicability, inputs, report elements, source metadata, and editable sample language.</p>
      </div>
      <div className="filter-bar compact-filter-bar">
        <label className="field">
          Search RADS systems
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search LI-RADS, PI-RADS, Bone-RADS..." />
        </label>
        <FilterSelect label="Status" value={status} values={['All', 'implemented', 'partial', 'planned']} onChange={(value) => setStatus(value as never)} />
      </div>
      <div className="rads-grid">
        {filtered.map((system) => {
          const sentence = editedSentences[system.id] ?? generateRadsPreviewSentence(system);
          return (
            <RadsSystemCard
              system={system}
              sentence={sentence}
              onSentenceChange={(text) => setEditedSentences((existing) => ({ ...existing, [system.id]: text }))}
              onInsertTarget={(target) => onInsertSentence(sentence, system.name, target)}
              onSave={() => onSaveText(system.name, 'rads', sentence, { radsSystemId: system.id })}
              key={system.id}
            />
          );
        })}
      </div>
    </section>
  );
}

function RadsSystemCard({
  system,
  sentence,
  onSentenceChange,
  onInsertTarget,
  onSave,
}: {
  system: RadsSystemDefinition;
  sentence: string;
  onSentenceChange: (text: string) => void;
  onInsertTarget: (target: InsertTarget) => void;
  onSave: () => void;
}) {
  return (
    <article className="registry-card rads-card">
      <div className="card-topline">
        <span>
          {system.modality} · {system.bodySystem}
        </span>
        <StatusBadge status={system.status} />
      </div>
      <h3>{system.name}</h3>
      <p>
        <strong>{system.fullName}.</strong> {system.purpose}
      </p>
      <PreviewList title="Applies to" items={system.appliesTo} />
      <PreviewList title="Does not apply to" items={system.doesNotApplyTo} />
      <PreviewList title="Key inputs" items={system.keyInputs.slice(0, 8)} />
      <PreviewList title="Category concepts" items={system.categoryConcepts.slice(0, 6)} />
      <PreviewList title="Report elements" items={system.reportElements} />
      <ApplicabilityWarning>{system.safetyWarning}</ApplicabilityWarning>
      <GeneratedTextPanel
        title={`${system.name} preview sentence`}
        subtitle="Editable classification language"
        text={sentence}
        onTextChange={onSentenceChange}
        onInsertTarget={onInsertTarget}
        onSave={onSave}
        copyLabel="Copy sentence"
      />
      <SourceBadges names={system.sourceNames} links={system.sourceLinks} />
    </article>
  );
}

interface IncidentalFindingsPanelProps {
  onInsertSentence: (sentence: string, label: string, target?: InsertTarget) => void;
  onSaveText: (title: string, type: DraftType, text: string, structuredData?: unknown) => void;
}

export function IncidentalFindingsPanel({ onInsertSentence, onSaveText }: IncidentalFindingsPanelProps) {
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState(incidentalFindingsRegistry[0].id);
  const [valuesById, setValuesById] = useState<Record<string, IncidentalValueMap>>({});
  const [editedSentences, setEditedSentences] = useState<Record<string, string>>({});
  const selected = incidentalFindingsRegistry.find((item) => item.id === selectedId) ?? incidentalFindingsRegistry[0];
  const values = valuesById[selected.id] ?? {};
  const generated = editedSentences[selected.id] ?? generateIncidentalFindingSentence(selected, values);

  const filtered = incidentalFindingsRegistry.filter((finding) => {
    const query = search.trim().toLowerCase();
    const text = [finding.name, finding.organSystem, finding.purpose, finding.commonModalities.join(' ')].join(' ').toLowerCase();
    return !query || text.includes(query);
  });

  const updateValue = (fieldId: string, valueToSet: string | boolean) => {
    setValuesById((existing) => ({
      ...existing,
      [selected.id]: {
        ...(existing[selected.id] ?? {}),
        [fieldId]: valueToSet,
      },
    }));
    setEditedSentences((existing) => {
      const next = { ...existing };
      delete next[selected.id];
      return next;
    });
  };

  return (
    <section className="registry-panel incidental-panel">
      <div className="section-heading">
        <span className="eyebrow">Incidental Findings & Follow-up</span>
        <h2>Consistent follow-up language</h2>
        <p>Generate editable incidental finding sentences from radiologist-entered descriptors. These helpers do not characterize images independently.</p>
      </div>
      <div className="incidental-layout">
        <aside className="template-list-panel">
          <label className="field">
            Search incidental helpers
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search adrenal, renal, thyroid..." />
          </label>
          <div className="template-list">
            {filtered.map((finding) => (
              <button
                className={`request-template-card ${finding.id === selected.id ? 'active' : ''}`}
                onClick={() => setSelectedId(finding.id)}
                type="button"
                key={finding.id}
              >
                <span>{finding.organSystem}</span>
                <strong>{finding.name}</strong>
                <small>{finding.commonModalities.join(', ')}</small>
              </button>
            ))}
          </div>
        </aside>

        <section className="request-form-panel">
          <div className="section-heading">
            <h3>{selected.name}</h3>
            <p>{selected.purpose}</p>
          </div>
          <div className="form-grid">
            {selected.keyInputs.map((field) => (
              <GenericField
                field={field}
                value={values[field.id]}
                onChange={(valueToSet) => updateValue(field.id, valueToSet)}
                key={field.id}
              />
            ))}
          </div>
          <PreviewList title="High-risk features to verify" items={selected.redFlagsOrHighRiskFeatures} />
          <ApplicabilityWarning>{selected.safetyWarning}</ApplicabilityWarning>
          <SourceBadges names={selected.sourceNames} links={selected.sourceLinks} />
        </section>

        <aside className="request-output-panel">
          <GeneratedTextPanel
            title={selected.name}
            subtitle="Incidental finding sentence"
            text={generated}
            onTextChange={(text) => setEditedSentences((existing) => ({ ...existing, [selected.id]: text }))}
            onInsertTarget={(target) => onInsertSentence(generated, selected.name, target)}
            onSave={() => onSaveText(selected.name, 'incidental', generated, { incidentalFindingId: selected.id, values })}
            copyLabel="Copy sentence"
          />
        </aside>
      </div>
    </section>
  );
}

interface PrimaryCareRequestBuilderProps {
  initialForm?: ReferralFormState;
  onInsertText: (text: string, label: string, target?: InsertTarget) => void;
  onSaveText: (title: string, type: DraftType, text: string, structuredData?: unknown) => void;
  onOpenImagingGuide?: (topicId: string, variantId?: string) => void;
  onSidebarStateChange?: (state: RequisitionSidebarState | null) => void;
}

type PrimaryCareViewMode = 'form' | 'preview' | 'split';

export interface RequisitionSidebarState {
  readiness: ReturnType<typeof scoreRequisitionCompleteness>;
  missing: string[];
  draftStatus: string;
}

const PRIMARY_CARE_VIEW_KEY = 'radreppilot:primary-care-view';
const ACR_REQUISITION_SELECTION_KEY = 'radreppilot.selectedAppropriatenessScenario';
const LEGACY_ACR_REQUISITION_SELECTION_KEY = 'radreppilot.pendingAcrRequisitionSelection';
const secondaryQuickFieldIds = new Set([
  'feverMeningismus',
  'cancerImmunosuppression',
  'priorImaging',
  'examFindings',
  'labs',
  'pregnancyStatus',
  'contrastSafety',
  'priorSurgery',
  'surgicalHistory',
  'cancerHistory',
  'immunosuppression',
  'negativeSymptoms',
  'redFlags',
]);

function appropriatenessSeverityLabel(check: RequestedImagingCheck) {
  if (check.severity === 'appropriate') return 'Usually Appropriate';
  if (check.severity === 'conditional') return check.appropriatenessCategory ?? 'May be appropriate';
  if (check.severity === 'not_appropriate') return 'Usually Not Appropriate';
  if (check.severity === 'unknown') return 'Not found in selected scenario';
  return 'Select requested imaging';
}

export function PrimaryCareRequestBuilder({ initialForm, onInsertText, onSaveText, onOpenImagingGuide, onSidebarStateChange }: PrimaryCareRequestBuilderProps) {
  const [mode, setMode] = useState<'quick' | 'detailed'>('quick');
  const [viewMode, setViewMode] = useState<PrimaryCareViewMode>(() => {
    if (typeof window === 'undefined') return 'form';
    const saved = window.localStorage.getItem(PRIMARY_CARE_VIEW_KEY);
    return saved === 'form' || saved === 'preview' || saved === 'split' ? saved : 'form';
  });
  const [search, setSearch] = useState('');
  const [bodySystemFilter, setBodySystemFilter] = useState<'All' | BodySystem>('All');
  const [modalityFilter, setModalityFilter] = useState('All');
  const [commonOnly, setCommonOnly] = useState(false);
  const [selectedComplaintId, setSelectedComplaintId] = useState('');
  const [preferredVariantId, setPreferredVariantId] = useState('');
  const [draftStatus, setDraftStatus] = useState('Local requisition draft ready');
  const [appropriatenessCheck, setAppropriatenessCheck] = useState<RequestedImagingCheck | null>(null);
  const [form, setForm] = useState<ReferralFormState>(
    initialForm ?? {
      requestType: primaryCareContentRegistry[0].id,
      values: {},
      generatedText: '',
      outputStyle: 'standard',
    },
  );

  const template = getPrimaryCareTemplate(form.requestType);
  const selectedTopicForTitle = selectedComplaintId.startsWith('topic:')
    ? getTopicById(selectedComplaintId.replace(/^topic:/, ''))
    : undefined;
  const typedClinicalProblem = typeof form.values.mainSymptom === 'string' ? form.values.mainSymptom.trim() : '';
  const activeRequisitionTitle = selectedTopicForTitle?.title ?? (typedClinicalProblem ? `Imaging request: ${typedClinicalProblem}` : template.title);
  const outputStyle = form.outputStyle ?? 'standard';
  const requisitionQuality = useMemo(() => scoreRequisitionCompleteness(form), [form]);
  const missing = useMemo(
    () =>
      typedClinicalProblem
        ? requisitionQuality.checks
            .filter((check) => !check.complete)
            .map((check) => check.missingLabel ?? check.label)
        : getMissingEssentials(form),
    [form, requisitionQuality.checks, typedClinicalProblem],
  );
  const pathwayMissing = useMemo(() => {
    const additions: string[] = [];
    if (!form.values.acrScenario && !selectedComplaintId) additions.push('Clinical scenario');
    if (!form.values.requestedProcedure) additions.push('Selected requested imaging');
    return Array.from(new Set([...missing, ...additions]));
  }, [form.values.acrScenario, form.values.requestedProcedure, missing, selectedComplaintId]);
  const readinessPercent = Math.round((requisitionQuality.complete / Math.max(requisitionQuality.total, 1)) * 100);
  const readinessLabel = pathwayMissing.length ? 'Requisition readiness: needs key details' : 'Requisition readiness: ready for review';
  const generated = form.generatedText || generateReferralText(form, outputStyle);
  const modalityOptions = useMemo(() => ['All', ...Array.from(new Set(primaryCareContentRegistry.map((item) => item.modality))).sort()], []);

  const filtered = primaryCareContentRegistry.filter((item) => {
    const query = search.trim().toLowerCase();
    const matchesSearch = !query || [item.title, item.description, item.modality, item.bodySystem].join(' ').toLowerCase().includes(query);
    return (
      matchesSearch &&
      (bodySystemFilter === 'All' || item.bodySystem === bodySystemFilter) &&
      (modalityFilter === 'All' || item.modality === modalityFilter) &&
      (!commonOnly || item.commonInPrimaryCare)
    );
  });

  useEffect(() => {
    if (initialForm) {
      setForm({ ...initialForm, outputStyle: initialForm.outputStyle ?? 'standard' });
    }
  }, [initialForm]);

  useEffect(() => {
    window.localStorage.setItem(PRIMARY_CARE_VIEW_KEY, viewMode);
  }, [viewMode]);

  useEffect(() => {
    onSidebarStateChange?.({
      readiness: requisitionQuality,
      missing: pathwayMissing,
      draftStatus,
    });

    return () => onSidebarStateChange?.(null);
  }, [draftStatus, onSidebarStateChange, pathwayMissing, requisitionQuality]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const pending = window.localStorage.getItem(ACR_REQUISITION_SELECTION_KEY) ?? window.localStorage.getItem(LEGACY_ACR_REQUISITION_SELECTION_KEY);
    if (!pending) return;

    try {
      const parsed = JSON.parse(pending) as { topicId?: string; variantId?: string; scenarioTitle?: string; procedure?: string };
      if (parsed.topicId) {
        const topic = getTopicById(parsed.topicId);
        const variant = topic?.variants.find((item) => item.id === parsed.variantId) ?? topic?.variants[0];
        setSelectedComplaintId(`topic:${parsed.topicId}`);
        setPreferredVariantId(parsed.variantId ?? '');
        if (topic) {
          setForm((existing) => {
            const next = {
              ...existing,
              values: {
                ...existing.values,
                positiveSymptoms: topic.title,
                mainSymptom: parsed.scenarioTitle ?? variant?.clinicalScenario ?? topic.title,
                indication: parsed.scenarioTitle ?? variant?.clinicalScenario ?? topic.title,
                acrScenario: `${topic.title}${variant ? ` - ${variant.title}` : ''}`,
                requestedProcedure: parsed.procedure ?? existing.values.requestedProcedure,
                clinicalQuestion:
                  variant?.requisitionSuggestions[0] ??
                  variant?.clinicalScenario ??
                  `Please advise on appropriate imaging for ${topic.title}.`,
              },
            };

            return {
              ...next,
              generatedText: generateReferralText(next, next.outputStyle ?? 'standard'),
            };
          });
        }
      }
    } catch {
      // Ignore malformed handoff state.
    } finally {
      window.localStorage.removeItem(ACR_REQUISITION_SELECTION_KEY);
      window.localStorage.removeItem(LEGACY_ACR_REQUISITION_SELECTION_KEY);
    }
  }, []);

  const regenerate = (next: ReferralFormState) => ({
    ...next,
    generatedText: generateReferralText(next, next.outputStyle ?? 'standard'),
  });

  const updateValue = (fieldId: string, valueToSet: string | boolean) => {
    setForm((existing) =>
      regenerate({
        ...existing,
        values: {
          ...existing.values,
          [fieldId]: valueToSet,
        },
      }),
    );
    setDraftStatus('Local requisition draft updated');
  };

  const updateClinicalProblem = (valueToSet: string) => {
    setSelectedComplaintId('');
    setPreferredVariantId('');
    setAppropriatenessCheck(null);
    setForm((existing) =>
      regenerate({
        ...existing,
        values: {
          ...existing.values,
          mainSymptom: valueToSet,
          indication: '',
          acrScenario: '',
          requestedProcedure: '',
          clinicalQuestion: '',
          redFlags: '',
        },
      }),
    );
    setDraftStatus('Clinical problem updated');
  };

  const updateOutputStyle = (style: RequisitionOutputStyle) => {
    setForm((existing) => regenerate({ ...existing, outputStyle: style }));
  };

  const selectRequestedImagingOption = (procedure: string, suggestedQuestion: string) => {
    setForm((existing) =>
      regenerate({
        ...existing,
        values: {
          ...existing.values,
          requestedProcedure: procedure,
          clinicalQuestion: suggestedQuestion || existing.values.clinicalQuestion || template.defaultQuestion,
        },
      }),
    );
    setDraftStatus('Requested imaging selected');
  };

  const selectTemplate = (item: PrimaryCareContentTemplate) => {
    const next: ReferralFormState = {
      requestType: item.id,
      values: {},
      generatedText: '',
      outputStyle,
      tone: form.tone ?? (typeof form.values.requisitionTone === 'string' ? form.values.requisitionTone as ReferralFormState['tone'] : 'polite'),
    };
    setSelectedComplaintId('');
    setPreferredVariantId('');
    setAppropriatenessCheck(null);
    setForm(regenerate(next));
    setDraftStatus('Template reset');
  };

  const resetRequisition = () => {
    const next: ReferralFormState = {
      requestType: form.requestType,
      values: {},
      generatedText: '',
      outputStyle,
      tone: form.tone ?? 'polite',
    };
    setSelectedComplaintId('');
    setPreferredVariantId('');
    setAppropriatenessCheck(null);
    setForm(regenerate(next));
    setDraftStatus('Local requisition draft cleared');
  };

  const applyNegative = (values: Record<string, string | boolean>) => {
    setForm((existing) =>
      regenerate({
        ...existing,
        values: {
          ...existing.values,
          ...values,
        },
      }),
    );
    setDraftStatus('Clinical context updated');
  };

  const applyScenario = (scenario: { topicTitle: string; variantTitle: string; clinicalScenario: string; suggestedQuestion?: string }) => {
    setForm((existing) =>
      regenerate({
        ...existing,
        values: {
          ...existing.values,
          clinicalQuestion:
            scenario.suggestedQuestion && scenario.suggestedQuestion !== 'Requisition wording pending for this topic.'
              ? scenario.suggestedQuestion
              : existing.values.clinicalQuestion || `Please assess for findings relevant to ${scenario.topicTitle}.`,
          acrScenario: scenario.variantTitle,
        },
      }),
    );
    setDraftStatus('Clinical scenario selected');
  };

  const applyGuidedClinicalContext = (phrases: string[]) => {
    setForm((existing) => {
      const nextParts = Array.from(new Set(phrases.map((phrase) => phrase.trim()).filter(Boolean)));
      return regenerate({
        ...existing,
        values: {
          ...existing.values,
          redFlags: nextParts.join('; '),
        },
      });
    });
    setDraftStatus('Clinical scenario context updated');
  };

  const toggleClinicalPrompt = (prompt: string, checked: boolean) => {
    setForm((existing) => {
      const current = typeof existing.values.redFlags === 'string' ? existing.values.redFlags : '';
      const parts = current
        .split(';')
        .map((item) => item.trim())
        .filter(Boolean);
      const nextParts = checked ? Array.from(new Set([...parts, prompt])) : parts.filter((item) => item !== prompt);
      return regenerate({
        ...existing,
        values: {
          ...existing.values,
          redFlags: nextParts.join('; '),
        },
      });
    });
    setDraftStatus('Clinical prompt updated');
  };

  const primaryQuickFields = template.quickFields.filter((field) => !secondaryQuickFieldIds.has(field.id));
  const secondaryQuickFields = template.quickFields.filter((field) => secondaryQuickFieldIds.has(field.id));
  const formFields =
    mode === 'quick' ? (
      <div className="quick-field-stack">
        <div className="form-grid request-field-grid">
          {primaryQuickFields.map((field) => (
            <GenericField
              field={field}
              value={form.values[field.id]}
              onChange={(valueToSet) => updateValue(field.id, valueToSet)}
              key={field.id}
            />
          ))}
        </div>
        {secondaryQuickFields.length ? (
          <details className="accordion-card">
            <summary>Less common details</summary>
            <div className="form-grid request-field-grid">
              {secondaryQuickFields.map((field) => (
                <GenericField
                  field={field}
                  value={form.values[field.id]}
                  onChange={(valueToSet) => updateValue(field.id, valueToSet)}
                  key={field.id}
                />
              ))}
            </div>
          </details>
        ) : null}
      </div>
    ) : (
      <div className="accordion-stack">
        {template.detailedFieldSections.map((section, index) => (
          <details className="accordion-card" open={index === 0} key={section.id}>
            <summary>{section.title}</summary>
            <div className="form-grid request-field-grid">
              {section.fields.map((field) => (
                <GenericField field={field} value={form.values[field.id]} onChange={(valueToSet) => updateValue(field.id, valueToSet)} key={field.id} />
              ))}
            </div>
          </details>
        ))}
      </div>
    );

  const requisitionPreview = (
    <aside className="request-output-panel">
      <div className="request-output-header">
        <div>
          <span className="eyebrow">Generated requisition</span>
          <h3>Generated requisition</h3>
        </div>
      </div>
      <div className="output-controls-grid">
        <div className="output-style-row">
          <span>Output style</span>
          <SegmentedControl
            value={outputStyle}
            options={[
              { value: 'ultra', label: 'Minimal' },
              { value: 'standard', label: 'Standard' },
              { value: 'detailed', label: 'Detailed' },
            ]}
            onChange={(value) => updateOutputStyle(value as RequisitionOutputStyle)}
          />
        </div>
        <div className="output-style-row">
          <span>Tone</span>
          <SegmentedControl
            value={form.tone ?? (typeof form.values.requisitionTone === 'string' ? form.values.requisitionTone : 'polite')}
            options={[
              { value: 'polite', label: 'Polite requisition' },
              { value: 'direct', label: 'Direct clinical' },
            ]}
            onChange={(tone) =>
              setForm((existing) =>
                regenerate({
                  ...existing,
                  tone: tone as ReferralFormState['tone'],
                  values: {
                    ...existing.values,
                    requisitionTone: tone,
                  },
                }),
              )
            }
          />
        </div>
      </div>
      {appropriatenessCheck && appropriatenessCheck.severity !== 'not_selected' && form.values.requestedProcedure ? (
        <section className={`appropriateness-check-card ${appropriatenessCheck.severity}`} aria-label="Appropriateness check">
          <div>
            <span className="eyebrow">Appropriateness check</span>
            <strong>{appropriatenessSeverityLabel(appropriatenessCheck)}</strong>
          </div>
          <p>{appropriatenessCheck.message}</p>
          {appropriatenessCheck.radiationLevel ? (
            <small>Relative radiation: {appropriatenessCheck.radiationLevel}</small>
          ) : null}
          {appropriatenessCheck.suggestedAlternatives.length ? (
            <div className="appropriateness-alternative-list">
              <span>Listed alternatives:</span>
              {appropriatenessCheck.suggestedAlternatives.map((option) => (
                <button
                  className="ghost-button chip-button"
                  onClick={() =>
                    selectRequestedImagingOption(
                      option.procedure,
                      typeof form.values.clinicalQuestion === 'string' && form.values.clinicalQuestion
                        ? form.values.clinicalQuestion
                        : template.defaultQuestion,
                    )
                  }
                  type="button"
                  key={option.procedure}
                >
                  {option.procedure}
                </button>
              ))}
            </div>
          ) : null}
        </section>
      ) : null}
      <GeneratedTextPanel
        title={activeRequisitionTitle}
        subtitle="Editable requisition"
        text={generated}
        onTextChange={(text) => setForm((existing) => ({ ...existing, generatedText: text }))}
        onSave={() => onSaveText(activeRequisitionTitle, 'referral', generated, { referralForm: { ...form, generatedText: generated }, requisitionText: generated })}
        copyLabel="Copy requisition"
      />
      <button className="secondary-button full-width-action" onClick={resetRequisition} type="button">
        Clear/reset
      </button>
    </aside>
  );

  return (
    <section className="primary-care-workspace">
      <div className="primary-care-topbar">
        <div>
          <h2>Imaging requisitions</h2>
          <p>Search a clinical problem, select an educational ACR-style scenario, choose imaging, and draft a concise request.</p>
        </div>
        <div className="primary-care-toggle-stack">
          <SegmentedControl
            value={viewMode}
            options={[
              { value: 'form', label: 'Form' },
              { value: 'preview', label: 'Preview' },
              { value: 'split', label: 'Split' },
            ]}
            onChange={(value) => setViewMode(value as PrimaryCareViewMode)}
          />
        </div>
      </div>

      <div className="primary-care-layout requisition-search-layout">
        <section className={`request-workspace view-${viewMode}`}>
          <div className={`request-main-grid ${viewMode}`}>
            {viewMode !== 'preview' ? (
              <section className="request-form-panel">
                <div className="section-heading">
                  <span className="eyebrow">Guided imaging request</span>
                  <h3>Clinical problem to imaging request</h3>
                  <p>Enter the clinical problem, clarify the scenario, then select an imaging option from the guided drawer.</p>
                </div>

                <RequisitionAppropriatenessPanel
                  template={template}
                  form={form}
                  selectedComplaintId={selectedComplaintId}
                  preferredVariantId={preferredVariantId}
                  onSelectComplaint={(complaintId) => {
                    setSelectedComplaintId(complaintId);
                    setPreferredVariantId('');
                    setAppropriatenessCheck(null);
                  }}
                  onSelectTopicVariant={(topicId, variantId) => {
                    setSelectedComplaintId(`topic:${topicId}`);
                    setPreferredVariantId(variantId);
                    setAppropriatenessCheck(null);
                  }}
                  onSelectScenario={applyScenario}
                  onApplyClinicalContext={applyGuidedClinicalContext}
                  onClinicalProblemChange={updateClinicalProblem}
                  onUpdateValue={updateValue}
                  onSelectImagingOption={selectRequestedImagingOption}
                  onAppropriatenessCheckChange={setAppropriatenessCheck}
                  onOpenGuide={onOpenImagingGuide}
                />

                <section className="patient-context-panel core-requisition-panel">
                  <span className="mini-heading">Core requisition fields</span>
                  <div className="form-grid request-field-grid">
                    <GenericField
                      field={{
                        id: 'clinicalQuestion',
                        label: 'Key clinical question',
                        type: 'textarea',
                        placeholder: 'e.g. assess for acute intracranial hemorrhage or other acute intracranial abnormality',
                      }}
                      value={form.values.clinicalQuestion}
                      onChange={(valueToSet) => updateValue('clinicalQuestion', valueToSet)}
                    />
                    <GenericField
                      field={{
                        id: 'requestedProcedure',
                        label: 'Selected requested imaging',
                        type: 'text',
                        placeholder: 'Select from ACR options or type requested study',
                      }}
                      value={form.values.requestedProcedure}
                      onChange={(valueToSet) => updateValue('requestedProcedure', valueToSet)}
                    />
                  </div>
                  <details className="accordion-card advanced-context-card">
                    <summary>Advanced patient context</summary>
                    <div className="patient-context-grid">
                      <GenericField
                        field={{
                          id: 'pmhxStatus',
                          label: 'PMHx documented?',
                          type: 'select',
                          options: [
                            { value: '', label: 'Not specified' },
                            { value: 'no-significant-pmhx', label: 'No relevant PMHx' },
                            { value: 'relevant-pmhx', label: 'Relevant PMHx present' },
                          ],
                        }}
                        value={form.values.pmhxStatus}
                        onChange={(valueToSet) => updateValue('pmhxStatus', valueToSet)}
                      />
                      <GenericField
                        field={{
                          id: 'pmhx',
                          label: 'Relevant PMHx',
                          type: 'textarea',
                          placeholder: 'e.g. cancer, anticoagulation, immunosuppression, recent surgery, CKD, pregnancy…',
                        }}
                        value={form.values.pmhx}
                        onChange={(valueToSet) => updateValue('pmhx', valueToSet)}
                      />
                      <GenericField
                        field={{ id: 'pregnancyStatus', label: 'Pregnancy status', type: 'text', placeholder: 'If relevant' }}
                        value={form.values.pregnancyStatus}
                        onChange={(valueToSet) => updateValue('pregnancyStatus', valueToSet)}
                      />
                      <GenericField
                        field={{ id: 'contrastSafety', label: 'Renal function / contrast issue', type: 'text', placeholder: 'eGFR, allergy, contrast concern' }}
                        value={form.values.contrastSafety}
                        onChange={(valueToSet) => updateValue('contrastSafety', valueToSet)}
                      />
                      <GenericField
                        field={{ id: 'anticoagulation', label: 'Anticoagulation', type: 'text', placeholder: 'Optional' }}
                        value={form.values.anticoagulation}
                        onChange={(valueToSet) => updateValue('anticoagulation', valueToSet)}
                      />
                      <GenericField
                        field={{ id: 'priorImaging', label: 'Prior imaging', type: 'text', placeholder: 'Optional comparison' }}
                        value={form.values.priorImaging}
                        onChange={(valueToSet) => updateValue('priorImaging', valueToSet)}
                      />
                      <GenericField
                        field={{ id: 'surgicalHistory', label: 'Relevant surgery', type: 'text', placeholder: 'Optional' }}
                        value={form.values.surgicalHistory}
                        onChange={(valueToSet) => updateValue('surgicalHistory', valueToSet)}
                      />
                      <GenericField
                        field={{ id: 'cancerHistory', label: 'Cancer history', type: 'text', placeholder: 'Optional' }}
                        value={form.values.cancerHistory}
                        onChange={(valueToSet) => updateValue('cancerHistory', valueToSet)}
                      />
                      <GenericField
                        field={{
                          id: 'immunosuppression',
                          label: 'Immunosuppression',
                          type: 'select',
                          options: [
                            { value: '', label: 'Not specified' },
                            { value: 'no', label: 'No' },
                            { value: 'yes', label: 'Yes' },
                          ],
                        }}
                        value={form.values.immunosuppression}
                        onChange={(valueToSet) => updateValue('immunosuppression', valueToSet)}
                      />
                    </div>
                  </details>
                </section>

                <details className="readiness-details inline-readiness-details">
                  <summary>{pathwayMissing.length ? 'Show missing details' : 'Show readiness details'}</summary>
                  {pathwayMissing.length ? (
                    <div className="missing-chip-row">
                      {pathwayMissing.slice(0, 8).map((item) => (
                        <span key={item}>{item}</span>
                      ))}
                    </div>
                  ) : (
                    <p>Verify the generated wording before using it clinically.</p>
                  )}
                </details>

                {template.oneClickNegatives.length ? (
                  <details className="accordion-card">
                    <summary>Optional quick fills</summary>
                    <div className="one-click-row">
                      {template.oneClickNegatives.map((negative) => (
                        <button className="ghost-button chip-button" onClick={() => applyNegative(negative.values)} type="button" key={negative.label}>
                          {negative.label}
                        </button>
                      ))}
                    </div>
                  </details>
                ) : null}

                <details className="accordion-card">
                  <summary>Additional request details</summary>
                  {formFields}
                </details>

                <details className="why-panel">
                  <summary>Why this matters to radiology</summary>
                  <ul>
                    {template.whyItMatters.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </details>
              </section>
            ) : null}

            {requisitionPreview}
          </div>
        </section>
      </div>
    </section>
  );
}

export function RequestTemplateCard({
  template,
  active,
  onSelect,
}: {
  template: PrimaryCareContentTemplate;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button className={`request-template-card ${active ? 'active' : ''}`} onClick={onSelect} type="button">
      <span>
        {template.bodySystem} · {template.modality}
      </span>
      <strong>{template.title}</strong>
      <small>{template.description}</small>
    </button>
  );
}

function GenericField({
  field,
  value,
  onChange,
}: {
  field: PrimaryCareFieldDefinition;
  value: string | boolean | undefined;
  onChange: (value: string | boolean) => void;
}) {
  const label = field.id === 'clinicalQuestion' ? 'Radiology question / request' : field.label;
  const hint =
    field.id === 'clinicalQuestion'
      ? 'Use natural wording: characterize, compare, evaluate, assess stability, assess for complication, or rule out when appropriate.'
      : '';

  if (field.type === 'select') {
    return (
      <label className={`field ${field.important ? 'important-field' : ''}`} data-field-id={field.id}>
        {label}
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

  if (field.type === 'textarea') {
    return (
      <label className={`field wide-field ${field.important ? 'important-field' : ''}`} data-field-id={field.id}>
        {label}
        <textarea value={typeof value === 'string' ? value : ''} onChange={(event) => onChange(event.target.value)} placeholder={field.placeholder} />
        {hint ? <small className="field-hint">{hint}</small> : null}
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
    <label className={`field ${field.important ? 'important-field' : ''}`} data-field-id={field.id}>
      {label}
      <input value={typeof value === 'string' ? value : ''} onChange={(event) => onChange(event.target.value)} placeholder={field.placeholder} />
    </label>
  );
}

function SegmentedControl({
  value,
  options,
  onChange,
}: {
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
}) {
  return (
    <div className="segmented-control">
      {options.map((option) => (
        <button className={value === option.value ? 'active' : ''} onClick={() => onChange(option.value)} type="button" key={option.value}>
          {option.label}
        </button>
      ))}
    </div>
  );
}

function PreviewList({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <div className="preview-list">
      <span>{title}</span>
      <ul>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

function SourceBadges({ names, links }: { names: string[]; links: string[] }) {
  if (!names.length && !links.length) return null;
  return (
    <div className="source-badges">
      {names.map((name, index) => {
        const link = links[index];
        return link ? (
          <a href={link} target="_blank" rel="noreferrer" key={`${name}-${link}`}>
            {name}
          </a>
        ) : (
          <span key={name}>{name}</span>
        );
      })}
    </div>
  );
}

function FilterSelect({
  label,
  value,
  values,
  onChange,
}: {
  label: string;
  value: string;
  values: readonly string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="field">
      {label}
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {values.map((item) => (
          <option value={item} key={item}>
            {item}
          </option>
        ))}
      </select>
    </label>
  );
}
