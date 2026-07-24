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

const schema = reportingWorkflowSchemas.lymphomaPetCt;

function negativeValues(overrides: WorkflowValues = {}): WorkflowValues {
  return {
    ...schema.defaultValues,
    clinicalIndication: 'Initial staging of biopsy-proven lymphoma.',
    examPurpose: 'initial staging',
    examQuality: 'diagnostic',
    nodalDisease: 'absent',
    extranodalDisease: 'absent',
    spleenAssessment: 'absent',
    marrowAssessment: 'absent',
    liverAssessment: 'absent',
    newLesions: 'absent',
    ...overrides,
  };
}

function positiveValues(overrides: WorkflowValues = {}): WorkflowValues {
  return {
    ...negativeValues(),
    nodalDisease: 'present',
    nodalDistribution: 'bilateral cervical, mediastinal, and retroperitoneal nodal stations',
    dominantNodalSite: 'retroperitoneal nodal conglomerate',
    dominantNodeSizeMm: '54',
    dominantNodeSuvMax: '18.2',
    bulkyDisease: 'present',
    extranodalDisease: 'present',
    extranodalSites: 'spleen and left iliac bone',
    dominantExtranodalSite: 'left iliac bone lesion',
    dominantExtranodalSizeMm: '31',
    dominantExtranodalSuvMax: '15.6',
    spleenAssessment: 'present',
    marrowAssessment: 'indeterminate',
    liverAssessment: 'absent',
    highestUptakeSite: 'retroperitoneal nodal conglomerate',
    highestLesionSuvMax: '18.2',
    ...overrides,
  };
}

