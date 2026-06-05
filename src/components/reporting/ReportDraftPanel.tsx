import { useState } from 'react';
import { buildFullReport } from '../../radrep/reportLogic';
import type { InsertTarget, ReportSections } from '../../radrep/types';
import { CopyButton } from '../radrep/RadRepComponents';

export interface WorkflowDraftReport extends ReportSections {
  internalNotes?: string;
}

interface ReportDraftPanelProps {
  title: string;
  report: WorkflowDraftReport;
  onChange: (report: WorkflowDraftReport) => void;
  onRegenerate: () => void;
  onInsert: (target: InsertTarget, text: string) => void;
  onSaveDraft: () => void;
  onSaveLocalDraft: () => void;
  onClear: () => void;
}

const editableSections: Array<{ field: keyof WorkflowDraftReport; label: string; large?: boolean }> = [
  { field: 'indication', label: 'Indication' },
  { field: 'technique', label: 'Technique' },
  { field: 'findings', label: 'Findings', large: true },
  { field: 'impression', label: 'Impression', large: true },
  { field: 'incidentalFindings', label: 'Incidental findings / follow-up' },
  { field: 'recommendations', label: 'Recommendations' },
];

function buildWorkflowReport(report: WorkflowDraftReport): string {
  const baseReport = buildFullReport(report);
  return [baseReport, report.internalNotes?.trim() ? `INTERNAL NOTES:\n${report.internalNotes.trim()}` : ''].filter(Boolean).join('\n\n');
}

export function ReportDraftPanel({
  title,
  report,
  onChange,
  onRegenerate,
  onInsert,
  onSaveDraft,
  onSaveLocalDraft,
  onClear,
}: ReportDraftPanelProps) {
  const [activeTab, setActiveTab] = useState<'preview' | 'edit'>('preview');
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [internalNotesOpen, setInternalNotesOpen] = useState(false);
  const fullReport = buildWorkflowReport(report);
  const insertTargets: Array<{ target: InsertTarget; label: string; text: string }> = [
    { target: 'indication', label: 'Indication', text: report.indication },
    { target: 'technique', label: 'Technique', text: report.technique },
    { target: 'findings', label: 'Findings', text: report.findings },
    { target: 'impression', label: 'Impression', text: report.impression },
    { target: 'incidentalFindings', label: 'Incidental follow-up', text: report.incidentalFindings ?? '' },
    { target: 'recommendations', label: 'Recommendations', text: report.recommendations ?? '' },
    { target: 'internalNotes', label: 'Internal notes', text: report.internalNotes ?? title },
  ];

  const update = (field: keyof WorkflowDraftReport, value: string) => {
    onChange({ ...report, [field]: value });
  };

  const previewSections = [
    { label: 'Indication', value: report.indication },
    { label: 'Technique', value: report.technique },
    { label: 'Findings', value: report.findings },
    { label: 'Impression', value: report.impression },
    { label: 'Incidental findings / follow-up', value: report.incidentalFindings },
    { label: 'Recommendations', value: report.recommendations },
  ].filter((section) => section.value?.trim());

  return (
    <aside className="generated-report-panel report-draft-panel">
      <div className="output-heading">
        <div>
          <span>Report draft</span>
          <h3>{title}</h3>
        </div>
        <button className="ghost-button compact-panel-toggle" type="button" onClick={onSaveLocalDraft}>
          Save local draft
        </button>
      </div>

      <div className="draft-tab-row" role="tablist" aria-label="Report draft view">
        <button className={activeTab === 'preview' ? 'active' : ''} onClick={() => setActiveTab('preview')} type="button">
          Preview
        </button>
        <button className={activeTab === 'edit' ? 'active' : ''} onClick={() => setActiveTab('edit')} type="button">
          Edit
        </button>
      </div>

      {activeTab === 'preview' ? (
        <div className="report-preview-sections">
          {previewSections.length ? (
            previewSections.map((section) => (
              <section key={section.label}>
                <h4>{section.label}</h4>
                <p>{section.value}</p>
              </section>
            ))
          ) : (
            <div className="inline-note">Start entering structured findings to generate a draft.</div>
          )}
        </div>
      ) : (
        <div className="generated-report-fields">
          {editableSections.map((section) => (
            <label key={section.field}>
              {section.label}
              <textarea
                className={section.large ? 'large' : undefined}
                value={String(report[section.field] ?? '')}
                onChange={(event) => update(section.field, event.target.value)}
              />
            </label>
          ))}
          <details className="internal-notes-details" open={internalNotesOpen} onToggle={(event) => setInternalNotesOpen(event.currentTarget.open)}>
            <summary>Internal notes</summary>
            <label>
              Internal notes
              <textarea value={report.internalNotes ?? ''} onChange={(event) => update('internalNotes', event.target.value)} />
            </label>
          </details>
        </div>
      )}

      <div className="button-row generated-report-actions primary-draft-actions">
        <button className="primary-button" onClick={onRegenerate} type="button">
          Regenerate from structured fields
        </button>
        <CopyButton text={fullReport} label="Copy full report" />
        <CopyButton text={report.impression} label="Copy impression" />
        <button className="secondary-button" onClick={onSaveDraft} type="button">
          Save draft
        </button>
        <button className="ghost-button" onClick={onClear} type="button">
          Reset
        </button>
      </div>

      <details className="advanced-insert-options" open={advancedOpen} onToggle={(event) => setAdvancedOpen(event.currentTarget.open)}>
        <summary>Advanced insert options</summary>
        <div className="button-row">
          {insertTargets.map((item) => (
            <button className="secondary-button" onClick={() => onInsert(item.target, item.text)} type="button" key={item.target}>
              Insert {item.label}
            </button>
          ))}
        </div>
      </details>
    </aside>
  );
}
