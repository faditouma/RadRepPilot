import { describe, expect, it } from 'vitest';
import { isWorkflowFieldVisible, reportingWorkflowSchemas, type WorkflowValues } from '../data/reportingWorkflowSchemas';
import { moduleNavigationTree } from '../data/moduleNavigationTree';
import { createStoredWorkflowDraft, readStoredWorkflowDraft, writeStoredWorkflowDraft } from '../lib/workflowDraftStorage';
import { generateReportingWorkflowReport } from './reportGenerators';
import { scoreReportCompleteness } from './qualityMetrics';

const schema = reportingWorkflowSchemas.thyroidUltrasound;
const negative = (overrides: WorkflowValues = {}): WorkflowValues => ({
  ...schema.defaultValues,
  clinicalIndication: 'Thyroid enlargement on clinical examination.',
  modalityProtocol: 'Grayscale and color Doppler thyroid ultrasound',
  examQuality: 'diagnostic',
  glandBackground: 'Normal size with homogeneous echotexture',
  rightLobeSize: '46 × 16 × 18 mm',
  leftLobeSize: '44 × 15 × 17 mm',
  isthmusThicknessMm: '3',
  dominantNodule: 'absent',
  cervicalNodes: 'absent',
  ...overrides,
});
const positive = (overrides: WorkflowValues = {}): WorkflowValues => negative({
  dominantNodule: 'present',
  noduleIdentifier: 'Nodule 1',
  noduleSide: 'right',
  noduleLocation: 'mid pole posteriorly',
  noduleApMm: '11',
  noduleTrMm: '14',
  noduleCcMm: '18',
  composition: 'solid or almost completely solid',
  echogenicity: 'hypoechoic',
  shape: 'wider than tall',
  margins: 'lobulated or irregular',
  echogenicFoci: 'punctate echogenic foci',
  noduleVascularity: 'Mild internal vascularity',
  extrathyroidalExtension: 'absent',
  intervalChange: 'stable',
  intervalChangeDetails: 'Previously 12 × 14 × 18 mm on 2025-05-01',
  cervicalNodes: 'present',
  cervicalNodeDetails: 'Right level IV rounded node measures 9 mm short axis with punctate echogenic foci',
  ...overrides,
});

describe('thyroid ultrasound workflow', () => {
  it('is accessible through the existing thyroid navigation identity', () => {
    const item = moduleNavigationTree.flatMap((module) => module.bodySystems).flatMap((body) => body.workflows).find((workflow) => workflow.moduleId === schema.moduleId);
    expect(item).toMatchObject({ status: 'implemented', moduleType: 'thyroidUltrasound' });
  });

  it('generates concise negative and positive reports without automatic TI-RADS', () => {
    expect(generateReportingWorkflowReport('thyroidUltrasound', negative()).impression).toContain('No clinically relevant thyroid nodule');
    const report = generateReportingWorkflowReport('thyroidUltrasound', positive());
    expect(report.findings).toContain('11 × 14 × 18 mm');
    expect(report.findings).toContain('punctate echogenic foci');
    expect(report.impression).toContain('Right level IV');
    expect(report.findings).not.toMatch(/TI-RADS category: TR[1-5]/);
  });

  it('preserves a user-entered category and propagates limitations without advice', () => {
    const userCategorized = generateReportingWorkflowReport('thyroidUltrasound', positive({ userAssignedTirads: 'TR5' }));
    expect(userCategorized.findings).toContain('User-entered TI-RADS category: TR5');
    expect(userCategorized.recommendations).not.toMatch(/biopsy at|follow[- ]?up in/i);
    const limited = generateReportingWorkflowReport('thyroidUltrasound', negative({ examQuality: 'limited', technicalLimitations: 'Inferior poles incompletely visualized', dominantNodule: 'indeterminate' }));
    expect(limited.findings).toContain('Limitations');
    expect(limited.impression).toContain('Limited thyroid ultrasound');
  });

  it('shows nodule and node details conditionally', () => {
    const fields = schema.sections.flatMap((section) => section.fields);
    expect(isWorkflowFieldVisible(fields.find((field) => field.id === 'noduleSide')!, negative())).toBe(false);
    expect(isWorkflowFieldVisible(fields.find((field) => field.id === 'noduleSide')!, positive())).toBe(true);
    expect(isWorkflowFieldVisible(fields.find((field) => field.id === 'cervicalNodeDetails')!, positive())).toBe(true);
  });

  it('scores completeness and flags missing conditional descriptors', () => {
    const values = positive();
    const report = generateReportingWorkflowReport('thyroidUltrasound', values);
    expect(scoreReportCompleteness('thyroidUltrasound', values, report).complete).toBe(scoreReportCompleteness('thyroidUltrasound', values, report).total);
    const incomplete = positive({ echogenicity: '', cervicalNodeDetails: '' });
    const score = scoreReportCompleteness('thyroidUltrasound', incomplete, generateReportingWorkflowReport('thyroidUltrasound', incomplete));
    expect(score.checks.find((check) => check.label.includes('nodule characterized'))?.complete).toBe(false);
    expect(score.checks.find((check) => check.label.includes('Cervical lymph'))?.complete).toBe(false);
  });

  it('preserves overrides and draft serialization/restoration', () => {
    const edited = generateReportingWorkflowReport('thyroidUltrasound', negative({ findingsOverride: 'Edited findings.', impressionOverride: 'Edited impression.' }));
    expect(edited.findings).toBe('Edited findings.');
    expect(edited.impression).toBe('Edited impression.');
    const values = positive();
    const report = generateReportingWorkflowReport('thyroidUltrasound', values);
    const data = new Map<string, string>();
    const storage = { getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => data.set(key, value) };
    const draft = createStoredWorkflowDraft({ schema, values, report });
    writeStoredWorkflowDraft(storage, draft);
    expect(readStoredWorkflowDraft(storage, schema)).toEqual(draft);
  });
});
