import type { ReportingWorkflowSchema, WorkflowValues } from '../data/reportingWorkflowSchemas';
import type { ReportSections } from '../radrep/types';
import { cleanLines, numberOrNull, workflowValue } from './impressionGenerators';

const dimensions = (values: WorkflowValues, keys: string[]) => {
  const entered = keys.map((key) => numberOrNull(values, key)).filter((value): value is number => value !== null);
  return entered.length ? `${entered.join(' × ')} mm` : '';
};

export function generateCtColonographyReport(schema: ReportingWorkflowSchema, values: WorkflowValues): ReportSections {
  const quality = workflowValue(values, 'examQuality');
  const lesionStatus = workflowValue(values, 'colonicLesion');
  const complete = workflowValue(values, 'completeColonAssessment');
  const limitation = [workflowValue(values, 'technicalLimitations'), workflowValue(values, 'limitationsUncertainty')].filter(Boolean).join('; ');
  const size = dimensions(values, ['lesionApMm', 'lesionTrMm', 'lesionCcMm']);
  const lesionLine =
    lesionStatus === 'absent' ? 'No colonic polyp or mass is identified in the assessed segments.' :
    lesionStatus === 'present' ? `${workflowValue(values, 'lesionNumber') || 'Dominant lesion'} in the ${workflowValue(values, 'lesionSegment') || 'unspecified colonic segment'}${workflowValue(values, 'distanceFromAnalVergeCm') ? `, ${workflowValue(values, 'distanceFromAnalVergeCm')} cm from the anal verge` : ''}${size ? `, measures ${size}` : ''}. ${[
      workflowValue(values, 'lesionMorphology') ? `Morphology: ${workflowValue(values, 'lesionMorphology')}` : '',
      workflowValue(values, 'lesionMobility') ? `mobility: ${workflowValue(values, 'lesionMobility')}` : '',
      workflowValue(values, 'lesionConfidence') ? `confidence: ${workflowValue(values, 'lesionConfidence')}` : '',
      workflowValue(values, 'lesionAttenuation') ? `characteristics: ${workflowValue(values, 'lesionAttenuation')}` : '',
    ].filter(Boolean).join('; ')}.` :
    lesionStatus === 'indeterminate' ? `Indeterminate colonic finding${workflowValue(values, 'lesionSegment') ? ` in the ${workflowValue(values, 'lesionSegment')}` : ''}${size ? ` measuring ${size}` : ''}${workflowValue(values, 'lesionConfidence') ? ` (${workflowValue(values, 'lesionConfidence')} confidence)` : ''}.` :
    lesionStatus === 'not assessed' ? 'Colonic polyps and masses were not adequately assessed.' : undefined;
  const strictureStatus = workflowValue(values, 'stricture');
  const strictureLine =
    strictureStatus === 'present' ? `Colonic stricture: ${workflowValue(values, 'strictureDetails') || 'details not entered'}.` :
    strictureStatus === 'indeterminate' ? `Indeterminate colonic stricture${workflowValue(values, 'strictureDetails') ? `: ${workflowValue(values, 'strictureDetails')}` : ''}.` :
    strictureStatus === 'not assessed' ? 'Colonic stricture was not adequately assessed.' : undefined;
  const segmentQuality = [
    workflowValue(values, 'rectosigmoidDistention') ? `rectum/sigmoid ${workflowValue(values, 'rectosigmoidDistention')}` : '',
    workflowValue(values, 'descendingDistention') ? `descending ${workflowValue(values, 'descendingDistention')}` : '',
    workflowValue(values, 'transverseDistention') ? `transverse ${workflowValue(values, 'transverseDistention')}` : '',
    workflowValue(values, 'ascendingCecalDistention') ? `ascending/cecum ${workflowValue(values, 'ascendingCecalDistention')}` : '',
  ].filter(Boolean).join('; ');
  const incompleteLine =
    complete === 'absent' || complete === 'indeterminate' || complete === 'not assessed'
      ? `Incomplete colonic assessment${workflowValue(values, 'incompleteSegments') ? `: ${workflowValue(values, 'incompleteSegments')}` : '.'}`
      : undefined;
  const generatedFindings = cleanLines([
    segmentQuality ? `Colonic distention: ${segmentQuality}.` : undefined,
    workflowValue(values, 'residualMaterial') ? `Residual material: ${workflowValue(values, 'residualMaterial')}.` : undefined,
    incompleteLine, lesionLine,
    workflowValue(values, 'additionalLesions') ? `Additional lesions: ${workflowValue(values, 'additionalLesions')}.` : undefined,
    strictureLine,
    workflowValue(values, 'diverticularDisease') ? `Diverticular disease: ${workflowValue(values, 'diverticularDisease')}.` : undefined,
    workflowValue(values, 'otherColonicFindings') ? `Other colonic findings: ${workflowValue(values, 'otherColonicFindings')}.` : undefined,
    workflowValue(values, 'extracolonicFindings') ? `Extracolonic findings: ${workflowValue(values, 'extracolonicFindings')}.` : undefined,
    workflowValue(values, 'userAssignedColonicCategory') ? `User-entered colonic category: ${workflowValue(values, 'userAssignedColonicCategory')}.` : undefined,
    workflowValue(values, 'userAssignedExtracolonicCategory') ? `User-entered extracolonic category: ${workflowValue(values, 'userAssignedExtracolonicCategory')}.` : undefined,
    limitation ? `Limitations: ${limitation}.` : undefined,
  ]);
  const limitationSummary =
    quality === 'nondiagnostic' ? `Nondiagnostic CT colonography${limitation ? `: ${limitation}` : '.'}` :
    quality === 'limited' ? `Limited CT colonography${incompleteLine ? `; ${incompleteLine.toLowerCase()}` : limitation ? `: ${limitation}` : '.'}` : undefined;
  const lesionSummary =
    lesionStatus === 'absent' && complete === 'present' ? 'No colonic polyp, mass, or stricture is identified.' :
    lesionStatus === 'present' ? `${workflowValue(values, 'lesionMorphology') || 'Colonic lesion'} in the ${workflowValue(values, 'lesionSegment') || 'unspecified segment'}${size ? ` measuring ${size}` : ''}.` :
    lesionStatus === 'indeterminate' ? `Indeterminate distal or colonic filling abnormality${workflowValue(values, 'lesionSegment') ? ` in the ${workflowValue(values, 'lesionSegment')}` : ''}.` :
    lesionStatus === 'not assessed' ? 'Colonic lesion assessment is incomplete.' : 'Colonic lesion assessment is not entered.';
  return {
    indication: cleanLines([
      workflowValue(values, 'clinicalIndication') || schema.clinicalQuestion,
      workflowValue(values, 'clinicalContext') ? `Relevant clinical context: ${workflowValue(values, 'clinicalContext')}.` : undefined,
    ]),
    technique: cleanLines([
      workflowValue(values, 'modalityProtocol') || schema.techniqueDefault,
      quality ? `Examination quality: ${quality}.` : undefined,
      workflowValue(values, 'preparationQuality') ? `Bowel preparation: ${workflowValue(values, 'preparationQuality')}.` : undefined,
      limitation ? `Technical limitations: ${limitation}.` : undefined,
    ]),
    findings: workflowValue(values, 'findingsOverride') || generatedFindings,
    impression: workflowValue(values, 'impressionOverride') || cleanLines([
      limitationSummary, lesionSummary, strictureLine,
      workflowValue(values, 'extracolonicFindings') ? `Relevant extracolonic findings: ${workflowValue(values, 'extracolonicFindings')}.` : undefined,
      workflowValue(values, 'userAssignedColonicCategory') ? `User-entered colonic category: ${workflowValue(values, 'userAssignedColonicCategory')}.` : undefined,
      workflowValue(values, 'userAssignedExtracolonicCategory') ? `User-entered extracolonic category: ${workflowValue(values, 'userAssignedExtracolonicCategory')}.` : undefined,
    ]),
    incidentalFindings: workflowValue(values, 'extracolonicFindings'),
    recommendations: 'No colonic or extracolonic category, surveillance interval, or management recommendation is calculated. Verify preparation, segmental distention, complete colonic visualization, all lesions, and user-entered categories before finalizing.',
  };
}

