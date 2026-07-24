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

const schema = reportingWorkflowSchemas.pancreaticCancer;

function negativeValues(overrides: WorkflowValues = {}): WorkflowValues {
  return {
    ...schema.defaultValues,
    clinicalIndication: 'Initial staging for suspected pancreatic malignancy.',
    modalityProtocol: 'Multiphase pancreas-protocol CT',
    examQuality: 'diagnostic',
    pancreaticMass: 'absent',
    pancreaticDuctObstruction: 'absent',
    biliaryObstruction: 'absent',
    upstreamAtrophy: 'absent',
    smaContact: 'no contact',
    celiacContact: 'no contact',
    commonHepaticArteryContact: 'no contact',
    smvContact: 'no contact',
    portalVeinContact: 'no contact',
    adjacentOrganInvasion: 'absent',
    regionalNodes: 'absent',
    liverMetastases: 'absent',
    peritonealMetastases: 'absent',
    otherMetastases: 'absent',
    ...overrides,
  };
}

function positiveValues(overrides: WorkflowValues = {}): WorkflowValues {
  return {
    ...negativeValues(),
    pancreaticMass: 'present',
    tumorLocation: 'head or uncinate process',
    tumorSizeApMm: '32',
    tumorSizeTrMm: '28',
    tumorSizeCcMm: '35',
    tumorMorphology: 'solid',
    tumorEnhancement: 'hypoenhancing',
    pancreaticDuctObstruction: 'present',
    pancreaticDuctDiameterMm: '7',
    biliaryObstruction: 'present',
    commonBileDuctDiameterMm: '13',
    upstreamAtrophy: 'present',
    smaContact: 'contact less than 180 degrees',
    celiacContact: 'no contact',
    commonHepaticArteryContact: 'no contact',
    smvContact: 'contact 180 degrees or greater',
    portalVeinContact: 'contact less than 180 degrees',
    vascularDeformity: 'Severe SMV narrowing over 18 mm',
    adjacentOrganInvasion: 'absent',
    regionalNodes: 'present',
    regionalNodeDetails: 'Two rounded peripancreatic nodes measuring up to 12 mm',
    liverMetastases: 'present',
    liverMetastasisDetails: 'Three bilobar lesions measuring up to 21 mm',
    peritonealMetastases: 'absent',
    otherMetastases: 'absent',
    ...overrides,
  };
}

