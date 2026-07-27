import { describe, expect, it } from 'vitest';
import { isWorkflowFieldVisible, reportingWorkflowSchemas, type WorkflowValues } from '../data/reportingWorkflowSchemas';
import { moduleNavigationTree } from '../data/moduleNavigationTree';
import { createStoredWorkflowDraft, readStoredWorkflowDraft, writeStoredWorkflowDraft } from '../lib/workflowDraftStorage';
import { generateReportingWorkflowReport } from './reportGenerators';
import { scoreReportCompleteness } from './qualityMetrics';

const schema = reportingWorkflowSchemas.pancreaticCyst;
const negative = (overrides: WorkflowValues = {}): WorkflowValues => ({
  ...schema.defaultValues, clinicalIndication: 'Pancreatic cyst surveillance.', pancreatitisHistory: 'No pancreatitis',
  modalityProtocol: 'Pancreas MRI with MRCP before and after contrast', examQuality: 'diagnostic',
  cysticLesion: 'absent', muralNodule: 'absent', solidComponent: 'absent', wallEnhancement: 'absent',
  septalEnhancement: 'absent', intervalGrowth: 'not assessed', pancreatitis: 'absent',
  biliaryObstruction: 'absent', parenchymalAtrophy: 'absent', suspiciousNodes: 'absent', ...overrides,
});
const positive = (overrides: WorkflowValues = {}): WorkflowValues => negative({
  cysticLesion: 'present', multiplicity: 'Multiple', dominantCystSite: 'pancreatic head',
  cystApMm: '18', cystTrMm: '21', cystCcMm: '24', cystMorphology: 'Multilocular cluster',
  ductCommunication: 'present', mainDuctDiameterMm: '4', branchDuctDilation: 'present', ...overrides,
});

describe('pancreatic cyst workflow', () => {
  it('is accessible through navigation and preserves the incidental helper', () => {
    const items = moduleNavigationTree.flatMap((m) => m.bodySystems).flatMap((b) => b.workflows);
    expect(items.find((w) => w.moduleId === schema.moduleId)).toMatchObject({ status: 'implemented', moduleType: 'pancreaticCyst' });
    expect(items.some((w) => w.moduleId === 'incidental-pancreatic-cyst')).toBe(true);
  });
  it('generates negative and characterized cyst reports', () => {
    expect(generateReportingWorkflowReport('pancreaticCyst', negative()).impression).toContain('No pancreatic cystic lesion');
    const report = generateReportingWorkflowReport('pancreaticCyst', positive());
    expect(report.findings).toContain('18 × 21 × 24 mm'); expect(report.findings).toContain('main duct 4 mm');
  });
  it('propagates limitations and user synthesis without automatic advice', () => {
    const report = generateReportingWorkflowReport('pancreaticCyst', positive({ examQuality: 'limited', technicalLimitations: 'Motion degrades postcontrast imaging', userRiskFeatureSynthesis: 'No user-identified enhancing high-risk feature' }));
    expect(report.impression).toContain('Limited pancreatic cyst characterization');
    expect(report.recommendations).not.toMatch(/follow[- ]?up in \d|recommend(?:s|ed)? (?:EUS|surgery)|high-risk category \d/i);
  });
  it('uses conditional cyst and component fields', () => {
    const fields = schema.sections.flatMap((s) => s.fields);
    expect(isWorkflowFieldVisible(fields.find((f) => f.id === 'dominantCystSite')!, negative())).toBe(false);
    expect(isWorkflowFieldVisible(fields.find((f) => f.id === 'dominantCystSite')!, positive())).toBe(true);
    expect(isWorkflowFieldVisible(fields.find((f) => f.id === 'muralNoduleDetails')!, positive())).toBe(false);
    expect(isWorkflowFieldVisible(fields.find((f) => f.id === 'muralNoduleDetails')!, positive({ muralNodule: 'present' }))).toBe(true);
  });
  it('scores completeness and flags missing duct characterization', () => {
    const values = positive(); const report = generateReportingWorkflowReport('pancreaticCyst', values);
    expect(scoreReportCompleteness('pancreaticCyst', values, report).complete).toBe(scoreReportCompleteness('pancreaticCyst', values, report).total);
    const incompleteValues = positive({ dominantCystSite: '', ductCommunication: '', mainDuctDiameterMm: '' });
    expect(scoreReportCompleteness('pancreaticCyst', incompleteValues, generateReportingWorkflowReport('pancreaticCyst', incompleteValues)).checks.find((c) => c.label.includes('Dominant cyst'))?.complete).toBe(false);
  });
  it('preserves overrides, drafts, and private provenance boundaries', () => {
    const edited = generateReportingWorkflowReport('pancreaticCyst', negative({ findingsOverride: 'Edited findings.', impressionOverride: 'Edited impression.' }));
    expect(edited.findings).toBe('Edited findings.'); expect(edited.impression).toBe('Edited impression.');
    const values = positive(); const report = generateReportingWorkflowReport('pancreaticCyst', values);
    const data = new Map<string, string>(); const storage = { getItem: (k: string) => data.get(k) ?? null, setItem: (k: string, v: string) => data.set(k, v) };
    const draft = createStoredWorkflowDraft({ schema, values, report }); writeStoredWorkflowDraft(storage, draft);
    expect(readStoredWorkflowDraft(storage, schema)).toEqual(draft);
    expect(Object.values(report).join(' ')).not.toMatch(/chapter|textbook|content[_ -]pack|page\s+\d+/i);
  });
});
