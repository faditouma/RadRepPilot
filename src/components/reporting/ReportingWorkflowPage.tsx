import { useEffect, useState } from 'react';
import type { ReportingWorkflowSchema, WorkflowQuickFill, WorkflowValues } from '../../data/reportingWorkflowSchemas';
import { generateReportingWorkflowReport } from '../../utils/reportGenerators';
import { scoreReportCompleteness } from '../../utils/qualityMetrics';
import type { InsertTarget, ReportSections } from '../../radrep/types';
import { CompletenessChecklist } from '../quality/CompletenessChecklist';
import { GeneratedReportPanel } from './GeneratedReportPanel';
import { IncidentalFindingsPanel } from './IncidentalFindingsPanel';
import { KeyNegativesPanel } from './KeyNegativesPanel';
import { OptionalClinicalContextPanel } from './OptionalClinicalContextPanel';
import { QuickFillButtons } from './QuickFillButtons';
import { StructuredFieldRenderer } from './StructuredFieldRenderer';

interface ReportingWorkflowPageProps {
  schema: ReportingWorkflowSchema;
  onInsertText: (text: string, label: string, target?: InsertTarget) => void;
  onSaveDraft: (report: ReportSections, structuredData: unknown, title?: string) => void;
  onOpenHelper?: (helperId: string) => void;
}

function cloneValues(values: WorkflowValues): WorkflowValues {
  return Object.fromEntries(
    Object.entries(values).map(([key, value]) => [key, Array.isArray(value) ? [...value] : value]),
  );
}

const helperLinksByModule: Partial<Record<string, Array<{ id: string; label: string }>>> = {
  appendicitis: [
    { id: 'adrenal-washout', label: 'Adrenal washout' },
    { id: 'bosniak', label: 'Bosniak' },
  ],
  bowelObstruction: [{ id: 'adrenal-washout', label: 'Adrenal washout' }],
  renalColic: [{ id: 'bosniak', label: 'Bosniak renal cyst helper' }],
  ruqUltrasound: [
    { id: 'lirads', label: 'LI-RADS preview' },
    { id: 'tirads', label: 'TI-RADS if thyroid finding' },
  ],
  dvtUltrasound: [{ id: 'bonerads', label: 'Bone-RADS if bone lesion' }],
};

