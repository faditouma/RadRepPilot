import { describe, expect, it } from 'vitest';
import { isWorkflowFieldVisible, reportingWorkflowSchemas, type WorkflowValues } from '../data/reportingWorkflowSchemas';
import { moduleNavigationTree } from '../data/moduleNavigationTree';
import { createStoredWorkflowDraft, readStoredWorkflowDraft, writeStoredWorkflowDraft } from '../lib/workflowDraftStorage';
import { generateReportingWorkflowReport } from './reportGenerators';
import { scoreReportCompleteness } from './qualityMetrics';

const schema = reportingWorkflowSchemas.hilarCholangiocarcinoma;
const negative = (overrides: WorkflowValues = {}): WorkflowValues => ({
  ...schema.defaultValues, clinicalIndication: 'Evaluate hilar biliary stricture.',
  modalityProtocol: 'Liver MRI with MRCP', examQuality: 'diagnostic', hilarLesion: 'absent',
  intrahepaticDuctDilation: 'absent', lobarAtrophy: 'absent', portalVeinRelationship: 'no contact',
  hepaticArteryRelationship: 'no contact', liverInvasion: 'absent', adjacentOrganInvasion: 'absent',
  suspiciousNodes: 'absent', peritonealMetastases: 'absent', distantMetastases: 'absent', ...overrides,
});
const positive = (overrides: WorkflowValues = {}): WorkflowValues => negative({
  hilarLesion: 'present', ductalEpicenter: 'common hepatic duct confluence',
  longitudinalExtent: 'Extends from the common hepatic duct into right and left hepatic ducts',
  lesionApMm: '24', lesionTrMm: '19', lesionCcMm: '31', morphology: 'Periductal infiltrating tumor',
  rightDuctExtent: 'Extends into right anterior sectoral duct', leftDuctExtent: 'Extends 12 mm into left hepatic duct',
  intrahepaticDuctDilation: 'present', lobarAtrophy: 'present', lobarAtrophyDetails: 'Mild left lobar atrophy',
  portalVeinRelationship: 'narrowed', portalVeinDetails: 'Left portal vein narrowed over 14 mm',
  hepaticArteryRelationship: 'no contact', liverInvasion: 'present', liverInvasionDetails: 'Direct segment 4 invasion',
  adjacentOrganInvasion: 'absent', suspiciousNodes: 'present', suspiciousNodeDetails: 'Portacaval node 13 mm',
  peritonealMetastases: 'absent', distantMetastases: 'absent', ...overrides,
});

describe('hilar cholangiocarcinoma workflow', () => {
  it('is user-accessible through navigation', () => {
    const item = moduleNavigationTree.flatMap((m) => m.bodySystems).flatMap((b) => b.workflows).find((w) => w.moduleId === schema.moduleId);
    expect(item).toMatchObject({ status: 'implemented', moduleType: 'hilarCholangiocarcinoma' });
  });
  it('generates negative and detailed positive reports without automatic staging', () => {
    expect(generateReportingWorkflowReport('hilarCholangiocarcinoma', negative()).impression).toContain('No hilar biliary lesion');
    const report = generateReportingWorkflowReport('hilarCholangiocarcinoma', positive());
    expect(report.findings).toContain('24 × 19 × 31 mm');
    expect(report.findings).toContain('Right ductal extent');
    expect(report.findings).toContain('Left portal vein narrowed');
    expect(report.impression).not.toMatch(/Bismuth|T[0-4]N[0-3]/);
  });
  it('keeps user classification and limitations explicit', () => {
    const assigned = generateReportingWorkflowReport('hilarCholangiocarcinoma', positive({ userAssignedBismuth: 'Type IV' }));
    expect(assigned.findings).toContain('User-assigned ductal classification: Type IV');
    const limited = generateReportingWorkflowReport('hilarCholangiocarcinoma', negative({ examQuality: 'limited', technicalLimitations: 'Motion limits second-order duct assessment', hilarLesion: 'indeterminate' }));
    expect(limited.findings).toContain('Limitations');
    expect(limited.impression).toContain('Limited hilar tumor assessment');
  });
  it('shows tumor, atrophy, and vessel details conditionally', () => {
    const fields = schema.sections.flatMap((s) => s.fields);
    expect(isWorkflowFieldVisible(fields.find((f) => f.id === 'ductalEpicenter')!, negative())).toBe(false);
    expect(isWorkflowFieldVisible(fields.find((f) => f.id === 'ductalEpicenter')!, positive())).toBe(true);
    expect(isWorkflowFieldVisible(fields.find((f) => f.id === 'portalVeinDetails')!, positive())).toBe(true);
  });
  it('scores completeness and detects missing ductal or vessel details', () => {
    const values = positive();
    const complete = scoreReportCompleteness('hilarCholangiocarcinoma', values, generateReportingWorkflowReport('hilarCholangiocarcinoma', values));
    expect(complete.complete).toBe(complete.total);
    const bad = positive({ rightDuctExtent: '', portalVeinDetails: '' });
    const score = scoreReportCompleteness('hilarCholangiocarcinoma', bad, generateReportingWorkflowReport('hilarCholangiocarcinoma', bad));
    expect(score.checks.find((c) => c.label.includes('Primary tumor'))?.complete).toBe(false);
    expect(score.checks.find((c) => c.label.includes('Portal vein'))?.complete).toBe(false);
  });
  it('preserves overrides and draft compatibility', () => {
    const overridden = generateReportingWorkflowReport('hilarCholangiocarcinoma', negative({ findingsOverride: 'Edited findings.', impressionOverride: 'Edited impression.' }));
    expect(overridden.findings).toBe('Edited findings.');
    expect(overridden.impression).toBe('Edited impression.');
    const values = positive(); const report = generateReportingWorkflowReport('hilarCholangiocarcinoma', values);
    const data = new Map<string, string>(); const storage = { getItem: (k: string) => data.get(k) ?? null, setItem: (k: string, v: string) => data.set(k, v) };
    const draft = createStoredWorkflowDraft({ schema, values, report });
    writeStoredWorkflowDraft(storage, draft);
    expect(readStoredWorkflowDraft(storage, schema)).toEqual(draft);
  });
});
