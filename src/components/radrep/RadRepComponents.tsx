import { useEffect, useState, type ReactNode } from 'react';
import { buildFullReport } from '../../radrep/reportLogic';
import type { DraftType, ModuleType, PageKey, ReportSections, SavedDraft } from '../../radrep/types';
import { RadRepPilotLogo } from '../branding/RadRepPilotLogo';
import { RadIcon, type RadIconName } from '../icons/RadIcon';

const navItems: Array<{ key: PageKey; label: string; description: string; iconName: RadIconName }> = [
  { key: 'dashboard', label: 'Dashboard', description: 'Overview', iconName: 'dashboard' },
  { key: 'modules', label: 'Radiology Reporting', description: 'Structured workflows', iconName: 'xray' },
  { key: 'calculators', label: 'Guidelines & Calculators', description: 'Decision support', iconName: 'calculator' },
  { key: 'builder', label: 'Report Builder', description: 'Assemble final draft', iconName: 'report' },
  { key: 'referral', label: 'Primary Care Imaging Requests', description: 'Clearer handoffs', iconName: 'primaryCare' },
  { key: 'why', label: 'Why This Matters', description: 'Clinical insight', iconName: 'helper' },
  { key: 'gallery', label: 'Example Outputs', description: 'Reports and requisitions', iconName: 'followUp' },
  { key: 'drafts', label: 'Saved Drafts', description: 'Local browser storage', iconName: 'savedDrafts' },
  { key: 'safety', label: 'About / Safety', description: 'Scope and limits', iconName: 'safety' },
];

const moduleLabels: Record<DraftType, string> = {
  ctpa: 'CTPA Pulmonary Embolism',
  nodule: 'Pulmonary Nodule / Fleischner',
  stroke: 'CT Head Stroke / ASPECTS',
  appendicitis: 'CT Abdomen/Pelvis: Appendicitis',
  bowelObstruction: 'CT Abdomen/Pelvis: Bowel Obstruction',
  renalColic: 'CT KUB: Renal Colic',
  ruqUltrasound: 'RUQ Ultrasound: Biliary Colic / Cholecystitis',
  dvtUltrasound: 'Lower-Limb Venous Ultrasound: DVT',
  builder: 'Report Builder',
  referral: 'Primary Care Imaging Request',
  calculator: 'Calculator Sentence',
  incidental: 'Incidental Finding Sentence',
  rads: 'RADS / Classification Preview',
};

interface SidebarProps {
  activePage: PageKey;
  onNavigate: (page: PageKey) => void;
}

export function Sidebar({ activePage, onNavigate }: SidebarProps) {
  return (
    <aside className="sidebar" aria-label="RadRepPilot navigation">
      <div className="sidebar-brand">
        <RadRepPilotLogo variant="iconOnly" size={40} />
        <div className="sidebar-brand-copy">
          <strong>RadRepPilot</strong>
          <small>Clinical workflow prototype</small>
        </div>
      </div>
      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <button
            className={activePage === item.key ? 'active' : ''}
            key={item.key}
            onClick={() => onNavigate(item.key)}
            type="button"
          >
            <RadIcon name={item.iconName} size={21} />
            <span>{item.label}</span>
            <small>{item.description}</small>
          </button>
        ))}
      </nav>
      <div className="sidebar-note">
        <strong>No PHI.</strong>
        <span>Prototype only. Verify before clinical use.</span>
      </div>
    </aside>
  );
}

export function BrandMark({ large = false }: { large?: boolean }) {
  return <RadRepPilotLogo variant={large ? 'full' : 'iconOnly'} size={large ? 56 : 40} showText={large} />;
}

export function SafetyBanner() {
  return (
    <section className="safety-banner" aria-label="Safety disclaimer">
      <strong>Prototype only. Do not enter patient-identifying information.</strong>
      <span>
        User-entered findings only. RadRepPilot does not interpret images, diagnose, or replace radiologist review. Verify all
        guideline applicability and final wording.
      </span>
    </section>
  );
}

interface ModuleCardProps {
  title: string;
  description: string;
  meta: string;
  iconName?: RadIconName;
  onOpen: () => void;
  ctaLabel?: string;
}

export function ModuleCard({ title, description, meta, iconName = 'report', onOpen, ctaLabel = 'Open' }: ModuleCardProps) {
  return (
    <article className="module-card">
      <div className="module-card-topline">
        <span className="module-card-icon" aria-hidden="true">
          <RadIcon name={iconName} size={24} />
        </span>
        <span>{meta}</span>
      </div>
      <h3>{title}</h3>
      <p>{description}</p>
      <button className="secondary-button" onClick={onOpen} type="button">
        {ctaLabel}
      </button>
    </article>
  );
}