const assessedFinding = (values: WorkflowValues, label: string, statusKey: string, detailsKey = '') => {
  const status = workflowValue(values, statusKey);
  if (status === 'absent') return undefined;
  if (!['present', 'indeterminate', 'not assessed'].includes(status)) return undefined;
  return `${label}: ${status}${detailsKey && workflowValue(values, detailsKey) ? `; ${workflowValue(values, detailsKey)}` : ''}.`;
};

export function generateEnterographyReport(schema: ReportingWorkflowSchema, values: WorkflowValues): ReportSections {
  const quality = workflowValue(values, 'examQuality');
  const activity = workflowValue(values, 'activeInflammation');
  const limitation = [workflowValue(values, 'technicalLimitations'), workflowValue(values, 'limitationsUncertainty')].filter(Boolean).join('; ');
  const muralLine =
    activity === 'absent' ? 'No active mural small-bowel inflammation is identified.' :
    ['present', 'indeterminate'].includes(activity) ? `${activity === 'present' ? 'Active inflammatory changes' : 'Indeterminate mural abnormality'} involving the ${workflowValue(values, 'involvedSegment') || 'unspecified bowel segment'}${workflowValue(values, 'involvedLengthCm') ? ` over ${workflowValue(values, 'involvedLengthCm')} cm` : ''}${workflowValue(values, 'muralThicknessMm') ? `, with mural thickness up to ${workflowValue(values, 'muralThicknessMm')} mm` : ''}. ${[
      workflowValue(values, 'muralEnhancement') ? `Enhancement: ${workflowValue(values, 'muralEnhancement')}` : '',
      workflowValue(values, 'muralEdema') ? `edema: ${workflowValue(values, 'muralEdema')}` : '',
      workflowValue(values, 'diffusionRestriction') ? `diffusion restriction: ${workflowValue(values, 'diffusionRestriction')}` : '',
      workflowValue(values, 'ulceration') ? `ulceration: ${workflowValue(values, 'ulceration')}` : '',
    ].filter(Boolean).join('; ')}.` :
    activity === 'not assessed' ? 'Active mural inflammation was not adequately assessed.' : undefined;
  const strictureStatus = workflowValue(values, 'stricture');
  const strictureLine =
    ['present', 'indeterminate'].includes(strictureStatus)
      ? `${strictureStatus === 'present' ? 'Stricture' : 'Indeterminate stricture'} at the ${workflowValue(values, 'strictureLocation') || 'unspecified location'}${workflowValue(values, 'strictureLengthCm') ? ` spanning ${workflowValue(values, 'strictureLengthCm')} cm` : ''}${workflowValue(values, 'upstreamDilation') ? `; upstream dilation ${workflowValue(values, 'upstreamDilation')}${workflowValue(values, 'upstreamDiameterMm') ? ` to ${workflowValue(values, 'upstreamDiameterMm')} mm` : ''}` : ''}.`
      : strictureStatus === 'not assessed' ? 'Stricture was not adequately assessed.' : undefined;
  const complicationLines = [
    assessedFinding(values, 'Fistula or sinus tract', 'penetratingDisease', 'fistulaDetails'),
    assessedFinding(values, 'Abscess or phlegmon', 'abscessPhlegmon', 'abscessPhlegmonDetails'),
    assessedFinding(values, 'Mesenteric inflammatory change', 'mesentericInflammation', 'mesentericDetails'),
    assessedFinding(values, 'Suspicious lymph nodes', 'suspiciousNodes', 'suspiciousNodeDetails'),
  ];
  const negativeComplications = ['stricture', 'penetratingDisease', 'abscessPhlegmon'].every((key) => workflowValue(values, key) === 'absent');
  const generatedFindings = cleanLines([
    muralLine, strictureLine, ...complicationLines,
    negativeComplications ? 'No stricture, penetrating disease, abscess, or phlegmon is identified.' : undefined,
    workflowValue(values, 'additionalBowelFindings') ? `Additional bowel findings: ${workflowValue(values, 'additionalBowelFindings')}.` : undefined,
    workflowValue(values, 'extraintestinalFindings') ? `Extraintestinal findings: ${workflowValue(values, 'extraintestinalFindings')}.` : undefined,
    workflowValue(values, 'intervalChange') ? `Interval change: ${workflowValue(values, 'intervalChange')}.` : undefined,
    limitation ? `Limitations: ${limitation}.` : undefined,
  ]);
  const limitationSummary =
    quality === 'nondiagnostic' ? `Nondiagnostic enterography examination${limitation ? `: ${limitation}` : '.'}` :
    quality === 'limited' ? `Limited enterography examination${workflowValue(values, 'incompleteSegments') ? `: ${workflowValue(values, 'incompleteSegments')}` : limitation ? `: ${limitation}` : '.'}` : undefined;
  const activitySummary =
    activity === 'absent' ? 'No active small-bowel inflammation.' :
    activity === 'present' ? `Active inflammation involving the ${workflowValue(values, 'involvedSegment') || 'specified bowel segment'}${workflowValue(values, 'involvedLengthCm') ? ` over ${workflowValue(values, 'involvedLengthCm')} cm` : ''}.` :
    activity === 'indeterminate' ? `Indeterminate inflammatory change involving the ${workflowValue(values, 'involvedSegment') || 'specified bowel segment'}.` :
    activity === 'not assessed' ? 'Bowel inflammatory activity is not adequately assessed.' : 'Bowel inflammatory activity is not entered.';
  return {
    indication: cleanLines([
      workflowValue(values, 'clinicalIndication') || schema.clinicalQuestion,
      workflowValue(values, 'clinicalContext') ? `Relevant clinical context: ${workflowValue(values, 'clinicalContext')}.` : undefined,
    ]),
    technique: cleanLines([
      workflowValue(values, 'modalityProtocol') || schema.techniqueDefault,
      quality ? `Examination quality: ${quality}.` : undefined,
      workflowValue(values, 'bowelDistention') ? `Small-bowel distention: ${workflowValue(values, 'bowelDistention')}.` : undefined,
      limitation ? `Technical limitations: ${limitation}.` : undefined,
    ]),
    findings: workflowValue(values, 'findingsOverride') || generatedFindings,
    impression: workflowValue(values, 'impressionOverride') || cleanLines([
      limitationSummary, activitySummary, strictureLine, ...complicationLines.slice(0, 2),
      workflowValue(values, 'userActivitySynthesis') || undefined,
      workflowValue(values, 'extraintestinalFindings') ? `Relevant extraintestinal findings: ${workflowValue(values, 'extraintestinalFindings')}.` : undefined,
    ]),
    incidentalFindings: workflowValue(values, 'incidentalFindings'),
    recommendations: 'No disease-activity score, treatment, surveillance interval, or management recommendation is calculated. Verify bowel distention, involved segments, strictures, penetrating complications, and comparison before finalizing.',
  };
}

