import { describe, expect, it } from 'vitest';
import { isWorkflowFieldVisible, reportingWorkflowSchemas, type WorkflowValues } from '../data/reportingWorkflowSchemas';
import { moduleNavigationTree } from '../data/moduleNavigationTree';
import { createStoredWorkflowDraft, readStoredWorkflowDraft, writeStoredWorkflowDraft } from '../lib/workflowDraftStorage';
import { generateReportingWorkflowReport } from './reportGenerators';
import { scoreReportCompleteness } from './qualityMetrics';

const schema = reportingWorkflowSchemas.adrenalIncidentaloma;
const negative = (overrides: WorkflowValues = {}): WorkflowValues => ({
  ...schema.defaultValues, clinicalIndication: 'Incidental adrenal finding.', cancerHistory: 'No known malignancy',
  modalityProtocol: 'Adrenal-protocol CT', examQuality: 'diagnostic', adrenalLesion: 'absent',
  growthStatus: 'not assessed', localInvasion: 'absent', metastaticDisease: 'absent',
  contralateralAdrenal: 'Normal', ...overrides,
});
const positive = (overrides: WorkflowValues = {}): WorkflowValues => negative({
  adrenalLesion: 'present', laterality: 'Left', lesionApMm: '18', lesionTrMm: '21', lesionCcMm: '24',
  homogeneity: 'Homogeneous with smooth margins', unenhancedHu: '7', chemicalShiftLoss: 'not assessed',
  macroscopicFat: 'absent', calcification: 'absent', hemorrhage: 'absent', necrosis: 'absent',
  growthStatus: 'absent', ...overrides,
});

describe('adrenal incidentaloma workflow', () => {
  it('is accessible through navigation while preserving the helper', () => {
    const items = moduleNavigationTree.flatMap((modality) => modality.bodySystems).flatMap((body) => body.workflows);
    expect(items.find((item) => item.moduleId === schema.moduleId)).toMatchObject({ status: 'implemented', moduleType: 'adrenalIncidentaloma' });
    expect(items.some((item) => item.moduleId === 'incidental-adrenal-nodule')).toBe(true);
  });
  it('generates negative and characterized lesion reports', () => {
    expect(generateReportingWorkflowReport('adrenalIncidentaloma', negative()).impression).toContain('No adrenal lesion');
    const report = generateReportingWorkflowReport('adrenalIncidentaloma', positive());
    expect(report.findings).toContain('18 × 21 × 24 mm');
    expect(report.findings).toContain('7 HU');
    expect(report.impression).toContain('Left');
  });
  it('propagates limitations and retains user synthesis without automatic advice', () => {
    const report = generateReportingWorkflowReport('adrenalIncidentaloma', positive({ examQuality: 'limited', technicalLimitations: 'Delayed phase not acquired', userImagingSynthesis: 'Imaging appearance favors a lipid-rich lesion' }));
    expect(report.impression).toContain('Limited adrenal characterization');
    expect(report.impression).toContain('favors a lipid-rich lesion');
    expect(report.recommendations).not.toMatch(/follow[- ]?up in \d|recommend(?:s|ed)? (?:biopsy|resection)|hormonal workup is recommended/i);
  });
  it('shows lesion and aggressive-feature details conditionally', () => {
    const fields = schema.sections.flatMap((section) => section.fields);
    expect(isWorkflowFieldVisible(fields.find((field) => field.id === 'unenhancedHu')!, negative())).toBe(false);
    expect(isWorkflowFieldVisible(fields.find((field) => field.id === 'unenhancedHu')!, positive())).toBe(true);
    expect(isWorkflowFieldVisible(fields.find((field) => field.id === 'localInvasionDetails')!, positive())).toBe(false);
    expect(isWorkflowFieldVisible(fields.find((field) => field.id === 'localInvasionDetails')!, positive({ localInvasion: 'present' }))).toBe(true);
  });
  it('scores completeness and flags missing characterization', () => {
    const values = positive(); const report = generateReportingWorkflowReport('adrenalIncidentaloma', values);
    expect(scoreReportCompleteness('adrenalIncidentaloma', values, report).complete).toBe(scoreReportCompleteness('adrenalIncidentaloma', values, report).total);
    const incompleteValues = positive({ laterality: '', homogeneity: '', unenhancedHu: '', chemicalShiftLoss: '', macroscopicFat: '' });
    expect(scoreReportCompleteness('adrenalIncidentaloma', incompleteValues, generateReportingWorkflowReport('adrenalIncidentaloma', incompleteValues)).checks.find((check) => check.label.includes('lesion characterized'))?.complete).toBe(false);
  });
  it('preserves overrides, drafts, and private-provenance boundaries', () => {
    const edited = generateReportingWorkflowReport('adrenalIncidentaloma', negative({ findingsOverride: 'Edited findings.', impressionOverride: 'Edited impression.' }));
    expect(edited.findings).toBe('Edited findings.'); expect(edited.impression).toBe('Edited impression.');
    const values = positive(); const report = generateReportingWorkflowReport('adrenalIncidentaloma', values);
    const data = new Map<string, string>(); const storage = { getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => data.set(key, value) };
    const draft = createStoredWorkflowDraft({ schema, values, report }); writeStoredWorkflowDraft(storage, draft);
    expect(readStoredWorkflowDraft(storage, schema)).toEqual(draft);
    expect(Object.values(report).join(' ')).not.toMatch(/chapter|textbook|content[_ -]pack|page\s+\d+/i);
  });
});
