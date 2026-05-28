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
  if (moduleType === 'ctpa') {
    return score('Report completeness', [
      { label: 'PE presence/distribution documented', complete: hasAny(values, ['pePresent', 'proximalLevel', 'laterality']) || hasValue(report.findings) },
      { label: 'RV/LV or right heart strain addressed', complete: hasAny(values, ['rvDiameterMm', 'lvDiameterMm']) || /right heart|rv\/lv/i.test(report.impression) },
      { label: 'Pulmonary infarct addressed', complete: hasAny(values, ['pulmonaryInfarct']) || /infarct/i.test(report.findings) },
      { label: 'Pleural effusion addressed', complete: hasAny(values, ['pleuralEffusion']) || /effusion/i.test(report.findings) },
      { label: 'Key negatives included', complete: hasAny(values, ['keyNegatives']) || /no /i.test(report.findings + report.impression) },
      optionalFindingCheck('Incidental follow-up addressed if present', values.incidentalFindings, report.incidentalFindings, 'No incidental finding entered', 'Incidental finding/follow-up documented'),
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
