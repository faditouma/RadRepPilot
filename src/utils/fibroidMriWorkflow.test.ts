import { describe, expect, it } from 'vitest';
import { isWorkflowFieldVisible, reportingWorkflowSchemas, type WorkflowValues } from '../data/reportingWorkflowSchemas';
import { moduleNavigationTree } from '../data/moduleNavigationTree';
import { createStoredWorkflowDraft, readStoredWorkflowDraft, writeStoredWorkflowDraft } from '../lib/workflowDraftStorage';
import { generateReportingWorkflowReport } from './reportGenerators';
import { scoreReportCompleteness } from './qualityMetrics';

const schema = reportingWorkflowSchemas.fibroidMri;
const negative = (overrides: WorkflowValues = {}): WorkflowValues => ({
  ...schema.defaultValues, clinicalIndication: 'Heavy menstrual bleeding.', treatmentHistory: 'No prior treatment',
  modalityProtocol: 'Pelvic MRI before and after contrast', examQuality: 'diagnostic',
  uterusApMm: '45', uterusTrMm: '55', uterusCcMm: '80', uterineOrientation: 'Anteverted',
  fibroidBurden: 'No fibroids', dominantFibroid: 'absent', pedunculated: 'absent',
  adenomyosis: 'absent', endometrium: 'Normal thickness and contour', ovariesAdnexa: 'Normal', ...overrides,
});
const positive = (overrides: WorkflowValues = {}): WorkflowValues => negative({
  fibroidBurden: 'Multiple fibroids', dominantFibroid: 'present', fibroidIdentifier: 'Fibroid 1',
  fibroidLocation: 'Anterior uterine body', fibroidApMm: '42', fibroidTrMm: '48', fibroidCcMm: '51',
  endometrialRelationship: 'Contacts and displaces the endometrium', serosalRelationship: 'Less than 50% exophytic',
  pedunculated: 'absent', enhancement: 'Heterogeneous avid enhancement', degeneration: 'Small cystic areas',
  diffusion: 'No marked restriction', hemorrhageCalcification: 'Absent', ...overrides,
});

describe('fibroid MRI workflow', () => {
  it('is accessible through MRI navigation', () => {
    const item = moduleNavigationTree.flatMap((m) => m.bodySystems).flatMap((b) => b.workflows).find((w) => w.moduleId === schema.moduleId);
    expect(item).toMatchObject({ status: 'implemented', moduleType: 'fibroidMri' });
  });
  it('generates negative and mapped positive reports', () => {
    expect(generateReportingWorkflowReport('fibroidMri', negative()).impression).toContain('No uterine fibroid');
    const report = generateReportingWorkflowReport('fibroidMri', positive());
    expect(report.findings).toContain('42 × 48 × 51 mm'); expect(report.findings).toContain('displaces the endometrium');
  });
  it('propagates limitations and user type without automatic advice', () => {
    const report = generateReportingWorkflowReport('fibroidMri', positive({ examQuality: 'limited', technicalLimitations: 'Motion degrades diffusion imaging', userAssignedFigoType: 'User type 3' }));
    expect(report.impression).toContain('Limited fibroid characterization'); expect(report.findings).toContain('User-entered FIGO type');
    expect(report.recommendations).not.toMatch(/eligible|recommend(?:s|ed)? (?:embolization|surgery)|FIGO type \d/i);
  });
  it('shows dominant lesion and stalk details conditionally', () => {
    const fields = schema.sections.flatMap((s) => s.fields);
    expect(isWorkflowFieldVisible(fields.find((f) => f.id === 'fibroidLocation')!, negative())).toBe(false);
    expect(isWorkflowFieldVisible(fields.find((f) => f.id === 'fibroidLocation')!, positive())).toBe(true);
    expect(isWorkflowFieldVisible(fields.find((f) => f.id === 'stalkDetails')!, positive())).toBe(false);
    expect(isWorkflowFieldVisible(fields.find((f) => f.id === 'stalkDetails')!, positive({ pedunculated: 'present' }))).toBe(true);
  });
  it('scores completeness and flags missing relationships', () => {
    const values = positive(); const report = generateReportingWorkflowReport('fibroidMri', values);
    expect(scoreReportCompleteness('fibroidMri', values, report).complete).toBe(scoreReportCompleteness('fibroidMri', values, report).total);
    const incompleteValues = positive({ fibroidLocation: '', endometrialRelationship: '', enhancement: '' });
    expect(scoreReportCompleteness('fibroidMri', incompleteValues, generateReportingWorkflowReport('fibroidMri', incompleteValues)).checks.find((c) => c.label.includes('Dominant fibroid'))?.complete).toBe(false);
  });
  it('preserves overrides, drafts, and private provenance boundaries', () => {
    const edited = generateReportingWorkflowReport('fibroidMri', negative({ findingsOverride: 'Edited findings.', impressionOverride: 'Edited impression.' }));
    expect(edited.findings).toBe('Edited findings.'); expect(edited.impression).toBe('Edited impression.');
    const values = positive(); const report = generateReportingWorkflowReport('fibroidMri', values);
    const data = new Map<string, string>(); const storage = { getItem: (k: string) => data.get(k) ?? null, setItem: (k: string, v: string) => data.set(k, v) };
    const draft = createStoredWorkflowDraft({ schema, values, report }); writeStoredWorkflowDraft(storage, draft);
    expect(readStoredWorkflowDraft(storage, schema)).toEqual(draft);
    expect(Object.values(report).join(' ')).not.toMatch(/chapter|textbook|content[_ -]pack|page\s+\d+/i);
  });
});
