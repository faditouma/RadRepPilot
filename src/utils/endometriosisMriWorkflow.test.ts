import { describe, expect, it } from 'vitest';
import { isWorkflowFieldVisible, reportingWorkflowSchemas, type WorkflowValues } from '../data/reportingWorkflowSchemas';
import { moduleNavigationTree } from '../data/moduleNavigationTree';
import { createStoredWorkflowDraft, readStoredWorkflowDraft, writeStoredWorkflowDraft } from '../lib/workflowDraftStorage';
import { generateReportingWorkflowReport } from './reportGenerators';
import { scoreReportCompleteness } from './qualityMetrics';

const schema = reportingWorkflowSchemas.endometriosisMri;
const negative = (overrides: WorkflowValues = {}): WorkflowValues => ({
  ...schema.defaultValues, clinicalIndication: 'Pelvic pain.', surgeryTreatmentHistory: 'No prior surgery',
  modalityProtocol: 'Pelvic MRI endometriosis protocol', examQuality: 'diagnostic',
  endometrioma: 'absent', anteriorCompartment: 'absent', middleCompartment: 'absent', posteriorCompartment: 'absent',
  uterosacralTorus: 'absent', rectovaginalVaginal: 'absent', bladderUreter: 'absent', bowelInvolvement: 'absent',
  pouchDouglas: 'Patent', adhesions: 'No organ tethering', hydronephrosis: 'absent', adenomyosis: 'absent', ...overrides,
});
const positive = (overrides: WorkflowValues = {}): WorkflowValues => negative({
  endometrioma: 'present', endometriomaDetails: 'Left ovarian endometrioma measures 34 mm',
  posteriorCompartment: 'present', posteriorDetails: 'Plaque at the torus and anterior rectal wall',
  uterosacralTorus: 'present', uterosacralTorusDetails: 'Bilateral uterosacral ligament thickening',
  bowelInvolvement: 'present', bowelSegment: 'Upper rectum', bowelLesionLengthMm: '28',
  bowelDepth: 'Muscularis involvement', bowelCircumference: 'Approximately 25%', pouchDouglas: 'Partially obliterated', adhesions: 'Left ovary tethered medially', ...overrides,
});

describe('endometriosis MRI workflow', () => {
  it('is accessible through MRI navigation', () => {
    const item = moduleNavigationTree.flatMap((m) => m.bodySystems).flatMap((b) => b.workflows).find((w) => w.moduleId === schema.moduleId);
    expect(item).toMatchObject({ status: 'implemented', moduleType: 'endometriosisMri' });
  });
  it('generates negative and surgical-mapping reports', () => {
    expect(generateReportingWorkflowReport('endometriosisMri', negative()).impression).toContain('No MRI evidence');
    const report = generateReportingWorkflowReport('endometriosisMri', positive());
    expect(report.findings).toContain('Upper rectum'); expect(report.findings).toContain('Approximately 25%');
  });
  it('propagates limitations without automatic classification or treatment advice', () => {
    const report = generateReportingWorkflowReport('endometriosisMri', positive({ examQuality: 'limited', technicalLimitations: 'Motion degrades the posterior compartment' }));
    expect(report.impression).toContain('Limited endometriosis mapping');
    expect(report.recommendations).not.toMatch(/stage [IVX\d]|recommend(?:s|ed)? (?:surgery|treatment)/i);
  });
  it('shows compartment and bowel details conditionally', () => {
    const fields = schema.sections.flatMap((s) => s.fields);
    expect(isWorkflowFieldVisible(fields.find((f) => f.id === 'endometriomaDetails')!, negative())).toBe(false);
    expect(isWorkflowFieldVisible(fields.find((f) => f.id === 'endometriomaDetails')!, positive())).toBe(true);
    expect(isWorkflowFieldVisible(fields.find((f) => f.id === 'bowelSegment')!, negative())).toBe(false);
    expect(isWorkflowFieldVisible(fields.find((f) => f.id === 'bowelSegment')!, positive())).toBe(true);
  });
  it('scores completeness and flags missing bowel mapping', () => {
    const values = positive(); const report = generateReportingWorkflowReport('endometriosisMri', values);
    expect(scoreReportCompleteness('endometriosisMri', values, report).complete).toBe(scoreReportCompleteness('endometriosisMri', values, report).total);
    const incompleteValues = positive({ bowelSegment: '', bowelDepth: '', uterosacralTorusDetails: '' });
    const scored = scoreReportCompleteness('endometriosisMri', incompleteValues, generateReportingWorkflowReport('endometriosisMri', incompleteValues));
    expect(scored.checks.find((c) => c.label.includes('Bowel'))?.complete).toBe(false);
    expect(scored.checks.find((c) => c.label.includes('Uterosacral'))?.complete).toBe(false);
  });
  it('preserves overrides, drafts, and private provenance boundaries', () => {
    const edited = generateReportingWorkflowReport('endometriosisMri', negative({ findingsOverride: 'Edited findings.', impressionOverride: 'Edited impression.' }));
    expect(edited.findings).toBe('Edited findings.'); expect(edited.impression).toBe('Edited impression.');
    const values = positive(); const report = generateReportingWorkflowReport('endometriosisMri', values);
    const data = new Map<string, string>(); const storage = { getItem: (k: string) => data.get(k) ?? null, setItem: (k: string, v: string) => data.set(k, v) };
    const draft = createStoredWorkflowDraft({ schema, values, report }); writeStoredWorkflowDraft(storage, draft);
    expect(readStoredWorkflowDraft(storage, schema)).toEqual(draft);
    expect(Object.values(report).join(' ')).not.toMatch(/chapter|textbook|content[_ -]pack|page\s+\d+/i);
  });
});
