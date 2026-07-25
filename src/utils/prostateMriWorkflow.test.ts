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

const schema = reportingWorkflowSchemas.prostateMri;

function negativeValues(overrides: WorkflowValues = {}): WorkflowValues {
  return {
    ...schema.defaultValues,
    clinicalIndication: 'Elevated PSA; evaluate for clinically significant prostate lesion.',
    examPurpose: 'detection and localization',
    examQuality: 'diagnostic',
    glandApMm: '36',
    glandTrMm: '48',
    glandCcMm: '42',
    prostateVolumeMl: '38',
    lesionAssessment: 'absent',
    additionalLesions: 'absent',
    extracapsularExtension: 'absent',
    neurovascularBundleInvolvement: 'absent',
    seminalVesicleInvasion: 'absent',
    bladderNeckInvasion: 'absent',
    suspiciousNodes: 'absent',
    osseousMetastases: 'absent',
    ...overrides,
  };
}

function positiveValues(overrides: WorkflowValues = {}): WorkflowValues {
  return {
    ...negativeValues(),
    lesionAssessment: 'present',
    indexLesionLocation: 'left posterolateral mid gland',
    indexLesionZone: 'peripheral zone',
    indexLesionSizeMm: '17',
    t2Description: 'Focal markedly hypointense lesion',
    diffusionDescription: 'Marked high-b-value hyperintensity',
    adcDescription: 'Marked ADC hypointensity',
    dceDescription: 'Focal early enhancement',
    userAssignedPirads: '5',
    additionalLesions: 'absent',
    extracapsularExtension: 'indeterminate',
    extracapsularExtensionDetails: 'Broad capsular contact without definite breach',
    neurovascularBundleInvolvement: 'absent',
    seminalVesicleInvasion: 'absent',
    bladderNeckInvasion: 'absent',
    suspiciousNodes: 'present',
    suspiciousNodeDetails: 'Left obturator node measuring 11 mm short axis',
    osseousMetastases: 'absent',
    ...overrides,
  };
}

describe('prostate MRI workflow', () => {
  it('refines the existing PI-RADS navigation entry into an implemented workflow', () => {
    const item = moduleNavigationTree
      .flatMap((modality) => modality.bodySystems)
      .flatMap((bodySystem) => bodySystem.workflows)
      .find((workflow) => workflow.moduleId === schema.moduleId);
    expect(item).toMatchObject({ status: 'implemented', moduleType: 'prostateMri' });
  });

  it('generates a concise negative examination', () => {
    const report = generateReportingWorkflowReport('prostateMri', negativeValues());
    expect(report.findings).toContain('No suspicious prostate lesion');
    expect(report.findings).toContain('36 × 48 × 42 mm');
    expect(report.impression).toContain('No suspicious prostate lesion');
    expect(report.recommendations).not.toMatch(/recommend(?:ed)? (?:biopsy|treatment)/i);
  });

  it('reports the index lesion, user category, sequence findings, and extension', () => {
    const report = generateReportingWorkflowReport('prostateMri', positiveValues());
    expect(report.findings).toContain('left posterolateral mid gland');
    expect(report.findings).toContain('user-assigned PI-RADS 5');
    expect(report.findings).toContain('Marked high-b-value hyperintensity');
    expect(report.findings).toContain('Extraprostatic extension is indeterminate');
    expect(report.impression).toContain('user-assigned PI-RADS 5');
    expect(report.impression).not.toContain('automatically assigned');
  });

  it('propagates limitations and preserves manual overrides', () => {
    const limited = generateReportingWorkflowReport(
      'prostateMri',
      negativeValues({
        examQuality: 'limited',
        technicalLimitations: 'Diffusion images are degraded by rectal gas artifact',
        lesionAssessment: 'not assessed',
      }),
    );
    expect(limited.technique).toContain('rectal gas artifact');
    expect(limited.findings).toContain('Limitations');
    expect(limited.impression).toContain('Limited prostate MRI');

    const overridden = generateReportingWorkflowReport(
      'prostateMri',
      negativeValues({
        findingsOverride: 'Edited prostate findings.',
        impressionOverride: 'Edited prostate impression.',
      }),
    );
    expect(overridden.findings).toBe('Edited prostate findings.');
    expect(overridden.impression).toBe('Edited prostate impression.');
  });

  it('reveals lesion and staging details only when relevant', () => {
    const fields = schema.sections.flatMap((section) => section.fields);
    const lesionLocation = fields.find((field) => field.id === 'indexLesionLocation');
    const nodeDetails = fields.find((field) => field.id === 'suspiciousNodeDetails');
    expect(isWorkflowFieldVisible(lesionLocation!, negativeValues())).toBe(false);
    expect(isWorkflowFieldVisible(lesionLocation!, positiveValues())).toBe(true);
    expect(isWorkflowFieldVisible(nodeDetails!, negativeValues())).toBe(false);
    expect(isWorkflowFieldVisible(nodeDetails!, positiveValues())).toBe(true);
  });

  it('scores complete cases and detects missing lesion or node details', () => {
    const complete = positiveValues();
    const completeScore = scoreReportCompleteness(
      'prostateMri',
      complete,
      generateReportingWorkflowReport('prostateMri', complete),
    );
    expect(completeScore.complete).toBe(completeScore.total);

    const incomplete = positiveValues({ t2Description: '', suspiciousNodeDetails: '' });
    const incompleteScore = scoreReportCompleteness(
      'prostateMri',
      incomplete,
      generateReportingWorkflowReport('prostateMri', incomplete),
    );
    expect(incompleteScore.checks.find((check) => check.label.includes('Index lesion'))?.complete).toBe(false);
    expect(incompleteScore.checks.find((check) => check.label.includes('Nodes and bone'))?.complete).toBe(false);
  });

  it('round-trips a draft through the unchanged storage contract', () => {
    const values = positiveValues();
    const report = generateReportingWorkflowReport('prostateMri', values);
    const data = new Map<string, string>();
    const storage = {
      getItem: (key: string) => data.get(key) ?? null,
      setItem: (key: string, value: string) => data.set(key, value),
    };
    const draft = createStoredWorkflowDraft({
      schema,
      values,
      report,
      activeQuickFillId: 'suspicious-index-lesion',
      now: new Date('2026-07-24T21:00:00.000Z'),
    });
    writeStoredWorkflowDraft(storage, draft);
    expect(data.has(ACTIVE_WORKFLOW_DRAFT_KEY)).toBe(true);
    expect(readStoredWorkflowDraft(storage, schema)).toEqual(draft);
  });
});
