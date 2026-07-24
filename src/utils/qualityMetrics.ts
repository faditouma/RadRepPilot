import type { ModuleType, ReferralFormState, ReportSections } from '../radrep/types';

export interface QualityCheck {
  label: string;
  complete: boolean;
  missingLabel?: string;
  completeLabel?: string;
}

export interface QualityScore {
  label: string;
  complete: number;
  total: number;
  percent: number;
  checks: QualityCheck[];
  summary: string;
}

function score(label: string, checks: QualityCheck[]): QualityScore {
  const complete = checks.filter((check) => check.complete).length;
  const total = checks.length;
  const percent = total ? Math.round((complete / total) * 100) : 0;
  return {
    label,
    complete,
    total,
    percent,
    checks,
    summary: `${label}: ${complete}/${total}`,
  };
}

function hasValue(value: unknown): boolean {
  if (typeof value === 'boolean') return true;
  if (Array.isArray(value)) return value.length > 0;
  return typeof value === 'string' ? value.trim().length > 0 : value != null;
}

function hasAny(values: Record<string, unknown>, keys: string[]): boolean {
  return keys.some((key) => hasValue(values[key]));
}

function textValue(value: unknown): string {
  if (typeof value === 'boolean') return value ? 'yes' : 'no';
  if (Array.isArray(value)) return value.join(' ');
  return typeof value === 'string' ? value.trim() : '';
}

function hasMeaningfulText(value: unknown): boolean {
  const text = textValue(value).toLowerCase();
  return Boolean(text) && !['no', 'none', 'nil', 'n/a', 'na', 'not applicable', 'negative'].includes(text);
}

function addressed(value: unknown): boolean {
  const text = textValue(value).toLowerCase();
  return Boolean(text) && !['not specified', 'unknown', 'unspecified', ''].includes(text);
}

function addressedAny(values: Record<string, unknown>, keys: string[]): boolean {
  return keys.some((key) => addressed(values[key]));
}

function hasFreeTextCoverage(values: Record<string, unknown>): boolean {
  return hasMeaningfulText(values.additionalFindings) || hasMeaningfulText(values.limitationsUncertainty);
}

function hasPmhxAddressed(values: Record<string, unknown>): boolean {
  const pmhxStatus = textValue(values.pmhxStatus).toLowerCase();
  const pmhx = textValue(values.pmhx).toLowerCase();
  if (pmhxStatus === 'no-significant-pmhx' || pmhxStatus === 'relevant-pmhx') return true;
  return hasValue(values.pmhx) || /^(healthy|well|no significant|no pmhx|no past medical history)$/.test(pmhx);
}

function hasKeyNegative(values: Record<string, unknown>, phrase: string): boolean {
  const keyNegatives = values.keyNegatives;
  if (!Array.isArray(keyNegatives)) return false;
  const normalizedPhrase = phrase.toLowerCase();
  return keyNegatives.some((item) => String(item).toLowerCase().includes(normalizedPhrase));
}

function hasReportText(report: ReportSections, pattern: RegExp): boolean {
  return pattern.test([report.findings, report.impression, report.incidentalFindings, report.recommendations].filter(Boolean).join(' '));
}

function optionalFindingCheck(
  label: string,
  value: unknown,
  reportText: unknown,
  absentLabel: string,
  presentLabel: string,
): QualityCheck {
  const entered = hasMeaningfulText(value) || hasMeaningfulText(reportText);
  return {
    label,
    complete: true,
    completeLabel: entered ? presentLabel : absentLabel,
  };
}

