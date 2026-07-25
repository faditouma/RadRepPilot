import { describe, expect, it } from 'vitest';
import {
  isWorkflowFieldVisible,
  reportingWorkflowSchemas,
  type WorkflowValues,
} from '../data/reportingWorkflowSchemas';
import { moduleNavigationTree } from '../data/moduleNavigationTree';
import {
  ACTIVE_WORKFLOW_DRAFT_KEY,
  createStoredWorkflowDraft,
  readStoredWorkflowDraft,
  writeStoredWorkflowDraft,
} from '../lib/workflowDraftStorage';
import { generateReportingWorkflowReport } from './reportGenerators';
import { scoreReportCompleteness } from './qualityMetrics';

const schema = reportingWorkflowSchemas.rectalCancerMri;

function negativeValues(overrides: WorkflowValues = {}): WorkflowValues {
  return {
    ...schema.defaultValues,
    clinicalIndication: 'Initial local staging of biopsy-proven rectal malignancy.',
    examPurpose: 'initial staging',
    examQuality: 'diagnostic',
    rectalTumor: 'absent',
    mesorectalFasciaRelationship: 'not applicable',
    sphincterInvolvement: 'absent',
    levatorInvolvement: 'absent',
    adjacentOrganInvasion: 'absent',
    emvi: 'absent',
    mesorectalNodes: 'absent',
    extramesorectalNodes: 'absent',
    tumorDeposits: 'absent',
    distantMetastases: 'absent',
    ...overrides,
  };
}

function positiveValues(overrides: WorkflowValues = {}): WorkflowValues {
  return {
    ...negativeValues(),
    rectalTumor: 'present',
    distanceFromAnalVergeCm: '5.2',
    relationToAnorectalJunction: 'above',
    craniocaudalLengthMm: '48',
    circumferentialLocation: 'semiannular',
    tumorMorphology: 'semiannular',
    extramuralDepthMm: '8',
    mesorectalFasciaRelationship: 'threatened',
    minimumMesorectalFasciaDistanceMm: '1',
    fasciaThreatSite: 'left posterolateral mesorectal fascia',
    sphincterInvolvement: 'absent',
    levatorInvolvement: 'absent',
    adjacentOrganInvasion: 'absent',
    emvi: 'present',
    emviDetails: 'Left-sided mesorectal vessel involvement',
    mesorectalNodes: 'present',
    mesorectalNodeDetails: 'Three suspicious mesorectal nodes up to 9 mm',
    extramesorectalNodes: 'absent',
    tumorDeposits: 'present',
    tumorDepositDetails: 'Single 7 mm left mesorectal deposit',
    distantMetastases: 'absent',
    ...overrides,
  };
}