export function generatePerianalFistulaMriReport(schema: ReportingWorkflowSchema, values: WorkflowValues): ReportSections {
  const quality = workflowValue(values, 'examQuality');
  const status = workflowValue(values, 'primaryFistula');
  const limitation = [workflowValue(values, 'technicalLimitations'), workflowValue(values, 'limitationsUncertainty')].filter(Boolean).join('; ');
  const collectionSize = dimensions(values, ['abscessApMm', 'abscessTrMm', 'abscessCcMm']);
  const tractLine =
    status === 'absent' ? 'No perianal fistula tract is identified.' :
    status === 'present' ? `${workflowValue(values, 'tractClassification') || 'Perianal fistula tract'} with internal opening at ${workflowValue(values, 'internalOpeningClock') || 'an unspecified clock-face position'}${workflowValue(values, 'internalOpeningHeightCm') ? `, ${workflowValue(values, 'internalOpeningHeightCm')} cm above the anal verge` : ''}. ${workflowValue(values, 'tractCourse') || ''}${workflowValue(values, 'externalOpening') ? ` External opening: ${workflowValue(values, 'externalOpening')}.` : ''}${workflowValue(values, 'tractActivity') ? ` Appearance: ${workflowValue(values, 'tractActivity')}.` : ''}` :
    status === 'indeterminate' ? `Indeterminate perianal tract${workflowValue(values, 'internalOpeningClock') ? ` with possible internal opening at ${workflowValue(values, 'internalOpeningClock')}` : ''}.` :
    status === 'not assessed' ? 'Perianal fistula was not adequately assessed.' : undefined;
  const abscessStatus = workflowValue(values, 'abscess');
  const collectionLine =
    abscessStatus === 'present' ? `Perianal collection at ${workflowValue(values, 'abscessLocation') || 'an unspecified location'}${collectionSize ? ` measuring ${collectionSize}` : ''}.` :
    abscessStatus === 'indeterminate' ? `Indeterminate perianal collection${workflowValue(values, 'abscessLocation') ? ` at ${workflowValue(values, 'abscessLocation')}` : ''}${collectionSize ? ` measuring ${collectionSize}` : ''}.` :
    abscessStatus === 'not assessed' ? 'Perianal collection was not adequately assessed.' : undefined;
  const extensions = [
    assessedFinding(values, 'Secondary tracts', 'secondaryTracts', 'secondaryTractDetails'),
    assessedFinding(values, 'Horseshoe component', 'horseshoeExtension'),
    assessedFinding(values, 'Supralevator extension', 'supralevatorExtension'),
    assessedFinding(values, 'Translevator extension', 'translevatorExtension'),
    assessedFinding(values, 'Proctitis', 'proctitis', 'proctitisDetails'),
  ];
  const noComplication = ['secondaryTracts', 'abscess', 'horseshoeExtension', 'supralevatorExtension', 'translevatorExtension'].every((key) => workflowValue(values, key) === 'absent');
  const generatedFindings = cleanLines([
    tractLine, collectionLine, ...extensions,
    noComplication ? 'No secondary tract, collection, horseshoe component, or supralevator/translevator extension.' : undefined,
    workflowValue(values, 'userAssignedClassification') ? `User-entered classification: ${workflowValue(values, 'userAssignedClassification')}.` : undefined,
    workflowValue(values, 'additionalFindings') ? `Additional findings: ${workflowValue(values, 'additionalFindings')}.` : undefined,
    limitation ? `Limitations: ${limitation}.` : undefined,
  ]);
  const limitationSummary =
    quality === 'nondiagnostic' ? `Nondiagnostic perianal MRI${limitation ? `: ${limitation}` : '.'}` :
    quality === 'limited' ? `Limited perianal MRI${limitation ? `: ${limitation}` : '.'}` : undefined;
  const summary =
    status === 'absent' ? 'No perianal fistula or abscess.' :
    status === 'present' ? `${workflowValue(values, 'tractClassification') || 'Perianal fistula'}${workflowValue(values, 'internalOpeningClock') ? ` with internal opening at ${workflowValue(values, 'internalOpeningClock')}` : ''}${workflowValue(values, 'tractActivity') ? `; ${workflowValue(values, 'tractActivity')}` : ''}.` :
    status === 'indeterminate' ? 'Indeterminate perianal fistula tract.' : 'Perianal fistula assessment is incomplete.';
  return {
    indication: cleanLines([workflowValue(values, 'clinicalIndication') || schema.clinicalQuestion, workflowValue(values, 'clinicalContext') ? `Relevant clinical context: ${workflowValue(values, 'clinicalContext')}.` : undefined]),
    technique: cleanLines([workflowValue(values, 'modalityProtocol') || schema.techniqueDefault, quality ? `Examination quality: ${quality}.` : undefined, limitation ? `Technical limitations: ${limitation}.` : undefined]),
    findings: workflowValue(values, 'findingsOverride') || generatedFindings,
    impression: workflowValue(values, 'impressionOverride') || cleanLines([limitationSummary, summary, collectionLine, ...extensions.slice(0, 4)]),
    incidentalFindings: workflowValue(values, 'incidentalFindings'),
    recommendations: 'No fistula classification, surgical plan, treatment, or management recommendation is calculated. Verify all openings, tract relationships, secondary extensions, collections, and activity before finalizing.',
  };
}

