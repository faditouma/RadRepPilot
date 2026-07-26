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

export function generateEndometrialCancerMriReport(schema: ReportingWorkflowSchema, values: WorkflowValues): ReportSections {
  const status = workflowValue(values, 'uterineTumor');
  const quality = workflowValue(values, 'examQuality');
  const limitation = [workflowValue(values, 'technicalLimitations'), workflowValue(values, 'limitationsUncertainty')].filter(Boolean).join('; ');
  const size = dimensions(values, ['tumorApMm', 'tumorTrMm', 'tumorCcMm']);
  const primary =
    status === 'absent' ? 'No visible endometrial tumor is entered.' :
    status === 'present' ? `Endometrial tumor${workflowValue(values, 'tumorLocation') ? ` at the ${workflowValue(values, 'tumorLocation')}` : ''}${size ? ` measuring ${size}` : ''}.` :
    status === 'indeterminate' ? `Indeterminate endometrial abnormality${size ? ` measuring ${size}` : ''}.` : undefined;
  const localExtent = [
    positiveOrIndeterminate(values, 'Myometrial invasion', 'myometrialInvasion', 'myometrialInvasionDetails'),
    positiveOrIndeterminate(values, 'Cervical stromal invasion', 'cervicalStromalInvasion', 'cervicalStromalDetails'),
    positiveOrIndeterminate(values, 'Uterine serosal extension', 'serosalExtension', 'serosalExtensionDetails'),
    positiveOrIndeterminate(values, 'Adnexal extension', 'adnexalExtension', 'adnexalExtensionDetails'),
    positiveOrIndeterminate(values, 'Vaginal extension', 'vaginalExtension', 'vaginalExtensionDetails'),
    positiveOrIndeterminate(values, 'Parametrial extension', 'parametrialExtension', 'parametrialExtensionDetails'),
    positiveOrIndeterminate(values, 'Bladder or rectal invasion', 'bladderRectalInvasion', 'bladderRectalDetails'),
  ];
  const metastatic = [
    positiveOrIndeterminate(values, 'Suspicious pelvic nodal disease', 'pelvicNodes', 'pelvicNodeDetails'),
    positiveOrIndeterminate(values, 'Suspicious para-aortic nodal disease', 'paraAorticNodes', 'paraAorticNodeDetails'),
    positiveOrIndeterminate(values, 'Distant metastatic disease', 'distantMetastases', 'distantMetastasisDetails'),
  ];
  const extensionNegative = ['myometrialInvasion', 'cervicalStromalInvasion', 'serosalExtension', 'adnexalExtension', 'vaginalExtension', 'parametrialExtension', 'bladderRectalInvasion'].every((key) => workflowValue(values, key) === 'absent');
  const spreadNegative = ['pelvicNodes', 'paraAorticNodes', 'distantMetastases'].every((key) => workflowValue(values, key) === 'absent');
  const generatedFindings = cleanLines([
    primary,
    workflowValue(values, 'tumorMorphology') ? `Tumor morphology: ${workflowValue(values, 'tumorMorphology')}.` : undefined,
    ...localExtent,
    extensionNegative ? 'No myometrial, cervical stromal, serosal, adnexal, vaginal, parametrial, bladder, or rectal extension is entered.' : undefined,
    ...metastatic,
    spreadNegative ? 'No suspicious pelvic or para-aortic nodes or distant metastases are entered.' : undefined,
    workflowValue(values, 'userAssignedFigo') ? `User-assigned FIGO stage: ${workflowValue(values, 'userAssignedFigo')}.` : undefined,
    workflowValue(values, 'additionalFindings') ? `Additional findings: ${workflowValue(values, 'additionalFindings')}.` : undefined,
    limitation ? `Limitations: ${limitation}.` : undefined,
  ]);
  const limitationSummary =
    quality === 'nondiagnostic' ? `Nondiagnostic pelvic MRI${limitation ? `: ${limitation}` : '.'}` :
    quality === 'limited' ? `Limited endometrial cancer MRI staging examination${limitation ? `: ${limitation}` : '.'}` : undefined;
  return {
    indication: cleanLines([
      workflowValue(values, 'clinicalIndication') || schema.clinicalQuestion,
      workflowValue(values, 'pathology') ? `Pathology: ${workflowValue(values, 'pathology')}.` : undefined,
      workflowValue(values, 'clinicalContext') ? `Relevant clinical context: ${workflowValue(values, 'clinicalContext')}.` : undefined,
      workflowValue(values, 'treatmentHistory') ? `Treatment history: ${workflowValue(values, 'treatmentHistory')}.` : undefined,
    ]),
    technique: cleanLines([
      workflowValue(values, 'modalityProtocol') || schema.techniqueDefault,
      quality ? `Examination quality: ${quality}.` : undefined,
      workflowValue(values, 'technicalLimitations') ? `Technical limitations: ${workflowValue(values, 'technicalLimitations')}.` : undefined,
    ]),
    findings: workflowValue(values, 'findingsOverride') || generatedFindings,
    impression: workflowValue(values, 'impressionOverride') || cleanLines([limitationSummary, primary, ...localExtent, ...metastatic]),
    incidentalFindings: workflowValue(values, 'incidentalFindings'),
    recommendations: 'No FIGO/TNM stage, treatment, or management recommendation is calculated. Verify tumor extent, nodes, metastases, and any user-assigned stage before finalizing.',
  };
}

