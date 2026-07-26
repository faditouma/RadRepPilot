import { describe, expect, it } from 'vitest';
import { isWorkflowFieldVisible, reportingWorkflowSchemas, type WorkflowValues } from '../data/reportingWorkflowSchemas';
import { moduleNavigationTree } from '../data/moduleNavigationTree';
import { createStoredWorkflowDraft, readStoredWorkflowDraft, writeStoredWorkflowDraft } from '../lib/workflowDraftStorage';
import { generateReportingWorkflowReport } from './reportGenerators';
import { scoreReportCompleteness } from './qualityMetrics';

const schema = reportingWorkflowSchemas.ovarianCancer;
const negative = (overrides: WorkflowValues = {}): WorkflowValues => ({
  ...schema.defaultValues, clinicalIndication: 'Initial staging of ovarian malignancy.',
  modalityProtocol: 'Contrast-enhanced CT chest/abdomen/pelvis', examQuality: 'diagnostic',
  adnexalPrimary: 'absent', ascites: 'absent', pelvicPeritoneum: 'absent', omentum: 'absent',
  upperAbdominalPeritoneum: 'absent', bowelMesentery: 'absent', abdominalWallDiaphragm: 'absent',
  suspiciousNodes: 'absent', pleuralDisease: 'absent', distantMetastases: 'absent', ...overrides,
});
const positive = (overrides: WorkflowValues = {}): WorkflowValues => negative({
  adnexalPrimary: 'present', laterality: 'bilateral', primarySite: 'right ovary',
  sizeApMm: '68', sizeTrMm: '74', sizeCcMm: '81', morphology: 'Mixed solid and cystic enhancing mass',
  solidComponents: 'Enhancing solid component measures 32 mm', contralateralAdnexa: 'Smaller left adnexal mass',
  ascites: 'present', pelvicPeritoneum: 'present', pelvicPeritoneumDetails: 'Multiple cul-de-sac implants',
  omentum: 'present', omentumDetails: 'Omental cake measuring 22 mm thick',
  upperAbdominalPeritoneum: 'present', upperAbdominalDetails: 'Right diaphragmatic implants',
  bowelMesentery: 'present', bowelMesenteryDetails: 'Multifocal small-bowel mesenteric implants without obstruction',
  abdominalWallDiaphragm: 'absent', suspiciousNodes: 'present', suspiciousNodeDetails: 'Left para-aortic node 14 mm',
  pleuralDisease: 'absent', distantMetastases: 'absent', ...overrides,
});
describe('ovarian cancer staging workflow', () => {
  it('is accessible in navigation', () => {
    const item = moduleNavigationTree.flatMap((m) => m.bodySystems).flatMap((b) => b.workflows).find((w) => w.moduleId === schema.moduleId);
    expect(item).toMatchObject({ status: 'implemented', moduleType: 'ovarianCancer' });
  });
  it('generates concise negative and compartment-based positive reports', () => {
    expect(generateReportingWorkflowReport('ovarianCancer', negative()).impression).toContain('No adnexal primary');
    const report = generateReportingWorkflowReport('ovarianCancer', positive());
    expect(report.findings).toContain('68 × 74 × 81 mm');
    expect(report.findings).toContain('Omental cake');
    expect(report.impression).toContain('Bowel or mesenteric involvement');
    expect(report.impression).not.toMatch(/FIGO [IVX0-9]/);
  });
  it('preserves user FIGO entry and propagates limitations', () => {
    expect(generateReportingWorkflowReport('ovarianCancer', positive({ userAssignedFigo: 'IIIC' })).findings).toContain('User-assigned FIGO stage: IIIC');
    const limited = generateReportingWorkflowReport('ovarianCancer', negative({ examQuality: 'limited', technicalLimitations: 'Chest not included', adnexalPrimary: 'indeterminate' }));
    expect(limited.findings).toContain('Limitations');
    expect(limited.impression).toContain('Limited ovarian cancer staging examination');
  });
  it('shows primary and compartment details conditionally', () => {
    const fields = schema.sections.flatMap((s) => s.fields);
    expect(isWorkflowFieldVisible(fields.find((f) => f.id === 'primarySite')!, negative())).toBe(false);
    expect(isWorkflowFieldVisible(fields.find((f) => f.id === 'primarySite')!, positive())).toBe(true);
    expect(isWorkflowFieldVisible(fields.find((f) => f.id === 'omentumDetails')!, positive())).toBe(true);
  });
  it('scores completeness and detects missing primary or compartment details', () => {
    const values = positive(); const report = generateReportingWorkflowReport('ovarianCancer', values);
    expect(scoreReportCompleteness('ovarianCancer', values, report).complete).toBe(scoreReportCompleteness('ovarianCancer', values, report).total);
    const bad = positive({ morphology: '', omentumDetails: '' });
    const score = scoreReportCompleteness('ovarianCancer', bad, generateReportingWorkflowReport('ovarianCancer', bad));
    expect(score.checks.find((c) => c.label.includes('Primary adnexal'))?.complete).toBe(false);
    expect(score.checks.find((c) => c.label.includes('Pelvic, omental'))?.complete).toBe(false);
  });
  it('preserves overrides and drafts', () => {
    const edited = generateReportingWorkflowReport('ovarianCancer', negative({ findingsOverride: 'Edited findings.', impressionOverride: 'Edited impression.' }));
    expect(edited.findings).toBe('Edited findings.'); expect(edited.impression).toBe('Edited impression.');
    const values = positive(); const report = generateReportingWorkflowReport('ovarianCancer', values);
    const data = new Map<string, string>(); const storage = { getItem: (k: string) => data.get(k) ?? null, setItem: (k: string, v: string) => data.set(k, v) };
    const draft = createStoredWorkflowDraft({ schema, values, report }); writeStoredWorkflowDraft(storage, draft);
    expect(readStoredWorkflowDraft(storage, schema)).toEqual(draft);
  });
});