export function scoreRequisitionCompleteness(form: ReferralFormState): QualityScore {
  const values = form.values ?? {};
  return score('Requisition completeness', [
    { label: 'Age/sex present', complete: hasAny(values, ['age', 'sex']), missingLabel: 'Missing age/sex' },
    { label: 'PMHx addressed', complete: hasPmhxAddressed(values), missingLabel: 'Missing PMHx or “healthy/no PMHx” status' },
    {
      label: 'Symptom/indication present',
      complete: hasAny(values, ['mainSymptom', 'positiveSymptoms', 'symptomType', 'painLocation', 'indication']),
      missingLabel: 'Missing symptom/indication',
    },
    { label: 'Duration present', complete: hasAny(values, ['duration', 'onsetDuration', 'timeSinceInjury']), missingLabel: 'Missing duration' },
    {
      label: 'Red flags addressed',
      complete: hasAny(values, [
        'redFlags',
        'thunderclap',
        'neuroDeficit',
        'trauma',
        'anticoagulation',
        'fever',
        'immunosuppression',
        'cancerHistory',
      ]),
      missingLabel: 'Missing red flags',
    },
    {
      label: 'Specific radiology question present',
      complete: hasAny(values, ['clinicalQuestion', 'question']),
      missingLabel: 'Missing specific question',
    },
  ]);
}

