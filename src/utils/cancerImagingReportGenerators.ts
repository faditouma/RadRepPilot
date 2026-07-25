import type { ReportingWorkflowSchema, WorkflowValues } from '../data/reportingWorkflowSchemas';
import type { ReportSections } from '../radrep/types';
import { cleanLines, numberOrNull, workflowValue } from './impressionGenerators';

function capitalize(value: string): string {
  return value ? `${value.charAt(0).toUpperCase()}${value.slice(1)}` : '';
}

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

function dimensions(values: WorkflowValues, keys: string[]): string {
  const entered = keys
    .map((key) => numberOrNull(values, key))
    .filter((value): value is number => value !== null);
  return entered.length ? `${entered.join(' × ')} mm` : '';
}

function assessmentSentence(label: string, status: string, details = ''): string | undefined {
  if (!status || status === 'not assessed') return undefined;
  if (status === 'absent') return `No ${label.toLowerCase()} is entered.`;
  if (status === 'present') return `${label} is present${details ? `: ${details}` : ''}.`;
  return `${label} is indeterminate${details ? `: ${details}` : ''}.`;
}

export function generatePancreaticCancerReport(
  schema: ReportingWorkflowSchema,
  values: WorkflowValues,
): ReportSections {
  const massStatus = workflowValue(values, 'pancreaticMass');
  const location = workflowValue(values, 'tumorLocation');
  const tumorDimensions = dimensions(values, [
    'tumorSizeApMm',
    'tumorSizeTrMm',
    'tumorSizeCcMm',
  ]);
  const morphology = workflowValue(values, 'tumorMorphology');
  const enhancement = workflowValue(values, 'tumorEnhancement');
  const tumorDescription = workflowValue(values, 'tumorDescription');
  const quality = workflowValue(values, 'examQuality');
  const technicalLimitations = workflowValue(values, 'technicalLimitations');
  const additionalUncertainty = workflowValue(values, 'limitationsUncertainty');
  const limitationText = [technicalLimitations, additionalUncertainty].filter(Boolean).join('; ');
  const findingsOverride = workflowValue(values, 'findingsOverride');
  const impressionOverride = workflowValue(values, 'impressionOverride');

  const massFinding =
    massStatus === 'absent'
      ? 'No pancreatic mass is entered.'
      : massStatus === 'present'
        ? `Pancreatic ${morphology || 'mass'}${location ? ` at the ${location}` : ''}${
            tumorDimensions ? ` measuring ${tumorDimensions}` : ''
          }${enhancement && enhancement !== 'not assessed' ? `, ${enhancement}` : ''}${
            tumorDescription ? `. ${tumorDescription}` : ''
          }.`
        : massStatus === 'indeterminate'
          ? `Indeterminate pancreatic lesion${location ? ` at the ${location}` : ''}${
              tumorDimensions ? ` measuring ${tumorDimensions}` : ''
            }${tumorDescription ? `: ${tumorDescription}` : ''}.`
          : undefined;

  const ductLines = [
    assessmentSentence(
      'Pancreatic duct obstruction',
      workflowValue(values, 'pancreaticDuctObstruction'),
      numberOrNull(values, 'pancreaticDuctDiameterMm') !== null
        ? `main duct ${numberOrNull(values, 'pancreaticDuctDiameterMm')} mm`
        : '',
    ),
    assessmentSentence(
      'Biliary obstruction',
      workflowValue(values, 'biliaryObstruction'),
      numberOrNull(values, 'commonBileDuctDiameterMm') !== null
        ? `common bile duct ${numberOrNull(values, 'commonBileDuctDiameterMm')} mm`
        : '',
    ),
    assessmentSentence('Upstream pancreatic atrophy', workflowValue(values, 'upstreamAtrophy')),
  ];

  const vesselFields: Array<[string, string]> = [
    ['Superior mesenteric artery', 'smaContact'],
    ['Celiac axis', 'celiacContact'],
    ['Common hepatic artery', 'commonHepaticArteryContact'],
    ['Superior mesenteric vein', 'smvContact'],
    ['Portal vein', 'portalVeinContact'],
  ];
  const involvedVessels = vesselFields
    .map(([label, key]) => {
      const relationship = workflowValue(values, key);
      return relationship &&
        !['no contact', 'not assessed'].includes(relationship)
        ? `${label}: ${relationship}`
        : '';
    })
    .filter(Boolean);
  const noContactVessels = vesselFields
    .filter(([, key]) => workflowValue(values, key) === 'no contact')
    .map(([label]) => label);
  const vascularLines = [
    involvedVessels.length
      ? `Tumor-vessel relationships: ${involvedVessels.join('; ')}.`
      : undefined,
    noContactVessels.length === vesselFields.length
      ? 'No tumor contact with the assessed major peripancreatic arteries or veins is entered.'
      : undefined,
    workflowValue(values, 'vascularDeformity')
      ? `Vessel narrowing/deformity/occlusion: ${workflowValue(values, 'vascularDeformity')}.`
      : undefined,
    workflowValue(values, 'vascularThrombosis')
      ? `Vascular thrombosis: ${workflowValue(values, 'vascularThrombosis')}.`
      : undefined,
    workflowValue(values, 'collateralVessels')
      ? `Collateral vessels: ${workflowValue(values, 'collateralVessels')}.`
      : undefined,
    workflowValue(values, 'vascularVariants')
      ? `Surgically relevant vascular anatomy: ${workflowValue(values, 'vascularVariants')}.`
      : undefined,
  ];

  const extensionLines = [
    assessmentSentence(
      'Adjacent-organ invasion',
      workflowValue(values, 'adjacentOrganInvasion'),
      workflowValue(values, 'adjacentOrganDetails'),
    ),
    assessmentSentence(
      'Suspicious regional nodal disease',
      workflowValue(values, 'regionalNodes'),
      workflowValue(values, 'regionalNodeDetails'),
    ),
    assessmentSentence(
      'Liver metastatic disease',
      workflowValue(values, 'liverMetastases'),
      workflowValue(values, 'liverMetastasisDetails'),
    ),
    assessmentSentence(
      'Peritoneal metastatic disease',
      workflowValue(values, 'peritonealMetastases'),
      workflowValue(values, 'peritonealMetastasisDetails'),
    ),
    assessmentSentence(
      'Other distant metastatic disease',
      workflowValue(values, 'otherMetastases'),
      workflowValue(values, 'otherMetastasisDetails'),
    ),
  ];

  const generatedFindings = cleanLines([
    workflowValue(values, 'comparisonStudy') || workflowValue(values, 'comparisonDate')
      ? `Comparison: ${workflowValue(values, 'comparisonStudy') || 'prior examination'}${
          workflowValue(values, 'comparisonDate')
            ? ` dated ${workflowValue(values, 'comparisonDate')}`
            : ''
        }.`
      : undefined,
    massFinding,
    ...ductLines,
    ...vascularLines,
    ...extensionLines,
    workflowValue(values, 'additionalFindings')
      ? `Additional findings: ${workflowValue(values, 'additionalFindings')}.`
      : undefined,
    limitationText ? `Limitations: ${limitationText}.` : undefined,
  ]);

  const metastaticStatuses = [
    workflowValue(values, 'liverMetastases'),
    workflowValue(values, 'peritonealMetastases'),
    workflowValue(values, 'otherMetastases'),
  ];
  const metastaticSites = [
    workflowValue(values, 'liverMetastases') === 'present' ? 'liver' : '',
    workflowValue(values, 'peritonealMetastases') === 'present' ? 'peritoneum' : '',
    workflowValue(values, 'otherMetastases') === 'present'
      ? workflowValue(values, 'otherMetastasisDetails') || 'other distant sites'
      : '',
  ].filter(Boolean);
  const indeterminateMetastases = metastaticStatuses.includes('indeterminate');

  const tumorSummary =
    massStatus === 'present'
      ? `Pancreatic mass${location ? ` at the ${location}` : ''}${
          tumorDimensions ? ` measuring ${tumorDimensions}` : ''
        }.`
      : massStatus === 'absent'
        ? 'No pancreatic mass is entered.'
        : massStatus === 'indeterminate'
          ? 'Indeterminate pancreatic lesion; correlate with the detailed findings.'
          : 'Pancreatic primary is not fully assessed from the entered findings.';
  const vascularSummary =
    involvedVessels.length
      ? `Major tumor-vessel relationships: ${involvedVessels.join('; ')}.`
      : noContactVessels.length === vesselFields.length
        ? 'No tumor contact with the assessed major peripancreatic vessels is entered.'
        : undefined;
  const metastasisSummary = metastaticSites.length
    ? `Metastatic disease is present involving ${metastaticSites.join(' and ')}.`
    : indeterminateMetastases
      ? 'Distant metastatic disease is indeterminate.'
      : metastaticStatuses.every((status) => status === 'absent')
        ? 'No liver, peritoneal, or other distant metastases are entered.'
        : undefined;
  const userSynthesis = workflowValue(values, 'userResectabilitySynthesis');
  const limitationSummary =
    quality === 'nondiagnostic'
      ? `Nondiagnostic examination${limitationText ? `: ${limitationText}` : '.'}`
      : quality === 'limited'
        ? `Limited staging examination${limitationText ? `: ${limitationText}` : '.'}`
        : undefined;

  return {
    indication: cleanLines([
      workflowValue(values, 'clinicalIndication') || schema.clinicalQuestion,
      workflowValue(values, 'pathologyStatus')
        ? `Pathology status: ${workflowValue(values, 'pathologyStatus')}.`
        : undefined,
      workflowValue(values, 'relevantClinicalContext')
        ? `Relevant clinical context: ${workflowValue(values, 'relevantClinicalContext')}.`
        : undefined,
    ]),
    technique: cleanLines([
      workflowValue(values, 'modalityProtocol') || schema.techniqueDefault,
      quality ? `Examination quality: ${quality}.` : undefined,
      technicalLimitations ? `Technical limitations: ${technicalLimitations}.` : undefined,
    ]),
    findings: findingsOverride || generatedFindings,
    impression: impressionOverride || cleanLines([
      limitationSummary,
      tumorSummary,
      vascularSummary,
      assessmentSentence(
        'Adjacent-organ invasion',
        workflowValue(values, 'adjacentOrganInvasion'),
        workflowValue(values, 'adjacentOrganDetails'),
      ),
      assessmentSentence(
        'Suspicious regional nodal disease',
        workflowValue(values, 'regionalNodes'),
        workflowValue(values, 'regionalNodeDetails'),
      ),
      metastasisSummary,
      userSynthesis ? `User resectability synthesis: ${userSynthesis}.` : undefined,
    ]),
    incidentalFindings: workflowValue(values, 'incidentalFindings'),
    recommendations:
      'No operability, treatment, or management recommendation is generated. Verify vessel relationships, metastatic disease, protocol adequacy, and any user-entered resectability synthesis before finalizing.',
  };
}

