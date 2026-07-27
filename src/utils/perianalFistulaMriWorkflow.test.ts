import { describe, expect, it } from 'vitest';
import { isWorkflowFieldVisible, reportingWorkflowSchemas, type WorkflowValues } from '../data/reportingWorkflowSchemas';
import { moduleNavigationTree } from '../data/moduleNavigationTree';
import { createStoredWorkflowDraft, readStoredWorkflowDraft, writeStoredWorkflowDraft } from '../lib/workflowDraftStorage';
import { generateReportingWorkflowReport } from './reportGenerators';
import { scoreReportCompleteness } from './qualityMetrics';

const schema = reportingWorkflowSchemas.perianalFistulaMri;
const negative = (overrides: WorkflowValues = {}): WorkflowValues => ({
  ...schema.defaultValues, clinicalIndication: 'Perianal pain and drainage.',
  modalityProtocol: 'Dedicated perianal MRI with intravenous contrast', examQuality: 'diagnostic',
  primaryFistula: 'absent', secondaryTracts: 'absent', abscess: 'absent',
  horseshoeExtension: 'absent', supralevatorExtension: 'absent', translevatorExtension: 'absent', proctitis: 'absent', ...overrides,
});
const positive = (overrides: WorkflowValues = {}): WorkflowValues => negative({
  primaryFistula: 'present', internalOpeningClock: '6 o’clock', internalOpeningHeightCm: '2.5',
  tractClassification: 'Transsphincteric fistula', tractCourse: 'Courses posteriorly through the external sphincter into the left ischioanal fossa',
  externalOpening: 'Left gluteal cleft at 7 o’clock', tractActivity: 'Active',
  abscess: 'present', abscessLocation: 'Left ischioanal fossa', abscessApMm: '12', abscessTrMm: '9', abscessCcMm: '18', ...overrides,
});

describe('perianal fistulizing disease MRI workflow', () => {
  it('is accessible through MRI navigation', () => {
    const item = moduleNavigationTree.flatMap((modality) => modality.bodySystems).flatMap((body) => body.workflows).find((workflow) => workflow.moduleId === schema.moduleId);
    expect(item).toMatchObject({ status: 'implemented', moduleType: 'perianalFistulaMri' });
  });
  it('generates negative and detailed positive reports', () => {
    expect(generateReportingWorkflowReport('perianalFistulaMri', negative()).impression).toContain('No perianal fistula or abscess');
    const report = generateReportingWorkflowReport('perianalFistulaMri', positive());
    expect(report.findings).toContain('6 o’clock');
    expect(report.findings).toContain('12 × 9 × 18 mm');
    expect(report.impression).toContain('Transsphincteric');
  });
  it('propagates limitations without automatic classification or management', () => {
    const report = generateReportingWorkflowReport('perianalFistulaMri', negative({ examQuality: 'limited', technicalLimitations: 'Motion obscures the superior anal canal', primaryFistula: 'indeterminate' }));
    expect(report.impression).toContain('Limited perianal MRI');
    expect(report.recommendations).not.toMatch(/surgery|drainage recommended|antibiotic|grade \d/i);
  });
  it('shows tract, secondary-tract, and collection details conditionally', () => {
    const fields = schema.sections.flatMap((section) => section.fields);
    expect(isWorkflowFieldVisible(fields.find((field) => field.id === 'tractCourse')!, negative())).toBe(false);
    expect(isWorkflowFieldVisible(fields.find((field) => field.id === 'tractCourse')!, positive())).toBe(true);
    expect(isWorkflowFieldVisible(fields.find((field) => field.id === 'secondaryTractDetails')!, negative())).toBe(false);
    expect(isWorkflowFieldVisible(fields.find((field) => field.id === 'abscessLocation')!, positive())).toBe(true);
  });
  it('scores completeness and flags missing conditional details', () => {
    const values = positive();
    const complete = scoreReportCompleteness('perianalFistulaMri', values, generateReportingWorkflowReport('perianalFistulaMri', values));
    expect(complete.complete).toBe(complete.total);
    const incompleteValues = positive({ internalOpeningClock: '', tractCourse: '', abscessLocation: '' });
    const incomplete = scoreReportCompleteness('perianalFistulaMri', incompleteValues, generateReportingWorkflowReport('perianalFistulaMri', incompleteValues));
    expect(incomplete.checks.find((check) => check.label.includes('Primary tract'))?.complete).toBe(false);
    expect(incomplete.checks.find((check) => check.label.includes('Abscess'))?.complete).toBe(false);
  });
  it('preserves overrides, drafts, and private-provenance boundaries', () => {
    const edited = generateReportingWorkflowReport('perianalFistulaMri', negative({ findingsOverride: 'Edited findings.', impressionOverride: 'Edited impression.' }));
    expect(edited.findings).toBe('Edited findings.'); expect(edited.impression).toBe('Edited impression.');
    const values = positive(); const report = generateReportingWorkflowReport('perianalFistulaMri', values);
    const data = new Map<string, string>(); const storage = { getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => data.set(key, value) };
    const draft = createStoredWorkflowDraft({ schema, values, report }); writeStoredWorkflowDraft(storage, draft);
    expect(readStoredWorkflowDraft(storage, schema)).toEqual(draft);
    expect(Object.values(report).join(' ')).not.toMatch(/chapter|textbook|content[_ -]pack|page\s+\d+/i);
  });
});