export function generateCervicalCancerMriReport(schema: ReportingWorkflowSchema, values: WorkflowValues): ReportSections {
  const status = workflowValue(values, 'cervicalTumor');
  const quality = workflowValue(values, 'examQuality');
  const limitation = [workflowValue(values, 'technicalLimitations'), workflowValue(values, 'limitationsUncertainty')].filter(Boolean).join('; ');
  const size = dimensions(values, ['tumorApMm', 'tumorTrMm', 'tumorCcMm']);
  const primary =
    status === 'absent' ? 'No visible cervical tumor is entered.' :
    status === 'present' ? `Cervical tumor${workflowValue(values, 'tumorEpicenter') ? ` centered at the ${workflowValue(values, 'tumorEpicenter')}` : ''}${size ? ` measuring ${size}` : ''}.` :
    status === 'indeterminate' ? `Indeterminate cervical abnormality${size ? ` measuring ${size}` : ''}.` : undefined;
  const localExtent = [
    positiveOrIndeterminate(values, 'Extension into the uterine corpus', 'uterineExtension', 'uterineExtensionDetails'),
    positiveOrIndeterminate(values, 'Vaginal involvement', 'vaginalInvolvement', 'vaginalInvolvementDetails'),
    positiveOrIndeterminate(values, 'Parametrial involvement', 'parametrialInvolvement', 'parametrialDetails'),
    positiveOrIndeterminate(values, 'Pelvic sidewall involvement', 'pelvicSidewallInvolvement', 'pelvicSidewallDetails'),
    positiveOrIndeterminate(values, 'Bladder invasion', 'bladderInvasion', 'bladderInvasionDetails'),
    positiveOrIndeterminate(values, 'Rectal invasion', 'rectalInvasion', 'rectalInvasionDetails'),
    positiveOrIndeterminate(values, 'Ureteric obstruction or hydronephrosis', 'uretericObstruction', 'uretericObstructionDetails'),
  ];
  const metastatic = [
    positiveOrIndeterminate(values, 'Suspicious pelvic nodal disease', 'pelvicNodes', 'pelvicNodeDetails'),
    positiveOrIndeterminate(values, 'Suspicious para-aortic nodal disease', 'paraAorticNodes', 'paraAorticNodeDetails'),
    positiveOrIndeterminate(values, 'Distant metastatic disease', 'distantMetastases', 'distantMetastasisDetails'),
  ];
  const localNegative = ['uterineExtension', 'vaginalInvolvement', 'parametrialInvolvement', 'pelvicSidewallInvolvement', 'bladderInvasion', 'rectalInvasion', 'uretericObstruction'].every((key) => workflowValue(values, key) === 'absent');
  const spreadNegative = ['pelvicNodes', 'paraAorticNodes', 'distantMetastases'].every((key) => workflowValue(values, key) === 'absent');
  const generatedFindings = cleanLines([
    primary,
    workflowValue(values, 'tumorMorphology') ? `Tumor morphology: ${workflowValue(values, 'tumorMorphology')}.` : undefined,
    workflowValue(values, 'endocervicalCanalExtension') ? `Endocervical canal extent: ${workflowValue(values, 'endocervicalCanalExtension')}.` : undefined,
    ...localExtent,
    localNegative ? 'No uterine, vaginal, parametrial, pelvic sidewall, bladder, or rectal extension or ureteric obstruction is entered.' : undefined,
    ...metastatic,
    spreadNegative ? 'No suspicious pelvic or para-aortic nodes or distant metastases are entered.' : undefined,
    workflowValue(values, 'userAssignedFigo') ? `User-assigned FIGO stage: ${workflowValue(values, 'userAssignedFigo')}.` : undefined,
    workflowValue(values, 'additionalFindings') ? `Additional findings: ${workflowValue(values, 'additionalFindings')}.` : undefined,
    limitation ? `Limitations: ${limitation}.` : undefined,
  ]);
  const limitationSummary =
    quality === 'nondiagnostic' ? `Nondiagnostic pelvic MRI${limitation ? `: ${limitation}` : '.'}` :
    quality === 'limited' ? `Limited cervical cancer MRI staging examination${limitation ? `: ${limitation}` : '.'}` : undefined;
  return {
    indication: cleanLines([
      workflowValue(values, 'clinicalIndication') || schema.clinicalQuestion,
      workflowValue(values, 'pathology') ? `Pathology: ${workflowValue(values, 'pathology')}.` : undefined,
      workflowValue(values, 'clinicalContext') ? `Relevant clinical context: ${workflowValue(values, 'clinicalContext')}.` : undefined,
      workflowValue(values, 'treatmentHistory') ? `Treatment history: ${workflowValue(values, 'treatmentHistory')}.` : undefined,
    ]),
    technique: cleanLines([
      workflowValue(values, 'modalityProtocol') || schema.techniqueDefault,
      quality ? `Examination quality: ${quality}.` : undefined,
      workflowValue(values, 'technicalLimitations') ? `Technical limitations: ${workflowValue(values, 'technicalLimitations')}.` : undefined,
    ]),
    findings: workflowValue(values, 'findingsOverride') || generatedFindings,
    impression: workflowValue(values, 'impressionOverride') || cleanLines([limitationSummary, primary, ...localExtent, ...metastatic]),
    incidentalFindings: workflowValue(values, 'incidentalFindings'),
    recommendations: 'No FIGO/TNM stage, treatment, or management recommendation is calculated. Verify tumor extent, urinary obstruction, nodes, metastases, and any user-assigned stage before finalizing.',
  };
}