interface FormSectionProps {
  title: string;
  description?: string;
  children: ReactNode;
}

export function FormSection({ title, description, children }: FormSectionProps) {
  return (
    <section className="form-section">
      <div className="section-heading">
        <h3>{title}</h3>
        {description ? <p>{description}</p> : null}
      </div>
      <div className="form-grid">{children}</div>
    </section>
  );
}

interface CopyButtonProps {
  text: string;
  label?: string;
  className?: string;
}

export function CopyButton({ text, label = 'Copy', className = 'secondary-button' }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timeout = window.setTimeout(() => setCopied(false), 1600);
    return () => window.clearTimeout(timeout);
  }, [copied]);

  const copyText = async () => {
    if (!text.trim()) return;
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
    } else {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      textarea.remove();
    }
    setCopied(true);
    window.dispatchEvent(new CustomEvent('radreppilot-toast', { detail: 'Copied' }));
  };

  return (
    <button className={className} onClick={copyText} type="button">
      {copied ? 'Copied' : label}
    </button>
  );
}

interface OutputPanelProps {
  title: string;
  report: ReportSections;
  onChange: (report: ReportSections) => void;
  onSendToBuilder?: () => void;
  onSaveDraft?: () => void;
}

export function OutputPanel({ title, report, onChange, onSendToBuilder, onSaveDraft }: OutputPanelProps) {
  const fullReport = buildFullReport(report);

  const update = (field: keyof ReportSections, value: string) => {
    onChange({ ...report, [field]: value });
  };

  return (
    <aside className="output-panel">
      <div className="output-heading">
        <div>
          <span>Editable output</span>
          <h3>{title}</h3>
        </div>
        <div className="button-row">
          <CopyButton text={fullReport} label="Copy report" />
          <CopyButton text={report.impression} label="Copy impression" />
        </div>
      </div>

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
        <textarea
          value={report.incidentalFindings ?? ''}
          onChange={(event) => update('incidentalFindings', event.target.value)}
        />
      </label>
      <label>
        Recommendations
        <textarea
          value={report.recommendations ?? ''}
          onChange={(event) => update('recommendations', event.target.value)}
        />
      </label>

      <div className="button-row">
        {onSendToBuilder ? (
          <button className="primary-button" onClick={onSendToBuilder} type="button">
            Send to builder
          </button>
        ) : null}
        {onSaveDraft ? (
          <button className="secondary-button" onClick={onSaveDraft} type="button">
            Save draft
          </button>
        ) : null}
      </div>
    </aside>
  );
}

interface CalculatorCardProps {
  title: string;
  description: string;
  status?: 'Ready' | 'Coming soon';
  children?: ReactNode;
}

export function CalculatorCard({ title, description, status = 'Ready', children }: CalculatorCardProps) {
  return (
    <article className={`calculator-card ${status === 'Coming soon' ? 'placeholder-card' : ''}`}>
      <div className="calculator-heading">
        <div>
          <span>{status}</span>
          <h3>{title}</h3>
        </div>
      </div>
      <p>{description}</p>
      {children ? <div className="calculator-body">{children}</div> : null}
    </article>
  );
}

interface SavedDraftListProps {
  drafts: SavedDraft[];
  onOpen: (draft: SavedDraft) => void;
  onDelete: (id: string) => void;
}

export function SavedDraftList({ drafts, onOpen, onDelete }: SavedDraftListProps) {
  if (drafts.length === 0) {
    return (
      <div className="empty-state">
        <h3>No saved drafts yet</h3>
        <p>Generated reports and builder drafts saved from this prototype will appear here in local browser storage.</p>
      </div>
    );
  }

  return (
    <div className="draft-list">
      {drafts.map((draft) => (
        <article className="draft-card" key={draft.id}>
          <div>
            <span>{draft.category ?? moduleLabels[draft.moduleType]}</span>
            <h3>{draft.title}</h3>
            <p>{new Date(draft.dateTime).toLocaleString()}</p>
          </div>
          <p className="draft-preview">{draft.impression || 'No impression saved.'}</p>
          <div className="button-row">
            <button className="primary-button" onClick={() => onOpen(draft)} type="button">
              Open draft
            </button>
            <CopyButton text={draft.reportText} label="Copy report" />
            <button className="danger-button" onClick={() => onDelete(draft.id)} type="button">
              Delete
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}
