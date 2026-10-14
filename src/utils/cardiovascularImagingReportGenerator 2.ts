import type { ReportingWorkflowSchema, WorkflowValues } from '../data/reportingWorkflowSchemas';
import type { ReportSections } from '../radrep/types';
import { cleanLines, workflowValue } from './impressionGenerators';

const keysByModule: Record<string, string[]> = {
  coronaryCta: ['heartRateBpm', 'coronaryOrigins', 'dominance', 'segmentAssessment', 'nondiagnosticSegments', 'plaqueBurden', 'maximalStenosis', 'highRiskPlaque', 'stents', 'grafts', 'cardiacFindings', 'userCadRads'],
  taviPlanningCta: ['valveMorphology', 'valveCalcium', 'annularAreaMm2', 'annularPerimeterMm', 'annularMinMm', 'annularMaxMm', 'leftCoronaryHeightMm', 'rightCoronaryHeightMm', 'sinusDimensions', 'sinotubularJunction', 'ascendingAorta', 'lvot', 'fluoroscopicAngle', 'iliofemoralDiameters', 'accessCalcification', 'accessTortuosity', 'accessSummary', 'alternativeAccess', 'cardiacFindings'],
  cardiomyopathyMri: ['lvEdvi', 'lvEsvi', 'lvEf', 'lvMassIndex', 'rvEdvi', 'rvEsvi', 'rvEf', 'wallMotion', 'wallThickness', 'atria', 'valves', 'pericardium', 'edema', 'perfusion', 'lateGadoliniumEnhancement', 'mapping', 'thrombus', 'noncompactionFeatures', 'arrhythmogenicFeatures'],
  aaaPostprocedure: ['repairType', 'repairDate', 'sacApMm', 'sacTrMm', 'sacVolumeMl', 'sacChange', 'graftPosition', 'migration', 'kinking', 'graftPatency', 'limbOcclusion', 'endoleakStatus', 'userEndoleakType', 'endoleakSource', 'branchPatency', 'ruptureInflammation', 'accessComplications'],
  aaaPreprocedure: ['aneurysmLocation', 'aneurysmMorphology', 'maxDiameterMm', 'aneurysmLengthMm', 'neckLengthMm', 'neckDiameterMm', 'neckAngle', 'neckThrombus', 'neckCalcification', 'branchAnatomy', 'iliacLandingZones', 'accessDiameters', 'accessTortuosity', 'accessCalcification', 'ruptureSigns', 'planningSummary'],
  calciumScore: ['lmScore', 'ladScore', 'lcxScore', 'rcaScore', 'otherScore', 'totalAgatston', 'involvedVesselCount', 'percentile', 'percentileReference', 'userCacCategory', 'extracoronaryCalcification', 'cardiacFindings'],
  ffrCt: ['sourceCtaAdequacy', 'vessel', 'lesionLocation', 'plaqueStenosis', 'analyzability', 'standardLocation', 'standardValue', 'lowestLocation', 'lowestValue', 'pressureDropPattern', 'focalDrop', 'distalTapering'],
};

const label = (key: string) => key.replace(/([A-Z])/g, ' $1').replace(/^./, (character) => character.toUpperCase());
const sentence = (value: string) => value.replace(/[.;:\s]+$/, '');

export function generateCardiovascularImagingReport(schema: ReportingWorkflowSchema, values: WorkflowValues): ReportSections {
  const v = (key: string) => workflowValue(values, key);
  const lines = (keysByModule[schema.moduleType] || [])
    .filter((key) => v(key))
    .map((key) => `${label(key)}: ${sentence(v(key))}.`);
  const limitation = [v('technicalLimitations'), v('limitationsUncertainty')].filter(Boolean).join('; ');
  const qualitySentence = v('examQuality') === 'nondiagnostic'
    ? `Nondiagnostic ${schema.shortTitle} assessment.`
    : v('examQuality') === 'limited'
      ? `Limited ${schema.shortTitle} assessment.`
      : undefined;
  return {
    indication: cleanLines([
      v('clinicalIndication') || schema.clinicalQuestion,
      v('clinicalContext') ? `Context: ${v('clinicalContext')}.` : undefined,
      v('comparisonStudy') ? `Comparison: ${v('comparisonStudy')}${v('comparisonDate') ? ` dated ${v('comparisonDate')}` : ''}.` : undefined,
    ]),
    technique: cleanLines([
      v('modalityProtocol') || schema.techniqueDefault,
      v('examQuality') ? `Quality: ${v('examQuality')}.` : undefined,
      limitation ? `Limitations: ${limitation}.` : undefined,
    ]),
    findings: v('findingsOverride') || cleanLines([...lines, v('additionalFindings') ? `Additional findings: ${v('additionalFindings')}.` : undefined]),
    impression: v('impressionOverride') || cleanLines([
      qualitySentence,
      v('userSynthesis') || lines[0] || 'Assessment is incomplete.',
      ...lines.slice(1, 4),
      v('diagnosticConfidence') ? `Confidence: ${v('diagnosticConfidence')}.` : undefined,
    ]),
    incidentalFindings: v('incidentalFindings'),
    recommendations: 'No automatic classification, staging, eligibility, treatment, intervention, surveillance, or management recommendation is generated. Verify all measurements, analysis conventions, comparison, and user-entered synthesis.',
  };
}