export function scoreReportCompleteness(moduleType: ModuleType, values: Record<string, unknown>, report: ReportSections): QualityScore {
  if (moduleType === 'lymphomaPetCt') {
    const nodalStatus = textValue(values.nodalDisease);
    const extranodalStatus = textValue(values.extranodalDisease);
    const responseExam = /response|surveillance|recurrence/i.test(textValue(values.examPurpose));
    const nodalDetailsComplete =
      !['present', 'indeterminate'].includes(nodalStatus) ||
      (hasMeaningfulText(values.nodalDistribution) && hasMeaningfulText(values.dominantNodalSite));
    const extranodalDetailsComplete =
      !['present', 'indeterminate'].includes(extranodalStatus) ||
      (hasMeaningfulText(values.extranodalSites) && hasMeaningfulText(values.dominantExtranodalSite));
    const responseComplete =
      !responseExam ||
      (hasAny(values, ['comparisonStudy', 'comparisonDate']) &&
        addressed(values.intervalChange) &&
        addressed(values.newLesions));

    return score('Report completeness', [
      {
        label: 'Clinical indication and examination purpose addressed',
        complete: hasMeaningfulText(values.clinicalIndication) && addressed(values.examPurpose),
        missingLabel: 'Clinical indication or examination purpose missing',
      },
      {
        label: 'Tracer and technical quality addressed',
        complete: hasMeaningfulText(values.tracer) && addressed(values.examQuality),
        missingLabel: 'Tracer or examination quality missing',
      },
      {
        label: 'Nodal disease distribution complete',
        complete: addressed(values.nodalDisease) && nodalDetailsComplete,
        missingLabel:
          nodalStatus === 'present' || nodalStatus === 'indeterminate'
            ? 'Nodal distribution or dominant site missing'
            : 'Nodal disease assessment missing',
      },
      {
        label: 'Extranodal disease distribution complete',
        complete: addressed(values.extranodalDisease) && extranodalDetailsComplete,
        missingLabel:
          extranodalStatus === 'present' || extranodalStatus === 'indeterminate'
            ? 'Extranodal distribution or dominant site missing'
            : 'Extranodal disease assessment missing',
      },
      {
        label: 'Spleen, marrow, and liver addressed',
        complete:
          addressed(values.spleenAssessment) &&
          addressed(values.marrowAssessment) &&
          addressed(values.liverAssessment),
        missingLabel: 'Spleen, marrow, or liver assessment missing',
      },
      {
        label: 'Response assessment complete when applicable',
        complete: responseComplete,
        missingLabel: 'Comparison, interval change, or new-lesion assessment missing',
      },
      {
        label: 'Impression generated',
        complete: hasMeaningfulText(report.impression),
        missingLabel: 'Impression incomplete',
      },
      optionalFindingCheck(
        'Incidental findings addressed',
        values.incidentalFindings,
        report.incidentalFindings,
        'No incidental finding entered',
        'Incidental finding documented',
      ),
    ]);
  }

  if (moduleType === 'chestXray') {
    const airspaceAddressed = addressedAny(values, ['consolidation', 'atelectaticChange', 'interstitialEdema']) || hasFreeTextCoverage(values);
    const pleuraAddressed = addressedAny(values, ['pleuralEffusion', 'pneumothorax']) || hasFreeTextCoverage(values);
    return score('Report completeness', [
      {
        label: 'Study quality or technique addressed',
        complete: addressed(values.studyQuality) || hasMeaningfulText(values.technique) || hasFreeTextCoverage(values),
        missingLabel: 'Study quality/technique not addressed',
      },
      {
        label: 'Cardiomediastinal silhouette addressed',
        complete: addressed(values.cardiomediastinalSilhouette) || hasFreeTextCoverage(values),
        missingLabel: 'Cardiomediastinal silhouette not addressed',
      },
      {
        label: 'Lung/airspace findings addressed',
        complete: airspaceAddressed,
        missingLabel: 'Airspace/edema findings not addressed',
      },
      {
        label: 'Pleura/pneumothorax addressed',
        complete: pleuraAddressed,
        missingLabel: 'Pleural effusion/pneumothorax not addressed',
      },
      {
        label: 'Impression generated',
        complete: hasMeaningfulText(report.impression),
        missingLabel: 'Impression incomplete',
      },
    ]);
  }

  if (moduleType === 'mskXrayFracture') {
    return score('Report completeness', [
      {
        label: 'Body part/laterality addressed',
        complete: hasMeaningfulText(values.bodyPart) && addressed(values.laterality),
        missingLabel: 'Body part or laterality missing',
      },
      {
        label: 'Fracture status addressed',
        complete: addressed(values.fracture),
        missingLabel: 'Fracture status not addressed',
      },
      {
        label: 'Alignment/dislocation addressed',
        complete: addressed(values.jointAlignment),
        missingLabel: 'Alignment/dislocation not addressed',
      },
      {
        label: 'Soft tissue/joint effusion addressed',
        complete: addressed(values.softTissueEffusion) || hasFreeTextCoverage(values),
        missingLabel: 'Soft tissue/effusion status not addressed',
      },
      {
        label: 'Impression generated',
        complete: hasMeaningfulText(report.impression),
        missingLabel: 'Impression incomplete',
      },
    ]);
  }

  if (moduleType === 'ctpa') {
    const peStatus = textValue(values.pePresent);
    const positivePeDetailsComplete =
      peStatus !== 'present' ||
      (addressed(values.embolusAppearance) &&
        addressed(values.laterality) &&
        addressed(values.proximalLevel) &&
        hasMeaningfulText(values.involvedBranches));
    const indeterminateDetailsComplete =
      peStatus !== 'indeterminate' ||
      (addressed(values.indeterminateLevel) && hasMeaningfulText(values.indeterminateLocation));
    const rightHeartAddressed =
      addressed(values.rightHeartSynthesis) ||
      addressedAny(values, [
        'rvDiameterMm',
        'lvDiameterMm',
        'enteredRvLvRatio',
        'septalConfiguration',
        'contrastReflux',
        'mainPulmonaryArteryEnlargement',
      ]) ||
      hasMeaningfulText(values.otherRightHeartFindings);
    const associatedFindingsAddressed =
      addressedAny(values, [
        'pulmonaryInfarct',
        'pleuralEffusion',
        'atelectaticConsolidativeOpacity',
        'pneumothorax',
      ]) || hasAny(values, ['alternativeDiagnosis', 'additionalFindings', 'findingsOverride']);
    const urgentFinding =
      ['present', 'indeterminate', 'not-adequately-assessed'].includes(peStatus) ||
      textValue(values.examQuality) === 'nondiagnostic' ||
      textValue(values.pneumothorax) === 'present';
    const communicationComplete =
      !urgentFinding ||
      (addressed(values.communicationStatus) &&
        (textValue(values.communicationStatus) !== 'occurred' ||
          (hasMeaningfulText(values.communicationRecipient) &&
            hasMeaningfulText(values.communicationDate) &&
            hasMeaningfulText(values.communicationTime) &&
            hasMeaningfulText(values.communicationMethod))));

    return score('Report completeness', [
      {
        label: 'Clinical indication addressed',
        complete: hasMeaningfulText(values.clinicalIndication),
        missingLabel: 'Clinical indication not entered',
      },
      {
        label: 'Technical quality addressed',
        complete:
          addressed(values.contrastOpacification) &&
          addressed(values.examQuality) &&
          addressed(values.respiratoryMotion) &&
          addressed(values.bolusTimingArtifact),
        missingLabel: 'Contrast quality, diagnostic quality, motion, or bolus timing not addressed',
      },
      {
        label: 'PE assessment and distribution complete',
        complete: addressed(values.pePresent) && positivePeDetailsComplete && indeterminateDetailsComplete,
        missingLabel:
          peStatus === 'present'
            ? 'Positive PE appearance/distribution incomplete'
            : peStatus === 'indeterminate'
              ? 'Indeterminate filling-defect detail incomplete'
              : 'PE assessment not entered',
      },
      {
        label: 'Right-heart findings addressed',
        complete: rightHeartAddressed,
        missingLabel: 'Right-heart assessment not entered',
      },
      {
        label: 'Associated findings addressed',
        complete: associatedFindingsAddressed,
        missingLabel: 'Complications/associated thoracic findings not addressed',
      },
      {
        label: 'Impression generated',
        complete: hasMeaningfulText(report.impression),
        missingLabel: 'Impression incomplete',
      },
      {
        label: 'Urgent communication status addressed when applicable',
        complete: communicationComplete,
        missingLabel: 'Critical-result communication status/details incomplete',
      },
      optionalFindingCheck('Incidental follow-up addressed if present', values.incidentalFindings, report.incidentalFindings, 'No incidental finding entered', 'Incidental finding/follow-up documented'),
    ]);
  }

  if (moduleType === 'nodule') {
    return score('Report completeness', [
      {
        label: 'Guideline applicability context addressed',
        complete: hasAny(values, ['patientAge', 'knownMalignancy', 'immunocompromised', 'patientRisk']),
        missingLabel: 'Applicability context not addressed',
      },
      {
        label: 'Nodule type/count addressed',
        complete: addressed(values.noduleType) && addressed(values.numberOfNodules),
        missingLabel: 'Nodule type/count not addressed',
      },
      {
        label: 'Size/location addressed',
        complete: hasAny(values, ['sizeMm', 'location']) || hasFreeTextCoverage(values),
        missingLabel: 'Nodule size/location not addressed',
      },
      {
        label: 'Morphology or stability addressed',
        complete: addressed(values.morphology) || addressed(values.stability) || hasFreeTextCoverage(values),
        missingLabel: 'Morphology/stability not addressed',
      },
      {
        label: 'Follow-up language generated',
        complete: hasMeaningfulText(report.impression) || hasMeaningfulText(report.recommendations),
        missingLabel: 'Follow-up language incomplete',
      },
    ]);
  }

  if (moduleType === 'stroke') {
    return score('Report completeness', [
      {
        label: 'Hemorrhage addressed',
        complete: addressed(values.hemorrhagePresent) || hasReportText(report, /hemorrhage/i),
        missingLabel: 'Hemorrhage not addressed',
      },
      {
        label: 'Early ischemic change/ASPECTS addressed',
        complete: addressed(values.earlyIschemicChangePresent) || hasValue(values.aspectsRegions) || hasReportText(report, /ASPECTS|ischemic|infarct/i),
        missingLabel: 'ASPECTS/ischemic change not addressed',
      },
      {
        label: 'Mass effect/shift addressed',
        complete: addressed(values.massEffect) || hasAny(values, ['midlineShiftMm']) || hasReportText(report, /mass effect|midline shift/i),
        missingLabel: 'Mass effect/shift not addressed',
      },
      {
        label: 'LVO/clinical context addressed',
        complete: addressed(values.largeVesselOcclusionSuspected) || hasAny(values, ['clinicalIndication']) || hasFreeTextCoverage(values),
        missingLabel: 'LVO/context not addressed',
      },
      {
        label: 'Impression generated',
        complete: hasMeaningfulText(report.impression),
        missingLabel: 'Impression incomplete',
      },
    ]);
  }

  if (moduleType === 'appendicitis') {
    const combinedReportText = [report.findings, report.impression].filter(Boolean).join(' ');
    const alternativeReportMention =
      /alternative (finding|diagnosis)/i.test(combinedReportText) &&
      !/alternative (finding|diagnosis):?\s*(none|no|negative)/i.test(combinedReportText);
    const alternativeEntered = hasMeaningfulText(values.alternativeDiagnosis) || alternativeReportMention;
    return score('Report completeness', [
      {
        label: 'Appendix visualization/diameter addressed',
        complete: hasAny(values, ['appendixVisualized']) && (textValue(values.appendixVisualized) === 'no' || hasAny(values, ['appendixDiameterMm']) || hasReportText(report, /normal in caliber|not confidently visualized/i)),
        missingLabel: 'Appendix visualization/diameter not addressed',
      },
      { label: 'Inflammatory changes addressed', complete: hasAny(values, ['fatStranding', 'wallThickeningEnhancement']) || hasReportText(report, /inflammatory|stranding|wall thickening/i), missingLabel: 'Inflammatory changes not addressed' },
      {
        label: 'Abscess/perforation addressed',
        complete: hasAny(values, ['abscessPhlegmon', 'freeAirPerforation']) || hasKeyNegative(values, 'abscess') || hasKeyNegative(values, 'perforation') || hasReportText(report, /abscess|perforation|free air/i),
        missingLabel: 'Abscess/perforation not addressed',
      },
      {
        label: 'Bowel obstruction addressed',
        complete: hasAny(values, ['obstructionIleus']) || hasKeyNegative(values, 'bowel obstruction') || hasReportText(report, /bowel obstruction|ileus/i),
        missingLabel: 'Bowel obstruction not addressed',
      },
      {
        label: 'Alternative diagnosis addressed',
        complete: true,
        completeLabel: alternativeEntered ? 'Alternative diagnosis documented' : 'No alternative diagnosis entered',
      },
      optionalFindingCheck('Incidental findings addressed', values.incidentalFindings, report.incidentalFindings, 'No incidental finding entered', 'Incidental finding/follow-up documented'),
    ]);
  }

  return score('Report completeness', [
    { label: 'Findings generated', complete: hasValue(report.findings) },
    { label: 'Impression generated', complete: hasValue(report.impression) },
    { label: 'Key negatives/complications considered', complete: hasAny(values, ['keyNegatives']) || /no /i.test(report.findings + report.impression) },
    optionalFindingCheck('Incidental follow-up addressed if present', values.incidentalFindings, report.incidentalFindings, 'No incidental finding entered', 'Incidental finding/follow-up documented'),
  ]);
}