export function generateRectalCancerMriReport(
  schema: ReportingWorkflowSchema,
  values: WorkflowValues,
): ReportSections {
  const tumorStatus = workflowValue(values, 'rectalTumor');
  const quality = workflowValue(values, 'examQuality');
  const technicalLimitations = workflowValue(values, 'technicalLimitations');
  const additionalUncertainty = workflowValue(values, 'limitationsUncertainty');
  const limitationText = [technicalLimitations, additionalUncertainty].filter(Boolean).join('; ');
  const findingsOverride = workflowValue(values, 'findingsOverride');
  const impressionOverride = workflowValue(values, 'impressionOverride');
  const purpose = workflowValue(values, 'examPurpose');

  const tumorFinding =
    tumorStatus === 'absent'
      ? 'No visible rectal tumor is entered.'
      : tumorStatus === 'present'
        ? `Rectal tumor${numberOrNull(values, 'distanceFromAnalVergeCm') !== null
            ? ` with inferior margin ${numberOrNull(values, 'distanceFromAnalVergeCm')} cm from the anal verge`
            : ''
          }${workflowValue(values, 'relationToAnorectalJunction')
            ? `, ${workflowValue(values, 'relationToAnorectalJunction')} the anorectal junction`
            : ''
          }${numberOrNull(values, 'craniocaudalLengthMm') !== null
            ? `, measuring ${numberOrNull(values, 'craniocaudalLengthMm')} mm craniocaudally`
            : ''
          }${workflowValue(values, 'circumferentialLocation')
            ? `, ${workflowValue(values, 'circumferentialLocation')}`
            : ''
          }${workflowValue(values, 'tumorMorphology')
            ? `, with ${workflowValue(values, 'tumorMorphology')} morphology`
            : ''
          }${numberOrNull(values, 'extramuralDepthMm') !== null
            ? `. Maximum extramural depth is ${numberOrNull(values, 'extramuralDepthMm')} mm`
            : ''
          }.`
        : tumorStatus === 'indeterminate'
          ? 'Indeterminate rectal abnormality; correlate with the entered localization and morphology.'
          : undefined;

  const fascia = workflowValue(values, 'mesorectalFasciaRelationship');
  const fasciaFinding =
    fascia && !['not assessed', 'not applicable'].includes(fascia)
      ? `Mesorectal fascia is ${fascia}${
          numberOrNull(values, 'minimumMesorectalFasciaDistanceMm') !== null
            ? `; minimum tumor-to-fascia distance ${numberOrNull(values, 'minimumMesorectalFasciaDistanceMm')} mm`
            : ''
        }${workflowValue(values, 'fasciaThreatSite')
          ? ` at ${workflowValue(values, 'fasciaThreatSite')}`
          : ''
        }.`
      : undefined;

  const positiveOrIndeterminate = (
    label: string,
    statusKey: string,
    detailsKey: string,
  ): string | undefined => {
    const status = workflowValue(values, statusKey);
    if (!['present', 'indeterminate'].includes(status)) return undefined;
    return `${label} is ${status}${workflowValue(values, detailsKey) ? `: ${workflowValue(values, detailsKey)}` : ''}.`;
  };

  const stagingLines = [
    positiveOrIndeterminate('Sphincter complex involvement', 'sphincterInvolvement', 'sphincterDetails'),
    positiveOrIndeterminate('Levator involvement', 'levatorInvolvement', 'levatorDetails'),
    positiveOrIndeterminate('Adjacent-organ invasion', 'adjacentOrganInvasion', 'adjacentOrganDetails'),
    positiveOrIndeterminate('Extramural venous invasion', 'emvi', 'emviDetails'),
    positiveOrIndeterminate('Suspicious mesorectal nodes', 'mesorectalNodes', 'mesorectalNodeDetails'),
    positiveOrIndeterminate(
      'Suspicious extramesorectal nodes',
      'extramesorectalNodes',
      'extramesorectalNodeDetails',
    ),
    positiveOrIndeterminate('Tumor deposits', 'tumorDeposits', 'tumorDepositDetails'),
    positiveOrIndeterminate(
      'Distant metastatic disease',
      'distantMetastases',
      'distantMetastasisDetails',
    ),
  ];
  const allStagingNegatives = [
    'sphincterInvolvement',
    'levatorInvolvement',
    'adjacentOrganInvasion',
    'emvi',
    'mesorectalNodes',
    'extramesorectalNodes',
    'tumorDeposits',
    'distantMetastases',
  ].every((key) => workflowValue(values, key) === 'absent');

  const responseLines = [
    workflowValue(values, 'intervalChange') &&
    workflowValue(values, 'intervalChange') !== 'not assessed'
      ? `Interval tumor change: ${workflowValue(values, 'intervalChange')}.`
      : undefined,
    workflowValue(values, 'userResponseSynthesis')
      ? `User response synthesis: ${workflowValue(values, 'userResponseSynthesis')}.`
      : undefined,
  ];

  const generatedFindings = cleanLines([
    workflowValue(values, 'comparisonStudy') || workflowValue(values, 'comparisonDate')
      ? `Comparison: ${workflowValue(values, 'comparisonStudy') || 'prior examination'}${
          workflowValue(values, 'comparisonDate')
            ? ` dated ${workflowValue(values, 'comparisonDate')}`
            : ''
        }.`
      : undefined,
    tumorFinding,
    workflowValue(values, 'userAssignedTCategory')
      ? `User-assigned T category: ${workflowValue(values, 'userAssignedTCategory')}.`
      : undefined,
    fasciaFinding,
    ...stagingLines,
    allStagingNegatives
      ? 'No sphincter, levator, adjacent-organ, EMVI, suspicious nodal, tumor-deposit, or distant metastatic involvement is entered.'
      : undefined,
    ...responseLines,
    workflowValue(values, 'additionalFindings')
      ? `Additional findings: ${workflowValue(values, 'additionalFindings')}.`
      : undefined,
    limitationText ? `Limitations: ${limitationText}.` : undefined,
  ]);

  const keyPositiveFindings = [
    fascia === 'threatened' || fascia === 'involved'
      ? `Mesorectal fascia ${fascia}${workflowValue(values, 'fasciaThreatSite') ? ` at ${workflowValue(values, 'fasciaThreatSite')}` : ''}`
      : '',
    workflowValue(values, 'sphincterInvolvement') === 'present'
      ? 'sphincter complex involvement'
      : '',
    workflowValue(values, 'levatorInvolvement') === 'present' ? 'levator involvement' : '',
    workflowValue(values, 'adjacentOrganInvasion') === 'present'
      ? `adjacent-organ invasion${workflowValue(values, 'adjacentOrganDetails') ? ` (${workflowValue(values, 'adjacentOrganDetails')})` : ''}`
      : '',
    workflowValue(values, 'emvi') === 'present' ? 'extramural venous invasion' : '',
    workflowValue(values, 'mesorectalNodes') === 'present' ? 'suspicious mesorectal nodes' : '',
    workflowValue(values, 'extramesorectalNodes') === 'present'
      ? 'suspicious extramesorectal nodes'
      : '',
    workflowValue(values, 'tumorDeposits') === 'present' ? 'tumor deposits' : '',
  ].filter(Boolean);
  const tumorSummary =
    tumorStatus === 'present'
      ? `Rectal tumor${numberOrNull(values, 'distanceFromAnalVergeCm') !== null
          ? ` with inferior margin ${numberOrNull(values, 'distanceFromAnalVergeCm')} cm from the anal verge`
          : ''
        }${numberOrNull(values, 'craniocaudalLengthMm') !== null
          ? ` and length ${numberOrNull(values, 'craniocaudalLengthMm')} mm`
          : ''
        }.`
      : tumorStatus === 'absent'
        ? 'No visible rectal tumor is entered.'
        : tumorStatus === 'indeterminate'
          ? 'Indeterminate rectal abnormality.'
          : 'Rectal tumor is not fully assessed from the entered findings.';
  const limitationSummary =
    quality === 'nondiagnostic'
      ? `Nondiagnostic examination${limitationText ? `: ${limitationText}` : '.'}`
      : quality === 'limited'
        ? `Limited rectal MRI${limitationText ? `: ${limitationText}` : '.'}`
        : undefined;

  return {
    indication: cleanLines([
      workflowValue(values, 'clinicalIndication') || schema.clinicalQuestion,
      purpose ? `Examination purpose: ${purpose}.` : undefined,
      workflowValue(values, 'treatmentHistory')
        ? `Treatment history: ${workflowValue(values, 'treatmentHistory')}.`
        : undefined,
      workflowValue(values, 'relevantClinicalContext')
        ? `Relevant clinical context: ${workflowValue(values, 'relevantClinicalContext')}.`
        : undefined,
    ]),
    technique: cleanLines([
      workflowValue(values, 'modalityProtocol') || schema.techniqueDefault,
      quality ? `Examination quality: ${quality}.` : undefined,
      technicalLimitations ? `Technical limitations: ${technicalLimitations}.` : undefined,
    ]),
    findings: findingsOverride || generatedFindings,
    impression: impressionOverride || cleanLines([
      limitationSummary,
      tumorSummary,
      keyPositiveFindings.length
        ? `Key local and regional findings: ${keyPositiveFindings.join('; ')}.`
        : undefined,
      workflowValue(values, 'distantMetastases') === 'present'
        ? `Distant metastatic disease: ${workflowValue(values, 'distantMetastasisDetails') || 'present'}.`
        : workflowValue(values, 'distantMetastases') === 'indeterminate'
          ? 'Distant metastatic disease is indeterminate.'
          : undefined,
      workflowValue(values, 'userResponseSynthesis') || undefined,
    ]),
    incidentalFindings: workflowValue(values, 'incidentalFindings'),
    recommendations:
      'No stage, treatment, or management recommendation is generated. Verify surgical-plane measurements, nodal morphology, treatment history, and all user-assigned staging or response language before finalizing.',
  };
}