export function generateAdrenalIncidentalomaReport(schema: ReportingWorkflowSchema, values: WorkflowValues): ReportSections {
  const quality = workflowValue(values, 'examQuality');
  const status = workflowValue(values, 'adrenalLesion');
  const limitation = [workflowValue(values, 'technicalLimitations'), workflowValue(values, 'limitationsUncertainty')].filter(Boolean).join('; ');
  const size = dimensions(values, ['lesionApMm', 'lesionTrMm', 'lesionCcMm']);
  const lesionLine =
    status === 'absent' ? 'No adrenal lesion is identified.' :
    status === 'present' ? `${workflowValue(values, 'laterality') || 'Adrenal'} lesion${size ? ` measuring ${size}` : ''}${workflowValue(values, 'homogeneity') ? `, ${workflowValue(values, 'homogeneity')}` : ''}.` :
    status === 'indeterminate' ? `Indeterminate ${workflowValue(values, 'laterality') || 'adrenal'} lesion${size ? ` measuring ${size}` : ''}.` :
    status === 'not assessed' ? 'Adrenal glands were not adequately assessed.' : undefined;
  const characterization = status === 'present' || status === 'indeterminate' ? [
    workflowValue(values, 'unenhancedHu') ? `Unenhanced attenuation: ${workflowValue(values, 'unenhancedHu')} HU.` : undefined,
    workflowValue(values, 'postcontrastHu') ? `Postcontrast attenuation: ${workflowValue(values, 'postcontrastHu')} HU.` : undefined,
    workflowValue(values, 'delayedHu') ? `Delayed attenuation: ${workflowValue(values, 'delayedHu')} HU${workflowValue(values, 'delayMinutes') ? ` at ${workflowValue(values, 'delayMinutes')} minutes` : ''}.` : undefined,
    workflowValue(values, 'userEnteredWashout') ? `User-entered washout result: ${workflowValue(values, 'userEnteredWashout')}.` : undefined,
    workflowValue(values, 'chemicalShiftLoss') ? `Opposed-phase signal loss: ${workflowValue(values, 'chemicalShiftLoss')}.` : undefined,
    workflowValue(values, 'macroscopicFat') ? `Macroscopic fat: ${workflowValue(values, 'macroscopicFat')}.` : undefined,
    workflowValue(values, 'calcification') ? `Calcification: ${workflowValue(values, 'calcification')}.` : undefined,
    workflowValue(values, 'hemorrhage') ? `Hemorrhage: ${workflowValue(values, 'hemorrhage')}.` : undefined,
    workflowValue(values, 'necrosis') ? `Necrosis: ${workflowValue(values, 'necrosis')}.` : undefined,
  ] : [];
  const aggressive = [
    assessedFinding(values, 'Interval growth', 'growthStatus', 'growthDetails'),
    assessedFinding(values, 'Local invasion', 'localInvasion', 'localInvasionDetails'),
    assessedFinding(values, 'Metastatic disease', 'metastaticDisease', 'metastaticDiseaseDetails'),
  ];
  const generatedFindings = cleanLines([
    lesionLine, ...characterization, ...aggressive,
    workflowValue(values, 'contralateralAdrenal') ? `Contralateral adrenal: ${workflowValue(values, 'contralateralAdrenal')}.` : undefined,
    workflowValue(values, 'additionalFindings') ? `Additional findings: ${workflowValue(values, 'additionalFindings')}.` : undefined,
    limitation ? `Limitations: ${limitation}.` : undefined,
  ]);
  const limitationSummary =
    quality === 'nondiagnostic' ? `Nondiagnostic adrenal examination${limitation ? `: ${limitation}` : '.'}` :
    quality === 'limited' ? `Limited adrenal characterization${limitation ? `: ${limitation}` : '.'}` : undefined;
  return {
    indication: cleanLines([
      workflowValue(values, 'clinicalIndication') || schema.clinicalQuestion,
      workflowValue(values, 'clinicalContext') ? `Relevant clinical context: ${workflowValue(values, 'clinicalContext')}.` : undefined,
      workflowValue(values, 'cancerHistory') ? `Cancer history: ${workflowValue(values, 'cancerHistory')}.` : undefined,
      workflowValue(values, 'hormonalContext') ? `Hormonal context: ${workflowValue(values, 'hormonalContext')}.` : undefined,
    ]),
    technique: cleanLines([workflowValue(values, 'modalityProtocol') || schema.techniqueDefault, quality ? `Examination quality: ${quality}.` : undefined, limitation ? `Technical limitations: ${limitation}.` : undefined]),
    findings: workflowValue(values, 'findingsOverride') || generatedFindings,
    impression: workflowValue(values, 'impressionOverride') || cleanLines([
      limitationSummary, lesionLine,
      workflowValue(values, 'userImagingSynthesis') || undefined,
      ...aggressive.filter(Boolean),
    ]),
    incidentalFindings: workflowValue(values, 'incidentalFindings'),
    recommendations: 'No washout calculation, adrenal diagnosis, hormonal conclusion, follow-up interval, biopsy, treatment, or management recommendation is generated. Verify protocol timing, measurements, clinical context, interval change, and user-entered synthesis before finalizing.',
  };
}

