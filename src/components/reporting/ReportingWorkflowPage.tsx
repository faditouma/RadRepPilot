import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  ReportingWorkflowSchema,
  WorkflowQuickFill,
  WorkflowValue,
  WorkflowValues,
} from '../../data/reportingWorkflowSchemas';
import { generateReportingWorkflowReport } from '../../utils/reportGenerators';
import { scoreReportCompleteness } from '../../utils/qualityMetrics';
import type { InsertTarget, ReportSections } from '../../radrep/types';
import { CompletenessMiniPanel } from './CompletenessMiniPanel';
import { IncidentalFindingsPanel } from './IncidentalFindingsPanel';
import { KeyNegativesPanel } from './KeyNegativesPanel';
import { QuickFillButtons } from './QuickFillButtons';
import { ReportDraftPanel, type WorkflowDraftReport } from './ReportDraftPanel';
import { StructuredFieldRenderer } from './StructuredFieldRenderer';
import { WorkflowToolDock, type WorkflowToolId, type WorkflowToolItem } from './WorkflowToolDock';

interface ReportingWorkflowPageProps {
  schema: ReportingWorkflowSchema;
  onInsertText: (text: string, label: string, target?: InsertTarget) => void;
  onSaveDraft: (report: ReportSections, structuredData: unknown, title?: string) => void;
  onOpenHelper?: (helperId: string) => void;
}

interface StoredWorkflowDraft {
  workflowId: string;
  moduleType: string;
  values: WorkflowValues;
  report: WorkflowDraftReport;
  activeQuickFillId?: string;
  lastUpdatedAt: string;
}

const LOCAL_DRAFT_KEY = 'radreppilot.activeWorkflowDraft';

function cloneValues(values: WorkflowValues): WorkflowValues {
  return Object.fromEntries(
    Object.entries(values).map(([key, value]) => [key, Array.isArray(value) ? [...value] : value]),
  );
}

function createDraftReport(schema: ReportingWorkflowSchema, values: WorkflowValues): WorkflowDraftReport {
  return {
    ...generateReportingWorkflowReport(schema.moduleType, values),
    internalNotes: '',
  };
}