describe('rectal cancer MRI workflow', () => {
  it('uses the existing navigation identity as an implemented workflow', () => {
    const navigationWorkflow = moduleNavigationTree
      .flatMap((modality) => modality.bodySystems)
      .flatMap((bodySystem) => bodySystem.workflows)
      .find((workflow) => workflow.moduleId === 'mri-rectal-cancer');

    expect(navigationWorkflow).toMatchObject({
      status: 'implemented',
      moduleType: 'rectalCancerMri',
    });
  });

  it('generates a concise negative examination', () => {
    const report = generateReportingWorkflowReport('rectalCancerMri', negativeValues());

    expect(report.findings).toContain('No visible rectal tumor');
    expect(report.findings).toContain('No sphincter, levator, adjacent-organ, EMVI');
    expect(report.impression).toContain('No visible rectal tumor');
    expect(report.impression).not.toMatch(/\bT[0-4]\b|\bN[0-3]\b|\bM[01]\b/);
  });

  it('prioritizes tumor height, mesorectal fascia, EMVI, nodes, and deposits', () => {
    const report = generateReportingWorkflowReport('rectalCancerMri', positiveValues());

    expect(report.findings).toContain('5.2 cm from the anal verge');
    expect(report.findings).toContain('48 mm craniocaudally');
    expect(report.findings).toContain('Mesorectal fascia is threatened');
    expect(report.findings).toContain('Extramural venous invasion is present');
    expect(report.impression).toContain('Mesorectal fascia threatened');
    expect(report.impression).toContain('suspicious mesorectal nodes');
  });

  it('supports descriptive post-treatment response without automatic grading', () => {
    const report = generateReportingWorkflowReport(
      'rectalCancerMri',
      positiveValues({
        examPurpose: 'post-treatment restaging',
        treatmentHistory: 'Completed neoadjuvant therapy',
        comparisonDate: '2026-05-01',
        intervalChange: 'decreased',
        userResponseSynthesis: 'Substantial treatment response entered by the radiologist',
      }),
    );

    expect(report.indication).toContain('Completed neoadjuvant therapy');
    expect(report.findings).toContain('Interval tumor change: decreased');
    expect(report.impression).toContain('Substantial treatment response entered by the radiologist');
    expect(report.impression).not.toMatch(/regression grade|mrTRG/i);
  });

  it('propagates technical limitations and preserves overrides', () => {
    const limited = generateReportingWorkflowReport(
      'rectalCancerMri',
      negativeValues({
        examQuality: 'limited',
        technicalLimitations: 'Motion degrades the high-resolution axial images',
        rectalTumor: 'indeterminate',
        distanceFromAnalVergeCm: '5',
        craniocaudalLengthMm: '30',
        circumferentialLocation: 'indeterminate',
        tumorMorphology: 'indeterminate',
      }),
    );
    expect(limited.technique).toContain('Motion degrades');
    expect(limited.findings).toContain('Limitations');
    expect(limited.impression).toContain('Limited rectal MRI');

    const overridden = generateReportingWorkflowReport(
      'rectalCancerMri',
      negativeValues({
        findingsOverride: 'Radiologist-edited rectal MRI findings.',
        impressionOverride: 'Radiologist-edited rectal MRI impression.',
      }),
    );
    expect(overridden.findings).toBe('Radiologist-edited rectal MRI findings.');
    expect(overridden.impression).toBe('Radiologist-edited rectal MRI impression.');
  });

  it('reveals tumor, fascia, and nodal details conditionally', () => {
    const fields = schema.sections.flatMap((section) => section.fields);
    const tumorLength = fields.find((field) => field.id === 'craniocaudalLengthMm');
    const fasciaSite = fields.find((field) => field.id === 'fasciaThreatSite');
    const nodeDetails = fields.find((field) => field.id === 'mesorectalNodeDetails');

    expect(isWorkflowFieldVisible(tumorLength!, negativeValues())).toBe(false);
    expect(isWorkflowFieldVisible(tumorLength!, positiveValues())).toBe(true);
    expect(isWorkflowFieldVisible(fasciaSite!, negativeValues())).toBe(false);
    expect(isWorkflowFieldVisible(fasciaSite!, positiveValues())).toBe(true);
    expect(isWorkflowFieldVisible(nodeDetails!, negativeValues())).toBe(false);
    expect(isWorkflowFieldVisible(nodeDetails!, positiveValues())).toBe(true);
  });

  it('scores complete cases and detects missing tumor or nodal details', () => {
    const complete = positiveValues();
    const completeScore = scoreReportCompleteness(
      'rectalCancerMri',
      complete,
      generateReportingWorkflowReport('rectalCancerMri', complete),
    );
    expect(completeScore.complete).toBe(completeScore.total);

    const incomplete = positiveValues({
      distanceFromAnalVergeCm: '',
      mesorectalNodeDetails: '',
    });
    const incompleteScore = scoreReportCompleteness(
      'rectalCancerMri',
      incomplete,
      generateReportingWorkflowReport('rectalCancerMri', incomplete),
    );
    expect(
      incompleteScore.checks.find((check) => check.label.includes('Primary tumor'))?.complete,
    ).toBe(false);
    expect(
      incompleteScore.checks.find((check) => check.label.includes('EMVI'))?.complete,
    ).toBe(false);
  });

  it('round-trips a draft through the unchanged storage contract', () => {
    const values = positiveValues();
    const report = generateReportingWorkflowReport('rectalCancerMri', values);
    const data = new Map<string, string>();
    const storage = {
      getItem: (key: string) => data.get(key) ?? null,
      setItem: (key: string, value: string) => data.set(key, value),
    };
    const draft = createStoredWorkflowDraft({
      schema,
      values,
      report,
      activeQuickFillId: 'rectal-tumor-staging',
      now: new Date('2026-07-24T19:00:00.000Z'),
    });

    writeStoredWorkflowDraft(storage, draft);
    expect(data.has(ACTIVE_WORKFLOW_DRAFT_KEY)).toBe(true);
    expect(readStoredWorkflowDraft(storage, schema)).toEqual(draft);
  });
});