export function generateProstateMriReport(
  schema: ReportingWorkflowSchema,
  values: WorkflowValues,
): ReportSections {
  const lesionStatus = workflowValue(values, 'lesionAssessment');
  const quality = workflowValue(values, 'examQuality');
  const limitationText = [
    workflowValue(values, 'technicalLimitations'),
    workflowValue(values, 'limitationsUncertainty'),
  ].filter(Boolean).join('; ');
  const glandDimensions = dimensions(values, ['glandApMm', 'glandTrMm', 'glandCcMm']);
  const lesionSize = numberOrNull(values, 'indexLesionSizeMm');
  const userPirads = workflowValue(values, 'userAssignedPirads');
  const findingsOverride = workflowValue(values, 'findingsOverride');
  const impressionOverride = workflowValue(values, 'impressionOverride');

  const glandLine =
    glandDimensions ||
    numberOrNull(values, 'prostateVolumeMl') !== null ||
    numberOrNull(values, 'psaDensity') !== null
      ? `Prostate gland: ${[
          glandDimensions ? `${glandDimensions}` : '',
          numberOrNull(values, 'prostateVolumeMl') !== null
            ? `entered volume ${numberOrNull(values, 'prostateVolumeMl')} mL`
            : '',
          numberOrNull(values, 'psaDensity') !== null
            ? `entered PSA density ${numberOrNull(values, 'psaDensity')} ng/mL/mL`
            : '',
        ].filter(Boolean).join('; ')}.`
      : undefined;
  const lesionLine =
    lesionStatus === 'absent'
      ? 'No suspicious prostate lesion is entered.'
      : lesionStatus === 'present'
        ? `Index lesion${workflowValue(values, 'indexLesionLocation') ? ` at ${workflowValue(values, 'indexLesionLocation')}` : ''}${
            workflowValue(values, 'indexLesionZone') ? ` in the ${workflowValue(values, 'indexLesionZone')}` : ''
          }${lesionSize !== null ? `, measuring ${lesionSize} mm` : ''}${
            userPirads ? `; user-assigned PI-RADS ${userPirads}` : ''
          }.`
        : lesionStatus === 'indeterminate'
          ? `Indeterminate prostate lesion${workflowValue(values, 'indexLesionLocation') ? ` at ${workflowValue(values, 'indexLesionLocation')}` : ''}${
              lesionSize !== null ? `, measuring ${lesionSize} mm` : ''
            }.`
          : undefined;
  const sequenceLines =
    ['present', 'indeterminate'].includes(lesionStatus)
      ? [
          workflowValue(values, 't2Description')
            ? `T2-weighted appearance: ${workflowValue(values, 't2Description')}.`
            : undefined,
          workflowValue(values, 'diffusionDescription')
            ? `Diffusion-weighted appearance: ${workflowValue(values, 'diffusionDescription')}.`
            : undefined,
          workflowValue(values, 'adcDescription')
            ? `ADC appearance: ${workflowValue(values, 'adcDescription')}.`
            : undefined,
          workflowValue(values, 'dceDescription')
            ? `Dynamic contrast enhancement: ${workflowValue(values, 'dceDescription')}.`
            : undefined,
        ]
      : [];
  const positiveOrIndeterminate = (
    label: string,
    statusKey: string,
    detailsKey: string,
  ): string | undefined => {
    const status = workflowValue(values, statusKey);
    if (!['present', 'indeterminate'].includes(status)) return undefined;
    return `${label} is ${status}${workflowValue(values, detailsKey) ? `: ${workflowValue(values, detailsKey)}` : ''}.`;
  };
  const extensionLines = [
    positiveOrIndeterminate(
      'Extraprostatic extension',
      'extracapsularExtension',
      'extracapsularExtensionDetails',
    ),
    positiveOrIndeterminate(
      'Neurovascular bundle involvement',
      'neurovascularBundleInvolvement',
      'neurovascularBundleDetails',
    ),
    positiveOrIndeterminate(
      'Seminal vesicle invasion',
      'seminalVesicleInvasion',
      'seminalVesicleDetails',
    ),
    positiveOrIndeterminate(
      'Bladder neck invasion',
      'bladderNeckInvasion',
      'bladderNeckDetails',
    ),
    positiveOrIndeterminate('Suspicious pelvic nodes', 'suspiciousNodes', 'suspiciousNodeDetails'),
    positiveOrIndeterminate(
      'Osseous metastatic disease',
      'osseousMetastases',
      'osseousMetastasisDetails',
    ),
  ];
  const allExtensionNegative = [
    'extracapsularExtension',
    'neurovascularBundleInvolvement',
    'seminalVesicleInvasion',
    'bladderNeckInvasion',
    'suspiciousNodes',
    'osseousMetastases',
  ].every((key) => workflowValue(values, key) === 'absent');

  const generatedFindings = cleanLines([
    workflowValue(values, 'comparisonStudy') || workflowValue(values, 'comparisonDate')
      ? `Comparison: ${workflowValue(values, 'comparisonStudy') || 'prior examination'}${
          workflowValue(values, 'comparisonDate') ? ` dated ${workflowValue(values, 'comparisonDate')}` : ''
        }.`
      : undefined,
    glandLine,
    lesionLine,
    ...sequenceLines,
    assessmentSentence(
      'Additional suspicious lesions',
      workflowValue(values, 'additionalLesions'),
      workflowValue(values, 'additionalLesionDetails'),
    ),
    ...extensionLines,
    allExtensionNegative
      ? 'No extraprostatic, neurovascular bundle, seminal vesicle, bladder neck, suspicious nodal, or osseous metastatic involvement is entered.'
      : undefined,
    workflowValue(values, 'treatmentRelatedChange')
      ? `Biopsy or treatment-related change: ${workflowValue(values, 'treatmentRelatedChange')}.`
      : undefined,
    workflowValue(values, 'additionalFindings')
      ? `Additional findings: ${workflowValue(values, 'additionalFindings')}.`
      : undefined,
    limitationText ? `Limitations: ${limitationText}.` : undefined,
  ]);

  const positiveExtension = extensionLines.filter(Boolean);
  const lesionSummary =
    lesionStatus === 'present'
      ? `Suspicious index lesion${workflowValue(values, 'indexLesionLocation') ? ` at ${workflowValue(values, 'indexLesionLocation')}` : ''}${
          lesionSize !== null ? ` measuring ${lesionSize} mm` : ''
        }${userPirads ? `, user-assigned PI-RADS ${userPirads}` : ''}.`
      : lesionStatus === 'absent'
        ? 'No suspicious prostate lesion is entered.'
        : lesionStatus === 'indeterminate'
          ? 'Indeterminate prostate lesion; correlate with the detailed sequence findings.'
          : 'Prostate lesion assessment is incomplete.';
  const limitationSummary =
    quality === 'nondiagnostic'
      ? `Nondiagnostic examination${limitationText ? `: ${limitationText}` : '.'}`
      : quality === 'limited'
        ? `Limited prostate MRI${limitationText ? `: ${limitationText}` : '.'}`
        : undefined;

  return {
    indication: cleanLines([
      workflowValue(values, 'clinicalIndication') || schema.clinicalQuestion,
      workflowValue(values, 'examPurpose')
        ? `Examination purpose: ${workflowValue(values, 'examPurpose')}.`
        : undefined,
      numberOrNull(values, 'psa') !== null ? `PSA: ${numberOrNull(values, 'psa')} ng/mL.` : undefined,
      workflowValue(values, 'biopsyHistory')
        ? `Biopsy history: ${workflowValue(values, 'biopsyHistory')}.`
        : undefined,
      workflowValue(values, 'treatmentHistory')
        ? `Treatment history: ${workflowValue(values, 'treatmentHistory')}.`
        : undefined,
      workflowValue(values, 'relevantClinicalContext')
        ? `Relevant clinical context: ${workflowValue(values, 'relevantClinicalContext')}.`
        : undefined,
    ]),
    technique: cleanLines([
      workflowValue(values, 'modalityProtocol') || schema.techniqueDefault,
      quality ? `Examination quality: ${quality}.` : undefined,
      workflowValue(values, 'technicalLimitations')
        ? `Technical limitations: ${workflowValue(values, 'technicalLimitations')}.`
        : undefined,
    ]),
    findings: findingsOverride || generatedFindings,
    impression: impressionOverride || cleanLines([
      limitationSummary,
      lesionSummary,
      positiveExtension.length
        ? `Local or metastatic staging findings: ${positiveExtension.map((line) => line?.replace(/\.$/, '')).join('; ')}.`
        : undefined,
    ]),
    incidentalFindings: workflowValue(values, 'incidentalFindings'),
    recommendations:
      'No PI-RADS category, stage, biopsy threshold, treatment, or management recommendation is calculated. Verify all sequence findings and user-assigned category before finalizing.',
  };
}