function readStoredDraft(schema: ReportingWorkflowSchema): StoredWorkflowDraft | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.localStorage.getItem(LOCAL_DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredWorkflowDraft>;
    if (parsed.workflowId !== schema.moduleId || parsed.moduleType !== schema.moduleType || !parsed.values || !parsed.report) {
      return null;
    }

    return {
      workflowId: parsed.workflowId,
      moduleType: parsed.moduleType,
      values: parsed.values,
      report: parsed.report,
      activeQuickFillId: parsed.activeQuickFillId ?? '',
      lastUpdatedAt: parsed.lastUpdatedAt ?? new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

function templateModePatch(moduleType: string, mode: string): WorkflowValues {
  if (moduleType === 'chestXray') {
    if (mode === 'blank') {
      return {
        templateMode: 'blank',
        studyQuality: 'not specified',
        cardiomediastinalSilhouette: 'not specified',
        lungVolumes: 'not specified',
        consolidation: 'not specified',
        consolidationLocation: '',
        atelectaticChange: 'not specified',
        interstitialEdema: 'not specified',
        pleuralEffusion: 'not specified',
        pleuralEffusionLocation: '',
        pneumothorax: 'not specified',
        pneumothoraxSideSize: '',
      };
    }
    if (mode === 'normal') {
      return {
        templateMode: 'normal',
        studyQuality: 'adequate',
        cardiomediastinalSilhouette: 'normal',
        lungVolumes: 'normal',
        consolidation: 'none',
        consolidationLocation: '',
        atelectaticChange: 'absent',
        interstitialEdema: 'absent',
        pleuralEffusion: 'none',
        pleuralEffusionLocation: '',
        pneumothorax: 'none',
        pneumothoraxSideSize: '',
      };
    }
  }

  if (moduleType === 'mskXrayFracture') {
    if (mode === 'blank') {
      return {
        templateMode: 'blank',
        fracture: 'not specified',
        fractureLocation: '',
        displacementAlignment: 'not specified',
        intraArticularExtension: 'not specified',
        jointAlignment: 'not specified',
        softTissueEffusion: 'not specified',
      };
    }
    if (mode === 'normal') {
      return {
        templateMode: 'normal',
        fracture: 'no acute fracture identified',
        fractureLocation: '',
        displacementAlignment: 'not specified',
        intraArticularExtension: 'not specified',
        jointAlignment: 'normal alignment',
        softTissueEffusion: 'none',
      };
    }
  }

  return { templateMode: mode };
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

function statusTimestamp(status: string, date: Date): string {
  return `${status} · ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
}

export function ReportingWorkflowPage({ schema, onInsertText, onSaveDraft, onOpenHelper }: ReportingWorkflowPageProps) {
  const initialStoredDraft = readStoredDraft(schema);
  const [values, setValues] = useState<WorkflowValues>(() => initialStoredDraft?.values ?? cloneValues(schema.defaultValues));
  const [report, setReport] = useState<WorkflowDraftReport>(() => initialStoredDraft?.report ?? createDraftReport(schema, schema.defaultValues));
  const [activeQuickFillId, setActiveQuickFillId] = useState(initialStoredDraft?.activeQuickFillId ?? '');
  const [activeTool, setActiveTool] = useState<WorkflowToolId | null>(null);
  const [manualDraftEdited, setManualDraftEdited] = useState(false);
  const [draftStatus, setDraftStatus] = useState(initialStoredDraft ? 'Local draft restored' : 'Draft saved locally');
  const isRestoringRef = useRef(false);

  const clinicalContextSections = schema.sections.filter((section) => section.id.toLowerCase().includes('context'));
  const imagingSections = schema.sections.filter((section) => !section.id.toLowerCase().includes('context'));
  const reportQuality = scoreReportCompleteness(schema.moduleType, values, report);
  const usesDerivedNegatives = schema.moduleType === 'chestXray' || schema.moduleType === 'mskXrayFracture';
  const helperLinks = helperLinksByModule[schema.moduleType] ?? [];
  const hasAdditionalTools = clinicalContextSections.length > 0 || schema.incidentalOptions.length > 0 || helperLinks.length > 0;

  const persistLocalDraft = useCallback(
    (statusMessage = 'Draft saved locally') => {
      if (typeof window === 'undefined') return;

      const nextDraft: StoredWorkflowDraft = {
        workflowId: schema.moduleId,
        moduleType: schema.moduleType,
        values,
        report,
        activeQuickFillId,
        lastUpdatedAt: new Date().toISOString(),
      };
      window.localStorage.setItem(LOCAL_DRAFT_KEY, JSON.stringify(nextDraft));
      setDraftStatus(statusTimestamp(statusMessage, new Date()));
    },
    [activeQuickFillId, report, schema.moduleId, schema.moduleType, values],
  );

  useEffect(() => {
    const storedDraft = readStoredDraft(schema);
    isRestoringRef.current = true;

    if (storedDraft) {
      setValues(storedDraft.values);
      setReport(storedDraft.report);
      setActiveQuickFillId(storedDraft.activeQuickFillId ?? '');
      setDraftStatus('Local draft restored');
    } else {
      const nextValues = cloneValues(schema.defaultValues);
      setValues(nextValues);
      setReport(createDraftReport(schema, nextValues));
      setActiveQuickFillId('');
      setDraftStatus('Draft ready');
    }

    setActiveTool(null);
    setManualDraftEdited(false);
  }, [schema]);

  useEffect(() => {
    if (manualDraftEdited) return;

    setReport((existing) => ({
      ...generateReportingWorkflowReport(schema.moduleType, values),
      internalNotes: existing.internalNotes ?? '',
    }));
  }, [manualDraftEdited, schema.moduleType, values]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const nextDraft: StoredWorkflowDraft = {
      workflowId: schema.moduleId,
      moduleType: schema.moduleType,
      values,
      report,
      activeQuickFillId,
      lastUpdatedAt: new Date().toISOString(),
    };
    window.localStorage.setItem(LOCAL_DRAFT_KEY, JSON.stringify(nextDraft));

    if (isRestoringRef.current) {
      isRestoringRef.current = false;
      return;
    }

    setDraftStatus(statusTimestamp('Draft saved locally', new Date()));
  }, [activeQuickFillId, report, schema.moduleId, schema.moduleType, values]);

  const updateValue = (fieldId: string, value: WorkflowValue) => {
    setValues((existing) => {
      if (fieldId === 'templateMode' && typeof value === 'string') {
        return {
          ...existing,
          ...templateModePatch(schema.moduleType, value),
        };
      }

      return {
        ...existing,
        [fieldId]: value,
      };
    });

    if (fieldId === 'incidentalFindings' && typeof value === 'string') {
      setReport((existing) => ({ ...existing, incidentalFindings: value }));
    }
  };

  const applyQuickFill = (quickFill: WorkflowQuickFill) => {
    setValues((existing) => ({
      ...existing,
      ...cloneValues(quickFill.values),
    }));
    setActiveQuickFillId(quickFill.id);
    setManualDraftEdited(false);
  };

  const clear = () => {
    const nextValues = cloneValues(schema.defaultValues);
    setValues(nextValues);
    setReport(createDraftReport(schema, nextValues));
    setActiveQuickFillId('');
    setActiveTool(null);
    setManualDraftEdited(false);
    setDraftStatus('Draft reset');
  };

  const regenerateReport = () => {
    setReport((existing) => ({
      ...generateReportingWorkflowReport(schema.moduleType, values),
      internalNotes: existing.internalNotes ?? '',
    }));
    setManualDraftEdited(false);
    setDraftStatus(statusTimestamp('Draft regenerated from structured fields', new Date()));
  };

  const handleReportChange = (nextReport: WorkflowDraftReport) => {
    setReport(nextReport);
    setManualDraftEdited(true);
  };

  const toolItems: WorkflowToolItem[] = [
    {
      id: 'clinicalContext',
      label: 'Clinical context',
      description: 'Indication, comparison, relevant context',
      available: clinicalContextSections.length > 0,
    },
    {
      id: 'incidental',
      label: 'Incidental finding',
      description: 'Follow-up language when present',
      available: schema.incidentalOptions.length > 0,
    },
    {
      id: 'helpers',
      label: 'Calculator/helper',
      description: 'Open linked support tools',
      available: helperLinks.length > 0 || schema.badges.length > 0,
    },
    {
      id: 'freeText',
      label: 'Free text',
      description: 'Additional findings or nuance',
    },
    {
      id: 'limitations',
      label: 'Limitations',
      description: 'Artifact, uncertainty, incomplete views',
    },
    {
      id: 'teaching',
      label: 'Teaching note',
      description: 'Educational scope and verification reminder',
      available: hasAdditionalTools,
    },
  ];

  const renderToolPanel = () => {
    if (!activeTool) return null;

    if (activeTool === 'clinicalContext') {
      return (
        <section className="workflow-card workflow-tool-panel">
          <div className="section-heading">
            <span className="eyebrow">Clinical context</span>
            <h3>Optional context fields</h3>
            <p>Use these only when they affect technique, comparison, or final wording.</p>
          </div>
          {clinicalContextSections.length ? (
            <div className="accordion-stack">
              {clinicalContextSections.map((section) => (
                <details className="workflow-card workflow-accordion nested-accordion" open key={section.id}>
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
            </div>
          ) : (
            <div className="inline-note">This workflow has no dedicated clinical context fields.</div>
          )}
        </section>
      );
    }

    if (activeTool === 'incidental') {
      return (
        <IncidentalFindingsPanel
          options={schema.incidentalOptions}
          value={typeof values.incidentalFindings === 'string' ? values.incidentalFindings : ''}
          onChange={(value) => updateValue('incidentalFindings', value)}
          onInsert={(target, text) => onInsertText(text, `${schema.shortTitle} incidental finding`, target)}
          onOpenHelper={onOpenHelper}
        />
      );
    }

    if (activeTool === 'helpers') {
      return (
        <section className="workflow-card compact-workflow-card workflow-tool-panel">
          <div className="section-heading">
            <span className="eyebrow">Calculators / classification systems</span>
            <h3>Linked helpers</h3>
            <p>Open helpers only when needed, then copy or insert the generated sentence into the draft.</p>
          </div>
          <div className="checklist-preview">
            {helperLinks.map((helper) => (
              <button className="helper-link-chip" onClick={() => onOpenHelper?.(helper.id)} type="button" key={helper.id}>
                Open {helper.label}
              </button>
            ))}
            {schema.badges
              .filter((badge) => !['Implemented', 'Prototype', 'Incidental support', 'Surgical red flags', 'Vascular workflow'].includes(badge))
              .map((badge) => (
                <span key={badge}>{badge}</span>
              ))}
            <span>Report Builder insert support available under advanced options</span>
          </div>
        </section>
      );
    }

    if (activeTool === 'freeText') {
      return (
        <section className="workflow-card workflow-tool-panel">
          <div className="section-heading">
            <span className="eyebrow">Free text</span>
            <h3>Additional findings / radiologist comment</h3>
            <p>Use for relevant findings not captured above, nuance, comparison, uncertainty, or differential considerations.</p>
          </div>
          <label className="field">
            Additional findings / radiologist comment
            <textarea
              value={typeof values.additionalFindings === 'string' ? values.additionalFindings : ''}
              onChange={(event) => updateValue('additionalFindings', event.target.value)}
              placeholder="Add relevant findings not captured above, nuance, comparison, uncertainty, or differential considerations."
            />
          </label>
        </section>
      );
    }

    if (activeTool === 'limitations') {
      return (
        <section className="workflow-card workflow-tool-panel">
          <div className="section-heading">
            <span className="eyebrow">Limitations</span>
            <h3>Limitations / uncertainty</h3>
            <p>Document technical limitations only when relevant to the final wording.</p>
          </div>
          <label className="field">
            Limitations / uncertainty
            <textarea
              value={typeof values.limitationsUncertainty === 'string' ? values.limitationsUncertainty : ''}
              onChange={(event) => updateValue('limitationsUncertainty', event.target.value)}
              placeholder="e.g. motion artifact, incomplete visualization, limited contrast timing, technically limited study."
            />
          </label>
        </section>
      );
    }

    return (
      <section className="workflow-card workflow-tool-panel">
        <div className="section-heading">
          <span className="eyebrow">Teaching note</span>
          <h3>Educational scope</h3>
          <p>RadRepPilot organizes user-entered findings into draft language. Verify source images, measurements, and final wording before use.</p>
        </div>
      </section>
    );
  };

  return (
    <div className="reporting-workflow">
      <div className="reporting-workflow-layout">
        <aside className="workflow-left-panel" aria-label="Workflow overview">
          <section className="workflow-side-card workflow-module-map">
            <span className="eyebrow">Workspace modules</span>
            <h3>{schema.shortTitle}</h3>
            <p>
              {schema.modality} · {schema.bodySystem}
            </p>
            <ol>
              <li>Quick start</li>
              <li>Core findings</li>
              <li>Report draft</li>
            </ol>
          </section>
          <CompletenessMiniPanel score={reportQuality} />
          <section className="workflow-side-card draft-status-card">
            <span className="eyebrow">Local progress</span>
            <strong>{draftStatus}</strong>
            <p>No sign-in required for this local draft.</p>
          </section>
        </aside>

        <main className="workflow-center-panel">
          <section className="workflow-title-card">
            <div>
              <span className="eyebrow">
                {schema.modality} · {schema.bodySystem}
              </span>
              <h2>{schema.title}</h2>
              <p>{schema.clinicalQuestion}</p>
            </div>
            <div className="workflow-badges">
              {schema.badges
                .filter((badge) => badge !== 'Prototype')
                .map((badge) => (
                  <span key={badge}>{badge}</span>
                ))}
              <span className="content-status-badge">Educational draft</span>
            </div>
          </section>

          <QuickFillButtons quickFills={schema.quickFills} onApply={applyQuickFill} activeQuickFillId={activeQuickFillId} />

          <WorkflowToolDock tools={toolItems} activeTool={activeTool} onSelect={(toolId) => setActiveTool((current) => (current === toolId ? null : toolId))} />

          {renderToolPanel()}

          <section className="workflow-card workflow-core-card">
            <div className="section-heading">
              <span className="eyebrow">Core findings</span>
              <h3>Structured imaging findings</h3>
              <p>Complete the findings verified on the study. Optional tools stay above this section until opened.</p>
            </div>
            <div className="accordion-stack">
              {imagingSections.map((section) => (
                <details className="workflow-card workflow-accordion nested-accordion" open={section.defaultOpen ?? true} key={section.id}>
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
            </div>
          </section>

          {usesDerivedNegatives ? (
            <section className="workflow-card compact-workflow-card">
              <div className="section-heading">
                <span className="eyebrow">Common negatives</span>
                <h3>Auto-derived from selected states</h3>
                <p>Absent/normal selections are included in the draft when appropriate. Positive findings suppress contradictory negatives.</p>
              </div>
            </section>
          ) : schema.keyNegatives.length ? (
            <KeyNegativesPanel
              options={schema.keyNegatives}
              selected={Array.isArray(values.keyNegatives) ? values.keyNegatives : []}
              onChange={(selected) => updateValue('keyNegatives', selected)}
            />
          ) : null}

          <p className="workflow-safety-note">{schema.safetyNote}</p>
        </main>

        <ReportDraftPanel
          title={`${schema.shortTitle} draft`}
          report={report}
          onChange={handleReportChange}
          onRegenerate={regenerateReport}
          onInsert={(target, text) => onInsertText(text, schema.title, target)}
          onSaveDraft={() => onSaveDraft(report, { workflowId: schema.moduleId, moduleType: schema.moduleType, values, report }, schema.title)}
          onSaveLocalDraft={() => persistLocalDraft('Draft saved locally')}
          onClear={clear}
        />
      </div>
    </div>
  );
}
