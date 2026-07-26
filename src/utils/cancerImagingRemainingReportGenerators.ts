import type { ReportingWorkflowSchema, WorkflowValues } from '../data/reportingWorkflowSchemas';
import type { ReportSections } from '../radrep/types';
import { cleanLines, numberOrNull, workflowValue } from './impressionGenerators';

const dimensions = (values: WorkflowValues, keys: string[]) => {
  const entered = keys.map((key) => numberOrNull(values, key)).filter((value): value is number => value !== null);
  return entered.length ? `${entered.join(' × ')} mm` : '';
};
const positiveOrIndeterminate = (values: WorkflowValues, label: string, statusKey: string, detailsKey = '') => {
  const status = workflowValue(values, statusKey);
  if (!['present', 'indeterminate'].includes(status)) return undefined;
  return `${label} is ${status}${detailsKey && workflowValue(values, detailsKey) ? `: ${workflowValue(values, detailsKey)}` : ''}.`;
};

export function generateHccLiverReport(schema: ReportingWorkflowSchema, values: WorkflowValues): ReportSections {
  const status = workflowValue(values, 'observationStatus');
  const quality = workflowValue(values, 'examQuality');
  const limitationText = [workflowValue(values, 'technicalLimitations'), workflowValue(values, 'limitationsUncertainty')].filter(Boolean).join('; ');
  const size = dimensions(values, ['sizeApMm', 'sizeTrMm', 'sizeCcMm']);
  const findingsOverride = workflowValue(values, 'findingsOverride');
  const impressionOverride = workflowValue(values, 'impressionOverride');
  const observation =
    status === 'absent'
      ? 'No focal liver observation is entered.'
      : ['present', 'indeterminate'].includes(status)
        ? `${workflowValue(values, 'observationNumber') || 'Dominant observation'}${workflowValue(values, 'segment') ? ` in ${workflowValue(values, 'segment')}` : ''}${size ? ` measures ${size}` : ''}. ${[
            workflowValue(values, 'arterialEnhancement') && workflowValue(values, 'arterialEnhancement') !== 'not assessed' ? `Arterial enhancement: ${workflowValue(values, 'arterialEnhancement')}` : '',
            workflowValue(values, 'washout') && workflowValue(values, 'washout') !== 'not assessed' ? `washout ${workflowValue(values, 'washout')}` : '',
            workflowValue(values, 'capsule') && workflowValue(values, 'capsule') !== 'not assessed' ? `capsule ${workflowValue(values, 'capsule')}` : '',
            workflowValue(values, 'thresholdGrowth') && workflowValue(values, 'thresholdGrowth') !== 'not assessed' ? `threshold growth ${workflowValue(values, 'thresholdGrowth')}` : '',
          ].filter(Boolean).join('; ')}${workflowValue(values, 'userAssignedLirads') ? ` User-assigned LI-RADS: ${workflowValue(values, 'userAssignedLirads')}.` : ''}${workflowValue(values, 'userAssignedOptn') ? ` User-assigned OPTN status: ${workflowValue(values, 'userAssignedOptn')}.` : ''}`
        : undefined;
  const treatedLine =
    workflowValue(values, 'treatmentStatus') === 'treated' && workflowValue(values, 'treatmentResponse')
      ? `Treated-observation enhancement: ${workflowValue(values, 'treatmentResponse')}.`
      : undefined;
  const stagingLines = [
    positiveOrIndeterminate(values, 'Tumor in vein', 'tumorInVein', 'tumorInVeinDetails'),
    positiveOrIndeterminate(values, 'Portal hypertension findings', 'portalHypertension', 'portalHypertensionDetails'),
    positiveOrIndeterminate(values, 'Suspicious nodal disease', 'suspiciousNodes', 'suspiciousNodeDetails'),
    positiveOrIndeterminate(values, 'Extrahepatic metastatic disease', 'extrahepaticMetastases', 'extrahepaticMetastasisDetails'),
  ];
  const stagingNegative = ['tumorInVein', 'suspiciousNodes', 'extrahepaticMetastases'].every((key) => workflowValue(values, key) === 'absent');
  const generatedFindings = cleanLines([
    workflowValue(values, 'liverBackground') ? `Background liver: ${workflowValue(values, 'liverBackground')}.` : undefined,
    observation, treatedLine,
    workflowValue(values, 'ancillaryFeatures') ? `Ancillary and other features: ${workflowValue(values, 'ancillaryFeatures')}.` : undefined,
    workflowValue(values, 'additionalObservations') ? `Additional observations: ${workflowValue(values, 'additionalObservations')}.` : undefined,
    ...stagingLines,
    stagingNegative ? 'No tumor in vein, suspicious nodes, or extrahepatic metastases are entered.' : undefined,
    workflowValue(values, 'additionalFindings') ? `Additional findings: ${workflowValue(values, 'additionalFindings')}.` : undefined,
    limitationText ? `Limitations: ${limitationText}.` : undefined,
  ]);
  const limitationSummary =
    quality === 'nondiagnostic' ? `Nondiagnostic examination${limitationText ? `: ${limitationText}` : '.'}` :
    quality === 'limited' ? `Limited multiphase liver examination${limitationText ? `: ${limitationText}` : '.'}` : undefined;
  const summary =
    status === 'absent' ? 'No focal liver observation is entered.' :
    status === 'present' ? `${workflowValue(values, 'observationNumber') || 'Dominant liver observation'}${workflowValue(values, 'segment') ? ` in ${workflowValue(values, 'segment')}` : ''}${size ? ` measuring ${size}` : ''}${workflowValue(values, 'userAssignedLirads') ? `, user-assigned LI-RADS ${workflowValue(values, 'userAssignedLirads')}` : ''}.` :
    status === 'indeterminate' ? 'Indeterminate liver observation; correlate with the detailed major features.' : 'Liver observation assessment is incomplete.';
  return {
    indication: cleanLines([
      workflowValue(values, 'clinicalIndication') || schema.clinicalQuestion,
      workflowValue(values, 'riskContext') ? `Risk context: ${workflowValue(values, 'riskContext')}.` : undefined,
      workflowValue(values, 'treatmentHistory') ? `Treatment history: ${workflowValue(values, 'treatmentHistory')}.` : undefined,
    ]),
    technique: cleanLines([
      workflowValue(values, 'modalityProtocol') || schema.techniqueDefault,
      quality ? `Examination quality: ${quality}.` : undefined,
      `Phase adequacy: ${[
        workflowValue(values, 'arterialPhaseAdequacy') ? `arterial ${workflowValue(values, 'arterialPhaseAdequacy')}` : '',
        workflowValue(values, 'portalVenousPhaseAdequacy') ? `portal venous ${workflowValue(values, 'portalVenousPhaseAdequacy')}` : '',
        workflowValue(values, 'delayedPhaseAdequacy') ? `delayed ${workflowValue(values, 'delayedPhaseAdequacy')}` : '',
      ].filter(Boolean).join('; ')}.`,
      workflowValue(values, 'technicalLimitations') ? `Technical limitations: ${workflowValue(values, 'technicalLimitations')}.` : undefined,
    ]),
    findings: findingsOverride || generatedFindings,
    impression: impressionOverride || cleanLines([limitationSummary, summary, treatedLine, ...stagingLines]),
    incidentalFindings: workflowValue(values, 'incidentalFindings'),
    recommendations: 'No LI-RADS, OPTN, transplant, treatment, or management category is calculated. Verify eligibility, phase adequacy, every observation, vascular invasion, and all user-assigned categories before finalizing.',
  };
}

