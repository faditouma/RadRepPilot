import { describe, expect, it } from 'vitest';
import { isWorkflowFieldVisible, reportingWorkflowSchemas, type WorkflowValues } from '../data/reportingWorkflowSchemas';
import { moduleNavigationTree } from '../data/moduleNavigationTree';
import { createStoredWorkflowDraft, readStoredWorkflowDraft, writeStoredWorkflowDraft } from '../lib/workflowDraftStorage';
import type { ModuleType } from '../radrep/types';
import { generateReportingWorkflowReport } from './reportGenerators';
import { scoreReportCompleteness } from './qualityMetrics';

const cases: Array<[ModuleType, WorkflowValues]> = [
  ['coronaryCta', { coronaryOrigins: 'Normal origins', dominance: 'Right', segmentAssessment: 'No plaque', nondiagnosticSegments: 'None', plaqueBurden: 'None', maximalStenosis: 'No stenosis' }],
  ['taviPlanningCta', { valveMorphology: 'Tricuspid', annularAreaMm2: '480', annularPerimeterMm: '79', leftCoronaryHeightMm: '13', rightCoronaryHeightMm: '15', iliofemoralDiameters: 'Minimum 7 mm', accessCalcification: 'Mild', accessTortuosity: 'Mild' }],
  ['cardiomyopathyMri', { lvEdvi: '82', lvEsvi: '32', lvEf: '61', rvEdvi: '78', rvEsvi: '31', rvEf: '60', wallMotion: 'Normal', lateGadoliniumEnhancement: 'Absent', thrombus: 'absent' }],
  ['aaaPostprocedure', { repairType: 'EVAR', sacApMm: '48', sacTrMm: '51', sacChange: 'Stable', graftPosition: 'Expected', graftPatency: 'absent', endoleakStatus: 'absent', branchPatency: 'Patent' }],
  ['aaaPreprocedure', { aneurysmLocation: 'Infrarenal', aneurysmMorphology: 'Fusiform', maxDiameterMm: '58', neckLengthMm: '28', neckDiameterMm: '24', branchAnatomy: 'Conventional', iliacLandingZones: 'Documented', accessDiameters: 'Minimum 7 mm' }],
  ['calciumScore', { lmScore: '0', ladScore: '40', lcxScore: '0', rcaScore: '0', totalAgatston: '40', involvedVesselCount: '1' }],
  ['ffrCt', { sourceCtaAdequacy: 'diagnostic', vessel: 'LAD', lesionLocation: 'Mid LAD', plaqueStenosis: 'Moderate plaque', analyzability: 'diagnostic', standardLocation: '2 cm distal', standardValue: '0.84', lowestValue: '0.81' }],
];

const items = moduleNavigationTree.flatMap((modality) => modality.bodySystems).flatMap((system) => system.workflows);

describe('cardiovascular expansion workflows', () => {
  it.each(cases)('%s is navigable, generates report sections, and has completeness scoring', (moduleType, entered) => {
    const schema = reportingWorkflowSchemas[moduleType]!;
    const values = { ...schema.defaultValues, clinicalIndication: 'Cardiovascular assessment.', modalityProtocol: 'Protocol as documented.', examQuality: 'diagnostic', ...entered };
    const report = generateReportingWorkflowReport(moduleType, values);
    expect(items.find((item) => item.moduleId === schema.moduleId)).toMatchObject({ status: 'implemented', moduleType });
    expect(report.findings.length).toBeGreaterThan(0);
    expect(report.impression.length).toBeGreaterThan(0);
    expect(report.recommendations).toMatch(/No automatic classification/);
    expect(scoreReportCompleteness(moduleType, values, report).total).toBeGreaterThan(0);
    expect(Object.values(report).join(' ')).not.toMatch(/chapter|textbook|content[_ -]pack|page\s+\d+/i);
  });

  it('keeps endoleak details conditional and honors overrides', () => {
    const schema = reportingWorkflowSchemas.aaaPostprocedure;
    const field = schema.sections.flatMap((section) => section.fields).find((candidate) => candidate.id === 'userEndoleakType')!;
    expect(isWorkflowFieldVisible(field, { ...schema.defaultValues, endoleakStatus: 'absent' })).toBe(false);
    expect(isWorkflowFieldVisible(field, { ...schema.defaultValues, endoleakStatus: 'present' })).toBe(true);
    const report = generateReportingWorkflowReport('aaaPostprocedure', { ...schema.defaultValues, findingsOverride: 'Edited findings.', impressionOverride: 'Edited impression.' });
    expect(report.findings).toBe('Edited findings.');
    expect(report.impression).toBe('Edited impression.');
  });

  it('round-trips a structured coronary CTA draft', () => {
    const schema = reportingWorkflowSchemas.coronaryCta;
    const values = { ...schema.defaultValues, clinicalIndication: 'Chest pain.', modalityProtocol: 'Coronary CTA.', examQuality: 'diagnostic', coronaryOrigins: 'Normal', dominance: 'Right' };
    const report = generateReportingWorkflowReport('coronaryCta', values);
    const data = new Map<string, string>();
    const storage = { getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => data.set(key, value) };
    const draft = createStoredWorkflowDraft({ schema, values, report });
    writeStoredWorkflowDraft(storage, draft);
    expect(readStoredWorkflowDraft(storage, schema)).toEqual(draft);
  });
});
