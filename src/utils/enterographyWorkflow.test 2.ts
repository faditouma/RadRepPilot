import { describe, expect, it } from 'vitest';
import { isWorkflowFieldVisible, reportingWorkflowSchemas, type WorkflowValues } from '../data/reportingWorkflowSchemas';
import { moduleNavigationTree } from '../data/moduleNavigationTree';
import { createStoredWorkflowDraft, readStoredWorkflowDraft, writeStoredWorkflowDraft } from '../lib/workflowDraftStorage';
import { generateReportingWorkflowReport } from './reportGenerators';
import { scoreReportCompleteness } from './qualityMetrics';

const schema = reportingWorkflowSchemas.enterography;
const negative = (overrides: WorkflowValues = {}): WorkflowValues => ({
  ...schema.defaultValues,
  clinicalIndication: 'Known Crohn disease; assess activity.',
  modalityProtocol: 'MR enterography with enteric and intravenous contrast',
  examQuality: 'diagnostic',
  bowelDistention: 'adequate',
  activeInflammation: 'absent',
  stricture: 'absent',
  penetratingDisease: 'absent',
  abscessPhlegmon: 'absent',
  mesentericInflammation: 'absent',
  suspiciousNodes: 'absent',
  ...overrides,
});
const positive = (overrides: WorkflowValues = {}): WorkflowValues => negative({
  activeInflammation: 'present',
  involvedSegment: 'terminal ileum',
  involvedLengthCm: '12',
  muralThicknessMm: '8',
  muralEnhancement: 'Stratified hyperenhancement',
  muralEdema: 'present',
  diffusionRestriction: 'present',
  ulceration: 'present',
  stricture: 'present',
  strictureLocation: 'terminal ileum',
  strictureLengthCm: '3',
  upstreamDilation: 'present',
  upstreamDiameterMm: '38',
  ...overrides,
});

describe('CT/MR enterography workflow', () => {
  it('is accessible through navigation', () => {
    const item = moduleNavigationTree.flatMap((modality) => modality.bodySystems).flatMap((body) => body.workflows).find((workflow) => workflow.moduleId === schema.moduleId);
    expect(item).toMatchObject({ status: 'implemented', moduleType: 'enterography' });
  });

  it('generates negative and active inflammatory reports', () => {
    expect(generateReportingWorkflowReport('enterography', negative()).impression).toContain('No active small-bowel inflammation');
    const report = generateReportingWorkflowReport('enterography', positive());
    expect(report.findings).toContain('terminal ileum');
    expect(report.findings).toContain('mural thickness up to 8 mm');
    expect(report.impression).toContain('Stricture');
  });

  it('propagates limited assessment without automatic activity or management advice', () => {
    const report = generateReportingWorkflowReport('enterography', negative({
      examQuality: 'limited', bowelDistention: 'limited', incompleteSegments: 'Jejunum is underdistended',
      activeInflammation: 'not assessed', stricture: 'not assessed', penetratingDisease: 'not assessed',
      abscessPhlegmon: 'not assessed', mesentericInflammation: 'not assessed', suspiciousNodes: 'not assessed',
    }));
    expect(report.impression).toContain('Limited enterography examination');
    expect(report.impression).toContain('Jejunum is underdistended');
    expect(report.recommendations).not.toMatch(/start|therapy|follow[- ]?up in|activity score \d/i);
  });

  it('shows conditional disease and limitation fields', () => {
    const fields = schema.sections.flatMap((section) => section.fields);
    expect(isWorkflowFieldVisible(fields.find((field) => field.id === 'involvedSegment')!, negative())).toBe(false);
    expect(isWorkflowFieldVisible(fields.find((field) => field.id === 'involvedSegment')!, positive())).toBe(true);
    expect(isWorkflowFieldVisible(fields.find((field) => field.id === 'incompleteSegments')!, negative())).toBe(false);
    expect(isWorkflowFieldVisible(fields.find((field) => field.id === 'incompleteSegments')!, negative({ bowelDistention: 'limited' }))).toBe(true);
  });

  it('scores completeness and flags missing positive details', () => {
    const values = positive();
    const complete = scoreReportCompleteness('enterography', values, generateReportingWorkflowReport('enterography', values));
    expect(complete.complete).toBe(complete.total);
    const incompleteValues = positive({ involvedSegment: '', muralEnhancement: '', strictureLengthCm: '' });
    const incomplete = scoreReportCompleteness('enterography', incompleteValues, generateReportingWorkflowReport('enterography', incompleteValues));
    expect(incomplete.checks.find((check) => check.label.includes('inflammatory segment'))?.complete).toBe(false);
    expect(incomplete.checks.find((check) => check.label.includes('Stricture'))?.complete).toBe(false);
  });

  it('preserves overrides, drafts, and private-provenance boundaries', () => {
    const edited = generateReportingWorkflowReport('enterography', negative({ findingsOverride: 'Edited findings.', impressionOverride: 'Edited impression.' }));
    expect(edited.findings).toBe('Edited findings.');
    expect(edited.impression).toBe('Edited impression.');
    const values = positive();
    const report = generateReportingWorkflowReport('enterography', values);
    const data = new Map<string, string>();
    const storage = { getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => data.set(key, value) };
    const draft = createStoredWorkflowDraft({ schema, values, report });
    writeStoredWorkflowDraft(storage, draft);
    expect(readStoredWorkflowDraft(storage, schema)).toEqual(draft);
    expect(Object.values(report).join(' ')).not.toMatch(/chapter|textbook|content[_ -]pack|page\s+\d+/i);
  });
});
