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
