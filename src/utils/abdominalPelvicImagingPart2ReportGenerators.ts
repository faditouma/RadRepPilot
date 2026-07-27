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

export function generatePancreatitisReport(schema: ReportingWorkflowSchema, values: WorkflowValues): ReportSections {
  const quality = workflowValue(values, 'examQuality');
  const limitation = [workflowValue(values, 'technicalLimitations'), workflowValue(values, 'limitationsUncertainty')].filter(Boolean).join('; ');
  const collectionSize = dimensions(values, ['collectionApMm', 'collectionTrMm', 'collectionCcMm']);
  const necrosis = assessed(values, 'Pancreatic/peripancreatic necrosis', 'necrosis', 'necrosisDistribution');
  const collectionStatus = workflowValue(values, 'collection');
  const collection = ['present', 'indeterminate'].includes(collectionStatus)
    ? `${collectionStatus === 'indeterminate' ? 'Indeterminate ' : ''}${workflowValue(values, 'collectionType') || 'pancreatic/peripancreatic collection'} at ${workflowValue(values, 'collectionLocation') || 'an unspecified location'}${collectionSize ? ` measuring ${collectionSize}` : ''}${workflowValue(values, 'collectionWall') ? `; wall ${workflowValue(values, 'collectionWall')}` : ''}${workflowValue(values, 'collectionContents') ? `; contents ${workflowValue(values, 'collectionContents')}` : ''}.`
    : collectionStatus === 'not assessed' ? 'Pancreatic collections were not adequately assessed.' : undefined;
  const complications = [
    assessed(values, 'Main pancreatic duct dilation', 'ductDilation'),
    assessed(values, 'Duct disruption/disconnected segment', 'ductDisruption'),
    assessed(values, 'Intraductal stones', 'ductStones'),
    assessed(values, 'Vascular complication', 'vascularComplication', 'vascularDetails'),
    assessed(values, 'Biliary cause or obstruction', 'biliaryCause', 'biliaryDetails'),
  ];
  const findings = cleanLines([
    workflowValue(values, 'pancreasSize') ? `Pancreas: ${workflowValue(values, 'pancreasSize')}.` : undefined,
    workflowValue(values, 'enhancementPattern') ? `Enhancement: ${workflowValue(values, 'enhancementPattern')}.` : undefined,
    necrosis, workflowValue(values, 'necrosisPercent') ? `Estimated necrosis: ${workflowValue(values, 'necrosisPercent')}%.` : undefined,
    workflowValue(values, 'inflammatoryChange') ? `Inflammatory change: ${workflowValue(values, 'inflammatoryChange')}.` : undefined,
    assessed(values, 'Parenchymal atrophy', 'parenchymalAtrophy'), assessed(values, 'Pancreatic calcification', 'calcification'),
    collection, workflowValue(values, 'additionalCollections') ? `Additional collections: ${workflowValue(values, 'additionalCollections')}.` : undefined,
    ...complications, workflowValue(values, 'ductDiameterMm') ? `Main duct diameter: ${workflowValue(values, 'ductDiameterMm')} mm.` : undefined,
    workflowValue(values, 'organComplications') ? `Other organ complications: ${workflowValue(values, 'organComplications')}.` : undefined,
    limitation ? `Limitations: ${limitation}.` : undefined,
  ]);
  const limit = quality === 'nondiagnostic' ? `Nondiagnostic pancreatic examination${limitation ? `: ${limitation}` : '.'}` : quality === 'limited' ? `Limited pancreatitis assessment${limitation ? `: ${limitation}` : '.'}` : undefined;
  return {
    indication: cleanLines([workflowValue(values, 'clinicalIndication') || schema.clinicalQuestion, workflowValue(values, 'pancreatitisMode') ? `Reporting mode: ${workflowValue(values, 'pancreatitisMode')}.` : undefined, workflowValue(values, 'clinicalContext') ? `Relevant clinical context: ${workflowValue(values, 'clinicalContext')}.` : undefined]),
    technique: cleanLines([workflowValue(values, 'modalityProtocol') || schema.techniqueDefault, quality ? `Examination quality: ${quality}.` : undefined, limitation ? `Technical limitations: ${limitation}.` : undefined]),
    findings: workflowValue(values, 'findingsOverride') || findings,
    impression: workflowValue(values, 'impressionOverride') || cleanLines([limit, workflowValue(values, 'userTerminologySynthesis') || (workflowValue(values, 'pancreatitisMode') ? `${workflowValue(values, 'pancreatitisMode')} pancreatitis imaging findings.` : 'Pancreatitis assessment is incomplete.'), necrosis, collection, ...complications.filter(Boolean)]),
    incidentalFindings: workflowValue(values, 'incidentalFindings'),
    recommendations: 'No Atlanta category, collection maturity class, intervention, treatment, or management recommendation is calculated. Verify clinical timing, enhancement, necrosis, collections, duct integrity, vascular and biliary complications.',
  };
}

