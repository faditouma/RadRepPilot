import { describe, expect, it } from 'vitest';
import { isWorkflowFieldVisible, reportingWorkflowSchemas, type WorkflowValues } from '../data/reportingWorkflowSchemas';
import { moduleNavigationTree } from '../data/moduleNavigationTree';
import { createStoredWorkflowDraft, readStoredWorkflowDraft, writeStoredWorkflowDraft } from '../lib/workflowDraftStorage';
import type { ModuleType } from '../radrep/types';
import { generateReportingWorkflowReport } from './reportGenerators';
import { scoreReportCompleteness } from './qualityMetrics';

const cases: Array<[ModuleType, WorkflowValues]> = [
  ['multipleSclerosisMri', { examMode: 'Brain and cervical spine', protocolCompleteness: 'Complete', periventricular: 'present', juxtacorticalCortical: 'absent', infratentorial: 'absent', enhancingLesions: 'absent', newEnlargingLesions: 'absent', diagnosticConfidence: 'High' }],
  ['stroke', { clinicalContext: 'Acute aphasia', lastKnownWell: '08:00', side: 'left', hemorrhagePresent: 'no', earlyIschemicChangePresent: 'no', massEffect: 'none', ctaPerformed: 'yes', occlusionStatus: 'absent', collaterals: 'Symmetric', stenosisDissection: 'None', perfusionPerformed: 'no', urgentFinding: 'no' }],
  ['traumaticBrainInjury', { hemorrhage: 'absent', contusion: 'absent', massEffect: 'absent', basalCisterns: 'Patent', herniation: 'absent', fracture: 'absent', vascularInjuryConcern: 'absent', urgentFinding: 'absent' }],
  ['niRads', { cancerTreatmentHistory: 'Treated oropharyngeal carcinoma', primarySiteStatus: 'absent', nodalBedStatus: 'absent', postTreatmentChange: 'Expected', intervalChange: 'Stable', diagnosticConfidence: 'High' }],
  ['dementiaMri', { globalAtrophy: 'Mild', medialTemporalAtrophy: 'Mild', whiteMatterDisease: 'Mild', infarcts: 'absent', microbleeds: 'absent', hydrocephalus: 'absent', massLesion: 'absent', diagnosticConfidence: 'High' }],
];

const items = moduleNavigationTree.flatMap((modality) => modality.bodySystems).flatMap((system) => system.workflows);

describe('neuroradiology expansion workflows', () => {
  it.each(cases)('%s is navigable, generates a guarded report, and scores completeness', (moduleType, entered) => {
    const schema = reportingWorkflowSchemas[moduleType]!;
    const values = { ...schema.defaultValues, clinicalIndication: 'Clinical assessment.', modalityProtocol: 'Protocol as documented.', examQuality: 'diagnostic', ...entered };
    const report = generateReportingWorkflowReport(moduleType, values);
    expect(items.find((item) => item.moduleId === schema.moduleId)).toMatchObject({ status: 'implemented', moduleType });
    expect(report.findings.length).toBeGreaterThan(0);
    expect(report.impression.length).toBeGreaterThan(0);
    expect(scoreReportCompleteness(moduleType, values, report).total).toBeGreaterThan(0);
    expect(Object.values(report).join(' ')).not.toMatch(/chapter|textbook|content[_ -]pack|page\s+\d+/i);
  });

  it('keeps positive MS details conditional and preserves report overrides', () => {
    const schema = reportingWorkflowSchemas.multipleSclerosisMri;
    const field = schema.sections.flatMap((section) => section.fields).find((candidate) => candidate.id === 'enhancingDetails')!;
    expect(isWorkflowFieldVisible(field, { ...schema.defaultValues, enhancingLesions: 'absent' })).toBe(false);
    expect(isWorkflowFieldVisible(field, { ...schema.defaultValues, enhancingLesions: 'present' })).toBe(true);
    const report = generateReportingWorkflowReport('multipleSclerosisMri', { ...schema.defaultValues, findingsOverride: 'Edited findings.', impressionOverride: 'Edited impression.' });
    expect(report.findings).toBe('Edited findings.');
    expect(report.impression).toBe('Edited impression.');
  });

  it('restores a structured NI-RADS draft without exposing internal provenance', () => {
    const schema = reportingWorkflowSchemas.niRads;
    const values = { ...schema.defaultValues, clinicalIndication: 'Surveillance.', modalityProtocol: 'Neck CT with contrast.', examQuality: 'diagnostic', primarySiteStatus: 'absent', nodalBedStatus: 'absent' };
    const report = generateReportingWorkflowReport('niRads', values);
    const data = new Map<string, string>();
    const storage = { getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => data.set(key, value) };
    const draft = createStoredWorkflowDraft({ schema, values, report });
    writeStoredWorkflowDraft(storage, draft);
    expect(readStoredWorkflowDraft(storage, schema)).toEqual(draft);
  });
});