export function scoreFollowUpSafety(sentence: string): QualityScore {
  const text = sentence.toLowerCase();
  const noFollowUp = /no (specific |routine )?(imaging )?follow-up/.test(text);
  const actionPresent = /follow-up|consider|recommend|surveillance|characterization|correlation/.test(text);
  const modalityPresent = /ct|mri|ultrasound|pet\/ct|x-ray|mrcp|adrenal protocol|renal protocol|thyroid ultrasound|chest/.test(text) || noFollowUp;
  const intervalPresent = /\b(3|6|9|12|18|24)[ -]?(month|months)|6-12|18-24|local protocol|no specific|further characterization/.test(text);
  const warningPresent = /guideline|applicability|protocol|verification|clinically appropriate/.test(text);

  return score('Follow-up safety', [
    { label: 'Follow-up recommendation present', complete: actionPresent, missingLabel: 'Follow-up recommendation missing' },
    { label: 'Modality specified when applicable', complete: modalityPresent, missingLabel: 'Follow-up modality missing' },
    { label: 'Interval specified if applicable', complete: intervalPresent || noFollowUp, missingLabel: 'Follow-up interval missing' },
    { label: 'Applicability/verification warning shown', complete: warningPresent, missingLabel: 'Applicability warning missing' },
  ]);
}
