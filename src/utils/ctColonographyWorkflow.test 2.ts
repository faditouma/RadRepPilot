import { describe, expect, it } from 'vitest';
import { isWorkflowFieldVisible, reportingWorkflowSchemas, type WorkflowValues } from '../data/reportingWorkflowSchemas';
import { moduleNavigationTree } from '../data/moduleNavigationTree';
import { createStoredWorkflowDraft, readStoredWorkflowDraft, writeStoredWorkflowDraft } from '../lib/workflowDraftStorage';
import { generateReportingWorkflowReport } from './reportGenerators';
import { scoreReportCompleteness } from './qualityMetrics';

const schema = reportingWorkflowSchemas.ctColonography;
const negative = (overrides: WorkflowValues = {}): WorkflowValues => ({
  ...schema.defaultValues,
  clinicalIndication: 'Average-risk colorectal cancer screening.',
  modalityProtocol: 'Low-dose supine and prone CT colonography',
  examQuality: 'diagnostic',
  preparationQuality: 'adequate',
  residualMaterial: 'Small volume of well-tagged residual fluid',
  rectosigmoidDistention: 'adequate',
  descendingDistention: 'adequate',
  transverseDistention: 'adequate',
  ascendingCecalDistention: 'adequate',
  completeColonAssessment: 'present',
  colonicLesion: 'absent',
  stricture: 'absent',
  ...overrides,
});
const positive = (overrides: WorkflowValues = {}): WorkflowValues => negative({
  colonicLesion: 'present',
  lesionNumber: 'Lesion 1',
  lesionSegment: 'ascending colon',
  distanceFromAnalVergeCm: '145',
  lesionApMm: '8',
  lesionTrMm: '11',
  lesionCcMm: '12',
  lesionMorphology: 'sessile',
  lesionMobility: 'fixed',
  lesionConfidence: 'high',
  lesionAttenuation: 'Soft-tissue attenuation',
  ...overrides,
});

describe('CT colonography workflow', () => {
  it('is accessible through CT abdomen/pelvis navigation', () => {
    const item = moduleNavigationTree.flatMap((modality) => modality.bodySystems).flatMap((body) => body.workflows).find((workflow) => workflow.moduleId === schema.moduleId);
    expect(item).toMatchObject({ status: 'implemented', moduleType: 'ctColonography' });
  });

  it('generates concise diagnostic negative and positive reports', () => {
    expect(generateReportingWorkflowReport('ctColonography', negative()).impression).toContain('No colonic polyp, mass, or stricture');
    const report = generateReportingWorkflowReport('ctColonography', positive());
    expect(report.findings).toContain('8 × 11 × 12 mm');
    expect(report.findings).toContain('ascending colon');
    expect(report.impression).toContain('sessile');
  });

  it('propagates incomplete segments and avoids automatic classification or management', () => {
    const values = negative({
      examQuality: 'limited',
      preparationQuality: 'suboptimal',
      completeColonAssessment: 'absent',
      incompleteSegments: 'Collapsed sigmoid colon on both acquisitions',
      colonicLesion: 'not assessed',
      stricture: 'not assessed',
      technicalLimitations: 'Extensive untagged residual stool',
    });
    const report = generateReportingWorkflowReport('ctColonography', values);
    expect(report.findings).toContain('Collapsed sigmoid colon');
    expect(report.impression).toContain('Limited CT colonography');
    expect(report.recommendations).not.toMatch(/C[0-4]|repeat in|colonoscopy is recommended/i);
  });

  it('shows lesion and incomplete-segment fields conditionally', () => {
    const fields = schema.sections.flatMap((section) => section.fields);
    expect(isWorkflowFieldVisible(fields.find((field) => field.id === 'lesionSegment')!, negative())).toBe(false);
    expect(isWorkflowFieldVisible(fields.find((field) => field.id === 'lesionSegment')!, positive())).toBe(true);
    expect(isWorkflowFieldVisible(fields.find((field) => field.id === 'incompleteSegments')!, negative())).toBe(false);
    expect(isWorkflowFieldVisible(fields.find((field) => field.id === 'incompleteSegments')!, negative({ completeColonAssessment: 'absent' }))).toBe(true);
  });

  it('scores completeness and identifies missing conditional details', () => {
    const values = positive();
    const complete = scoreReportCompleteness('ctColonography', values, generateReportingWorkflowReport('ctColonography', values));
    expect(complete.complete).toBe(complete.total);
    const incompleteValues = positive({ lesionSegment: '', lesionMorphology: '', lesionConfidence: '' });
    const incomplete = scoreReportCompleteness('ctColonography', incompleteValues, generateReportingWorkflowReport('ctColonography', incompleteValues));
    expect(incomplete.checks.find((check) => check.label.includes('Dominant lesion'))?.complete).toBe(false);
  });

  it('preserves overrides and draft serialization/restoration', () => {
    const edited = generateReportingWorkflowReport('ctColonography', negative({ findingsOverride: 'Edited findings.', impressionOverride: 'Edited impression.' }));
    expect(edited.findings).toBe('Edited findings.');
    expect(edited.impression).toBe('Edited impression.');
    const values = positive();
    const report = generateReportingWorkflowReport('ctColonography', values);
    const data = new Map<string, string>();
    const storage = { getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => data.set(key, value) };
    const draft = createStoredWorkflowDraft({ schema, values, report });
    writeStoredWorkflowDraft(storage, draft);
    expect(readStoredWorkflowDraft(storage, schema)).toEqual(draft);
  });

  it('does not expose private development provenance in generated report text', () => {
    const report = generateReportingWorkflowReport('ctColonography', positive());
    const text = Object.values(report).join(' ');
    expect(text).not.toMatch(/chapter|textbook|content[_ -]pack|page\s+\d+/i);
  });
});