export function ReportingWorkflowPage({ schema, onInsertText, onSaveDraft, onOpenHelper }: ReportingWorkflowPageProps) {
  const [values, setValues] = useState<WorkflowValues>(() => cloneValues(schema.defaultValues));
  const [report, setReport] = useState<ReportSections>(() => generateReportingWorkflowReport(schema.moduleType, schema.defaultValues));
  const [clinicalContextOpen, setClinicalContextOpen] = useState(false);
  const [activeQuickFillId, setActiveQuickFillId] = useState('');

  const clinicalContextSections = schema.sections.filter((section) => section.id.toLowerCase().includes('context'));
  const imagingSections = schema.sections.filter((section) => !section.id.toLowerCase().includes('context'));
  const reportQuality = scoreReportCompleteness(schema.moduleType, values, report);

  useEffect(() => {
    setValues(cloneValues(schema.defaultValues));
    setReport(generateReportingWorkflowReport(schema.moduleType, schema.defaultValues));
    setClinicalContextOpen(false);
    setActiveQuickFillId('');
  }, [schema]);

  useEffect(() => {
    setReport(generateReportingWorkflowReport(schema.moduleType, values));
  }, [schema.moduleType, values]);

  const updateValue = (fieldId: string, value: string | string[]) => {
    setValues((existing) => ({
      ...existing,
      [fieldId]: value,
    }));
  };

  const applyQuickFill = (quickFill: WorkflowQuickFill) => {
    setValues((existing) => ({
      ...existing,
      ...cloneValues(quickFill.values),
    }));
    setActiveQuickFillId(quickFill.id);
  };

  const clear = () => {
    setValues(cloneValues(schema.defaultValues));
    setReport(generateReportingWorkflowReport(schema.moduleType, schema.defaultValues));
    setActiveQuickFillId('');
    setClinicalContextOpen(false);
  };

  const generatedReport = () => setReport(generateReportingWorkflowReport(schema.moduleType, values));

  return (
    <div className="reporting-workflow">
      <section className="workflow-title-card">
        <div>
          <span className="eyebrow">
            {schema.modality} · {schema.bodySystem}
          </span>
          <h2>{schema.title}</h2>
          <p>{schema.clinicalQuestion}</p>
        </div>
        <div className="workflow-badges">
          {schema.badges.map((badge) => (
            <span key={badge}>{badge}</span>
          ))}
          <span className="content-status-badge">Draft content</span>
          <span className="content-status-badge review">Needs radiology review</span>
        </div>
      </section>

      <div className="reporting-workflow-layout">
        <div className="workflow-input-stack">
          <QuickFillButtons quickFills={schema.quickFills} onApply={applyQuickFill} activeQuickFillId={activeQuickFillId} />

          {imagingSections.map((section) => (
            <details className="workflow-card workflow-accordion" open={section.defaultOpen ?? true} key={section.id}>
              <summary>
                <span>{section.title}</span>
                {section.description ? <small>{section.description}</small> : null}
              </summary>
              <div className="workflow-form-grid">
                {section.fields.map((field) => (
                  <StructuredFieldRenderer
                    field={field}
                    value={values[field.id]}
                    onChange={(value) => updateValue(field.id, value)}
                    key={field.id}
                  />
                ))}
              </div>
            </details>
          ))}

          <KeyNegativesPanel
            options={schema.keyNegatives}
            selected={Array.isArray(values.keyNegatives) ? values.keyNegatives : []}
            onChange={(selected) => updateValue('keyNegatives', selected)}
          />

          <CompletenessChecklist score={reportQuality} />

          <IncidentalFindingsPanel
            options={schema.incidentalOptions}
            value={typeof values.incidentalFindings === 'string' ? values.incidentalFindings : ''}
            onChange={(value) => updateValue('incidentalFindings', value)}
            onInsert={(target, text) => onInsertText(text, `${schema.shortTitle} incidental finding`, target)}
            onOpenHelper={onOpenHelper}
          />

          <section className="workflow-card compact-workflow-card">
            <div className="section-heading">
              <span className="eyebrow">Calculators / classification systems</span>
              <h3>Linked helpers</h3>
              <p>Use the Guidelines & Calculators workspace for dedicated interactive helpers, then insert the result into this report.</p>
            </div>
            <div className="checklist-preview">
              {(helperLinksByModule[schema.moduleType] ?? []).map((helper) => (
                <button className="helper-link-chip" onClick={() => onOpenHelper?.(helper.id)} type="button" key={helper.id}>
                  Open {helper.label}
                </button>
              ))}
              {schema.badges
                .filter((badge) => !['Implemented', 'Prototype', 'Incidental support', 'Surgical red flags', 'Vascular workflow'].includes(badge))
                .map((badge) => (
                  <span key={badge}>{badge}</span>
                ))}
              <span>Report Builder insert support</span>
            </div>
          </section>

          <OptionalClinicalContextPanel
            sections={clinicalContextSections}
            values={values}
            open={clinicalContextOpen}
            onToggle={() => setClinicalContextOpen((open) => !open)}
            onChange={updateValue}
          />

          <section className="workflow-card">
            <div className="section-heading">
              <span className="eyebrow">Additional free text</span>
              <h3>Other findings</h3>
            </div>
            <label className="field">
              Additional free-text findings
              <textarea
                value={typeof values.additionalFindings === 'string' ? values.additionalFindings : ''}
                onChange={(event) => updateValue('additionalFindings', event.target.value)}
                placeholder="Enter any additional verified imaging findings."
              />
            </label>
          </section>
        </div>

        <GeneratedReportPanel
          title={`${schema.shortTitle} draft`}
          report={report}
          onChange={setReport}
          onGenerate={generatedReport}
          onInsert={(target, text) => onInsertText(text, schema.title, target)}
          onSaveDraft={() => onSaveDraft(report, { workflowId: schema.moduleId, moduleType: schema.moduleType, values, report }, schema.title)}
          onClear={clear}
        />
      </div>

      <p className="workflow-safety-note">{schema.safetyNote}</p>
    </div>
  );
}
