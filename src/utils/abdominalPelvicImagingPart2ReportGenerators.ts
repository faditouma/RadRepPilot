import type { ReportingWorkflowSchema, WorkflowValues } from '../data/reportingWorkflowSchemas';
import type { ReportSections } from '../radrep/types';
import { cleanLines, numberOrNull, workflowValue } from './impressionGenerators';

const dimensions = (values: WorkflowValues, keys: string[]) => {
  const entered = keys.map((key) => numberOrNull(values, key)).filter((value): value is number => value !== null);
  return entered.length ? `${entered.join(' × ')} mm` : '';
};
const assessed = (values: WorkflowValues, label: string, statusKey: string, detailsKey = '') => {
  const status = workflowValue(values, statusKey);
  if (!['present', 'indeterminate', 'not assessed'].includes(status)) return undefined;
  return `${label}: ${status}${detailsKey && workflowValue(values, detailsKey) ? `; ${workflowValue(values, detailsKey)}` : ''}.`;
};

export function generatePancreaticCystReport(schema: ReportingWorkflowSchema, values: WorkflowValues): ReportSections {
  const quality = workflowValue(values, 'examQuality');
  const status = workflowValue(values, 'cysticLesion');
  const limitation = [workflowValue(values, 'technicalLimitations'), workflowValue(values, 'limitationsUncertainty')].filter(Boolean).join('; ');
  const size = dimensions(values, ['cystApMm', 'cystTrMm', 'cystCcMm']);
  const cyst =
    status === 'absent' ? 'No pancreatic cystic lesion is identified.' :
    ['present', 'indeterminate'].includes(status) ? `${status === 'indeterminate' ? 'Indeterminate ' : ''}${workflowValue(values, 'multiplicity') || ''} pancreatic cystic lesion${workflowValue(values, 'dominantCystSite') ? ` centered in the ${workflowValue(values, 'dominantCystSite')}` : ''}${size ? ` measuring ${size}` : ''}. ${[
      workflowValue(values, 'cystMorphology') ? `Morphology: ${workflowValue(values, 'cystMorphology')}` : '',
      workflowValue(values, 'ductCommunication') ? `duct communication: ${workflowValue(values, 'ductCommunication')}` : '',
      workflowValue(values, 'mainDuctDiameterMm') ? `main duct ${workflowValue(values, 'mainDuctDiameterMm')} mm` : '',
    ].filter(Boolean).join('; ')}.` :
    status === 'not assessed' ? 'Pancreatic cystic lesions were not adequately assessed.' : undefined;
  const features = [
    assessed(values, 'Enhancing mural nodule', 'muralNodule', 'muralNoduleDetails'),
    assessed(values, 'Solid component', 'solidComponent', 'solidComponentDetails'),
    assessed(values, 'Wall thickening/enhancement', 'wallEnhancement'),
    assessed(values, 'Septal thickening/enhancement', 'septalEnhancement'),
    assessed(values, 'Interval growth', 'intervalGrowth', 'intervalGrowthDetails'),
    assessed(values, 'Pancreatitis', 'pancreatitis'), assessed(values, 'Biliary obstruction', 'biliaryObstruction'),
    assessed(values, 'Parenchymal atrophy', 'parenchymalAtrophy'),
    assessed(values, 'Suspicious lymph nodes', 'suspiciousNodes', 'suspiciousNodeDetails'),
  ];
  const findings = cleanLines([
    cyst, ...features,
    workflowValue(values, 'additionalCysts') ? `Additional cysts: ${workflowValue(values, 'additionalCysts')}.` : undefined,
    workflowValue(values, 'additionalFindings') ? `Additional findings: ${workflowValue(values, 'additionalFindings')}.` : undefined,
    limitation ? `Limitations: ${limitation}.` : undefined,
  ]);
  const limit = quality === 'nondiagnostic' ? `Nondiagnostic pancreatic examination${limitation ? `: ${limitation}` : '.'}` : quality === 'limited' ? `Limited pancreatic cyst characterization${limitation ? `: ${limitation}` : '.'}` : undefined;
  return {
    indication: cleanLines([workflowValue(values, 'clinicalIndication') || schema.clinicalQuestion, workflowValue(values, 'clinicalContext') ? `Relevant clinical context: ${workflowValue(values, 'clinicalContext')}.` : undefined, workflowValue(values, 'pancreatitisHistory') ? `Pancreatitis history: ${workflowValue(values, 'pancreatitisHistory')}.` : undefined]),
    technique: cleanLines([workflowValue(values, 'modalityProtocol') || schema.techniqueDefault, quality ? `Examination quality: ${quality}.` : undefined, limitation ? `Technical limitations: ${limitation}.` : undefined]),
    findings: workflowValue(values, 'findingsOverride') || findings,
    impression: workflowValue(values, 'impressionOverride') || cleanLines([limit, cyst, ...features.filter(Boolean), workflowValue(values, 'userRiskFeatureSynthesis') || undefined, workflowValue(values, 'userGuidelineCategory') ? `User-entered category: ${workflowValue(values, 'userGuidelineCategory')}.` : undefined]),
    incidentalFindings: workflowValue(values, 'incidentalFindings'),
    recommendations: 'No pancreatic-cyst category, surveillance interval, procedure, treatment, or management recommendation is calculated. Verify every cyst, duct anatomy, enhancing components, growth, associated findings, and user-entered guideline/version.',
  };
}
