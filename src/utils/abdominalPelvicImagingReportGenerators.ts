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
