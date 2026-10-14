import type { ReportingWorkflowSchema, WorkflowValues } from '../data/reportingWorkflowSchemas';
import type { ReportSections } from '../radrep/types';
import { cleanLines, workflowValue } from './impressionGenerators';

export function generateBrainTumorMriReport(schema: ReportingWorkflowSchema, values: WorkflowValues): ReportSections {
  const v = (key: string) => workflowValue(values, key);
  const size = [v('lesionApMm'), v('lesionTrMm'), v('lesionCcMm')].filter(Boolean).join(' × ');
  const lesion = v('dominantLesion') === 'absent' ? 'No intracranial tumor lesion is identified.' : `${v('dominantLesion') === 'indeterminate' ? 'Indeterminate' : 'Dominant'} lesion in the ${v('lesionLocation') || 'unspecified location'}${size ? ` measuring ${size} mm` : ''}.`;
  const keys = ['enhancement', 'nonenhancingDisease', 'diffusion', 'susceptibility', 'perfusion', 'spectroscopy', 'edema', 'massEffect', 'herniation', 'hydrocephalus', 'leptomeningealSpread', 'ependymalSpread', 'additionalLesions'];
  const lines = keys.filter((key) => v(key)).map((key) => `${key.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase())}: ${v(key)}.`);
  const limitation = [v('technicalLimitations'), v('limitationsUncertainty')].filter(Boolean).join('; ');
  return {
    indication: cleanLines([v('clinicalIndication') || schema.clinicalQuestion, v('diagnosisContext') ? `Diagnosis/pathology: ${v('diagnosisContext')}.` : undefined, v('treatmentHistory') ? `Treatment history: ${v('treatmentHistory')}.` : undefined]),
    technique: cleanLines([v('modalityProtocol') || schema.techniqueDefault, v('examQuality') ? `Quality: ${v('examQuality')}.` : undefined, limitation ? `Limitations: ${limitation}.` : undefined]),
    findings: v('findingsOverride') || cleanLines([lesion, ...lines, v('intervalChange') ? `Interval change: ${v('intervalChange')}.` : undefined]),
    impression: v('impressionOverride') || cleanLines([v('examQuality') === 'limited' ? 'Limited brain tumor MRI assessment.' : undefined, lesion, v('userResponseSynthesis') || v('intervalChange') || undefined, v('diagnosticConfidence') ? `Confidence: ${v('diagnosticConfidence')}.` : undefined]),
    incidentalFindings: v('incidentalFindings'),
    recommendations: 'No RANO response category, diagnosis, treatment, surveillance, or management recommendation is calculated. Verify treatment context, all lesions, advanced imaging validity, comparison, and user-entered synthesis.',
  };
}

const moduleKeys: Record<string, string[]> = {
  multipleSclerosisMri: ['examMode', 'protocolCompleteness', 'periventricular', 'juxtacorticalCortical', 'infratentorial', 'deepGray', 'spinalCord', 'spinalCordDetails', 'enhancingLesions', 'enhancingDetails', 'restrictedLesions', 'newEnlargingLesions', 'newEnlargingDetails', 't1Burden', 'atrophy', 'atypicalFindings', 'diagnosticConfidence'],
  traumaticBrainInjury: ['traumaMechanism', 'hemorrhage', 'hemorrhageDetails', 'contusion', 'contusionDetails', 'daiClues', 'massEffect', 'midlineShiftMm', 'basalCisterns', 'herniation', 'fracture', 'fractureDetails', 'pneumocephalus', 'vascularInjuryConcern', 'vascularDetails', 'devices', 'intervalProgression', 'urgentFinding', 'communicationOccurred', 'communicationDetails'],
  niRads: ['cancerTreatmentHistory', 'primarySiteStatus', 'primarySiteDetails', 'mucosalAbnormality', 'deepAbnormality', 'primarySizeMm', 'primaryMetabolicData', 'nodalBedStatus', 'nodalDetails', 'nodalSizeMm', 'nodalMetabolicData', 'postTreatmentChange', 'intervalChange', 'userPrimaryCategory', 'userNodalCategory', 'diagnosticConfidence'],
  dementiaMri: ['globalAtrophy', 'medialTemporalAtrophy', 'posteriorAtrophy', 'frontalTemporalAtrophy', 'whiteMatterDisease', 'lacunes', 'infarcts', 'microbleeds', 'siderosis', 'hydrocephalus', 'massLesion', 'subduralCollection', 'reversibleCauses', 'atypicalFindings', 'userPatternSynthesis', 'diagnosticConfidence'],
};
export function generateNeuroradiologyWorkflowReport(schema: ReportingWorkflowSchema, values: WorkflowValues): ReportSections {
  const v = (key: string) => workflowValue(values, key);
  const lines = (moduleKeys[schema.moduleType] || []).filter((key) => v(key)).map((key) => `${key.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase())}: ${v(key).replace(/[.;:\s]+$/, '')}.`);
  const limitation = [v('technicalLimitations'), v('limitationsUncertainty')].filter(Boolean).join('; ');
  return {
    indication: cleanLines([v('clinicalIndication') || schema.clinicalQuestion, v('clinicalContext') ? `Context: ${v('clinicalContext')}.` : undefined]),
    technique: cleanLines([v('modalityProtocol') || schema.techniqueDefault, v('examQuality') ? `Quality: ${v('examQuality')}.` : undefined, limitation ? `Limitations: ${limitation}.` : undefined]),
    findings: v('findingsOverride') || cleanLines([...lines, v('additionalFindings') ? `Additional findings: ${v('additionalFindings')}.` : undefined]),
    impression: v('impressionOverride') || cleanLines([v('examQuality') === 'nondiagnostic' ? `Nondiagnostic ${schema.shortTitle} assessment.` : v('examQuality') === 'limited' ? `Limited ${schema.shortTitle} assessment.` : undefined, v('userSynthesis') || v('userPatternSynthesis') || lines[0] || 'Assessment is incomplete.', ...lines.slice(1, 4)]),
    incidentalFindings: v('incidentalFindings'),
    recommendations: 'No diagnostic criteria, classification, treatment, surveillance, or management recommendation is calculated. Verify technique, all findings, dated comparison, and user-entered synthesis.',
  };
}
