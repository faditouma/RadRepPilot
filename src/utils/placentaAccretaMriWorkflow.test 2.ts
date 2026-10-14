import { describe, expect, it } from 'vitest';
import { isWorkflowFieldVisible, reportingWorkflowSchemas, type WorkflowValues } from '../data/reportingWorkflowSchemas';
import { moduleNavigationTree } from '../data/moduleNavigationTree';
import { createStoredWorkflowDraft, readStoredWorkflowDraft, writeStoredWorkflowDraft } from '../lib/workflowDraftStorage';
import { generateReportingWorkflowReport } from './reportGenerators';
import { scoreReportCompleteness } from './qualityMetrics';

const schema = reportingWorkflowSchemas.placentaAccretaMri;
const negative = (overrides: WorkflowValues = {}): WorkflowValues => ({
  ...schema.defaultValues, clinicalIndication: 'Anterior low placenta; assess interface.', gestationalAge: '30 weeks',
  priorUterineSurgery: 'One prior cesarean delivery', modalityProtocol: 'Noncontrast obstetric pelvic MRI',
  examQuality: 'diagnostic', fetalOrientation: 'Cephalic', uterineOrientation: 'Dextroverted',
  placentalLocation: 'Anterior placenta clear of the internal os', placentaPrevia: 'absent',
  placentalHeterogeneity: 'absent', darkBands: 'absent', uterineBulge: 'absent',
  myometrialThinning: 'absent', myometrialInterruption: 'absent', abnormalVascularity: 'absent',
  bladderInterface: 'absent', parametrialExtension: 'absent', cervicalInvolvement: 'absent',
  extrauterineExtension: 'absent', diagnosticConfidence: 'High', ...overrides,
});
const positive = (overrides: WorkflowValues = {}): WorkflowValues => negative({
  placentalLocation: 'Anterior low placenta overlying the prior scar', placentaPrevia: 'present',
  placentalHeterogeneity: 'present', darkBands: 'present', uterineBulge: 'present',
  myometrialThinning: 'present', myometrialInterruption: 'indeterminate', abnormalVascularity: 'present',
  bladderInterface: 'indeterminate', bladderDetails: 'Marked vessels at the uterovesical interface without definite bladder-wall interruption',
  diagnosticConfidence: 'Moderate', ...overrides,
});

describe('placenta accreta spectrum MRI workflow', () => {
  it('is accessible through navigation', () => {
    const item = moduleNavigationTree.flatMap((m) => m.bodySystems).flatMap((b) => b.workflows).find((w) => w.moduleId === schema.moduleId);
    expect(item).toMatchObject({ status: 'implemented', moduleType: 'placentaAccretaMri' });
  });
  it('generates negative and confidence-controlled positive reports', () => {
    expect(generateReportingWorkflowReport('placentaAccretaMri', negative()).impression).toContain('No MRI features entered');
    const report = generateReportingWorkflowReport('placentaAccretaMri', positive());
    expect(report.findings).toContain('Dark intraplacental'); expect(report.impression).toContain('Moderate');
  });
  it('propagates limitations without automatic invasion depth or management', () => {
    const report = generateReportingWorkflowReport('placentaAccretaMri', positive({ examQuality: 'limited', technicalLimitations: 'Fetal motion degrades the bladder interface' }));
    expect(report.impression).toContain('Limited placenta accreta spectrum assessment');
    expect(report.recommendations).not.toMatch(/percreta|increta|recommend(?:s|ed)? (?:delivery|surgery)|gestational week \d/i);
  });
  it('shows interface details conditionally', () => {
    const fields = schema.sections.flatMap((s) => s.fields);
    expect(isWorkflowFieldVisible(fields.find((f) => f.id === 'bladderDetails')!, negative())).toBe(false);
    expect(isWorkflowFieldVisible(fields.find((f) => f.id === 'bladderDetails')!, positive())).toBe(true);
    expect(isWorkflowFieldVisible(fields.find((f) => f.id === 'parametrialDetails')!, negative())).toBe(false);
  });
  it('scores completeness and flags missing interface details', () => {
    const values = positive(); const report = generateReportingWorkflowReport('placentaAccretaMri', values);
    expect(scoreReportCompleteness('placentaAccretaMri', values, report).complete).toBe(scoreReportCompleteness('placentaAccretaMri', values, report).total);
    const incompleteValues = positive({ placentalLocation: '', bladderDetails: '', diagnosticConfidence: '' });
    const scored = scoreReportCompleteness('placentaAccretaMri', incompleteValues, generateReportingWorkflowReport('placentaAccretaMri', incompleteValues));
    expect(scored.checks.find((c) => c.label.includes('location'))?.complete).toBe(false);
    expect(scored.checks.find((c) => c.label.includes('Bladder'))?.complete).toBe(false);
  });
  it('preserves overrides, drafts, and private provenance boundaries', () => {
    const edited = generateReportingWorkflowReport('placentaAccretaMri', negative({ findingsOverride: 'Edited findings.', impressionOverride: 'Edited impression.' }));
    expect(edited.findings).toBe('Edited findings.'); expect(edited.impression).toBe('Edited impression.');
    const values = positive(); const report = generateReportingWorkflowReport('placentaAccretaMri', values);
    const data = new Map<string, string>(); const storage = { getItem: (k: string) => data.get(k) ?? null, setItem: (k: string, v: string) => data.set(k, v) };
    const draft = createStoredWorkflowDraft({ schema, values, report }); writeStoredWorkflowDraft(storage, draft);
    expect(readStoredWorkflowDraft(storage, schema)).toEqual(draft);
    expect(Object.values(report).join(' ')).not.toMatch(/chapter|textbook|content[_ -]pack|page\s+\d+/i);
  });
});
