import { describe, expect, it } from 'vitest';
import { isWorkflowFieldVisible, reportingWorkflowSchemas, type WorkflowValues } from '../data/reportingWorkflowSchemas';
import { moduleNavigationTree } from '../data/moduleNavigationTree';
import { ACTIVE_WORKFLOW_DRAFT_KEY, createStoredWorkflowDraft, readStoredWorkflowDraft, writeStoredWorkflowDraft } from '../lib/workflowDraftStorage';
import { generateReportingWorkflowReport } from './reportGenerators';
import { scoreReportCompleteness } from './qualityMetrics';

const schema = reportingWorkflowSchemas.hccLiver;
const base = (overrides: WorkflowValues = {}): WorkflowValues => ({
  ...schema.defaultValues,
  clinicalIndication: 'Characterize liver observation in a patient at risk for HCC.',
  riskContext: 'Cirrhosis.',
  modalityProtocol: 'Multiphase liver MRI',
  examQuality: 'diagnostic',
  arterialPhaseAdequacy: 'present',
  portalVenousPhaseAdequacy: 'present',
  delayedPhaseAdequacy: 'present',
  observationStatus: 'absent',
  tumorInVein: 'absent',
  portalHypertension: 'absent',
  suspiciousNodes: 'absent',
  extrahepaticMetastases: 'absent',
  ...overrides,
});
const positive = (overrides: WorkflowValues = {}): WorkflowValues => base({
  observationStatus: 'present',
  observationNumber: 'Observation 1',
  segment: 'segment 8',
  sizeApMm: '24',
  sizeTrMm: '22',
  sizeCcMm: '26',
  treatmentStatus: 'untreated',
  arterialEnhancement: 'nonrim arterial phase hyperenhancement',
  washout: 'present',
  capsule: 'present',
  thresholdGrowth: 'absent',
  ancillaryFeatures: 'Mild diffusion restriction',
  tumorInVein: 'absent',
  portalHypertension: 'present',
  portalHypertensionDetails: 'Small paraesophageal varices and splenomegaly',
  suspiciousNodes: 'absent',
  extrahepaticMetastases: 'absent',
  ...overrides,
});

describe('HCC CT/MRI workflow', () => {
  it('refines the existing liver navigation entry', () => {
    const item = moduleNavigationTree.flatMap((m) => m.bodySystems).flatMap((b) => b.workflows).find((w) => w.moduleId === schema.moduleId);
    expect(item).toMatchObject({ status: 'implemented', moduleType: 'hccLiver' });
  });
  it('generates negative and positive reports without automatic categories', () => {
    expect(generateReportingWorkflowReport('hccLiver', base()).impression).toContain('No focal liver observation');
    const report = generateReportingWorkflowReport('hccLiver', positive());
    expect(report.findings).toContain('Observation 1 in segment 8 measures 24 × 22 × 26 mm');
    expect(report.findings).toContain('nonrim arterial phase hyperenhancement');
    expect(report.impression).not.toMatch(/LR-[1-5M]|OPTN class/i);
  });
  it('preserves user-assigned LI-RADS and OPTN values without calculating them', () => {
    const report = generateReportingWorkflowReport('hccLiver', positive({ userAssignedLirads: 'LR-5', userAssignedOptn: 'Class 5' }));
    expect(report.findings).toContain('User-assigned LI-RADS: LR-5');
    expect(report.findings).toContain('User-assigned OPTN status: Class 5');
    expect(report.recommendations).toContain('No LI-RADS, OPTN');
  });
  it('handles treated observations and technical limitations', () => {
    const treated = generateReportingWorkflowReport('hccLiver', positive({ treatmentStatus: 'treated', treatmentResponse: 'residual or recurrent masslike enhancement' }));
    expect(treated.impression).toContain('residual or recurrent masslike enhancement');
    const limited = generateReportingWorkflowReport('hccLiver', base({ examQuality: 'limited', technicalLimitations: 'Arterial phase timing is suboptimal', observationStatus: 'indeterminate' }));
    expect(limited.findings).toContain('Limitations');
    expect(limited.impression).toContain('Limited multiphase liver examination');
  });
  it('shows observation, treated-response, and vascular details conditionally', () => {
    const fields = schema.sections.flatMap((s) => s.fields);
    expect(isWorkflowFieldVisible(fields.find((f) => f.id === 'segment')!, base())).toBe(false);
    expect(isWorkflowFieldVisible(fields.find((f) => f.id === 'segment')!, positive())).toBe(true);
    expect(isWorkflowFieldVisible(fields.find((f) => f.id === 'treatmentResponse')!, positive())).toBe(false);
    expect(isWorkflowFieldVisible(fields.find((f) => f.id === 'treatmentResponse')!, positive({ treatmentStatus: 'treated' }))).toBe(true);
  });
  it('scores complete cases and detects missing observation or vascular details', () => {
    const values = positive();
    expect(scoreReportCompleteness('hccLiver', values, generateReportingWorkflowReport('hccLiver', values)).complete)
      .toBe(scoreReportCompleteness('hccLiver', values, generateReportingWorkflowReport('hccLiver', values)).total);
    const incomplete = positive({ segment: '', tumorInVein: 'present', tumorInVeinDetails: '' });
    const score = scoreReportCompleteness('hccLiver', incomplete, generateReportingWorkflowReport('hccLiver', incomplete));
    expect(score.checks.find((c) => c.label.includes('Dominant observation'))?.complete).toBe(false);
    expect(score.checks.find((c) => c.label.includes('Tumor in vein'))?.complete).toBe(false);
  });
  it('preserves overrides and round-trips drafts', () => {
    const overridden = generateReportingWorkflowReport('hccLiver', base({ findingsOverride: 'Edited findings.', impressionOverride: 'Edited impression.' }));
    expect(overridden.findings).toBe('Edited findings.');
    expect(overridden.impression).toBe('Edited impression.');
    const values = positive();
    const report = generateReportingWorkflowReport('hccLiver', values);
    const data = new Map<string, string>();
    const storage = { getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => data.set(key, value) };
    const draft = createStoredWorkflowDraft({ schema, values, report, now: new Date('2026-07-25T00:00:00Z') });
    writeStoredWorkflowDraft(storage, draft);
    expect(data.has(ACTIVE_WORKFLOW_DRAFT_KEY)).toBe(true);
    expect(readStoredWorkflowDraft(storage, schema)).toEqual(draft);
  });
});