describe('lymphoma PET-CT reporting workflow', () => {
  it('is selectable through the implemented navigation tree', () => {
    const navigationWorkflow = moduleNavigationTree
      .flatMap((modality) => modality.bodySystems)
      .flatMap((bodySystem) => bodySystem.workflows)
      .find((workflow) => workflow.moduleId === schema.moduleId);

    expect(navigationWorkflow).toMatchObject({
      status: 'implemented',
      moduleType: 'lymphomaPetCt',
    });
  });

  it('generates a concise negative staging report', () => {
    const report = generateReportingWorkflowReport('lymphomaPetCt', negativeValues());

    expect(report.findings).toContain('No metabolically active nodal disease');
    expect(report.findings).toContain('No metabolically active extranodal disease');
    expect(report.impression).toContain('No metabolically active nodal or extranodal lymphoma');
    expect(report.recommendations).not.toMatch(/treat|therapy|follow-up in/i);
  });

  it('generates clinically prioritized nodal and extranodal findings', () => {
    const report = generateReportingWorkflowReport('lymphomaPetCt', positiveValues());

    expect(report.findings).toContain('bilateral cervical, mediastinal, and retroperitoneal');
    expect(report.findings).toContain('retroperitoneal nodal conglomerate, 54 mm, SUVmax 18.2');
    expect(report.findings).toContain('left iliac bone lesion, 31 mm, SUVmax 15.6');
    expect(report.impression).toContain('Metabolically active lymphoma is present');
    expect(report.impression).toContain('retroperitoneal nodal conglomerate');
  });

  it('supports descriptive response assessment without calculating a classification', () => {
    const values = positiveValues({
      examPurpose: 'end-of-treatment response assessment',
      comparisonStudy: 'PET/CT',
      comparisonDate: '2026-04-01',
      bloodPoolSuvMean: '1.8',
      liverSuvMean: '2.7',
      intervalChange: 'decreased',
      newLesions: 'absent',
      userResponseSynthesis: 'Marked partial metabolic response entered by the radiologist',
    });
    const report = generateReportingWorkflowReport('lymphomaPetCt', values);

    expect(report.findings).toContain('Reference activity: blood-pool SUVmean 1.8; liver SUVmean 2.7');
    expect(report.impression).toContain('Marked partial metabolic response entered by the radiologist');
    expect(report.impression).not.toMatch(/Deauville|Lugano|score [1-5]/i);
  });

  it('propagates technical limitations into the technique, findings, and impression', () => {
    const values = negativeValues({
      examQuality: 'limited',
      technicalLimitations: 'Diffuse muscular uptake limits assessment of small lesions',
      nodalDisease: 'not assessed',
      extranodalDisease: 'not assessed',
      spleenAssessment: 'not assessed',
      marrowAssessment: 'not assessed',
      liverAssessment: 'not assessed',
    });
    const report = generateReportingWorkflowReport('lymphomaPetCt', values);

    expect(report.technique).toContain('Technical limitations');
    expect(report.findings).toContain('Limitations');
    expect(report.impression).toContain('Limited examination');
  });

  it('shows disease-detail fields only for positive or indeterminate assessments', () => {
    const fields = schema.sections.flatMap((section) => section.fields);
    const nodalDistribution = fields.find((field) => field.id === 'nodalDistribution');
    const extranodalSites = fields.find((field) => field.id === 'extranodalSites');
    const newLesionDescription = fields.find((field) => field.id === 'newLesionDescription');

    expect(isWorkflowFieldVisible(nodalDistribution!, negativeValues())).toBe(false);
    expect(isWorkflowFieldVisible(nodalDistribution!, positiveValues())).toBe(true);
    expect(isWorkflowFieldVisible(extranodalSites!, negativeValues())).toBe(false);
    expect(isWorkflowFieldVisible(extranodalSites!, positiveValues())).toBe(true);
    expect(isWorkflowFieldVisible(newLesionDescription!, negativeValues())).toBe(false);
    expect(
      isWorkflowFieldVisible(
        newLesionDescription!,
        negativeValues({ newLesions: 'indeterminate' }),
      ),
    ).toBe(true);
  });

  it('preserves explicit findings and impression overrides', () => {
    const report = generateReportingWorkflowReport(
      'lymphomaPetCt',
      negativeValues({
        findingsOverride: 'Radiologist-edited findings.',
        impressionOverride: 'Radiologist-edited impression.',
      }),
    );

    expect(report.findings).toBe('Radiologist-edited findings.');
    expect(report.impression).toBe('Radiologist-edited impression.');
  });

  it('scores complete negative and response examinations and detects missing positive distribution', () => {
    const negative = negativeValues();
    const negativeScore = scoreReportCompleteness(
      'lymphomaPetCt',
      negative,
      generateReportingWorkflowReport('lymphomaPetCt', negative),
    );
    expect(negativeScore.complete).toBe(negativeScore.total);

    const response = positiveValues({
      examPurpose: 'interim response assessment',
      comparisonDate: '2026-04-01',
      intervalChange: 'decreased',
      newLesions: 'absent',
    });
    const responseScore = scoreReportCompleteness(
      'lymphomaPetCt',
      response,
      generateReportingWorkflowReport('lymphomaPetCt', response),
    );
    expect(responseScore.complete).toBe(responseScore.total);

    const incomplete = positiveValues({
      nodalDistribution: '',
      dominantNodalSite: '',
    });
    const incompleteScore = scoreReportCompleteness(
      'lymphomaPetCt',
      incomplete,
      generateReportingWorkflowReport('lymphomaPetCt', incomplete),
    );
    expect(
      incompleteScore.checks.find((check) => check.label.includes('Nodal disease'))?.complete,
    ).toBe(false);
  });

  it('round-trips a draft without changing the shared storage key or payload shape', () => {
    const values = positiveValues();
    const report = generateReportingWorkflowReport('lymphomaPetCt', values);
    const data = new Map<string, string>();
    const storage = {
      getItem: (key: string) => data.get(key) ?? null,
      setItem: (key: string, value: string) => data.set(key, value),
    };
    const draft = createStoredWorkflowDraft({
      schema,
      values,
      report,
      activeQuickFillId: 'active-nodal-and-extranodal-disease',
      now: new Date('2026-07-24T15:00:00.000Z'),
    });

    writeStoredWorkflowDraft(storage, draft);

    expect(data.has(ACTIVE_WORKFLOW_DRAFT_KEY)).toBe(true);
    expect(readStoredWorkflowDraft(storage, schema)).toEqual(draft);
  });
});
