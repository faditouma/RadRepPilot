import type { ReportingWorkflowSchema, WorkflowValues } from '../data/reportingWorkflowSchemas';
import type { ReportSections } from '../radrep/types';
import { cleanLines, numberOrNull, workflowValue } from './impressionGenerators';

function measuredSite(
  site: string,
  size: number | null,
  suv: number | null,
): string {
  return [
    site,
    size !== null ? `${size} mm` : '',
    suv !== null ? `SUVmax ${suv}` : '',
  ]
    .filter(Boolean)
    .join(', ');
}

function organSentence(label: string, status: string): string | undefined {
  if (!status || status === 'not assessed') return undefined;
  if (status === 'absent') return `No metabolically active ${label.toLowerCase()} involvement is entered.`;
  if (status === 'present') return `Metabolically active ${label.toLowerCase()} involvement is present.`;
  return `${label} involvement is indeterminate.`;
}

export function generateLymphomaPetCtReport(
  schema: ReportingWorkflowSchema,
  values: WorkflowValues,
): ReportSections {
  const clinicalIndication = workflowValue(values, 'clinicalIndication');
  const relevantContext = workflowValue(values, 'relevantClinicalContext');
  const lymphomaSubtype = workflowValue(values, 'lymphomaSubtype');
  const purpose = workflowValue(values, 'examPurpose');
  const comparisonStudy = workflowValue(values, 'comparisonStudy');
  const comparisonDate = workflowValue(values, 'comparisonDate');
  const tracer = workflowValue(values, 'tracer');
  const administeredActivity = numberOrNull(values, 'administeredActivity');
  const uptakeTime = numberOrNull(values, 'uptakeTimeMinutes');
  const serumGlucose = numberOrNull(values, 'serumGlucose');
  const quality = workflowValue(values, 'examQuality');
  const technicalLimitations = workflowValue(values, 'technicalLimitations');
  const additionalUncertainty = workflowValue(values, 'limitationsUncertainty');
  const nodalStatus = workflowValue(values, 'nodalDisease');
  const extranodalStatus = workflowValue(values, 'extranodalDisease');
  const newLesions = workflowValue(values, 'newLesions');
  const intervalChange = workflowValue(values, 'intervalChange');
  const userResponseSynthesis = workflowValue(values, 'userResponseSynthesis');
  const findingsOverride = workflowValue(values, 'findingsOverride');
  const impressionOverride = workflowValue(values, 'impressionOverride');

  const limitationText = [technicalLimitations, additionalUncertainty].filter(Boolean).join('; ');
  const comparisonLine =
    comparisonStudy || comparisonDate
      ? `Comparison: ${comparisonStudy || 'prior examination'}${comparisonDate ? ` dated ${comparisonDate}` : ''}.`
      : undefined;

  const nodalDominant = measuredSite(
    workflowValue(values, 'dominantNodalSite'),
    numberOrNull(values, 'dominantNodeSizeMm'),
    numberOrNull(values, 'dominantNodeSuvMax'),
  );
  const extranodalDominant = measuredSite(
    workflowValue(values, 'dominantExtranodalSite'),
    numberOrNull(values, 'dominantExtranodalSizeMm'),
    numberOrNull(values, 'dominantExtranodalSuvMax'),
  );
  const highestUptake = measuredSite(
    workflowValue(values, 'highestUptakeSite'),
    null,
    numberOrNull(values, 'highestLesionSuvMax'),
  );
  const bloodPool = numberOrNull(values, 'bloodPoolSuvMean');
  const liver = numberOrNull(values, 'liverSuvMean');

  const nodalFinding =
    nodalStatus === 'absent'
      ? 'No metabolically active nodal disease is entered.'
      : nodalStatus === 'present'
        ? cleanLines([
            `Metabolically active nodal disease is present${
              workflowValue(values, 'nodalDistribution')
                ? ` involving ${workflowValue(values, 'nodalDistribution')}`
                : ''
            }.`,
            nodalDominant ? `Dominant nodal site: ${nodalDominant}.` : undefined,
            workflowValue(values, 'bulkyDisease') === 'present'
              ? 'Bulky nodal disease is present.'
              : workflowValue(values, 'bulkyDisease') === 'absent'
                ? 'No bulky nodal disease is entered.'
                : undefined,
          ])
        : nodalStatus === 'indeterminate'
          ? `Indeterminate nodal uptake${
              workflowValue(values, 'nodalDistribution')
                ? ` involving ${workflowValue(values, 'nodalDistribution')}`
                : ''
            }${nodalDominant ? `. Dominant indeterminate site: ${nodalDominant}` : ''}.`
          : undefined;

  const extranodalFinding =
    extranodalStatus === 'absent'
      ? 'No metabolically active extranodal disease is entered.'
      : extranodalStatus === 'present'
        ? cleanLines([
            `Metabolically active extranodal disease is present${
              workflowValue(values, 'extranodalSites')
                ? ` involving ${workflowValue(values, 'extranodalSites')}`
                : ''
            }.`,
            extranodalDominant ? `Dominant extranodal site: ${extranodalDominant}.` : undefined,
          ])
        : extranodalStatus === 'indeterminate'
          ? `Indeterminate extranodal uptake${
              workflowValue(values, 'extranodalSites')
                ? ` involving ${workflowValue(values, 'extranodalSites')}`
                : ''
            }${extranodalDominant ? `. Dominant indeterminate site: ${extranodalDominant}` : ''}.`
          : undefined;

  const referenceLine =
    bloodPool !== null || liver !== null
      ? `Reference activity: ${[
          bloodPool !== null ? `blood-pool SUVmean ${bloodPool}` : '',
          liver !== null ? `liver SUVmean ${liver}` : '',
        ]
          .filter(Boolean)
          .join('; ')}.`
      : undefined;
  const responseLines = [
    highestUptake ? `Highest-uptake site: ${highestUptake}.` : undefined,
    intervalChange && intervalChange !== 'not assessed'
      ? `Interval metabolic change: ${intervalChange}.`
      : undefined,
    newLesions === 'present'
      ? `New metabolically active lesions are present${
          workflowValue(values, 'newLesionDescription')
            ? `: ${workflowValue(values, 'newLesionDescription')}`
            : ''
        }.`
      : newLesions === 'absent'
        ? 'No new metabolically active lesions are entered.'
        : newLesions === 'indeterminate'
          ? `New lesion assessment is indeterminate${
              workflowValue(values, 'newLesionDescription')
                ? `: ${workflowValue(values, 'newLesionDescription')}`
                : ''
            }.`
          : undefined,
    userResponseSynthesis ? `User response synthesis: ${userResponseSynthesis}.` : undefined,
  ];

  const generatedFindings = cleanLines([
    comparisonLine,
    nodalFinding,
    extranodalFinding,
    organSentence('Spleen', workflowValue(values, 'spleenAssessment')),
    organSentence('Marrow', workflowValue(values, 'marrowAssessment')),
    organSentence('Liver', workflowValue(values, 'liverAssessment')),
    referenceLine,
    ...responseLines,
    workflowValue(values, 'additionalFindings')
      ? `Additional findings: ${workflowValue(values, 'additionalFindings')}.`
      : undefined,
    limitationText ? `Limitations: ${limitationText}.` : undefined,
  ]);

  const activeDisease = nodalStatus === 'present' || extranodalStatus === 'present';
  const indeterminateDisease =
    nodalStatus === 'indeterminate' ||
    extranodalStatus === 'indeterminate' ||
    newLesions === 'indeterminate';
  const dominantSites = [
    nodalStatus === 'present' ? workflowValue(values, 'dominantNodalSite') : '',
    extranodalStatus === 'present' ? workflowValue(values, 'dominantExtranodalSite') : '',
  ].filter(Boolean);

  const diseaseSummary = activeDisease
    ? `Metabolically active lymphoma is present${
        dominantSites.length ? `, most notably at ${dominantSites.join(' and ')}` : ''
      }.`
    : nodalStatus === 'absent' && extranodalStatus === 'absent'
      ? 'No metabolically active nodal or extranodal lymphoma is entered.'
      : indeterminateDisease
        ? 'Indeterminate metabolically active disease sites are present; correlate with the described distribution.'
        : 'Metabolic disease burden is not fully assessed from the entered findings.';
  const responseSummary =
    userResponseSynthesis ||
    (intervalChange && intervalChange !== 'not assessed'
      ? `Descriptive interval assessment: ${intervalChange}.`
      : undefined);
  const newDiseaseSummary =
    newLesions === 'present'
      ? `New metabolically active lesion${workflowValue(values, 'newLesionDescription') ? `: ${workflowValue(values, 'newLesionDescription')}` : 's are present'}.`
      : newLesions === 'indeterminate'
        ? 'New lesion assessment is indeterminate.'
        : undefined;
  const limitationSummary =
    quality === 'nondiagnostic'
      ? `Nondiagnostic examination${limitationText ? `: ${limitationText}` : '.'}`
      : quality === 'limited'
        ? `Limited examination${limitationText ? `: ${limitationText}` : '.'}`
        : undefined;

  return {
    indication: cleanLines([
      clinicalIndication || schema.clinicalQuestion,
      lymphomaSubtype ? `Lymphoma subtype: ${lymphomaSubtype}.` : undefined,
      purpose ? `Examination purpose: ${purpose}.` : undefined,
      relevantContext ? `Relevant clinical context: ${relevantContext}.` : undefined,
    ]),
    technique: cleanLines([
      schema.techniqueDefault,
      tracer ? `Tracer: ${tracer}.` : undefined,
      administeredActivity !== null ? `Administered activity: ${administeredActivity} MBq.` : undefined,
      uptakeTime !== null ? `Uptake time: ${uptakeTime} minutes.` : undefined,
      serumGlucose !== null ? `Serum glucose: ${serumGlucose} mmol/L.` : undefined,
      quality ? `Examination quality: ${quality}.` : undefined,
      technicalLimitations ? `Technical limitations: ${technicalLimitations}.` : undefined,
    ]),
    findings: findingsOverride || generatedFindings,
    impression: impressionOverride || cleanLines([
      limitationSummary,
      diseaseSummary,
      responseSummary,
      newDiseaseSummary,
    ]),
    incidentalFindings: workflowValue(values, 'incidentalFindings'),
    recommendations:
      'No management recommendation is generated. Verify all disease sites, comparison data, reference activity, and any user-assigned response synthesis before finalizing.',
  };
}
