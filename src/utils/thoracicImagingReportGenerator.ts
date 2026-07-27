import type { ReportingWorkflowSchema, WorkflowValues } from '../data/reportingWorkflowSchemas';
import type { ReportSections } from '../radrep/types';
import { cleanLines, workflowValue } from './impressionGenerators';

const labels: Record<string, string> = {
  tracheaCollapsePercent: 'Tracheal collapse (%)', rightBronchusCollapsePercent: 'Right main bronchus collapse (%)', leftBronchusCollapsePercent: 'Left main bronchus collapse (%)',
  airwayCollapse: 'Dynamic airway collapse', airTrapping: 'Air trapping', fibrosis: 'Fibrosis', reticulation: 'Reticulation', tractionBronchiectasis: 'Traction bronchiectasis',
  honeycombing: 'Honeycombing', groundGlass: 'Ground-glass opacity', emphysema: 'Emphysema', chronicThromboembolicSigns: 'Chronic thromboembolic signs',
  mainPaMm: 'Main pulmonary artery (mm)', rvLvRatio: 'RV/LV ratio', septalFlattening: 'Septal flattening/bowing', contrastReflux: 'Contrast reflux',
  mosaicPerfusion: 'Mosaic perfusion', systemicCollaterals: 'Systemic collaterals', airwayWallThickening: 'Airway wall thickening', mucusPlugging: 'Mucus plugging',
  bronchiectasis: 'Bronchiectasis', bullae: 'Bullae',
};
const keys: Record<string, string[]> = {
  tracheobronchomalacia: ['respiratoryEffort', 'tracheaInspirationMm', 'tracheaExpirationMm', 'tracheaCollapsePercent', 'rightBronchusCollapsePercent', 'leftBronchusCollapsePercent', 'airwayCollapse', 'collapseMorphology', 'distribution', 'focalDetails', 'airTrapping', 'associatedDisease', 'diagnosticConfidence'],
  fibroticLungDisease: ['axialDistribution', 'craniocaudalDistribution', 'fibrosis', 'reticulation', 'tractionBronchiectasis', 'honeycombing', 'groundGlass', 'mosaicAttenuation', 'airTrapping', 'emphysema', 'otherFeatures', 'intervalProgression', 'progressionDetails', 'acuteAbnormality', 'acuteDetails', 'userPattern', 'diagnosticConfidence'],
  pulmonaryHypertensionCtpa: ['contrastQuality', 'mainPaMm', 'rightPaMm', 'leftPaMm', 'chronicThromboembolicSigns', 'ctephDetails', 'rvLvRatio', 'septalFlattening', 'contrastReflux', 'rightHeartDetails', 'mosaicPerfusion', 'parenchymalDisease', 'leftHeartClues', 'systemicCollaterals', 'pericardialEffusion', 'userEtiologySynthesis', 'diagnosticConfidence'],
  copdCt: ['emphysema', 'emphysemaType', 'emphysemaDistribution', 'emphysemaSeverity', 'airwayWallThickening', 'mucusPlugging', 'bronchiectasis', 'airTrapping', 'bullae', 'bullaeDetails', 'fissureIntegrity', 'pulmonaryNodules', 'associatedDisease', 'quantitativeResults', 'userPhenotypeSynthesis'],
  cysticLungDisease: ['cysts', 'cystCount', 'cystSizeRange', 'cystWall', 'cystMorphology', 'axialDistribution', 'craniocaudalDistribution', 'associatedNodules', 'groundGlass', 'septalThickening', 'pneumothorax', 'extrapulmonaryClues', 'userDifferential', 'diagnosticConfidence'],
  lungCancerScreening: ['screeningContext', 'eligibilityExclusions', 'dominantNodule', 'noduleType', 'noduleLocation', 'noduleSizeMm', 'noduleVolumeMm3', 'solidComponentMm', 'seriesImage', 'morphology', 'growth', 'growthDetails', 'additionalNodules', 'significantIncidentals', 'userLungRads', 'userFollowupSynthesis'],
  viralPneumoniaCt: ['infectionMode', 'groundGlass', 'consolidation', 'crazyPaving', 'organizingPattern', 'axialDistribution', 'craniocaudalDistribution', 'extent', 'atypicalFindings', 'pleuralEffusion', 'pneumothorax', 'peAssessment', 'peDetails', 'complications', 'intervalChange', 'diagnosticConfidence'],
};
export function generateThoracicImagingReport(schema: ReportingWorkflowSchema, values: WorkflowValues): ReportSections {
  const v = (key: string) => workflowValue(values, key);
  const lines = (keys[schema.moduleType] || []).filter((key) => v(key)).map((key) => `${labels[key] || key.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase())}: ${v(key)}.`);
  const limitation = [v('technicalLimitations'), v('limitationsUncertainty')].filter(Boolean).join('; ');
  const quality = v('examQuality');
  return {
    indication: cleanLines([v('clinicalIndication') || schema.clinicalQuestion, v('clinicalContext') ? `Context: ${v('clinicalContext')}.` : undefined]),
    technique: cleanLines([v('modalityProtocol') || schema.techniqueDefault, quality ? `Examination quality: ${quality}.` : undefined, limitation ? `Limitations: ${limitation}.` : undefined]),
    findings: v('findingsOverride') || cleanLines([...lines, v('additionalFindings') ? `Additional findings: ${v('additionalFindings')}.` : undefined, limitation ? `Limitations: ${limitation}.` : undefined]),
    impression: v('impressionOverride') || cleanLines([quality === 'nondiagnostic' ? `Nondiagnostic ${schema.shortTitle} assessment.` : quality === 'limited' ? `Limited ${schema.shortTitle} assessment.` : undefined, v('userSynthesis') || v('userPattern') || v('userEtiologySynthesis') || v('userPhenotypeSynthesis') || lines[0] || 'Assessment is incomplete.', ...lines.slice(1, 4)]),
    incidentalFindings: v('incidentalFindings'),
    recommendations: 'No diagnostic threshold, classification, intervention eligibility, treatment, surveillance, or management recommendation is calculated. Verify technique, measurements, comparison, and user-entered synthesis.',
  };
}