export function generatePlacentaAccretaMriReport(schema: ReportingWorkflowSchema, values: WorkflowValues): ReportSections {
  const quality = workflowValue(values, 'examQuality');
  const limitation = [workflowValue(values, 'technicalLimitations'), workflowValue(values, 'limitationsUncertainty')].filter(Boolean).join('; ');
  const signs = [
    assessed(values, 'Placental heterogeneity', 'placentalHeterogeneity'),
    assessed(values, 'Dark intraplacental T2 bands', 'darkBands'),
    assessed(values, 'Uterine bulge', 'uterineBulge'),
    assessed(values, 'Myometrial thinning', 'myometrialThinning'),
    assessed(values, 'Myometrial interruption', 'myometrialInterruption'),
    assessed(values, 'Abnormal placental/subplacental vascularity', 'abnormalVascularity'),
  ];
  const extension = [
    assessed(values, 'Bladder interface abnormality', 'bladderInterface', 'bladderDetails'),
    assessed(values, 'Parametrial involvement', 'parametrialExtension', 'parametrialDetails'),
    assessed(values, 'Cervical involvement', 'cervicalInvolvement', 'cervicalDetails'),
    assessed(values, 'Other extrauterine extension', 'extrauterineExtension', 'extrauterineDetails'),
  ];
  const allNegative = ['placentalHeterogeneity', 'darkBands', 'uterineBulge', 'myometrialThinning', 'myometrialInterruption', 'abnormalVascularity', 'bladderInterface', 'parametrialExtension', 'cervicalInvolvement', 'extrauterineExtension'].every((key) => workflowValue(values, key) === 'absent');
  const findings = cleanLines([
    workflowValue(values, 'placentalLocation') ? `Placenta: ${workflowValue(values, 'placentalLocation')}.` : undefined,
    assessed(values, 'Placenta previa', 'placentaPrevia'), ...signs, ...extension,
    allNegative ? 'No entered MRI feature associated with placenta accreta spectrum or extrauterine extension.' : undefined,
    workflowValue(values, 'additionalObstetricFindings') ? `Additional obstetric findings: ${workflowValue(values, 'additionalObstetricFindings')}.` : undefined,
    limitation ? `Limitations: ${limitation}.` : undefined,
  ]);
  const limit = quality === 'nondiagnostic' ? `Nondiagnostic placental MRI${limitation ? `: ${limitation}` : '.'}` : quality === 'limited' ? `Limited placenta accreta spectrum assessment${limitation ? `: ${limitation}` : '.'}` : undefined;
  return {
    indication: cleanLines([workflowValue(values, 'clinicalIndication') || schema.clinicalQuestion, workflowValue(values, 'gestationalAge') ? `Gestational age: ${workflowValue(values, 'gestationalAge')}.` : undefined, workflowValue(values, 'priorUterineSurgery') ? `Prior uterine surgery: ${workflowValue(values, 'priorUterineSurgery')}.` : undefined]),
    technique: cleanLines([workflowValue(values, 'modalityProtocol') || schema.techniqueDefault, quality ? `Examination quality: ${quality}.` : undefined, workflowValue(values, 'fetalOrientation') ? `Fetal orientation: ${workflowValue(values, 'fetalOrientation')}.` : undefined, workflowValue(values, 'uterineOrientation') ? `Uterine orientation: ${workflowValue(values, 'uterineOrientation')}.` : undefined]),
    findings: workflowValue(values, 'findingsOverride') || findings,
    impression: workflowValue(values, 'impressionOverride') || cleanLines([limit, workflowValue(values, 'userPasSynthesis') || (allNegative ? 'No MRI features entered to suggest placenta accreta spectrum.' : 'MRI features associated with abnormal placental adherence are present; see mapped findings.'), workflowValue(values, 'diagnosticConfidence') ? `Diagnostic confidence: ${workflowValue(values, 'diagnosticConfidence')}.` : undefined, ...extension.filter(Boolean)]),
    incidentalFindings: workflowValue(values, 'incidentalFindings'),
    recommendations: 'No PAS depth, operative plan, delivery plan, treatment, or management recommendation is calculated. Verify clinical risk, placental and uterine interfaces, possible extension, orientation, and confidence with the multidisciplinary team.',
  };
}
