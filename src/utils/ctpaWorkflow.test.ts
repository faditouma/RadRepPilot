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

const schema = reportingWorkflowSchemas.ctpa;

function diagnosticNegativeValues(overrides: WorkflowValues = {}): WorkflowValues {
  return {
    ...schema.defaultValues,
    clinicalIndication: 'Pleuritic chest pain and elevated D-dimer.',
    contrastOpacification: 'adequate',
    examQuality: 'diagnostic',
    respiratoryMotion: 'absent',
    bolusTimingArtifact: 'absent',
    pePresent: 'absent',
    rightHeartSynthesis: 'no-associated-findings',
    pulmonaryInfarct: 'absent',
    pleuralEffusion: 'none',
    atelectaticConsolidativeOpacity: 'absent',
    pneumothorax: 'absent',
    ...overrides,
  };
}

function positiveValues(appearance: string): WorkflowValues {
  return diagnosticNegativeValues({
    pePresent: 'present',
    embolusAppearance: appearance,
    laterality: 'bilateral',
    proximalLevel: 'lobar',
    involvedBranches: 'right upper-lobe and bilateral lower-lobe arterial branches',
    occlusion: 'mixed',
    rightHeartSynthesis: 'associated-findings-present',
    rvDiameterMm: '45',
    lvDiameterMm: '35',
    pulmonaryInfarct: 'present',
    communicationStatus: 'occurred',
    communicationRecipient: 'Emergency physician',
    communicationDate: '2026-07-24',
    communicationTime: '14:35',
    communicationMethod: 'telephone',
  });
}

