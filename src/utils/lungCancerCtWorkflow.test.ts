import { describe, expect, it } from 'vitest';
import { isWorkflowFieldVisible, reportingWorkflowSchemas, type WorkflowValues } from '../data/reportingWorkflowSchemas';
import { moduleNavigationTree } from '../data/moduleNavigationTree';
import { createStoredWorkflowDraft, readStoredWorkflowDraft, writeStoredWorkflowDraft } from '../lib/workflowDraftStorage';
import { generateReportingWorkflowReport } from './reportGenerators';
import { scoreReportCompleteness } from './qualityMetrics';

const schema = reportingWorkflowSchemas.lungCancerCt;
const negative = (overrides: WorkflowValues = {}): WorkflowValues => ({
  ...schema.defaultValues,
  clinicalIndication: 'Initial staging of biopsy-proven lung adenocarcinoma.',
  modalityProtocol: 'Contrast-enhanced CT chest including the upper abdomen',
  examQuality: 'diagnostic',
  primaryTumor: 'absent',
  airwayObstruction: 'absent',
  visceralPleuralInvasion: 'absent',
  chestWallInvasion: 'absent',
  mediastinalInvasion: 'absent',
  diaphragmaticInvasion: 'absent',
  cardiacGreatVesselInvasion: 'absent',
  sameLobeNodules: 'absent',
  ipsilateralOtherLobeNodules: 'absent',
  contralateralLungNodules: 'absent',
  suspiciousNodes: 'absent',
  pleuralDisease: 'absent',
  pericardialDisease: 'absent',
  adrenalMetastases: 'absent',
  liverMetastases: 'absent',
  boneMetastases: 'absent',
  otherDistantMetastases: 'absent',
  ...overrides,
});
const positive = (overrides: WorkflowValues = {}): WorkflowValues => negative({
  primaryTumor: 'present',
  primaryLobe: 'right upper lobe',
  primaryLocation: 'posterior segment abutting the major fissure',
  tumorApMm: '38',
  tumorTrMm: '44',
  tumorCcMm: '51',
  tumorMorphology: 'Spiculated heterogeneously enhancing mass with central necrosis',
  airwayObstruction: 'present',
  airwayObstructionDetails: 'Obstructs the posterior segmental bronchus with distal atelectasis',
  visceralPleuralInvasion: 'indeterminate',
  visceralPleuralDetails: 'Broad fissural contact without definite transgression',
  chestWallInvasion: 'absent',
  mediastinalInvasion: 'absent',
  diaphragmaticInvasion: 'absent',
  cardiacGreatVesselInvasion: 'absent',
  sameLobeNodules: 'present',
  sameLobeNoduleDetails: 'Two satellite nodules up to 7 mm',
  ipsilateralOtherLobeNodules: 'absent',
  contralateralLungNodules: 'absent',
  suspiciousNodes: 'present',
  suspiciousNodeDetails: 'Right lower paratracheal station node measures 15 mm short axis',
  pleuralDisease: 'absent',
  pericardialDisease: 'absent',
  adrenalMetastases: 'present',
  adrenalMetastasisDetails: 'Left adrenal mass measures 24 mm',
  liverMetastases: 'absent',
  boneMetastases: 'absent',
  otherDistantMetastases: 'absent',
  ...overrides,
});

describe('lung cancer CT staging workflow', () => {
  it('is accessible in navigation', () => {
    const item = moduleNavigationTree.flatMap((module) => module.bodySystems).flatMap((body) => body.workflows).find((workflow) => workflow.moduleId === schema.moduleId);
    expect(item).toMatchObject({ status: 'implemented', moduleType: 'lungCancerCt' });
  });

  it('generates concise negative and positive reports without automatic TNM', () => {
    expect(generateReportingWorkflowReport('lungCancerCt', negative()).impression).toContain('No primary lung tumor');
    const report = generateReportingWorkflowReport('lungCancerCt', positive());
    expect(report.findings).toContain('38 × 44 × 51 mm');
    expect(report.impression).toContain('Right lower paratracheal');
    expect(report.impression).toContain('Left adrenal mass');
    expect(report.impression).not.toMatch(/\bT[0-4][a-z]?\s*N[0-3]\s*M[0-1]/);
  });

  it('preserves user-entered staging and propagates limitations', () => {
    const userStaged = generateReportingWorkflowReport('lungCancerCt', positive({ userAssignedTnm: 'T3 N2 M1b', userAssignedStage: 'IVA' }));
    expect(userStaged.findings).toContain('User-entered TNM: T3 N2 M1b');
    expect(userStaged.findings).toContain('User-entered stage group: IVA');
    const limited = generateReportingWorkflowReport('lungCancerCt', negative({ examQuality: 'limited', technicalLimitations: 'Upper abdomen incompletely covered', primaryTumor: 'indeterminate' }));
    expect(limited.findings).toContain('Limitations');
    expect(limited.impression).toContain('Limited lung cancer staging CT');
  });

  it('shows primary and staging details conditionally', () => {
    const fields = schema.sections.flatMap((section) => section.fields);
    expect(isWorkflowFieldVisible(fields.find((field) => field.id === 'primaryLobe')!, negative())).toBe(false);
    expect(isWorkflowFieldVisible(fields.find((field) => field.id === 'primaryLobe')!, positive())).toBe(true);
    expect(isWorkflowFieldVisible(fields.find((field) => field.id === 'suspiciousNodeDetails')!, positive())).toBe(true);
  });

  it('scores completeness and flags missing conditional details', () => {
    const values = positive();
    const report = generateReportingWorkflowReport('lungCancerCt', values);
    expect(scoreReportCompleteness('lungCancerCt', values, report).complete).toBe(scoreReportCompleteness('lungCancerCt', values, report).total);
    const incomplete = positive({ tumorMorphology: '', suspiciousNodeDetails: '' });
    const score = scoreReportCompleteness('lungCancerCt', incomplete, generateReportingWorkflowReport('lungCancerCt', incomplete));
    expect(score.checks.find((check) => check.label.includes('Primary lung'))?.complete).toBe(false);
    expect(score.checks.find((check) => check.label.includes('Nodes, pleura'))?.complete).toBe(false);
  });

  it('preserves overrides and draft serialization/restoration', () => {
    const edited = generateReportingWorkflowReport('lungCancerCt', negative({ findingsOverride: 'Edited findings.', impressionOverride: 'Edited impression.' }));
    expect(edited.findings).toBe('Edited findings.');
    expect(edited.impression).toBe('Edited impression.');
    const values = positive();
    const report = generateReportingWorkflowReport('lungCancerCt', values);
    const data = new Map<string, string>();
    const storage = { getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => data.set(key, value) };
    const draft = createStoredWorkflowDraft({ schema, values, report });
    writeStoredWorkflowDraft(storage, draft);
    expect(readStoredWorkflowDraft(storage, schema)).toEqual(draft);
  });
});
