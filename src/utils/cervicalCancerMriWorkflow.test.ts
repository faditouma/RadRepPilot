import { describe, expect, it } from 'vitest';
import { isWorkflowFieldVisible, reportingWorkflowSchemas, type WorkflowValues } from '../data/reportingWorkflowSchemas';
import { moduleNavigationTree } from '../data/moduleNavigationTree';
import { createStoredWorkflowDraft, readStoredWorkflowDraft, writeStoredWorkflowDraft } from '../lib/workflowDraftStorage';
import { generateReportingWorkflowReport } from './reportGenerators';
import { scoreReportCompleteness } from './qualityMetrics';

const schema = reportingWorkflowSchemas.cervicalCancerMri;
const negative = (overrides: WorkflowValues = {}): WorkflowValues => ({
  ...schema.defaultValues,
  clinicalIndication: 'Initial staging of cervical squamous cell carcinoma.',
  modalityProtocol: 'Pelvic MRI with small-field cervical imaging and diffusion',
  examQuality: 'diagnostic',
  cervicalTumor: 'absent',
  uterineExtension: 'absent',
  vaginalInvolvement: 'absent',
  parametrialInvolvement: 'absent',
  pelvicSidewallInvolvement: 'absent',
  bladderInvasion: 'absent',
  rectalInvasion: 'absent',
  uretericObstruction: 'absent',
  pelvicNodes: 'absent',
  paraAorticNodes: 'absent',
  distantMetastases: 'absent',
  ...overrides,
});
const positive = (overrides: WorkflowValues = {}): WorkflowValues => negative({
  cervicalTumor: 'present',
  tumorEpicenter: 'posterior cervical lip',
  tumorApMm: '31',
  tumorTrMm: '39',
  tumorCcMm: '46',
  tumorMorphology: 'Intermediate T2 signal with restricted diffusion and heterogeneous enhancement',
  endocervicalCanalExtension: 'Extends 18 mm cranially within the endocervical canal',
  uterineExtension: 'absent',
  vaginalInvolvement: 'present',
  vaginalInvolvementDetails: 'Upper posterior vaginal wall involvement',
  parametrialInvolvement: 'present',
  parametrialDetails: 'Right parametrial extension without sidewall contact',
  pelvicSidewallInvolvement: 'absent',
  bladderInvasion: 'absent',
  rectalInvasion: 'absent',
  uretericObstruction: 'present',
  uretericObstructionDetails: 'Mild right hydroureteronephrosis to the distal ureter',
  pelvicNodes: 'present',
  pelvicNodeDetails: 'Right external iliac node measures 13 mm short axis',
  paraAorticNodes: 'absent',
  distantMetastases: 'absent',
  ...overrides,
});

describe('cervical cancer MRI workflow', () => {
  it('is accessible in navigation', () => {
    const item = moduleNavigationTree.flatMap((module) => module.bodySystems).flatMap((body) => body.workflows).find((workflow) => workflow.moduleId === schema.moduleId);
    expect(item).toMatchObject({ status: 'implemented', moduleType: 'cervicalCancerMri' });
  });

  it('generates concise negative and positive reports without automatic staging', () => {
    expect(generateReportingWorkflowReport('cervicalCancerMri', negative()).impression).toContain('No visible cervical tumor');
    const report = generateReportingWorkflowReport('cervicalCancerMri', positive());
    expect(report.findings).toContain('31 × 39 × 46 mm');
    expect(report.impression).toContain('Parametrial involvement');
    expect(report.impression).toContain('hydroureteronephrosis');
    expect(report.impression).not.toMatch(/FIGO [IVX0-9]/);
  });

  it('preserves user-assigned FIGO text and propagates limitations', () => {
    expect(generateReportingWorkflowReport('cervicalCancerMri', positive({ userAssignedFigo: 'IIIC1' })).findings).toContain('User-assigned FIGO stage: IIIC1');
    const limited = generateReportingWorkflowReport('cervicalCancerMri', negative({ examQuality: 'limited', technicalLimitations: 'Motion obscures the parametrium', cervicalTumor: 'indeterminate' }));
    expect(limited.findings).toContain('Limitations');
    expect(limited.impression).toContain('Limited cervical cancer MRI');
  });

  it('shows primary and local-extension details conditionally', () => {
    const fields = schema.sections.flatMap((section) => section.fields);
    expect(isWorkflowFieldVisible(fields.find((field) => field.id === 'tumorEpicenter')!, negative())).toBe(false);
    expect(isWorkflowFieldVisible(fields.find((field) => field.id === 'tumorEpicenter')!, positive())).toBe(true);
    expect(isWorkflowFieldVisible(fields.find((field) => field.id === 'parametrialDetails')!, positive())).toBe(true);
  });

  it('scores completeness and flags missing conditional details', () => {
    const values = positive();
    const report = generateReportingWorkflowReport('cervicalCancerMri', values);
    expect(scoreReportCompleteness('cervicalCancerMri', values, report).complete).toBe(scoreReportCompleteness('cervicalCancerMri', values, report).total);
    const incomplete = positive({ tumorMorphology: '', parametrialDetails: '' });
    const score = scoreReportCompleteness('cervicalCancerMri', incomplete, generateReportingWorkflowReport('cervicalCancerMri', incomplete));
    expect(score.checks.find((check) => check.label.includes('Primary cervical'))?.complete).toBe(false);
    expect(score.checks.find((check) => check.label.includes('Vaginal and parametrial'))?.complete).toBe(false);
  });

  it('preserves overrides and draft serialization/restoration', () => {
    const edited = generateReportingWorkflowReport('cervicalCancerMri', negative({ findingsOverride: 'Edited findings.', impressionOverride: 'Edited impression.' }));
    expect(edited.findings).toBe('Edited findings.');
    expect(edited.impression).toBe('Edited impression.');
    const values = positive();
    const report = generateReportingWorkflowReport('cervicalCancerMri', values);
    const data = new Map<string, string>();
    const storage = { getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => data.set(key, value) };
    const draft = createStoredWorkflowDraft({ schema, values, report });
    writeStoredWorkflowDraft(storage, draft);
    expect(readStoredWorkflowDraft(storage, schema)).toEqual(draft);
  });
});