export function generateAdnexalCystUltrasoundReport(schema: ReportingWorkflowSchema, values: WorkflowValues): ReportSections {
  const quality = workflowValue(values, 'examQuality');
  const status = workflowValue(values, 'adnexalLesion');
  const limitation = [workflowValue(values, 'technicalLimitations'), workflowValue(values, 'limitationsUncertainty')].filter(Boolean).join('; ');
  const size = dimensions(values, ['lesionApMm', 'lesionTrMm', 'lesionCcMm']);
  const lesion =
    status === 'absent' ? 'No adnexal cystic lesion is identified.' :
    ['present', 'indeterminate'].includes(status) ? `${status === 'indeterminate' ? 'Indeterminate ' : ''}${workflowValue(values, 'laterality') ? `${workflowValue(values, 'laterality')} ` : ''}${workflowValue(values, 'lesionOrigin') || 'adnexal'} lesion${size ? ` measuring ${size}` : ''}. ${[
      workflowValue(values, 'architecture') ? `Architecture: ${workflowValue(values, 'architecture')}` : '',
      workflowValue(values, 'septa') ? `septa: ${workflowValue(values, 'septa')}` : '',
      workflowValue(values, 'wallSurface') ? `wall: ${workflowValue(values, 'wallSurface')}` : '',
      workflowValue(values, 'dopplerFlow') ? `Doppler flow: ${workflowValue(values, 'dopplerFlow')}` : '',
      workflowValue(values, 'internalContents') ? `contents: ${workflowValue(values, 'internalContents')}` : '',
    ].filter(Boolean).join('; ')}.` :
    status === 'not assessed' ? 'Adnexa were not adequately assessed.' : undefined;
  const concerning = [
    assessedFinding(values, 'Papillary projections', 'papillaryProjections', 'papillaryDetails'),
    assessedFinding(values, 'Solid component', 'solidComponent', 'solidDetails'),
    assessedFinding(values, 'Ascites', 'ascites'),
    assessedFinding(values, 'Peritoneal abnormality', 'peritonealFindings', 'peritonealDetails'),
  ];
  const findings = cleanLines([
    lesion, ...concerning,
    workflowValue(values, 'acousticShadowing') ? `Acoustic shadowing: ${workflowValue(values, 'acousticShadowing')}.` : undefined,
    workflowValue(values, 'contralateralOvary') ? `Contralateral ovary/adnexa: ${workflowValue(values, 'contralateralOvary')}.` : undefined,
    workflowValue(values, 'intervalChange') ? `Interval change: ${workflowValue(values, 'intervalChange')}.` : undefined,
    workflowValue(values, 'userAssignedOrads') ? `User-entered O-RADS category: ${workflowValue(values, 'userAssignedOrads')}.` : undefined,
    workflowValue(values, 'additionalFindings') ? `Additional findings: ${workflowValue(values, 'additionalFindings')}.` : undefined,
    limitation ? `Limitations: ${limitation}.` : undefined,
  ]);
  const limitationSummary = quality === 'nondiagnostic' ? `Nondiagnostic pelvic ultrasound${limitation ? `: ${limitation}` : '.'}` : quality === 'limited' ? `Limited adnexal assessment${limitation ? `: ${limitation}` : '.'}` : undefined;
  return {
    indication: cleanLines([workflowValue(values, 'clinicalIndication') || schema.clinicalQuestion, workflowValue(values, 'menopausalStatus') ? `Menopausal status: ${workflowValue(values, 'menopausalStatus')}.` : undefined, workflowValue(values, 'clinicalContext') ? `Relevant clinical context: ${workflowValue(values, 'clinicalContext')}.` : undefined]),
    technique: cleanLines([workflowValue(values, 'modalityProtocol') || schema.techniqueDefault, quality ? `Examination quality: ${quality}.` : undefined, limitation ? `Technical limitations: ${limitation}.` : undefined]),
    findings: workflowValue(values, 'findingsOverride') || findings,
    impression: workflowValue(values, 'impressionOverride') || cleanLines([limitationSummary, lesion, ...concerning.filter(Boolean), workflowValue(values, 'userAssignedOrads') ? `User-entered O-RADS category: ${workflowValue(values, 'userAssignedOrads')}.` : undefined]),
    incidentalFindings: workflowValue(values, 'incidentalFindings'),
    recommendations: 'No O-RADS category, follow-up interval, biopsy, surgery, treatment, or management recommendation is calculated. Verify lesion origin, morphology, Doppler technique, menopausal context, associated findings, and any user-entered category.',
  };
}

