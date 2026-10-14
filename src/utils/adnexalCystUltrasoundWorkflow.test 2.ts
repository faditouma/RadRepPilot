import { describe, expect, it } from 'vitest';
import { isWorkflowFieldVisible, reportingWorkflowSchemas, type WorkflowValues } from '../data/reportingWorkflowSchemas';
import { moduleNavigationTree } from '../data/moduleNavigationTree';
import { createStoredWorkflowDraft, readStoredWorkflowDraft, writeStoredWorkflowDraft } from '../lib/workflowDraftStorage';
import { generateReportingWorkflowReport } from './reportGenerators';
import { scoreReportCompleteness } from './qualityMetrics';

const schema = reportingWorkflowSchemas.adnexalCystUltrasound;
const negative = (overrides: WorkflowValues = {}): WorkflowValues => ({
  ...schema.defaultValues, clinicalIndication: 'Adnexal cyst follow-up.', menopausalStatus: 'Premenopausal',
  modalityProtocol: 'Transabdominal and transvaginal ultrasound with color Doppler', examQuality: 'diagnostic',
  adnexalLesion: 'absent', ascites: 'absent', peritonealFindings: 'absent', contralateralOvary: 'Normal', ...overrides,
});
const positive = (overrides: WorkflowValues = {}): WorkflowValues => negative({
  adnexalLesion: 'present', laterality: 'Right', lesionOrigin: 'Ovarian', lesionApMm: '32', lesionTrMm: '38', lesionCcMm: '41',
  architecture: 'Unilocular', loculeCount: 'One', septa: 'None', wallSurface: 'Smooth thin wall',
  papillaryProjections: 'absent', solidComponent: 'absent', dopplerFlow: 'No internal flow',
  acousticShadowing: 'absent', internalContents: 'Anechoic', ...overrides,
});

describe('adnexal cyst ultrasound workflow', () => {
  it('is accessible through navigation and preserves the helper', () => {
    const items = moduleNavigationTree.flatMap((m) => m.bodySystems).flatMap((b) => b.workflows);
    expect(items.find((item) => item.moduleId === schema.moduleId)).toMatchObject({ status: 'implemented', moduleType: 'adnexalCystUltrasound' });
    expect(items.some((item) => item.moduleId === 'incidental-adnexal-cyst')).toBe(true);
  });
  it('generates negative and morphologic positive reports', () => {
    expect(generateReportingWorkflowReport('adnexalCystUltrasound', negative()).impression).toContain('No adnexal cystic lesion');
    const report = generateReportingWorkflowReport('adnexalCystUltrasound', positive());
    expect(report.findings).toContain('32 × 38 × 41 mm'); expect(report.findings).toContain('Unilocular');
  });
  it('propagates limitations without automatic category or advice', () => {
    const report = generateReportingWorkflowReport('adnexalCystUltrasound', positive({ examQuality: 'limited', technicalLimitations: 'Left ovary obscured by bowel gas', userAssignedOrads: 'User category' }));
    expect(report.impression).toContain('Limited adnexal assessment'); expect(report.impression).toContain('User category');
    expect(report.recommendations).not.toMatch(/O-RADS [0-5]|follow[- ]?up in \d|recommend(?:s|ed)? (?:biopsy|surgery)/i);
  });
  it('uses conditional lesion and component details', () => {
    const fields = schema.sections.flatMap((s) => s.fields);
    expect(isWorkflowFieldVisible(fields.find((f) => f.id === 'architecture')!, negative())).toBe(false);
    expect(isWorkflowFieldVisible(fields.find((f) => f.id === 'architecture')!, positive())).toBe(true);
    expect(isWorkflowFieldVisible(fields.find((f) => f.id === 'papillaryDetails')!, positive())).toBe(false);
    expect(isWorkflowFieldVisible(fields.find((f) => f.id === 'papillaryDetails')!, positive({ papillaryProjections: 'present' }))).toBe(true);
  });
  it('scores completeness and flags missing positive descriptors', () => {
    const values = positive(); const report = generateReportingWorkflowReport('adnexalCystUltrasound', values);
    expect(scoreReportCompleteness('adnexalCystUltrasound', values, report).complete).toBe(scoreReportCompleteness('adnexalCystUltrasound', values, report).total);
    const incompleteValues = positive({ lesionOrigin: '', architecture: '', dopplerFlow: '' });
    expect(scoreReportCompleteness('adnexalCystUltrasound', incompleteValues, generateReportingWorkflowReport('adnexalCystUltrasound', incompleteValues)).checks.find((c) => c.label.includes('fully characterized'))?.complete).toBe(false);
  });
  it('preserves overrides, drafts, and private provenance boundaries', () => {
    const edited = generateReportingWorkflowReport('adnexalCystUltrasound', negative({ findingsOverride: 'Edited findings.', impressionOverride: 'Edited impression.' }));
    expect(edited.findings).toBe('Edited findings.'); expect(edited.impression).toBe('Edited impression.');
    const values = positive(); const report = generateReportingWorkflowReport('adnexalCystUltrasound', values);
    const data = new Map<string, string>(); const storage = { getItem: (k: string) => data.get(k) ?? null, setItem: (k: string, v: string) => data.set(k, v) };
    const draft = createStoredWorkflowDraft({ schema, values, report }); writeStoredWorkflowDraft(storage, draft);
    expect(readStoredWorkflowDraft(storage, schema)).toEqual(draft);
    expect(Object.values(report).join(' ')).not.toMatch(/chapter|textbook|content[_ -]pack|page\s+\d+/i);
  });
});
