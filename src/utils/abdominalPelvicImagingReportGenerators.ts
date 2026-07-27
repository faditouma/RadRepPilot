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