export function generateFibroidMriReport(schema: ReportingWorkflowSchema, values: WorkflowValues): ReportSections {
  const quality = workflowValue(values, 'examQuality');
  const status = workflowValue(values, 'dominantFibroid');
  const limitation = [workflowValue(values, 'technicalLimitations'), workflowValue(values, 'limitationsUncertainty')].filter(Boolean).join('; ');
  const uterusSize = dimensions(values, ['uterusApMm', 'uterusTrMm', 'uterusCcMm']);
  const fibroidSize = dimensions(values, ['fibroidApMm', 'fibroidTrMm', 'fibroidCcMm']);
  const fibroid =
    status === 'absent' ? 'No uterine fibroid is identified.' :
    ['present', 'indeterminate'].includes(status) ? `${status === 'indeterminate' ? 'Indeterminate uterine lesion' : workflowValue(values, 'fibroidIdentifier') || 'Dominant fibroid'} at the ${workflowValue(values, 'fibroidLocation') || 'unspecified uterine location'}${fibroidSize ? ` measures ${fibroidSize}` : ''}. ${[
      workflowValue(values, 'endometrialRelationship') ? `Endometrial relationship: ${workflowValue(values, 'endometrialRelationship')}` : '',
      workflowValue(values, 'serosalRelationship') ? `serosal relationship: ${workflowValue(values, 'serosalRelationship')}` : '',
      workflowValue(values, 'enhancement') ? `enhancement: ${workflowValue(values, 'enhancement')}` : '',
      workflowValue(values, 'diffusion') ? `diffusion: ${workflowValue(values, 'diffusion')}` : '',
    ].filter(Boolean).join('; ')}.` :
    status === 'not assessed' ? 'Fibroids were not adequately assessed.' : undefined;
  const findings = cleanLines([
    uterusSize ? `Uterus measures ${uterusSize}${workflowValue(values, 'uterineOrientation') ? ` and is ${workflowValue(values, 'uterineOrientation')}` : ''}.` : undefined,
    workflowValue(values, 'fibroidBurden') ? `Fibroid burden: ${workflowValue(values, 'fibroidBurden')}.` : undefined,
    fibroid,
    workflowValue(values, 'userAssignedFigoType') ? `User-entered FIGO type: ${workflowValue(values, 'userAssignedFigoType')}.` : undefined,
    workflowValue(values, 'pedunculated') && workflowValue(values, 'pedunculated') !== 'absent' ? `Pedunculated appearance: ${workflowValue(values, 'pedunculated')}${workflowValue(values, 'stalkDetails') ? `; ${workflowValue(values, 'stalkDetails')}` : ''}.` : undefined,
    workflowValue(values, 'degeneration') ? `Degeneration: ${workflowValue(values, 'degeneration')}.` : undefined,
    workflowValue(values, 'hemorrhageCalcification') ? `Hemorrhage/calcification: ${workflowValue(values, 'hemorrhageCalcification')}.` : undefined,
    workflowValue(values, 'additionalFibroids') ? `Additional fibroids: ${workflowValue(values, 'additionalFibroids')}.` : undefined,
    assessedFinding(values, 'Adenomyosis', 'adenomyosis', 'adenomyosisDetails'),
    workflowValue(values, 'endometrium') ? `Endometrium/cavity: ${workflowValue(values, 'endometrium')}.` : undefined,
    workflowValue(values, 'ovariesAdnexa') ? `Ovaries/adnexa: ${workflowValue(values, 'ovariesAdnexa')}.` : undefined,
    workflowValue(values, 'treatmentPlanningFindings') ? `Treatment-planning anatomy: ${workflowValue(values, 'treatmentPlanningFindings')}.` : undefined,
    workflowValue(values, 'additionalFindings') ? `Additional findings: ${workflowValue(values, 'additionalFindings')}.` : undefined,
    limitation ? `Limitations: ${limitation}.` : undefined,
  ]);
  const limitationSummary = quality === 'nondiagnostic' ? `Nondiagnostic pelvic MRI${limitation ? `: ${limitation}` : '.'}` : quality === 'limited' ? `Limited fibroid characterization${limitation ? `: ${limitation}` : '.'}` : undefined;
  return {
    indication: cleanLines([workflowValue(values, 'clinicalIndication') || schema.clinicalQuestion, workflowValue(values, 'clinicalContext') ? `Relevant clinical context: ${workflowValue(values, 'clinicalContext')}.` : undefined, workflowValue(values, 'treatmentHistory') ? `Treatment history: ${workflowValue(values, 'treatmentHistory')}.` : undefined]),
    technique: cleanLines([workflowValue(values, 'modalityProtocol') || schema.techniqueDefault, quality ? `Examination quality: ${quality}.` : undefined, limitation ? `Technical limitations: ${limitation}.` : undefined]),
    findings: workflowValue(values, 'findingsOverride') || findings,
    impression: workflowValue(values, 'impressionOverride') || cleanLines([limitationSummary, fibroid, workflowValue(values, 'fibroidBurden') ? `Overall fibroid burden: ${workflowValue(values, 'fibroidBurden')}.` : undefined, assessedFinding(values, 'Adenomyosis', 'adenomyosis', 'adenomyosisDetails'), workflowValue(values, 'treatmentPlanningFindings') || undefined]),
    incidentalFindings: workflowValue(values, 'incidentalFindings'),
    recommendations: 'No FIGO type, malignancy determination, embolization or surgical eligibility, treatment, or management recommendation is calculated. Verify all fibroids, relationships, morphology, adenomyosis, and treatment-planning anatomy.',
  };
}

