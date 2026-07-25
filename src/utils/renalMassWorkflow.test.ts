import { describe, expect, it } from 'vitest';
import { isWorkflowFieldVisible, reportingWorkflowSchemas, type WorkflowValues } from '../data/reportingWorkflowSchemas';
import { moduleNavigationTree } from '../data/moduleNavigationTree';
import { ACTIVE_WORKFLOW_DRAFT_KEY, createStoredWorkflowDraft, readStoredWorkflowDraft, writeStoredWorkflowDraft } from '../lib/workflowDraftStorage';
import { generateReportingWorkflowReport } from './reportGenerators';
import { scoreReportCompleteness } from './qualityMetrics';

const schema = reportingWorkflowSchemas.renalMass;

function negativeValues(overrides: WorkflowValues = {}): WorkflowValues {
  return {
    ...schema.defaultValues,
    clinicalIndication: 'Characterize indeterminate renal lesion.',
    modalityProtocol: 'Multiphase renal-protocol CT',
    examQuality: 'diagnostic',
    renalMass: 'absent',
    renalSinusInvolvement: 'absent',
    collectingSystemInvolvement: 'absent',
    renalVeinThrombus: 'absent',
    ivcThrombus: 'absent',
    perinephricExtension: 'absent',
    adjacentOrganInvasion: 'absent',
    multifocalDisease: 'absent',
    suspiciousNodes: 'absent',
    distantMetastases: 'absent',
    contralateralKidney: 'No suspicious contralateral renal lesion or hydronephrosis.',
    ...overrides,
  };
}

function positiveValues(overrides: WorkflowValues = {}): WorkflowValues {
  return {
    ...negativeValues(),
    renalMass: 'present',
    laterality: 'right',
    poleLocation: 'upper pole',
    massApMm: '52',
    massTrMm: '47',
    massCcMm: '58',
    composition: 'predominantly solid',
    enhancement: 'present',
    macroscopicFat: 'absent',
    hemorrhage: 'absent',
    necrosis: 'present',
    calcification: 'absent',
    renalSinusInvolvement: 'present',
    collectingSystemInvolvement: 'indeterminate',
    renalVeinThrombus: 'present',
    renalVeinThrombusDetails: 'Enhancing tumor thrombus extends to the renal vein ostium',
    ivcThrombus: 'absent',
    perinephricExtension: 'present',
    perinephricExtensionDetails: 'Posterior perinephric soft-tissue extension',
    adjacentOrganInvasion: 'absent',
    multifocalDisease: 'absent',
    suspiciousNodes: 'present',
    suspiciousNodeDetails: 'Retroperitoneal node measuring 16 mm short axis',
    distantMetastases: 'absent',
    ...overrides,
  };
}

describe('renal mass CT/MRI workflow', () => {
  it('refines the existing renal mass navigation entry', () => {
    const item = moduleNavigationTree.flatMap((m) => m.bodySystems).flatMap((b) => b.workflows)
      .find((workflow) => workflow.moduleId === schema.moduleId);
    expect(item).toMatchObject({ status: 'implemented', moduleType: 'renalMass' });
  });

  it('generates concise negative and detailed positive reports without automatic staging', () => {
    const negative = generateReportingWorkflowReport('renalMass', negativeValues());
    expect(negative.impression).toContain('No renal mass');

    const positive = generateReportingWorkflowReport('renalMass', positiveValues());
    expect(positive.findings).toContain('52 × 47 × 58 mm');
    expect(positive.findings).toContain('Renal vein thrombus is present');
    expect(positive.impression).toContain('Enhancing tumor thrombus extends');
    expect(positive.impression).not.toMatch(/\bT[0-4]\b|\bN[0-3]\b|\bM[01]\b/);
  });

  it('supports user-assigned cystic classification without calculating it', () => {
    const report = generateReportingWorkflowReport('renalMass', positiveValues({
      composition: 'cystic',
      userAssignedBosniak: 'III',
    }));
    expect(report.findings).toContain('user-assigned Bosniak III');
    expect(report.recommendations).toContain('No Bosniak category');
  });

  it('propagates limitations and preserves overrides', () => {
    const limited = generateReportingWorkflowReport('renalMass', negativeValues({
      examQuality: 'limited',
      technicalLimitations: 'Unenhanced phase is unavailable',
      renalMass: 'indeterminate',
      laterality: 'left',
      poleLocation: 'interpolar',
      massApMm: '20',
      composition: 'indeterminate',
      enhancement: 'not assessed',
    }));
    expect(limited.findings).toContain('Limitations');
    expect(limited.impression).toContain('Limited renal mass examination');

    const overridden = generateReportingWorkflowReport('renalMass', negativeValues({
      findingsOverride: 'Edited renal findings.',
      impressionOverride: 'Edited renal impression.',
    }));
    expect(overridden.findings).toBe('Edited renal findings.');
    expect(overridden.impression).toBe('Edited renal impression.');
  });

  it('reveals lesion and thrombus detail fields conditionally', () => {
    const fields = schema.sections.flatMap((section) => section.fields);
    const side = fields.find((field) => field.id === 'laterality');
    const thrombus = fields.find((field) => field.id === 'renalVeinThrombusDetails');
    expect(isWorkflowFieldVisible(side!, negativeValues())).toBe(false);
    expect(isWorkflowFieldVisible(side!, positiveValues())).toBe(true);
    expect(isWorkflowFieldVisible(thrombus!, negativeValues())).toBe(false);
    expect(isWorkflowFieldVisible(thrombus!, positiveValues())).toBe(true);
  });

  it('scores complete cases and detects missing lesion or thrombus details', () => {
    const complete = positiveValues();
    const completeScore = scoreReportCompleteness('renalMass', complete, generateReportingWorkflowReport('renalMass', complete));
    expect(completeScore.complete).toBe(completeScore.total);

    const incomplete = positiveValues({ massApMm: '', massTrMm: '', massCcMm: '', renalVeinThrombusDetails: '' });
    const score = scoreReportCompleteness('renalMass', incomplete, generateReportingWorkflowReport('renalMass', incomplete));
    expect(score.checks.find((check) => check.label.includes('Primary renal'))?.complete).toBe(false);
    expect(score.checks.find((check) => check.label.includes('Local extension'))?.complete).toBe(false);
  });

  it('round-trips a draft through the unchanged storage contract', () => {
    const values = positiveValues();
    const report = generateReportingWorkflowReport('renalMass', values);
    const data = new Map<string, string>();
    const storage = { getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => data.set(key, value) };
    const draft = createStoredWorkflowDraft({ schema, values, report, activeQuickFillId: 'renal-mass-staging', now: new Date('2026-07-24T22:00:00.000Z') });
    writeStoredWorkflowDraft(storage, draft);
    expect(data.has(ACTIVE_WORKFLOW_DRAFT_KEY)).toBe(true);
    expect(readStoredWorkflowDraft(storage, schema)).toEqual(draft);
  });
});
