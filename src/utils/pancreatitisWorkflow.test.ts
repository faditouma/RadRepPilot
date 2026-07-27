import { describe, expect, it } from 'vitest';
import { isWorkflowFieldVisible, reportingWorkflowSchemas, type WorkflowValues } from '../data/reportingWorkflowSchemas';
import { moduleNavigationTree } from '../data/moduleNavigationTree';
import { createStoredWorkflowDraft, readStoredWorkflowDraft, writeStoredWorkflowDraft } from '../lib/workflowDraftStorage';
import { generateReportingWorkflowReport } from './reportGenerators';
import { scoreReportCompleteness } from './qualityMetrics';

const schema = reportingWorkflowSchemas.pancreatitis;
const uncomplicated = (overrides: WorkflowValues = {}): WorkflowValues => ({
  ...schema.defaultValues, clinicalIndication: 'Epigastric pain and elevated lipase.', pancreatitisMode: 'Acute',
  modalityProtocol: 'Pancreas-protocol contrast CT', examQuality: 'diagnostic',
  pancreasSize: 'Mild diffuse enlargement', enhancementPattern: 'Homogeneous enhancement',
  necrosis: 'absent', inflammatoryChange: 'Mild peripancreatic fat stranding', collection: 'absent',
  parenchymalAtrophy: 'absent', calcification: 'absent', ductDilation: 'absent', ductDisruption: 'absent',
  ductStones: 'absent', vascularComplication: 'absent', biliaryCause: 'absent', ...overrides,
});
const complicated = (overrides: WorkflowValues = {}): WorkflowValues => uncomplicated({
  necrosis: 'present', necrosisPercent: '30', necrosisDistribution: 'Body and tail',
  collection: 'present', collectionType: 'User-entered necrotic collection', collectionLocation: 'Lesser sac',
  collectionApMm: '42', collectionTrMm: '58', collectionCcMm: '76',
  collectionWall: 'Partially organized enhancing wall', collectionContents: 'Fluid and nonliquefied debris', ...overrides,
});

describe('pancreatitis workflow', () => {
  it('is accessible through navigation', () => {
    const item = moduleNavigationTree.flatMap((m) => m.bodySystems).flatMap((b) => b.workflows).find((w) => w.moduleId === schema.moduleId);
    expect(item).toMatchObject({ status: 'implemented', moduleType: 'pancreatitis' });
  });
  it('generates uncomplicated and complicated reports', () => {
    expect(generateReportingWorkflowReport('pancreatitis', uncomplicated()).impression).toContain('Acute pancreatitis');
    const report = generateReportingWorkflowReport('pancreatitis', complicated());
    expect(report.findings).toContain('Estimated necrosis: 30%'); expect(report.findings).toContain('42 × 58 × 76 mm');
  });
  it('propagates limitations without automatic classification or advice', () => {
    const report = generateReportingWorkflowReport('pancreatitis', uncomplicated({ examQuality: 'limited', technicalLimitations: 'Portal venous phase only' }));
    expect(report.impression).toContain('Limited pancreatitis assessment');
    expect(report.recommendations).not.toMatch(/Atlanta grade|recommend(?:s|ed)? (?:drainage|intervention)|antibiotic/i);
  });
  it('shows necrosis and collection details conditionally', () => {
    const fields = schema.sections.flatMap((s) => s.fields);
    expect(isWorkflowFieldVisible(fields.find((f) => f.id === 'necrosisPercent')!, uncomplicated())).toBe(false);
    expect(isWorkflowFieldVisible(fields.find((f) => f.id === 'necrosisPercent')!, complicated())).toBe(true);
    expect(isWorkflowFieldVisible(fields.find((f) => f.id === 'collectionType')!, uncomplicated())).toBe(false);
    expect(isWorkflowFieldVisible(fields.find((f) => f.id === 'collectionType')!, complicated())).toBe(true);
  });
  it('scores completeness and flags missing collection characterization', () => {
    const values = complicated(); const report = generateReportingWorkflowReport('pancreatitis', values);
    expect(scoreReportCompleteness('pancreatitis', values, report).complete).toBe(scoreReportCompleteness('pancreatitis', values, report).total);
    const incompleteValues = complicated({ necrosisPercent: '', collectionType: '', collectionContents: '' });
    const scored = scoreReportCompleteness('pancreatitis', incompleteValues, generateReportingWorkflowReport('pancreatitis', incompleteValues));
    expect(scored.checks.find((c) => c.label.includes('Parenchyma'))?.complete).toBe(false);
    expect(scored.checks.find((c) => c.label.includes('collection'))?.complete).toBe(false);
  });
  it('preserves overrides, drafts, and private provenance boundaries', () => {
    const edited = generateReportingWorkflowReport('pancreatitis', uncomplicated({ findingsOverride: 'Edited findings.', impressionOverride: 'Edited impression.' }));
    expect(edited.findings).toBe('Edited findings.'); expect(edited.impression).toBe('Edited impression.');
    const values = complicated(); const report = generateReportingWorkflowReport('pancreatitis', values);
    const data = new Map<string, string>(); const storage = { getItem: (k: string) => data.get(k) ?? null, setItem: (k: string, v: string) => data.set(k, v) };
    const draft = createStoredWorkflowDraft({ schema, values, report }); writeStoredWorkflowDraft(storage, draft);
    expect(readStoredWorkflowDraft(storage, schema)).toEqual(draft);
    expect(Object.values(report).join(' ')).not.toMatch(/chapter|textbook|content[_ -]pack|page\s+\d+/i);
  });
});