describe('pancreatic cancer staging workflow', () => {
  it('is selectable through the implemented navigation tree', () => {
    const navigationWorkflow = moduleNavigationTree
      .flatMap((modality) => modality.bodySystems)
      .flatMap((bodySystem) => bodySystem.workflows)
      .find((workflow) => workflow.moduleId === schema.moduleId);

    expect(navigationWorkflow).toMatchObject({
      status: 'implemented',
      moduleType: 'pancreaticCancer',
    });
  });

  it('generates a concise negative examination without inventing a stage', () => {
    const report = generateReportingWorkflowReport('pancreaticCancer', negativeValues());

    expect(report.findings).toContain('No pancreatic mass is entered.');
    expect(report.findings).toContain('No tumor contact with the assessed major');
    expect(report.impression).toContain('No liver, peritoneal, or other distant metastases');
    expect(report.impression).not.toMatch(/\bT[0-4]\b|\bN[0-3]\b|\bM[01]\b|resectable/i);
  });

  it('generates prioritized tumor, vascular, nodal, and metastatic findings', () => {
    const report = generateReportingWorkflowReport('pancreaticCancer', positiveValues());

    expect(report.findings).toContain('32 × 28 × 35 mm');
    expect(report.findings).toContain('Superior mesenteric artery: contact less than 180 degrees');
    expect(report.findings).toContain('Superior mesenteric vein: contact 180 degrees or greater');
    expect(report.findings).toContain('Three bilobar lesions measuring up to 21 mm');
    expect(report.impression).toContain('Metastatic disease is present involving liver');
  });

  it('preserves user control over resectability synthesis', () => {
    const report = generateReportingWorkflowReport(
      'pancreaticCancer',
      positiveValues({
        userResectabilitySynthesis:
          'Vascular findings reviewed at multidisciplinary conference; final operability assessment deferred',
      }),
    );

    expect(report.impression).toContain('User resectability synthesis');
    expect(report.impression).toContain('final operability assessment deferred');
    expect(report.recommendations).toContain('No operability, treatment, or management recommendation');
  });

  it('propagates a limited examination into technique, findings, and impression', () => {
    const values = negativeValues({
      examQuality: 'limited',
      technicalLimitations: 'Arterial phase was not acquired',
      pancreaticMass: 'indeterminate',
      tumorLocation: 'indeterminate',
      tumorMorphology: 'indeterminate',
      tumorEnhancement: 'not assessed',
      smaContact: 'not assessed',
      celiacContact: 'not assessed',
      commonHepaticArteryContact: 'not assessed',
      smvContact: 'not assessed',
      portalVeinContact: 'not assessed',
    });
    const report = generateReportingWorkflowReport('pancreaticCancer', values);

    expect(report.technique).toContain('Arterial phase was not acquired');
    expect(report.findings).toContain('Limitations');
    expect(report.impression).toContain('Limited staging examination');
  });

  it('shows tumor and site-specific detail fields only when relevant', () => {
    const fields = schema.sections.flatMap((section) => section.fields);
    const tumorLocation = fields.find((field) => field.id === 'tumorLocation');
    const liverDetails = fields.find((field) => field.id === 'liverMetastasisDetails');
    const adjacentDetails = fields.find((field) => field.id === 'adjacentOrganDetails');

    expect(isWorkflowFieldVisible(tumorLocation!, negativeValues())).toBe(false);
    expect(isWorkflowFieldVisible(tumorLocation!, positiveValues())).toBe(true);
    expect(isWorkflowFieldVisible(liverDetails!, negativeValues())).toBe(false);
    expect(isWorkflowFieldVisible(liverDetails!, positiveValues())).toBe(true);
    expect(isWorkflowFieldVisible(adjacentDetails!, positiveValues())).toBe(false);
    expect(
      isWorkflowFieldVisible(
        adjacentDetails!,
        positiveValues({ adjacentOrganInvasion: 'indeterminate' }),
      ),
    ).toBe(true);
  });

  it('preserves explicit findings and impression overrides', () => {
    const report = generateReportingWorkflowReport(
      'pancreaticCancer',
      negativeValues({
        findingsOverride: 'Radiologist-edited pancreatic findings.',
        impressionOverride: 'Radiologist-edited pancreatic impression.',
      }),
    );

    expect(report.findings).toBe('Radiologist-edited pancreatic findings.');
    expect(report.impression).toBe('Radiologist-edited pancreatic impression.');
  });

  it('scores a complete workflow and detects missing positive tumor or metastatic details', () => {
    const complete = positiveValues();
    const completeScore = scoreReportCompleteness(
      'pancreaticCancer',
      complete,
      generateReportingWorkflowReport('pancreaticCancer', complete),
    );
    expect(completeScore.complete).toBe(completeScore.total);

    const incomplete = positiveValues({
      tumorSizeApMm: '',
      tumorSizeTrMm: '',
      tumorSizeCcMm: '',
      liverMetastasisDetails: '',
    });
    const incompleteScore = scoreReportCompleteness(
      'pancreaticCancer',
      incomplete,
      generateReportingWorkflowReport('pancreaticCancer', incomplete),
    );
    expect(
      incompleteScore.checks.find((check) => check.label.includes('Primary tumor'))?.complete,
    ).toBe(false);
    expect(
      incompleteScore.checks.find((check) => check.label.includes('Distant metastatic'))?.complete,
    ).toBe(false);
  });

  it('round-trips a draft through the unchanged shared storage contract', () => {
    const values = positiveValues();
    const report = generateReportingWorkflowReport('pancreaticCancer', values);
    const data = new Map<string, string>();
    const storage = {
      getItem: (key: string) => data.get(key) ?? null,
      setItem: (key: string, value: string) => data.set(key, value),
    };
    const draft = createStoredWorkflowDraft({
      schema,
      values,
      report,
      activeQuickFillId: 'pancreatic-mass-staging',
      now: new Date('2026-07-24T17:00:00.000Z'),
    });

    writeStoredWorkflowDraft(storage, draft);

    expect(data.has(ACTIVE_WORKFLOW_DRAFT_KEY)).toBe(true);
    expect(readStoredWorkflowDraft(storage, schema)).toEqual(draft);
  });
});