export function generateHilarCholangiocarcinomaReport(schema: ReportingWorkflowSchema, values: WorkflowValues): ReportSections {
  const status = workflowValue(values, 'hilarLesion');
  const quality = workflowValue(values, 'examQuality');
  const limitationText = [workflowValue(values, 'technicalLimitations'), workflowValue(values, 'limitationsUncertainty')].filter(Boolean).join('; ');
  const size = dimensions(values, ['lesionApMm', 'lesionTrMm', 'lesionCcMm']);
  const findingsOverride = workflowValue(values, 'findingsOverride');
  const impressionOverride = workflowValue(values, 'impressionOverride');
  const tumorLine =
    status === 'absent' ? 'No hilar biliary lesion is entered.' :
    status === 'present' ? `Hilar biliary tumor centered at ${workflowValue(values, 'ductalEpicenter') || 'an unspecified ductal site'}${size ? ` measuring ${size}` : ''}. ${workflowValue(values, 'longitudinalExtent') || ''}` :
    status === 'indeterminate' ? `Indeterminate hilar biliary abnormality${workflowValue(values, 'ductalEpicenter') ? ` centered at ${workflowValue(values, 'ductalEpicenter')}` : ''}.` : undefined;
  const ductalLines = [
    workflowValue(values, 'rightDuctExtent') ? `Right ductal extent: ${workflowValue(values, 'rightDuctExtent')}.` : undefined,
    workflowValue(values, 'leftDuctExtent') ? `Left ductal extent: ${workflowValue(values, 'leftDuctExtent')}.` : undefined,
    positiveOrIndeterminate(values, 'Intrahepatic duct dilation', 'intrahepaticDuctDilation'),
    positiveOrIndeterminate(values, 'Lobar atrophy', 'lobarAtrophy', 'lobarAtrophyDetails'),
  ];
  const vascularLines = [
    workflowValue(values, 'portalVeinRelationship') && workflowValue(values, 'portalVeinRelationship') !== 'not assessed'
      ? `Portal vein: ${workflowValue(values, 'portalVeinRelationship')}${workflowValue(values, 'portalVeinDetails') ? `; ${workflowValue(values, 'portalVeinDetails')}` : ''}.` : undefined,
    workflowValue(values, 'hepaticArteryRelationship') && workflowValue(values, 'hepaticArteryRelationship') !== 'not assessed'
      ? `Hepatic artery: ${workflowValue(values, 'hepaticArteryRelationship')}${workflowValue(values, 'hepaticArteryDetails') ? `; ${workflowValue(values, 'hepaticArteryDetails')}` : ''}.` : undefined,
    workflowValue(values, 'vascularVariants') ? `Vascular variants: ${workflowValue(values, 'vascularVariants')}.` : undefined,
    workflowValue(values, 'biliaryVariants') ? `Biliary variants: ${workflowValue(values, 'biliaryVariants')}.` : undefined,
  ];
  const extensionLines = [
    positiveOrIndeterminate(values, 'Liver invasion', 'liverInvasion', 'liverInvasionDetails'),
    positiveOrIndeterminate(values, 'Adjacent-organ invasion', 'adjacentOrganInvasion', 'adjacentOrganDetails'),
    positiveOrIndeterminate(values, 'Suspicious nodal disease', 'suspiciousNodes', 'suspiciousNodeDetails'),
    positiveOrIndeterminate(values, 'Peritoneal metastatic disease', 'peritonealMetastases', 'peritonealMetastasisDetails'),
    positiveOrIndeterminate(values, 'Other distant metastatic disease', 'distantMetastases', 'distantMetastasisDetails'),
  ];
  const generatedFindings = cleanLines([
    tumorLine,
    workflowValue(values, 'morphology') ? `Morphology: ${workflowValue(values, 'morphology')}.` : undefined,
    ...ductalLines, ...vascularLines, ...extensionLines,
    workflowValue(values, 'userAssignedBismuth') ? `User-assigned ductal classification: ${workflowValue(values, 'userAssignedBismuth')}.` : undefined,
    workflowValue(values, 'additionalFindings') ? `Additional findings: ${workflowValue(values, 'additionalFindings')}.` : undefined,
    limitationText ? `Limitations: ${limitationText}.` : undefined,
  ]);
  const limitationSummary =
    quality === 'nondiagnostic' ? `Nondiagnostic examination${limitationText ? `: ${limitationText}` : '.'}` :
    quality === 'limited' ? `Limited hilar tumor assessment${limitationText ? `: ${limitationText}` : '.'}` : undefined;
  const summary =
    status === 'present' ? `Hilar biliary tumor${workflowValue(values, 'ductalEpicenter') ? ` centered at ${workflowValue(values, 'ductalEpicenter')}` : ''}${size ? ` measuring ${size}` : ''}.` :
    status === 'absent' ? 'No hilar biliary lesion is entered.' :
    status === 'indeterminate' ? 'Indeterminate hilar biliary abnormality.' : 'Hilar lesion assessment is incomplete.';
  return {
    indication: cleanLines([
      workflowValue(values, 'clinicalIndication') || schema.clinicalQuestion,
      workflowValue(values, 'clinicalContext') ? `Relevant clinical context: ${workflowValue(values, 'clinicalContext')}.` : undefined,
    ]),
    technique: cleanLines([
      workflowValue(values, 'modalityProtocol') || schema.techniqueDefault,
      quality ? `Examination quality: ${quality}.` : undefined,
      workflowValue(values, 'technicalLimitations') ? `Technical limitations: ${workflowValue(values, 'technicalLimitations')}.` : undefined,
    ]),
    findings: findingsOverride || generatedFindings,
    impression: impressionOverride || cleanLines([
      limitationSummary, summary,
      workflowValue(values, 'longitudinalExtent') ? `Ductal extent: ${workflowValue(values, 'longitudinalExtent')}.` : undefined,
      ...vascularLines.slice(0, 2), ...extensionLines,
      workflowValue(values, 'userStagingSynthesis') || undefined,
    ]),
    incidentalFindings: workflowValue(values, 'incidentalFindings'),
    recommendations: 'No ductal classification, TNM stage, operability, treatment, or management recommendation is calculated. Verify ductal and vascular anatomy, local invasion, nodes, metastases, and user-assigned synthesis before finalizing.',
  };
}

