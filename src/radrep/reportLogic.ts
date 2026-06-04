import type {
  AspectsRegion,
  CtpaFormState,
  NoduleFormState,
  ReportBuilderState,
  ReportSections,
  StrokeFormState,
} from './types';

const emptyReport: ReportSections = {
  indication: '',
  technique: '',
  findings: '',
  impression: '',
  incidentalFindings: '',
  recommendations: '',
};

function parsePositiveNumber(value: string | number): number | null {
  const parsed = typeof value === 'number' ? value : Number.parseFloat(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function joinNonEmpty(parts: Array<string | undefined | null>, separator = ' '): string {
  return parts.filter((part): part is string => Boolean(part?.trim())).join(separator);
}

function sentenceList(items: string[]): string {
  if (items.length === 0) return '';
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`;
}

function cleanLines(lines: Array<string | undefined | null>): string {
  return lines.filter((line): line is string => Boolean(line?.trim())).join('\n');
}

function universalFreeTextLines(form: { additionalFindings?: string; limitationsUncertainty?: string }): Array<string | undefined> {
  return [
    form.additionalFindings?.trim()
      ? `Additional findings/radiologist comment: ${form.additionalFindings.trim()}`
      : undefined,
    form.limitationsUncertainty?.trim()
      ? `Limitations/uncertainty: ${form.limitationsUncertainty.trim()}`
      : undefined,
  ];
}

function formatNumber(value: number, digits = 1): string {
  return value.toFixed(digits).replace(/\.0$/, '');
}

export function buildFullReport(report: ReportSections): string {
  return cleanLines([
    report.indication ? `INDICATION:\n${report.indication}` : undefined,
    report.technique ? `TECHNIQUE:\n${report.technique}` : undefined,
    report.findings ? `FINDINGS:\n${report.findings}` : undefined,
    report.impression ? `IMPRESSION:\n${report.impression}` : undefined,
    report.incidentalFindings ? `INCIDENTAL FINDINGS / FOLLOW-UP:\n${report.incidentalFindings}` : undefined,
    report.recommendations ? `RECOMMENDATIONS:\n${report.recommendations}` : undefined,
  ]);
}

export function builderToReport(builder: ReportBuilderState): ReportSections {
  return {
    indication: builder.indication,
    technique: builder.technique,
    findings: builder.findings,
    impression: builder.impression,
    incidentalFindings: builder.incidentalFindings,
    recommendations: builder.recommendations,
  };
}

export function calculateRvLvRatio(rv: string | number, lv: string | number): number | null {
  const rvNumber = parsePositiveNumber(rv);
  const lvNumber = parsePositiveNumber(lv);
  if (!rvNumber || !lvNumber) return null;
  return Number((rvNumber / lvNumber).toFixed(2));
}

export function interpretRvLvRatio(ratio: number | null): string {
  if (ratio === null) return 'RV/LV ratio was not calculated because one or both measurements are missing.';
  if (ratio <= 1) return 'No CT evidence of right heart strain based on RV/LV ratio.';
  return 'RV/LV ratio supports CT evidence of right heart strain in the appropriate clinical context.';
}

export function generateRvLvSentence(rv: string, lv: string): string {
  const ratio = calculateRvLvRatio(rv, lv);
  if (ratio === null) return 'RV/LV ratio cannot be calculated from the provided measurements.';
  const interpretation =
    ratio > 1
      ? 'supporting CT evidence of right heart strain in the setting of pulmonary embolism'
      : 'without CT evidence of right heart strain by this measurement';
  return `RV/LV ratio is ${formatNumber(ratio)}, ${interpretation}.`;
}

export function calculateAspects(selectedRegions: AspectsRegion[]): number {
  return Math.max(0, 10 - new Set(selectedRegions).size);
}

export function generateAspectsSentence(
  score: number,
  side: string,
  selectedRegions: AspectsRegion[],
): string {
  if (selectedRegions.length === 0) {
    return `ASPECTS score is ${score}, with no selected early ischemic change regions.`;
  }

  const sidePhrase = side && side !== 'none' ? `${side} ` : '';
  return `ASPECTS score is ${score}, with early ischemic changes involving the ${sidePhrase}${sentenceList(
    selectedRegions,
  )} region${selectedRegions.length > 1 ? 's' : ''}.`;
}

function peLevelPhrase(form: CtpaFormState): string {
  const location = form.laterality === 'bilateral' ? 'bilaterally' : `on the ${form.laterality}`;
  return `${form.proximalLevel} pulmonary arteries ${location}`;
}

export function generateCtpaReport(form: CtpaFormState): ReportSections {
  const report = { ...emptyReport };
  const ratio = calculateRvLvRatio(form.rvDiameterMm, form.lvDiameterMm);
  const ratioSentence = ratio !== null ? `RV/LV ratio is ${formatNumber(ratio)}. ${interpretRvLvRatio(ratio)}` : '';
  const effusionSentence =
    form.pleuralEffusion === 'none'
      ? 'No pleural effusion.'
      : `${form.pleuralEffusion[0].toUpperCase()}${form.pleuralEffusion.slice(1)} pleural effusion is present.`;

  report.indication = form.clinicalIndication.trim() || 'Clinical concern for pulmonary embolism.';
  report.technique =
    'CT pulmonary angiogram was performed after intravenous contrast administration. Multiplanar reformats were reviewed.';

  if (form.pePresent === 'yes') {
    const saddleSentence = form.saddleEmbolus === 'yes' ? 'Saddle embolus is present.' : 'No saddle embolus is described.';
    const infarctSentence =
      form.pulmonaryInfarct === 'yes'
        ? 'Peripheral pulmonary infarct-type opacity is described.'
        : 'No pulmonary infarct is described.';

    report.findings = cleanLines([
      `Acute pulmonary embolism involves the ${peLevelPhrase(form)}. Clot burden is ${form.clotBurden}.`,
      saddleSentence,
      ratioSentence,
      infarctSentence,
      effusionSentence,
      form.alternativeDiagnosis ? `Additional or alternative finding: ${form.alternativeDiagnosis.trim()}` : undefined,
      ...universalFreeTextLines(form),
      form.incidentalFindings ? `Incidental findings: ${form.incidentalFindings.trim()}` : undefined,
    ]);

    report.impression = cleanLines([
      `Acute pulmonary embolism involving the ${peLevelPhrase(form)}.`,
      ratio !== null
        ? `RV/LV ratio is ${formatNumber(ratio)}, ${
            ratio > 1 ? 'with CT evidence of right heart strain' : 'without CT evidence of right heart strain'
          }.`
        : undefined,
      form.saddleEmbolus === 'yes' ? 'Saddle embolus is present.' : undefined,
      form.pulmonaryInfarct === 'yes' ? 'Pulmonary infarct-type opacity is present.' : undefined,
      form.pleuralEffusion !== 'none' ? `${form.pleuralEffusion} pleural effusion.` : undefined,
      form.alternativeDiagnosis ? form.alternativeDiagnosis.trim() : undefined,
    ]);
  } else if (form.pePresent === 'no') {
    report.findings = cleanLines([
      'No pulmonary embolism identified to the segmental/subsegmental level based on user-entered findings.',
      ratioSentence,
      effusionSentence,
      form.alternativeDiagnosis ? `Alternative finding: ${form.alternativeDiagnosis.trim()}` : undefined,
      ...universalFreeTextLines(form),
      form.incidentalFindings ? `Incidental findings: ${form.incidentalFindings.trim()}` : undefined,
    ]);

    report.impression = cleanLines([
      'No pulmonary embolism identified to the segmental/subsegmental level.',
      ratio !== null ? (ratio > 1 ? 'RV/LV ratio is elevated.' : 'No CT evidence of right heart strain.') : undefined,
      form.alternativeDiagnosis ? form.alternativeDiagnosis.trim() : undefined,
    ]);
  } else {
    report.findings = cleanLines([
      'Pulmonary embolism assessment is indeterminate based on the user-entered findings.',
      ratioSentence,
      effusionSentence,
      form.alternativeDiagnosis ? `Alternative finding: ${form.alternativeDiagnosis.trim()}` : undefined,
      ...universalFreeTextLines(form),
      form.incidentalFindings ? `Incidental findings: ${form.incidentalFindings.trim()}` : undefined,
    ]);
    report.impression = cleanLines([
      'Indeterminate assessment for pulmonary embolism from the provided findings. Radiologist review of source images is required.',
      ratio !== null ? `RV/LV ratio is ${formatNumber(ratio)}.` : undefined,
    ]);
  }

  report.recommendations = 'Verify all measurements, embolus level, and right heart strain assessment on source images.';
  return report;
}

export function getFleischnerApplicabilityWarning(form: NoduleFormState): string {
  const age = parsePositiveNumber(form.patientAge);
  const warnings = [
    age !== null && age < 35 ? 'patient age younger than 35' : undefined,
    form.knownMalignancy === 'yes' ? 'known malignancy' : undefined,
    form.immunocompromised === 'yes' ? 'immunocompromised status' : undefined,
  ].filter((item): item is string => Boolean(item));

  if (warnings.length === 0) return '';
  return `Fleischner Society recommendations may not apply because of ${sentenceList(
    warnings,
  )}. Consider individualized follow-up based on clinical context.`;
}

// Simplified prototype rules only. Verify against current official guideline sources before clinical use.
export function generateFleischnerRecommendation(form: NoduleFormState): string {
  const size = parsePositiveNumber(form.sizeMm);
  if (size === null) return 'Enter a nodule size to generate simplified prototype follow-up language.';

  if (form.noduleType === 'solid') {
    if (form.numberOfNodules === 'solitary') {
      if (size < 6) {
        return form.patientRisk === 'high risk'
          ? 'Optional follow-up CT chest at 12 months may be considered, based on simplified Fleischner guidance.'
          : 'No routine follow-up is suggested, based on simplified Fleischner guidance.';
      }
      if (size <= 8) {
        return 'Follow-up CT chest is recommended in 6-12 months, with consideration of additional CT at 18-24 months, based on simplified Fleischner guidance.';
      }
      return 'Consider CT chest at approximately 3 months, PET/CT, and/or tissue sampling, based on simplified Fleischner guidance.';
    }

    if (size < 6) {
      return form.patientRisk === 'high risk'
        ? 'Optional follow-up CT chest at 12 months may be considered for multiple small solid nodules, based on simplified Fleischner guidance.'
        : 'No routine follow-up is suggested for multiple small solid nodules, based on simplified Fleischner guidance.';
    }
    return 'Follow-up CT chest is recommended in 3-6 months, with consideration of additional CT at 18-24 months, based on simplified Fleischner guidance.';
  }

  if (form.noduleType === 'subsolid ground-glass') {
    if (size < 6) return 'No routine follow-up is suggested for a small ground-glass nodule, based on simplified Fleischner guidance.';
    return 'Follow-up CT chest is recommended in 6-12 months to confirm persistence, then periodic follow-up may be considered, based on simplified Fleischner guidance.';
  }

  if (size < 6) return 'No routine follow-up is suggested for a small part-solid nodule, based on simplified Fleischner guidance.';
  return 'Follow-up CT chest is recommended in 3-6 months to confirm persistence, then additional follow-up depends on the solid component, based on simplified Fleischner guidance.';
}

export function generateNoduleDescription(form: NoduleFormState): string {
  const size = parsePositiveNumber(form.sizeMm);
  const sizeText = size === null ? 'unspecified size' : `${formatNumber(size)} mm`;
  const countText = form.numberOfNodules === 'solitary' ? 'Solitary' : 'Multiple';
  const noduleNoun = form.numberOfNodules === 'solitary' ? 'pulmonary nodule' : 'pulmonary nodules';
  const location = form.location.trim() || 'the specified lung location';
  const morphology =
    form.morphology === 'calcified benign pattern'
      ? 'with a benign calcification pattern'
      : `with ${form.morphology} morphology`;
  const stability =
    form.priorImagingAvailable === 'yes' && form.stability !== 'unknown'
      ? `It is ${form.stability} compared with prior imaging.`
      : '';

  return joinNonEmpty([
    `${countText} ${form.noduleType} ${noduleNoun} measuring ${sizeText} in ${location}, ${morphology}.`,
    stability,
  ]);
}

export function generateNoduleReport(form: NoduleFormState): ReportSections {
  const description = generateNoduleDescription(form);
  const recommendation = generateFleischnerRecommendation(form);
  const warning = getFleischnerApplicabilityWarning(form);
  const report = { ...emptyReport };

  report.indication = 'Pulmonary nodule follow-up and reporting support.';
  report.technique = 'CT chest findings are summarized from user-entered measurements and descriptors.';
  report.findings = cleanLines([
    description,
    ...universalFreeTextLines(form),
  ]);
  report.impression = cleanLines([
    description,
    `In a ${form.patientRisk} patient, ${recommendation.charAt(0).toLowerCase()}${recommendation.slice(1)}`,
    warning || undefined,
  ]);
  report.recommendations = cleanLines([
    warning || undefined,
    `${recommendation} Confirm guideline applicability and compare with prior imaging before finalizing.`,
  ]);

  return report;
}

export function generateFleischnerSentence(form: NoduleFormState): string {
  const description = generateNoduleDescription(form);
  const recommendation = generateFleischnerRecommendation(form);
  return `${description} ${recommendation} Assumes guideline applicability.`;
}

export function generateStrokeReport(form: StrokeFormState): ReportSections {
  const report = { ...emptyReport };
  const aspectsScore = calculateAspects(form.aspectsRegions);
  const midlineShift = parsePositiveNumber(form.midlineShiftMm);
  const involvedRegions = sentenceList(form.aspectsRegions);
  const sidePhrase = form.side !== 'none' ? `${form.side} MCA territory` : 'MCA territory, if clinically applicable';
  const massEffectSentence =
    form.massEffect === 'none' ? 'No mass effect.' : `${form.massEffect[0].toUpperCase()}${form.massEffect.slice(1)} mass effect.`;
  const shiftSentence = midlineShift !== null ? `${formatNumber(midlineShift)} mm midline shift.` : 'No midline shift measurement provided.';

  report.indication = form.clinicalIndication.trim() || 'Acute neurologic deficit. Stroke evaluation.';
  report.technique = 'Non-contrast CT head was reviewed using user-entered findings.';

  if (form.hemorrhagePresent === 'yes') {
    report.findings = cleanLines([
      'Acute intracranial hemorrhage is entered as present.',
      massEffectSentence,
      shiftSentence,
      form.chronicFindings ? `Chronic findings: ${form.chronicFindings.trim()}` : undefined,
      ...universalFreeTextLines(form),
    ]);
    report.impression = cleanLines([
      'Acute intracranial hemorrhage is present.',
      'ASPECTS calculation may not be applicable in this context. Please correlate with vascular imaging and clinical findings.',
    ]);
  } else if (form.earlyIschemicChangePresent === 'yes' && form.aspectsRegions.length > 0) {
    report.findings = cleanLines([
      `Early ischemic changes involve the ${involvedRegions} region${form.aspectsRegions.length > 1 ? 's' : ''} in the ${sidePhrase}.`,
      `ASPECTS score is ${aspectsScore}.`,
      'No acute intracranial hemorrhage identified based on user-entered findings.',
      massEffectSentence,
      shiftSentence,
      form.largeVesselOcclusionSuspected !== 'unknown'
        ? `Large vessel occlusion suspected: ${form.largeVesselOcclusionSuspected}.`
        : undefined,
      form.chronicFindings ? `Chronic findings: ${form.chronicFindings.trim()}` : undefined,
      ...universalFreeTextLines(form),
    ]);
    report.impression = cleanLines([
      `Early ischemic changes involving the ${involvedRegions} in the ${sidePhrase}.`,
      `ASPECTS score is ${aspectsScore}.`,
      'No acute intracranial hemorrhage identified.',
    ]);
  } else {
    report.findings = cleanLines([
      'No acute intracranial hemorrhage identified based on user-entered findings.',
      'No established territorial infarct is entered.',
      `ASPECTS score is ${aspectsScore}, if clinically applicable.`,
      massEffectSentence,
      shiftSentence,
      form.chronicFindings ? `Chronic findings: ${form.chronicFindings.trim()}` : undefined,
      ...universalFreeTextLines(form),
    ]);
    report.impression = cleanLines([
      'No acute intracranial hemorrhage or established territorial infarct identified on non-contrast CT.',
      `ASPECTS is ${aspectsScore}, if clinically applicable.`,
    ]);
  }

  report.recommendations = 'Correlate with neurologic examination, time from symptom onset, CTA/CTP findings, and local stroke pathway.';
  return report;
}

export function defaultReport(): ReportSections {
  return { ...emptyReport };
}