export function generateLungCancerCtReport(schema: ReportingWorkflowSchema, values: WorkflowValues): ReportSections {
  const status = workflowValue(values, 'primaryTumor');
  const quality = workflowValue(values, 'examQuality');
  const limitation = [workflowValue(values, 'technicalLimitations'), workflowValue(values, 'limitationsUncertainty')].filter(Boolean).join('; ');
  const size = dimensions(values, ['tumorApMm', 'tumorTrMm', 'tumorCcMm']);
  const primary =
    status === 'absent' ? 'No primary lung tumor is entered.' :
    status === 'present' ? `${workflowValue(values, 'primaryLobe') || 'Lung'} primary tumor${workflowValue(values, 'primaryLocation') ? ` at ${workflowValue(values, 'primaryLocation')}` : ''}${size ? ` measuring ${size}` : ''}.` :
    status === 'indeterminate' ? `Indeterminate pulmonary primary${workflowValue(values, 'primaryLobe') ? ` in the ${workflowValue(values, 'primaryLobe')}` : ''}${size ? ` measuring ${size}` : ''}.` : undefined;
  const localExtent = [
    positiveOrIndeterminate(values, 'Airway obstruction or postobstructive change', 'airwayObstruction', 'airwayObstructionDetails'),
    positiveOrIndeterminate(values, 'Visceral pleural invasion', 'visceralPleuralInvasion', 'visceralPleuralDetails'),
    positiveOrIndeterminate(values, 'Chest wall invasion', 'chestWallInvasion', 'chestWallDetails'),
    positiveOrIndeterminate(values, 'Mediastinal invasion', 'mediastinalInvasion', 'mediastinalDetails'),
    positiveOrIndeterminate(values, 'Diaphragmatic invasion', 'diaphragmaticInvasion', 'diaphragmaticDetails'),
    positiveOrIndeterminate(values, 'Cardiac or great-vessel invasion', 'cardiacGreatVesselInvasion', 'cardiacGreatVesselDetails'),
  ];
  const thoracicSpread = [
    positiveOrIndeterminate(values, 'Separate same-lobe pulmonary nodules', 'sameLobeNodules', 'sameLobeNoduleDetails'),
    positiveOrIndeterminate(values, 'Separate nodules in another ipsilateral lobe', 'ipsilateralOtherLobeNodules', 'ipsilateralOtherLobeDetails'),
    positiveOrIndeterminate(values, 'Contralateral pulmonary nodules', 'contralateralLungNodules', 'contralateralNoduleDetails'),
    positiveOrIndeterminate(values, 'Suspicious thoracic nodal disease', 'suspiciousNodes', 'suspiciousNodeDetails'),
    positiveOrIndeterminate(values, 'Pleural disease', 'pleuralDisease', 'pleuralDiseaseDetails'),
    positiveOrIndeterminate(values, 'Pericardial disease', 'pericardialDisease', 'pericardialDiseaseDetails'),
  ];
  const distant = [
    positiveOrIndeterminate(values, 'Adrenal metastatic disease', 'adrenalMetastases', 'adrenalMetastasisDetails'),
    positiveOrIndeterminate(values, 'Hepatic metastatic disease', 'liverMetastases', 'liverMetastasisDetails'),
    positiveOrIndeterminate(values, 'Osseous metastatic disease', 'boneMetastases', 'boneMetastasisDetails'),
    positiveOrIndeterminate(values, 'Other distant metastatic disease', 'otherDistantMetastases', 'otherDistantMetastasisDetails'),
  ];
  const thoracicNegative = ['sameLobeNodules', 'ipsilateralOtherLobeNodules', 'contralateralLungNodules', 'suspiciousNodes', 'pleuralDisease', 'pericardialDisease'].every((key) => workflowValue(values, key) === 'absent');
  const distantNegative = ['adrenalMetastases', 'liverMetastases', 'boneMetastases', 'otherDistantMetastases'].every((key) => workflowValue(values, key) === 'absent');
  const generatedFindings = cleanLines([
    primary,
    workflowValue(values, 'tumorMorphology') ? `Primary tumor morphology: ${workflowValue(values, 'tumorMorphology')}.` : undefined,
    ...localExtent,
    ...thoracicSpread,
    thoracicNegative ? 'No separate pulmonary nodules, suspicious thoracic nodes, pleural disease, or pericardial disease are entered.' : undefined,
    ...distant,
    distantNegative ? 'No adrenal, hepatic, osseous, or other distant metastases are entered.' : undefined,
    workflowValue(values, 'userAssignedTnm') ? `User-entered TNM: ${workflowValue(values, 'userAssignedTnm')}.` : undefined,
    workflowValue(values, 'userAssignedStage') ? `User-entered stage group: ${workflowValue(values, 'userAssignedStage')}.` : undefined,
    workflowValue(values, 'additionalFindings') ? `Additional findings: ${workflowValue(values, 'additionalFindings')}.` : undefined,
    limitation ? `Limitations: ${limitation}.` : undefined,
  ]);
  const limitationSummary =
    quality === 'nondiagnostic' ? `Nondiagnostic lung cancer staging CT${limitation ? `: ${limitation}` : '.'}` :
    quality === 'limited' ? `Limited lung cancer staging CT${limitation ? `: ${limitation}` : '.'}` : undefined;
  return {
    indication: cleanLines([
      workflowValue(values, 'clinicalIndication') || schema.clinicalQuestion,
      workflowValue(values, 'pathology') ? `Pathology: ${workflowValue(values, 'pathology')}.` : undefined,
      workflowValue(values, 'clinicalContext') ? `Relevant clinical context: ${workflowValue(values, 'clinicalContext')}.` : undefined,
      workflowValue(values, 'treatmentHistory') ? `Treatment history: ${workflowValue(values, 'treatmentHistory')}.` : undefined,
    ]),
    technique: cleanLines([
      workflowValue(values, 'modalityProtocol') || schema.techniqueDefault,
      quality ? `Examination quality: ${quality}.` : undefined,
      workflowValue(values, 'technicalLimitations') ? `Technical limitations: ${workflowValue(values, 'technicalLimitations')}.` : undefined,
    ]),
    findings: workflowValue(values, 'findingsOverride') || generatedFindings,
    impression: workflowValue(values, 'impressionOverride') || cleanLines([limitationSummary, primary, ...localExtent, ...thoracicSpread, ...distant]),
    incidentalFindings: workflowValue(values, 'incidentalFindings'),
    recommendations: 'No TNM category, stage group, treatment, or management recommendation is calculated. Verify local invasion, nodal stations, metastatic disease, and all user-entered staging before finalizing.',
  };
}