export function generateOvarianCancerReport(schema: ReportingWorkflowSchema, values: WorkflowValues): ReportSections {
  const status = workflowValue(values, 'adnexalPrimary');
  const quality = workflowValue(values, 'examQuality');
  const limitation = [workflowValue(values, 'technicalLimitations'), workflowValue(values, 'limitationsUncertainty')].filter(Boolean).join('; ');
  const size = dimensions(values, ['sizeApMm', 'sizeTrMm', 'sizeCcMm']);
  const primary =
    status === 'absent' ? 'No adnexal primary tumor is entered.' :
    status === 'present' ? `${workflowValue(values, 'laterality') ? `${workflowValue(values, 'laterality')} ` : ''}${workflowValue(values, 'primarySite') || 'adnexal'} primary tumor${size ? ` measuring ${size}` : ''}.` :
    status === 'indeterminate' ? `Indeterminate adnexal primary${size ? ` measuring ${size}` : ''}.` : undefined;
  const disease = [
    positiveOrIndeterminate(values, 'Pelvic peritoneal disease', 'pelvicPeritoneum', 'pelvicPeritoneumDetails'),
    positiveOrIndeterminate(values, 'Omental disease', 'omentum', 'omentumDetails'),
    positiveOrIndeterminate(values, 'Upper abdominal peritoneal disease', 'upperAbdominalPeritoneum', 'upperAbdominalDetails'),
    positiveOrIndeterminate(values, 'Bowel or mesenteric involvement', 'bowelMesentery', 'bowelMesenteryDetails'),
    positiveOrIndeterminate(values, 'Abdominal wall or diaphragmatic invasion', 'abdominalWallDiaphragm', 'abdominalWallDiaphragmDetails'),
    positiveOrIndeterminate(values, 'Suspicious nodal disease', 'suspiciousNodes', 'suspiciousNodeDetails'),
    positiveOrIndeterminate(values, 'Pleural disease', 'pleuralDisease', 'pleuralDiseaseDetails'),
    positiveOrIndeterminate(values, 'Other distant metastatic disease', 'distantMetastases', 'distantMetastasisDetails'),
  ];
  const allNegative = ['pelvicPeritoneum', 'omentum', 'upperAbdominalPeritoneum', 'bowelMesentery', 'abdominalWallDiaphragm', 'suspiciousNodes', 'pleuralDisease', 'distantMetastases'].every((key) => workflowValue(values, key) === 'absent');
  const findings = cleanLines([
    primary,
    workflowValue(values, 'morphology') ? `Primary morphology: ${workflowValue(values, 'morphology')}.` : undefined,
    workflowValue(values, 'solidComponents') ? `Solid components: ${workflowValue(values, 'solidComponents')}.` : undefined,
    workflowValue(values, 'contralateralAdnexa') ? `Contralateral adnexa: ${workflowValue(values, 'contralateralAdnexa')}.` : undefined,
    positiveOrIndeterminate(values, 'Ascites', 'ascites'),
    ...disease,
    allNegative ? 'No peritoneal, bowel/mesenteric, nodal, pleural, or distant metastatic disease is entered.' : undefined,
    workflowValue(values, 'cytoreductionLimitingSites') ? `Potentially surgery-limiting sites: ${workflowValue(values, 'cytoreductionLimitingSites')}.` : undefined,
    workflowValue(values, 'userAssignedFigo') ? `User-assigned FIGO stage: ${workflowValue(values, 'userAssignedFigo')}.` : undefined,
    workflowValue(values, 'additionalFindings') ? `Additional findings: ${workflowValue(values, 'additionalFindings')}.` : undefined,
    limitation ? `Limitations: ${limitation}.` : undefined,
  ]);
  const limitationSummary = quality === 'nondiagnostic' ? `Nondiagnostic examination${limitation ? `: ${limitation}` : '.'}` : quality === 'limited' ? `Limited ovarian cancer staging examination${limitation ? `: ${limitation}` : '.'}` : undefined;
  return {
    indication: cleanLines([workflowValue(values, 'clinicalIndication') || schema.clinicalQuestion, workflowValue(values, 'pathology') ? `Pathology: ${workflowValue(values, 'pathology')}.` : undefined, workflowValue(values, 'clinicalContext') ? `Relevant clinical context: ${workflowValue(values, 'clinicalContext')}.` : undefined]),
    technique: cleanLines([workflowValue(values, 'modalityProtocol') || schema.techniqueDefault, quality ? `Examination quality: ${quality}.` : undefined, workflowValue(values, 'technicalLimitations') ? `Technical limitations: ${workflowValue(values, 'technicalLimitations')}.` : undefined]),
    findings: workflowValue(values, 'findingsOverride') || findings,
    impression: workflowValue(values, 'impressionOverride') || cleanLines([limitationSummary, primary, ...disease, workflowValue(values, 'cytoreductionLimitingSites') ? `Observed potentially surgery-limiting anatomy: ${workflowValue(values, 'cytoreductionLimitingSites')}.` : undefined]),
    incidentalFindings: workflowValue(values, 'incidentalFindings'),
    recommendations: 'No FIGO/TNM stage, cytoreduction assessment, treatment, or management recommendation is calculated. Verify all disease compartments and any user-assigned stage before finalizing.',
  };
}
