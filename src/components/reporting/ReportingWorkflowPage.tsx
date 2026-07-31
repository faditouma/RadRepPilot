import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
  ReportingWorkflowSchema,
  WorkflowQuickFill,
  WorkflowValue,
  WorkflowValues,
} from '../../data/reportingWorkflowSchemas';
import { isWorkflowFieldVisible } from '../../data/reportingWorkflowSchemas';
import { generateReportingWorkflowReport } from '../../utils/reportGenerators';
import { scoreReportCompleteness, type QualityScore } from '../../utils/qualityMetrics';
import type { InsertTarget, ReportSections } from '../../radrep/types';
import {
  createStoredWorkflowDraft,
  readStoredWorkflowDraft,
  type StoredWorkflowDraft,
  writeStoredWorkflowDraft,
} from '../../lib/workflowDraftStorage';
import { IncidentalFindingsPanel } from './IncidentalFindingsPanel';
import { KeyNegativesPanel } from './KeyNegativesPanel';
import { QuickFillButtons } from './QuickFillButtons';
import { ReportDraftPanel, type WorkflowDraftReport } from './ReportDraftPanel';
import { StructuredFieldRenderer } from './StructuredFieldRenderer';
import { WorkflowToolDock, type WorkflowToolId, type WorkflowToolItem } from './WorkflowToolDock';
import { useI18n } from '../../i18n/I18nContext';

interface ReportingWorkflowPageProps {
  schema: ReportingWorkflowSchema;
  onInsertText: (text: string, label: string, target?: InsertTarget) => void;
  onSaveDraft: (report: ReportSections, structuredData: unknown, title?: string) => void;
  onOpenHelper?: (helperId: string) => void;
  onSidebarStateChange?: (state: WorkflowSidebarState | null) => void;
}

export interface WorkflowSidebarState {
  workflowTitle: string;
  modality: string;
  bodySystem: string;
  completeness: QualityScore;
  draftStatus: string;
}

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
  return readStoredWorkflowDraft(window.localStorage, schema);
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
  ctpa: [{ id: 'rv-lv-ratio', label: 'RV/LV ratio' }],
  nodule: [{ id: 'fleischner', label: 'Fleischner nodule helper' }],
  stroke: [{ id: 'aspects', label: 'ASPECTS helper' }],
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
  return `${status} at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
}

export function ReportingWorkflowPage({
  schema,
  onInsertText,
  onSaveDraft,
  onOpenHelper,
  onSidebarStateChange,
}: ReportingWorkflowPageProps) {
  const { text } = useI18n();
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
  const reportQuality = useMemo(() => scoreReportCompleteness(schema.moduleType, values, report), [report, schema.moduleType, values]);
  const usesDerivedNegatives = schema.moduleType === 'chestXray' || schema.moduleType === 'mskXrayFracture';
  const helperLinks = helperLinksByModule[schema.moduleType] ?? [];
  const hasAdditionalTools = clinicalContextSections.length > 0 || schema.incidentalOptions.length > 0 || helperLinks.length > 0;

  useEffect(() => {
    return () => onSidebarStateChange?.(null);
  }, [onSidebarStateChange]);

  useEffect(() => {
    onSidebarStateChange?.({
      workflowTitle: schema.shortTitle,
      modality: schema.modality,
      bodySystem: schema.bodySystem,
      completeness: reportQuality,
      draftStatus,
    });
  }, [draftStatus, onSidebarStateChange, reportQuality, schema.bodySystem, schema.modality, schema.shortTitle]);

  const persistLocalDraft = useCallback(
    (statusMessage = 'Draft saved locally') => {
      if (typeof window === 'undefined') return;

      const nextDraft = createStoredWorkflowDraft({
        schema,
        values,
        report,
        activeQuickFillId,
      });
      writeStoredWorkflowDraft(window.localStorage, nextDraft);
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

    const nextDraft = createStoredWorkflowDraft({
      schema,
      values,
      report,
      activeQuickFillId,
    });
    writeStoredWorkflowDraft(window.localStorage, nextDraft);

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
            <span className="eyebrow">{text('Clinical context')}</span>
            <h3>{text('Optional context fields')}</h3>
          </div>
          {clinicalContextSections.length ? (
            <div className="accordion-stack">
              {clinicalContextSections.map((section) => (
                <details className="workflow-card workflow-accordion nested-accordion" open key={section.id}>
	                  <summary>
	                    <span>{text(section.title)}</span>
	                  </summary>
                  <div className="workflow-form-grid">
                    {section.fields.filter((field) => isWorkflowFieldVisible(field, values)).map((field) => (
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
            <div className="inline-note">{text('This workflow has no dedicated clinical context fields.')}</div>
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
	            <span className="eyebrow">{text('Calculators / classification systems')}</span>
	            <h3>{text('Linked helpers')}</h3>
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
	            <span className="eyebrow">{text('Free text')}</span>
	            <h3>{text('Additional findings / radiologist comment')}</h3>
	          </div>
          <label className="field">
            {text('Additional findings / radiologist comment')}
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
	            <span className="eyebrow">{text('Limitations')}</span>
	            <h3>{text('Limitations / uncertainty')}</h3>
	          </div>
          <label className="field">
            {text('Limitations / uncertainty')}
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
          <span className="eyebrow">{text('Teaching note')}</span>
          <h3>{text('Educational scope')}</h3>
          <p>{text('RadRepPilot organizes user-entered findings into draft language. Verify source images, measurements, and final wording before use.')}</p>
        </div>
      </section>
    );
  };

  return (
    <div className="reporting-workflow">
      <div className="reporting-workflow-layout">
        <main className="workflow-center-panel">
          <QuickFillButtons quickFills={schema.quickFills} onApply={applyQuickFill} activeQuickFillId={activeQuickFillId} />

          <WorkflowToolDock tools={toolItems} activeTool={activeTool} onSelect={(toolId) => setActiveTool((current) => (current === toolId ? null : toolId))} />

          {renderToolPanel()}

          <section className="workflow-card workflow-core-card">
	          <div className="section-heading">
	            <span className="eyebrow">{text('Core findings')}</span>
	            <h3>{text('Structured imaging findings')}</h3>
	          </div>
            <div className="accordion-stack">
              {imagingSections.map((section) => (
                <details className="workflow-card workflow-accordion nested-accordion" open={section.defaultOpen ?? true} key={section.id}>
	                  <summary>
	                    <span>{text(section.title)}</span>
	                  </summary>
                  <div className="workflow-form-grid">
                    {section.fields.filter((field) => isWorkflowFieldVisible(field, values)).map((field) => (
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
                <span className="eyebrow">{text('Common negatives')}</span>
                <h3>{text('Auto-derived from selected states')}</h3>
                <p>{text('Absent/normal selections are included in the draft when appropriate. Positive findings suppress contradictory negatives.')}</p>
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
          title={schema.shortTitle}
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
