import { describe, expect, it } from 'vitest';
import { isWorkflowFieldVisible, reportingWorkflowSchemas, type WorkflowValues } from '../data/reportingWorkflowSchemas';
import { moduleNavigationTree } from '../data/moduleNavigationTree';
import { createStoredWorkflowDraft, readStoredWorkflowDraft, writeStoredWorkflowDraft } from '../lib/workflowDraftStorage';
import { generateReportingWorkflowReport } from './reportGenerators';
import { scoreReportCompleteness } from './qualityMetrics';

const schema = reportingWorkflowSchemas.pelvicFloorImaging;
const negative = (overrides: WorkflowValues = {}): WorkflowValues => ({
  ...schema.defaultValues, clinicalIndication: 'Obstructed defecation.', priorSurgery: 'No prior pelvic surgery',
  modalityProtocol: 'Dynamic pelvic-floor MRI', examQuality: 'diagnostic', patientEffort: 'Adequate',
  referenceLine: 'Pubococcygeal line', restHLineCm: '4.5', restMLineCm: '1.5', evacuationHLineCm: '5.5', evacuationMLineCm: '2.5',
  cystocele: 'absent', uterineVaultProlapse: 'absent', enterocele: 'absent', rectocele: 'absent',
  intussusception: 'absent', rectalProlapse: 'absent', evacuationCompleteness: 'Complete', puborectalisBehavior: 'Appropriate relaxation', ...overrides,
});
const positive = (overrides: WorkflowValues = {}): WorkflowValues => negative({
  cystocele: 'present', cystoceleDetails: 'Bladder base descends 3.2 cm below the reference line',
  rectocele: 'present', rectoceleDepthCm: '3.5', rectoceleEmptying: 'Partial with retained gel',
  evacuationCompleteness: 'Approximately 60%', ...overrides,
});

describe('pelvic floor dysfunction imaging workflow', () => {
  it('is accessible through navigation', () => {
    const item = moduleNavigationTree.flatMap((m) => m.bodySystems).flatMap((b) => b.workflows).find((w) => w.moduleId === schema.moduleId);
    expect(item).toMatchObject({ status: 'implemented', moduleType: 'pelvicFloorImaging' });
  });
  it('generates negative and multicompartment reports', () => {
    expect(generateReportingWorkflowReport('pelvicFloorImaging', negative()).impression).toContain('No dynamic pelvic-floor prolapse');
    const report = generateReportingWorkflowReport('pelvicFloorImaging', positive());
    expect(report.findings).toContain('3.5 cm deep'); expect(report.impression).toContain('Cystocele');
  });
  it('propagates limited effort without automatic category or advice', () => {
    const report = generateReportingWorkflowReport('pelvicFloorImaging', negative({ examQuality: 'limited', patientEffort: 'Limited', technicalLimitations: 'Incomplete evacuation effort' }));
    expect(report.impression).toContain('Limited dynamic pelvic-floor assessment');
    expect(report.recommendations).not.toMatch(/grade \d|recommend(?:s|ed)? (?:surgery|therapy)/i);
  });
  it('shows compartment details conditionally', () => {
    const fields = schema.sections.flatMap((s) => s.fields);
    expect(isWorkflowFieldVisible(fields.find((f) => f.id === 'cystoceleDetails')!, negative())).toBe(false);
    expect(isWorkflowFieldVisible(fields.find((f) => f.id === 'cystoceleDetails')!, positive())).toBe(true);
    expect(isWorkflowFieldVisible(fields.find((f) => f.id === 'rectoceleDepthCm')!, negative())).toBe(false);
    expect(isWorkflowFieldVisible(fields.find((f) => f.id === 'rectoceleDepthCm')!, positive())).toBe(true);
  });
  it('scores completeness and flags missing dynamic details', () => {
    const values = positive(); const report = generateReportingWorkflowReport('pelvicFloorImaging', values);
    expect(scoreReportCompleteness('pelvicFloorImaging', values, report).complete).toBe(scoreReportCompleteness('pelvicFloorImaging', values, report).total);
    const incompleteValues = positive({ referenceLine: '', rectoceleDepthCm: '', cystoceleDetails: '' });
    const scored = scoreReportCompleteness('pelvicFloorImaging', incompleteValues, generateReportingWorkflowReport('pelvicFloorImaging', incompleteValues));
    expect(scored.checks.find((c) => c.label.includes('reference line'))?.complete).toBe(false);
    expect(scored.checks.find((c) => c.label.includes('Rectocele'))?.complete).toBe(false);
  });
  it('preserves overrides, drafts, and private provenance boundaries', () => {
    const edited = generateReportingWorkflowReport('pelvicFloorImaging', negative({ findingsOverride: 'Edited findings.', impressionOverride: 'Edited impression.' }));
    expect(edited.findings).toBe('Edited findings.'); expect(edited.impression).toBe('Edited impression.');
    const values = positive(); const report = generateReportingWorkflowReport('pelvicFloorImaging', values);
    const data = new Map<string, string>(); const storage = { getItem: (k: string) => data.get(k) ?? null, setItem: (k: string, v: string) => data.set(k, v) };
    const draft = createStoredWorkflowDraft({ schema, values, report }); writeStoredWorkflowDraft(storage, draft);
    expect(readStoredWorkflowDraft(storage, schema)).toEqual(draft);
    expect(Object.values(report).join(' ')).not.toMatch(/chapter|textbook|content[_ -]pack|page\s+\d+/i);
  });
});