export function generateRenalMassReport(
  schema: ReportingWorkflowSchema,
  values: WorkflowValues,
): ReportSections {
  const massStatus = workflowValue(values, 'renalMass');
  const quality = workflowValue(values, 'examQuality');
  const limitationText = [
    workflowValue(values, 'technicalLimitations'),
    workflowValue(values, 'limitationsUncertainty'),
  ].filter(Boolean).join('; ');
  const massDimensions = dimensions(values, ['massApMm', 'massTrMm', 'massCcMm']);
  const findingsOverride = workflowValue(values, 'findingsOverride');
  const impressionOverride = workflowValue(values, 'impressionOverride');
  const massLine =
    massStatus === 'absent'
      ? 'No renal mass is entered.'
      : massStatus === 'present'
        ? `${capitalize(workflowValue(values, 'laterality')) || 'Renal'} ${workflowValue(values, 'poleLocation') || ''} ${
            workflowValue(values, 'composition') || 'renal'
          } mass${massDimensions ? ` measuring ${massDimensions}` : ''}${
            workflowValue(values, 'enhancement') && workflowValue(values, 'enhancement') !== 'not assessed'
              ? `; enhancement ${workflowValue(values, 'enhancement')}`
              : ''
          }${workflowValue(values, 'userAssignedBosniak') ? `; user-assigned Bosniak ${workflowValue(values, 'userAssignedBosniak')}` : ''}.`
        : massStatus === 'indeterminate'
          ? `Indeterminate ${workflowValue(values, 'laterality') || ''} renal lesion${massDimensions ? ` measuring ${massDimensions}` : ''}.`
          : undefined;
  const compositionLines =
    ['present', 'indeterminate'].includes(massStatus)
      ? [
          assessmentSentence('Macroscopic fat', workflowValue(values, 'macroscopicFat')),
          assessmentSentence('Hemorrhage', workflowValue(values, 'hemorrhage')),
          assessmentSentence('Necrosis', workflowValue(values, 'necrosis')),
          assessmentSentence('Calcification', workflowValue(values, 'calcification')),
        ]
      : [];
  const positiveOrIndeterminate = (label: string, statusKey: string, detailsKey = '') => {
    const status = workflowValue(values, statusKey);
    if (!['present', 'indeterminate'].includes(status)) return undefined;
    return `${label} is ${status}${detailsKey && workflowValue(values, detailsKey) ? `: ${workflowValue(values, detailsKey)}` : ''}.`;
  };
  const extensionLines = [
    positiveOrIndeterminate('Renal sinus involvement', 'renalSinusInvolvement'),
    positiveOrIndeterminate('Collecting-system involvement', 'collectingSystemInvolvement'),
    positiveOrIndeterminate('Renal vein thrombus', 'renalVeinThrombus', 'renalVeinThrombusDetails'),
    positiveOrIndeterminate('IVC thrombus', 'ivcThrombus', 'ivcThrombusDetails'),
    positiveOrIndeterminate('Perinephric extension', 'perinephricExtension', 'perinephricExtensionDetails'),
    positiveOrIndeterminate('Adjacent-organ invasion', 'adjacentOrganInvasion', 'adjacentOrganDetails'),
    positiveOrIndeterminate('Multifocal renal disease', 'multifocalDisease', 'multifocalDetails'),
    positiveOrIndeterminate('Suspicious nodal disease', 'suspiciousNodes', 'suspiciousNodeDetails'),
    positiveOrIndeterminate('Distant metastatic disease', 'distantMetastases', 'distantMetastasisDetails'),
  ];
  const allExtensionNegative = [
    'renalSinusInvolvement', 'collectingSystemInvolvement', 'renalVeinThrombus', 'ivcThrombus',
    'perinephricExtension', 'adjacentOrganInvasion', 'multifocalDisease', 'suspiciousNodes',
    'distantMetastases',
  ].every((key) => workflowValue(values, key) === 'absent');
  const generatedFindings = cleanLines([
    massLine,
    ...compositionLines,
    ...extensionLines,
    allExtensionNegative
      ? 'No renal sinus, collecting-system, venous, perinephric, adjacent-organ, multifocal, nodal, or distant metastatic involvement is entered.'
      : undefined,
    workflowValue(values, 'contralateralKidney')
      ? `Contralateral kidney: ${workflowValue(values, 'contralateralKidney')}.`
      : undefined,
    workflowValue(values, 'surgicalAnatomy')
      ? `Surgically relevant anatomy: ${workflowValue(values, 'surgicalAnatomy')}.`
      : undefined,
    workflowValue(values, 'additionalFindings')
      ? `Additional findings: ${workflowValue(values, 'additionalFindings')}.`
      : undefined,
    limitationText ? `Limitations: ${limitationText}.` : undefined,
  ]);
  const limitationSummary =
    quality === 'nondiagnostic'
      ? `Nondiagnostic examination${limitationText ? `: ${limitationText}` : '.'}`
      : quality === 'limited'
        ? `Limited renal mass examination${limitationText ? `: ${limitationText}` : '.'}`
        : undefined;
  const massSummary =
    massStatus === 'present'
      ? `${capitalize(workflowValue(values, 'laterality')) || 'Renal'} renal mass${massDimensions ? ` measuring ${massDimensions}` : ''}${
          workflowValue(values, 'userAssignedBosniak') ? `, user-assigned Bosniak ${workflowValue(values, 'userAssignedBosniak')}` : ''
        }.`
      : massStatus === 'absent'
        ? 'No renal mass is entered.'
        : massStatus === 'indeterminate'
          ? 'Indeterminate renal lesion.'
          : 'Renal mass assessment is incomplete.';
  return {
    indication: cleanLines([
      workflowValue(values, 'clinicalIndication') || schema.clinicalQuestion,
      workflowValue(values, 'relevantClinicalContext')
        ? `Relevant clinical context: ${workflowValue(values, 'relevantClinicalContext')}.`
        : undefined,
    ]),
    technique: cleanLines([
      workflowValue(values, 'modalityProtocol') || schema.techniqueDefault,
      quality ? `Examination quality: ${quality}.` : undefined,
      workflowValue(values, 'technicalLimitations')
        ? `Technical limitations: ${workflowValue(values, 'technicalLimitations')}.`
        : undefined,
    ]),
    findings: findingsOverride || generatedFindings,
    impression: impressionOverride || cleanLines([
      limitationSummary,
      massSummary,
      ...extensionLines,
      workflowValue(values, 'userStagingSynthesis') || undefined,
    ]),
    incidentalFindings: workflowValue(values, 'incidentalFindings'),
    recommendations:
      'No Bosniak category, stage, treatment, or management recommendation is calculated. Verify enhancement, venous extent, local invasion, metastatic disease, and user-assigned classification before finalizing.',
  };
}