describe('CTPA reporting workflow', () => {
  it('generates a concise diagnostic negative examination', () => {
    const report = generateReportingWorkflowReport('ctpa', diagnosticNegativeValues());

    expect(report.findings).toContain('No pulmonary embolism identified.');
    expect(report.impression).toContain('No pulmonary embolism identified.');
    expect(report.impression).toContain('No CT findings entered that are associated with right-heart strain.');
    expect(report.findings).not.toContain('Pulmonary infarction is absent');
  });

  it('generates bilateral acute pulmonary embolism with user-controlled right-heart synthesis', () => {
    const report = generateReportingWorkflowReport('ctpa', positiveValues('acute'));

    expect(report.impression).toContain('Acute pulmonary embolism');
    expect(report.impression).toContain('bilaterally');
    expect(report.impression).toContain('CT findings that may be associated with right-heart strain');
    expect(report.impression).toContain('Pulmonary infarction.');
    expect(report.findings).toContain('RV/LV ratio 1.29 (calculated)');
    expect(report.recommendations).toContain('Emergency physician via telephone on 2026-07-24 at 14:35');
  });

  it('does not diagnose right-heart strain from an elevated RV/LV ratio alone', () => {
    const values = positiveValues('acute');
    values.rightHeartSynthesis = '';
    const report = generateReportingWorkflowReport('ctpa', values);

    expect(report.findings).toContain('RV/LV ratio 1.29 (calculated)');
    expect(report.impression).not.toContain('right-heart strain');
  });

  it.each([
    ['chronic', 'Chronic thromboembolic disease'],
    ['acute-on-chronic', 'Acute-on-chronic pulmonary embolic disease'],
  ])('generates %s embolic disease language', (appearance, expected) => {
    const report = generateReportingWorkflowReport('ctpa', positiveValues(appearance));
    expect(report.impression).toContain(expected);
  });

  it('generates an indeterminate distal filling-defect impression without claiming PE', () => {
    const values = diagnosticNegativeValues({
      pePresent: 'indeterminate',
      indeterminateLevel: 'subsegmental',
      indeterminateLocation: 'tiny left lower-lobe distal filling defect versus motion artifact',
      rightHeartSynthesis: 'not assessed',
      communicationStatus: 'not-documented',
    });
    const report = generateReportingWorkflowReport('ctpa', values);

    expect(report.impression).toContain('Indeterminate subsegmental filling defect');
    expect(report.impression).not.toContain('Acute pulmonary embolism');
    expect(report.recommendations).toContain('Critical-result communication prompt');
  });

  it('propagates a technically limited examination into findings and impression', () => {
    const values = diagnosticNegativeValues({
      contrastOpacification: 'suboptimal',
      examQuality: 'limited',
      respiratoryMotion: 'moderate',
      bolusTimingArtifact: 'present',
      pePresent: 'absent',
      otherTechnicalLimitations: 'Distal segmental arteries are incompletely assessed',
    });
    const report = generateReportingWorkflowReport('ctpa', values);

    expect(report.findings).toContain('Limitations:');
    expect(report.impression).toContain('Limited examination');
    expect(report.impression).toContain('suboptimal pulmonary arterial opacification');
    expect(report.impression).toContain('technically evaluable pulmonary arteries');
  });

  it('generates a nondiagnostic examination without asserting a negative study', () => {
    const values = diagnosticNegativeValues({
      contrastOpacification: 'poor',
      examQuality: 'nondiagnostic',
      respiratoryMotion: 'severe',
      pePresent: 'not-adequately-assessed',
      rightHeartSynthesis: 'not assessed',
      communicationStatus: 'not-documented',
    });
    const report = generateReportingWorkflowReport('ctpa', values);

    expect(report.impression).toContain('Pulmonary embolism cannot be adequately assessed');
    expect(report.impression).toContain('Nondiagnostic examination');
    expect(report.impression).not.toContain('No pulmonary embolism identified.');
  });

  it('preserves explicit findings and impression overrides', () => {
    const values = diagnosticNegativeValues({
      findingsOverride: 'User-entered findings override.',
      impressionOverride: 'User-entered impression override.',
    });
    const report = generateReportingWorkflowReport('ctpa', values);

    expect(report.findings).toBe('User-entered findings override.');
    expect(report.impression).toBe('User-entered impression override.');
  });

  it('shows positive-embolism and communication details only when relevant', () => {
    const embolusAppearance = schema.sections
      .flatMap((section) => section.fields)
      .find((field) => field.id === 'embolusAppearance');
    const communicationRecipient = schema.sections
      .flatMap((section) => section.fields)
      .find((field) => field.id === 'communicationRecipient');

    expect(embolusAppearance).toBeDefined();
    expect(communicationRecipient).toBeDefined();
    expect(isWorkflowFieldVisible(embolusAppearance!, diagnosticNegativeValues())).toBe(false);
    expect(isWorkflowFieldVisible(embolusAppearance!, positiveValues('acute'))).toBe(true);
    expect(isWorkflowFieldVisible(communicationRecipient!, diagnosticNegativeValues())).toBe(false);
    expect(
      isWorkflowFieldVisible(
        communicationRecipient!,
        diagnosticNegativeValues({ communicationStatus: 'occurred' }),
      ),
    ).toBe(true);
  });

  it('scores a complete diagnostic negative workflow and detects missing positive distribution', () => {
    const completeValues = diagnosticNegativeValues();
    const completeReport = generateReportingWorkflowReport('ctpa', completeValues);
    const completeScore = scoreReportCompleteness('ctpa', completeValues, completeReport);
    expect(completeScore.complete).toBe(completeScore.total);

    const incompleteValues = diagnosticNegativeValues({
      pePresent: 'present',
      embolusAppearance: 'acute',
      laterality: '',
      proximalLevel: '',
      involvedBranches: '',
      communicationStatus: '',
    });
    const incompleteReport = generateReportingWorkflowReport('ctpa', incompleteValues);
    const incompleteScore = scoreReportCompleteness('ctpa', incompleteValues, incompleteReport);
    expect(incompleteScore.checks.find((check) => check.label.includes('PE assessment'))?.complete).toBe(false);
    expect(incompleteScore.checks.find((check) => check.label.includes('communication'))?.complete).toBe(false);
  });

  it('round-trips the active CTPA draft through the existing local-storage key', () => {
    const values = positiveValues('acute');
    const report = generateReportingWorkflowReport('ctpa', values);
    const data = new Map<string, string>();
    const storage = {
      getItem: (key: string) => data.get(key) ?? null,
      setItem: (key: string, value: string) => {
        data.set(key, value);
      },
    };
    const draft = createStoredWorkflowDraft({
      schema,
      values,
      report,
      activeQuickFillId: 'bilateral-acute-pe',
      now: new Date('2026-07-24T18:35:00.000Z'),
    });

    writeStoredWorkflowDraft(storage, draft);
    expect(data.has(ACTIVE_WORKFLOW_DRAFT_KEY)).toBe(true);
    expect(readStoredWorkflowDraft(storage, schema)).toEqual(draft);
  });

  it('keeps every existing schema-driven reporting workflow loadable', () => {
    for (const moduleType of Object.keys(reportingWorkflowSchemas) as Array<
      keyof typeof reportingWorkflowSchemas
    >) {
      const workflowSchema = reportingWorkflowSchemas[moduleType];
      expect(() =>
        generateReportingWorkflowReport(moduleType, workflowSchema.defaultValues),
      ).not.toThrow();
    }
  });

  it('keeps private development-reference identifiers out of visible workflow content and reports', () => {
    const visibleSchemaContent = Object.values(reportingWorkflowSchemas).flatMap((workflowSchema) => [
      workflowSchema.title,
      workflowSchema.shortTitle,
      workflowSchema.clinicalQuestion,
      workflowSchema.techniqueDefault,
      workflowSchema.safetyNote,
      ...workflowSchema.badges,
      ...workflowSchema.sections.flatMap((section) => [
        section.title,
        section.description ?? '',
        ...section.fields.flatMap((field) => [
          field.label,
          field.placeholder ?? '',
          ...(field.options ?? []).map((option) => option.label),
        ]),
      ]),
      ...workflowSchema.quickFills.flatMap((quickFill) => [
        quickFill.label,
        quickFill.description,
      ]),
      ...workflowSchema.incidentalOptions.flatMap((option) => [
        option.label,
        option.sentence,
      ]),
    ]);
    const generatedReports = Object.entries(reportingWorkflowSchemas).flatMap(
      ([moduleType, workflowSchema]) =>
        Object.values(
          generateReportingWorkflowReport(
            moduleType as keyof typeof reportingWorkflowSchemas,
            workflowSchema.defaultValues,
          ),
        ).filter((value): value is string => typeof value === 'string'),
    );
    const publicText = [
      ...visibleSchemaContent,
      JSON.stringify(moduleNavigationTree),
      ...generatedReports,
    ]
      .join('\n')
      .toLowerCase();

    for (const forbiddenText of [
      'chapter',
      'radiology structured reporting handbook',
      'brook',
      'sommer',
      'radrepilot_textbook_content_pack',
      'textbook',
    ]) {
      expect(publicText).not.toContain(forbiddenText);
    }
  });
});