export function generateThyroidUltrasoundReport(schema: ReportingWorkflowSchema, values: WorkflowValues): ReportSections {
  const status = workflowValue(values, 'dominantNodule');
  const quality = workflowValue(values, 'examQuality');
  const limitation = [workflowValue(values, 'technicalLimitations'), workflowValue(values, 'limitationsUncertainty')].filter(Boolean).join('; ');
  const size = dimensions(values, ['noduleApMm', 'noduleTrMm', 'noduleCcMm']);
  const nodule =
    status === 'absent' ? 'No clinically relevant thyroid nodule is entered.' :
    status === 'present' ? `${workflowValue(values, 'noduleIdentifier') || 'Thyroid nodule'} in the ${[workflowValue(values, 'noduleSide'), workflowValue(values, 'noduleLocation')].filter(Boolean).join(' ') || 'thyroid'}${size ? ` measures ${size}` : ''}.` :
    status === 'indeterminate' ? `Indeterminate thyroid nodule${size ? ` measuring ${size}` : ''}.` : undefined;
  const descriptors = status === 'present' || status === 'indeterminate'
    ? [
        workflowValue(values, 'composition') ? `composition ${workflowValue(values, 'composition')}` : '',
        workflowValue(values, 'echogenicity') ? `echogenicity ${workflowValue(values, 'echogenicity')}` : '',
        workflowValue(values, 'shape') ? `shape ${workflowValue(values, 'shape')}` : '',
        workflowValue(values, 'margins') ? `margins ${workflowValue(values, 'margins')}` : '',
        workflowValue(values, 'echogenicFoci') ? `echogenic foci ${workflowValue(values, 'echogenicFoci')}` : '',
      ].filter(Boolean).join('; ')
    : '';
  const interval = workflowValue(values, 'intervalChange');
  const generatedFindings = cleanLines([
    workflowValue(values, 'glandBackground') ? `Thyroid gland: ${workflowValue(values, 'glandBackground')}.` : undefined,
    workflowValue(values, 'rightLobeSize') ? `Right lobe: ${workflowValue(values, 'rightLobeSize')}.` : undefined,
    workflowValue(values, 'leftLobeSize') ? `Left lobe: ${workflowValue(values, 'leftLobeSize')}.` : undefined,
    workflowValue(values, 'isthmusThicknessMm') ? `Isthmus thickness: ${workflowValue(values, 'isthmusThicknessMm')} mm.` : undefined,
    workflowValue(values, 'glandVascularity') ? `Gland vascularity: ${workflowValue(values, 'glandVascularity')}.` : undefined,
    nodule,
    descriptors ? `Nodule descriptors: ${descriptors}.` : undefined,
    workflowValue(values, 'noduleVascularity') ? `Nodule vascularity: ${workflowValue(values, 'noduleVascularity')}.` : undefined,
    positiveOrIndeterminate(values, 'Extrathyroidal extension', 'extrathyroidalExtension', 'extrathyroidalExtensionDetails'),
    interval ? `Interval change: ${interval}${workflowValue(values, 'intervalChangeDetails') ? `; ${workflowValue(values, 'intervalChangeDetails')}` : ''}.` : undefined,
    workflowValue(values, 'userAssignedTirads') ? `User-entered TI-RADS category: ${workflowValue(values, 'userAssignedTirads')}.` : undefined,
    workflowValue(values, 'additionalNodules') ? `Additional nodules: ${workflowValue(values, 'additionalNodules')}.` : undefined,
    positiveOrIndeterminate(values, 'Suspicious cervical lymph nodes', 'cervicalNodes', 'cervicalNodeDetails'),
    workflowValue(values, 'cervicalNodes') === 'absent' ? 'No suspicious cervical lymph nodes are entered.' : undefined,
    workflowValue(values, 'additionalFindings') ? `Additional findings: ${workflowValue(values, 'additionalFindings')}.` : undefined,
    limitation ? `Limitations: ${limitation}.` : undefined,
  ]);
  const limitationSummary =
    quality === 'nondiagnostic' ? `Nondiagnostic thyroid ultrasound${limitation ? `: ${limitation}` : '.'}` :
    quality === 'limited' ? `Limited thyroid ultrasound${limitation ? `: ${limitation}` : '.'}` : undefined;
  return {
    indication: cleanLines([
      workflowValue(values, 'clinicalIndication') || schema.clinicalQuestion,
      workflowValue(values, 'clinicalContext') ? `Relevant clinical context: ${workflowValue(values, 'clinicalContext')}.` : undefined,
      workflowValue(values, 'priorBiopsy') ? `Prior biopsy/pathology: ${workflowValue(values, 'priorBiopsy')}.` : undefined,
    ]),
    technique: cleanLines([
      workflowValue(values, 'modalityProtocol') || schema.techniqueDefault,
      quality ? `Examination quality: ${quality}.` : undefined,
      workflowValue(values, 'technicalLimitations') ? `Technical limitations: ${workflowValue(values, 'technicalLimitations')}.` : undefined,
    ]),
    findings: workflowValue(values, 'findingsOverride') || generatedFindings,
    impression: workflowValue(values, 'impressionOverride') || cleanLines([
      limitationSummary,
      nodule,
      descriptors ? `Sonographic descriptors: ${descriptors}.` : undefined,
      positiveOrIndeterminate(values, 'Extrathyroidal extension', 'extrathyroidalExtension', 'extrathyroidalExtensionDetails'),
      positiveOrIndeterminate(values, 'Suspicious cervical lymph nodes', 'cervicalNodes', 'cervicalNodeDetails'),
    ]),
    incidentalFindings: workflowValue(values, 'incidentalFindings'),
    recommendations: 'No TI-RADS score/category, biopsy threshold, surveillance interval, treatment, or management recommendation is calculated. Verify every nodule, comparison, cervical nodes, and any user-entered category before finalizing.',
  };
}