export function generatePelvicFloorImagingReport(schema: ReportingWorkflowSchema, values: WorkflowValues): ReportSections {
  const quality = workflowValue(values, 'examQuality');
  const limitation = [workflowValue(values, 'technicalLimitations'), workflowValue(values, 'limitationsUncertainty')].filter(Boolean).join('; ');
  const compartmentLines = [
    assessedFinding(values, 'Cystocele', 'cystocele', 'cystoceleDetails'),
    assessedFinding(values, 'Uterine/vaginal-vault prolapse', 'uterineVaultProlapse', 'uterineVaultDetails'),
    assessedFinding(values, 'Enterocele/peritoneocele', 'enterocele', 'enteroceleDetails'),
    workflowValue(values, 'rectocele') === 'present' || workflowValue(values, 'rectocele') === 'indeterminate'
      ? `Rectocele: ${workflowValue(values, 'rectocele')}${workflowValue(values, 'rectoceleDepthCm') ? `, ${workflowValue(values, 'rectoceleDepthCm')} cm deep` : ''}${workflowValue(values, 'rectoceleEmptying') ? `; emptying ${workflowValue(values, 'rectoceleEmptying')}` : ''}.` : undefined,
    assessedFinding(values, 'Rectal intussusception', 'intussusception', 'intussusceptionDetails'),
    assessedFinding(values, 'External rectal prolapse', 'rectalProlapse', 'rectalProlapseDetails'),
  ];
  const allNegative = ['cystocele', 'uterineVaultProlapse', 'enterocele', 'rectocele', 'intussusception', 'rectalProlapse'].every((key) => workflowValue(values, key) === 'absent');
  const measurements = [
    workflowValue(values, 'restHLineCm') ? `rest H line ${workflowValue(values, 'restHLineCm')} cm` : '',
    workflowValue(values, 'restMLineCm') ? `rest M line ${workflowValue(values, 'restMLineCm')} cm` : '',
    workflowValue(values, 'evacuationHLineCm') ? `evacuation H line ${workflowValue(values, 'evacuationHLineCm')} cm` : '',
    workflowValue(values, 'evacuationMLineCm') ? `evacuation M line ${workflowValue(values, 'evacuationMLineCm')} cm` : '',
    workflowValue(values, 'bladderDescentCm') ? `bladder-base descent ${workflowValue(values, 'bladderDescentCm')} cm` : '',
  ].filter(Boolean).join('; ');
  const findings = cleanLines([
    measurements ? `Dynamic measurements using ${workflowValue(values, 'referenceLine') || 'the entered reference line'}: ${measurements}.` : undefined,
    workflowValue(values, 'pelvicFloorMotion') ? `Pelvic-floor motion: ${workflowValue(values, 'pelvicFloorMotion')}.` : undefined,
    ...compartmentLines, allNegative ? 'No cystocele, middle-compartment prolapse, enterocele, rectocele, intussusception, or external rectal prolapse.' : undefined,
    workflowValue(values, 'evacuationCompleteness') ? `Evacuation: ${workflowValue(values, 'evacuationCompleteness')}.` : undefined,
    workflowValue(values, 'puborectalisBehavior') ? `Puborectalis: ${workflowValue(values, 'puborectalisBehavior')}.` : undefined,
    workflowValue(values, 'additionalFindings') ? `Additional findings: ${workflowValue(values, 'additionalFindings')}.` : undefined,
    limitation ? `Limitations: ${limitation}.` : undefined,
  ]);
  const limit = quality === 'nondiagnostic' ? `Nondiagnostic dynamic pelvic-floor examination${limitation ? `: ${limitation}` : '.'}` : quality === 'limited' ? `Limited dynamic pelvic-floor assessment${limitation ? `: ${limitation}` : '.'}` : undefined;
  return {
    indication: cleanLines([workflowValue(values, 'clinicalIndication') || schema.clinicalQuestion, workflowValue(values, 'clinicalContext') ? `Relevant clinical context: ${workflowValue(values, 'clinicalContext')}.` : undefined, workflowValue(values, 'priorSurgery') ? `Prior surgery: ${workflowValue(values, 'priorSurgery')}.` : undefined]),
    technique: cleanLines([workflowValue(values, 'modalityProtocol') || schema.techniqueDefault, quality ? `Examination quality: ${quality}.` : undefined, workflowValue(values, 'patientEffort') ? `Patient effort: ${workflowValue(values, 'patientEffort')}.` : undefined, workflowValue(values, 'referenceLine') ? `Reference line: ${workflowValue(values, 'referenceLine')}.` : undefined]),
    findings: workflowValue(values, 'findingsOverride') || findings,
    impression: workflowValue(values, 'impressionOverride') || cleanLines([limit, allNegative ? 'No dynamic pelvic-floor prolapse or obstructed evacuation is identified.' : undefined, ...compartmentLines, workflowValue(values, 'userSynthesis') || undefined]),
    incidentalFindings: workflowValue(values, 'incidentalFindings'),
    recommendations: 'No prolapse severity category, measurement threshold interpretation, treatment, or management recommendation is calculated. Verify patient effort, reference convention, dynamic phases, and all compartments.',
  };
}
