import { buildFullReport } from '../../radrep/reportLogic';
import type { InsertTarget, ReportSections } from '../../radrep/types';
import { CopyButton } from '../radrep/RadRepComponents';

interface GeneratedReportPanelProps {
  title: string;
  report: ReportSections;
  onChange: (report: ReportSections) => void;
  onGenerate: () => void;
  onInsert: (target: InsertTarget, text: string) => void;
  onSaveDraft: () => void;
  onClear: () => void;
}

export function GeneratedReportPanel({
  title,
  report,
  onChange,
  onGenerate,
  onInsert,
  onSaveDraft,
  onClear,
}: GeneratedReportPanelProps) {
  const fullReport = buildFullReport(report);
  const insertTargets: Array<{ target: InsertTarget; label: string; text: string }> = [
    { target: 'indication', label: 'Indication', text: report.indication },
    { target: 'technique', label: 'Technique', text: report.technique },
    { target: 'findings', label: 'Findings', text: report.findings },
    { target: 'impression', label: 'Impression', text: report.impression },
    { target: 'incidentalFindings', label: 'Incidental Follow-up', text: report.incidentalFindings ?? '' },
    { target: 'recommendations', label: 'Recommendations', text: report.recommendations ?? '' },
    { target: 'internalNotes', label: 'Internal Notes', text: title },
  ];

  const update = (field: keyof ReportSections, value: string) => {
    onChange({ ...report, [field]: value });
  };

  return (
    <aside className="generated-report-panel">
      <div className="output-heading">
        <div>
          <span>Report draft</span>
          <h3>{title}</h3>
        </div>
        <div className="button-row">
          <CopyButton text={fullReport} label="Copy full report" />
          <CopyButton text={report.impression} label="Copy impression" />
        </div>
      </div>

      <div className="generated-report-fields">
        <label>
          Indication
          <textarea value={report.indication} onChange={(event) => update('indication', event.target.value)} />
        </label>
        <label>
          Technique
          <textarea value={report.technique} onChange={(event) => update('technique', event.target.value)} />
        </label>
        <label>
          Findings
          <textarea className="large" value={report.findings} onChange={(event) => update('findings', event.target.value)} />
        </label>
        <label>
          Impression
          <textarea className="large" value={report.impression} onChange={(event) => update('impression', event.target.value)} />
        </label>
        <label>
          Incidental findings / follow-up
          <textarea value={report.incidentalFindings ?? ''} onChange={(event) => update('incidentalFindings', event.target.value)} />
        </label>
        <label>
          Recommendations
          <textarea value={report.recommendations ?? ''} onChange={(event) => update('recommendations', event.target.value)} />
        </label>
      </div>

      <div className="button-row generated-report-actions">
        <button className="primary-button" onClick={onGenerate} type="button">
          Generate report
        </button>
        <CopyButton text={fullReport} label="Copy full report" />
        <CopyButton text={report.impression} label="Copy impression only" />
        {insertTargets.map((item) => (
          <button className="secondary-button" onClick={() => onInsert(item.target, item.text)} type="button" key={item.target}>
            Insert {item.label}
          </button>
        ))}
        <button className="secondary-button" onClick={onSaveDraft} type="button">
          Save Draft
        </button>
        <button className="ghost-button" onClick={onClear} type="button">
          Clear/reset
        </button>
      </div>
    </aside>
  );
}
