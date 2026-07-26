import { describe, expect, it } from 'vitest';
import { isWorkflowFieldVisible, reportingWorkflowSchemas, type WorkflowValues } from '../data/reportingWorkflowSchemas';
import { moduleNavigationTree } from '../data/moduleNavigationTree';
import { createStoredWorkflowDraft, readStoredWorkflowDraft, writeStoredWorkflowDraft } from '../lib/workflowDraftStorage';
import { generateReportingWorkflowReport } from './reportGenerators';
import { scoreReportCompleteness } from './qualityMetrics';

const schema = reportingWorkflowSchemas.endometrialCancerMri;
const negative = (overrides: WorkflowValues = {}): WorkflowValues => ({
  ...schema.defaultValues,
  clinicalIndication: 'Initial staging of biopsy-proven endometrial carcinoma.',
  modalityProtocol: 'Pelvic MRI with diffusion and postcontrast imaging',
  examQuality: 'diagnostic',
  uterineTumor: 'absent',
  myometrialInvasion: 'absent',
  cervicalStromalInvasion: 'absent',
  serosalExtension: 'absent',
  adnexalExtension: 'absent',
  vaginalExtension: 'absent',
  parametrialExtension: 'absent',
  bladderRectalInvasion: 'absent',
  pelvicNodes: 'absent',
  paraAorticNodes: 'absent',
  distantMetastases: 'absent',
  ...overrides,
});
const positive = (overrides: WorkflowValues = {}): WorkflowValues => negative({
  uterineTumor: 'present',
  tumorLocation: 'posterior uterine corpus',
  tumorApMm: '28',
  tumorTrMm: '35',
  tumorCcMm: '42',
  tumorMorphology: 'Intermediate T2 signal with restricted diffusion and heterogeneous enhancement',
  myometrialInvasion: 'present',
  myometrialInvasionDetails: 'Estimated outer-half invasion at the posterior corpus',
  cervicalStromalInvasion: 'present',
  cervicalStromalDetails: 'Focal posterior cervical stromal extension',
  serosalExtension: 'absent',
  adnexalExtension: 'absent',
  vaginalExtension: 'absent',
  parametrialExtension: 'absent',
  bladderRectalInvasion: 'absent',
  pelvicNodes: 'present',
  pelvicNodeDetails: 'Right obturator node measures 12 mm short axis',
  paraAorticNodes: 'absent',
  distantMetastases: 'absent',
  ...overrides,
});

describe('endometrial cancer MRI workflow', () => {
  it('is accessible in navigation', () => {
    const item = moduleNavigationTree.flatMap((m) => m.bodySystems).flatMap((b) => b.workflows).find((w) => w.moduleId === schema.moduleId);
    expect(item).toMatchObject({ status: 'implemented', moduleType: 'endometrialCancerMri' });
  });

  it('generates concise negative and positive reports without automatic staging', () => {
    expect(generateReportingWorkflowReport('endometrialCancerMri', negative()).impression).toContain('No visible endometrial tumor');
    const report = generateReportingWorkflowReport('endometrialCancerMri', positive());
    expect(report.findings).toContain('28 × 35 × 42 mm');
    expect(report.impression).toContain('Myometrial invasion');
    expect(report.impression).toContain('Right obturator node');
    expect(report.impression).not.toMatch(/FIGO [IVX0-9]/);
  });

  it('preserves user-assigned FIGO text and propagates limitations', () => {
    expect(generateReportingWorkflowReport('endometrialCancerMri', positive({ userAssignedFigo: 'IIIC1' })).findings).toContain('User-assigned FIGO stage: IIIC1');
    const limited = generateReportingWorkflowReport('endometrialCancerMri', negative({ examQuality: 'limited', technicalLimitations: 'Severe motion', uterineTumor: 'indeterminate' }));
    expect(limited.findings).toContain('Limitations');
    expect(limited.impression).toContain('Limited endometrial cancer MRI');
  });

  it('shows tumor and extension detail fields conditionally', () => {
    const fields = schema.sections.flatMap((section) => section.fields);
    expect(isWorkflowFieldVisible(fields.find((field) => field.id === 'tumorLocation')!, negative())).toBe(false);
    expect(isWorkflowFieldVisible(fields.find((field) => field.id === 'tumorLocation')!, positive())).toBe(true);
    expect(isWorkflowFieldVisible(fields.find((field) => field.id === 'pelvicNodeDetails')!, positive())).toBe(true);
  });

  it('scores completeness and flags missing conditional details', () => {
    const values = positive();
    const report = generateReportingWorkflowReport('endometrialCancerMri', values);
    expect(scoreReportCompleteness('endometrialCancerMri', values, report).complete).toBe(scoreReportCompleteness('endometrialCancerMri', values, report).total);
    const incomplete = positive({ tumorMorphology: '', myometrialInvasionDetails: '' });
    const score = scoreReportCompleteness('endometrialCancerMri', incomplete, generateReportingWorkflowReport('endometrialCancerMri', incomplete));
    expect(score.checks.find((check) => check.label.includes('Primary uterine'))?.complete).toBe(false);
    expect(score.checks.find((check) => check.label.includes('Myometrial'))?.complete).toBe(false);
  });

  it('preserves overrides and draft serialization/restoration', () => {
    const edited = generateReportingWorkflowReport('endometrialCancerMri', negative({ findingsOverride: 'Edited findings.', impressionOverride: 'Edited impression.' }));
    expect(edited.findings).toBe('Edited findings.');
    expect(edited.impression).toBe('Edited impression.');
    const values = positive();
    const report = generateReportingWorkflowReport('endometrialCancerMri', values);
    const data = new Map<string, string>();
    const storage = { getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => data.set(key, value) };
    const draft = createStoredWorkflowDraft({ schema, values, report });
    writeStoredWorkflowDraft(storage, draft);
    expect(readStoredWorkflowDraft(storage, schema)).toEqual(draft);
  });
});
