import { primaryCareContentRegistry } from '../data/primaryCareContentRegistry';
import type { PrimaryCareContentTemplate, ReferralFormState, RequisitionOutputStyle } from '../radrep/types';

export function getPrimaryCareTemplate(id: string): PrimaryCareContentTemplate {
  return primaryCareContentRegistry.find((template) => template.id === id) ?? primaryCareContentRegistry[0];
}

export function valueFor(form: ReferralFormState, id: string): string {
  const value = form.values[id];
  if (typeof value === 'boolean') return value ? 'yes' : 'no';
  return value?.trim() ?? '';
}

function yesNoPhrase(form: ReferralFormState, id: string, yes: string, no: string): string | undefined {
  const value = valueFor(form, id);
  if (value === 'yes') return yes;
  if (value === 'no') return no;
  return undefined;
}

function join(parts: Array<string | undefined | null>, separator = ', '): string {
  return parts.filter((part): part is string => Boolean(part?.trim())).join(separator);
}

function isNoSignificantPmhx(value: string): boolean {
  return /^(healthy|well|none|nil|no|no significant|no pmhx|no past|n\/a|na)$/i.test(value.trim());
}

function hasPmhxAddressed(form: ReferralFormState): boolean {
  const status = valueFor(form, 'pmhxStatus');
  return Boolean(status) || Boolean(valueFor(form, 'pmhx'));
}

function sentenceCaseStart(text: string): string {
  return text ? `${text.charAt(0).toLowerCase()}${text.slice(1)}` : text;
}

function upperCaseStart(text: string): string {
  return text ? `${text.charAt(0).toUpperCase()}${text.slice(1)}` : text;
}

function ensureSentence(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return '';
  return /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`;
}

function formatQuestionSentence(question: string, tone: 'polite' | 'direct'): string {
  const raw = question.trim();
  if (!raw) return tone === 'polite' ? 'Thank you.' : '';

  const withoutTrailingPeriod = raw.replace(/\.$/, '').trim();
  const thanks = tone === 'polite' ? ' Thank you.' : '';

  if (/^(please|could you|can you|request|requested|clinical question:)/i.test(withoutTrailingPeriod)) {
    const directText = withoutTrailingPeriod.replace(/^(please|could you|can you)\s+/i, '').trim();
    return `${ensureSentence(tone === 'direct' ? upperCaseStart(directText) : withoutTrailingPeriod)}${thanks}`;
  }

  if (/^(assess|evaluate|characterize|compare|follow|monitor|stage|restage|screen|confirm|exclude|rule out|look for|clarify|localize|determine|check)\b/i.test(withoutTrailingPeriod)) {
    if (tone === 'direct') return ensureSentence(upperCaseStart(withoutTrailingPeriod));
    return `Please ${ensureSentence(sentenceCaseStart(withoutTrailingPeriod))}${thanks}`;
  }

  return `Clinical question: ${ensureSentence(withoutTrailingPeriod)}${thanks}`;
}

function fallbackSymptom(template: PrimaryCareContentTemplate): string {
  const fromTitle = template.title.match(/\bfor\s+(.+)$/i)?.[1];
  if (fromTitle) return fromTitle.replace(/\s*\/.*$/, '').trim().toLowerCase();
  return template.description.split(/[,.]/)[0]?.trim().toLowerCase() || 'the selected clinical indication';
}

export function getMissingEssentials(form: ReferralFormState): string[] {
  const template = getPrimaryCareTemplate(form.requestType);
  return template.essentialFields
    .filter((id) => {
      if (id === 'pmhx' || id === 'pmhxStatus') return !hasPmhxAddressed(form);
      return !valueFor(form, id);
    })
    .map(
      (id) =>
        template.quickFields.find((field) => field.id === id)?.conciseLabel ??
        template.quickFields.find((field) => field.id === id)?.label ??
        id,
    );
}

function specialtyPhrases(form: ReferralFormState): string[] {
  const phrases: Array<string | undefined> = [];

  const commonIds = [
    ['thunderclap', 'thunderclap/worst headache features present', 'no thunderclap features'],
    ['neuroDeficit', 'focal neurologic deficit present', 'no focal neurologic deficit'],
    ['abnormalNeuroExam', 'abnormal neurologic exam', 'neurologic exam not abnormal by history'],
    ['trauma', 'trauma present', 'no trauma'],
    ['anticoagulation', 'anticoagulated', 'not anticoagulated'],
    ['antiplateletAnticoagulation', 'on antiplatelet/anticoagulant therapy', 'not on antiplatelet/anticoagulant therapy'],
    ['fever', 'fever present', 'afebrile'],
    ['vomiting', 'vomiting/anorexia present', 'no vomiting/anorexia'],
    ['immunosuppression', 'immunosuppression present', 'no immunosuppression reported'],
    ['cancerImmunosuppression', 'cancer/immunosuppression history present', 'no cancer/immunosuppression reported'],
    ['hematuria', 'hematuria present', 'no hematuria reported'],
    ['solitaryKidney', 'solitary kidney', 'no solitary kidney reported'],
  ];

  commonIds.forEach(([id, yes, no]) => phrases.push(yesNoPhrase(form, id, yes, no)));

  [
    ['painLocation', 'pain location'],
    ['oxygenation', 'oxygenation'],
    ['labs', 'labs'],
    ['examFindings', 'exam'],
    ['vteRiskFactors', 'VTE risk factors'],
    ['hemodynamicStatus', 'hemodynamic status'],
    ['pregnancyStatus', 'pregnancy status'],
    ['contrastSafety', 'contrast considerations'],
    ['priorImaging', 'prior imaging/history'],
    ['priorSurgery', 'prior surgery'],
    ['pmhx', 'relevant history'],
    ['bodyPart', 'body part'],
    ['function', 'function'],
  ].forEach(([id, label]) => {
    const value = valueFor(form, id);
    if (value) phrases.push(`${label}: ${value}`);
  });

  return phrases.filter((phrase): phrase is string => Boolean(phrase));
}

export function generateReferralText(form: ReferralFormState, style: RequisitionOutputStyle = form.outputStyle ?? 'standard'): string {
  const template = getPrimaryCareTemplate(form.requestType);
  const age = valueFor(form, 'age').replace(/-?year-?old/i, '').trim();
  const sex = valueFor(form, 'sex');
  const patient = age || sex ? `${age}${sex && sex !== 'Prefer not to specify' ? sex : ''}` : 'Patient';
  const pmhxStatus = valueFor(form, 'pmhxStatus');
  const rawPmhx = valueFor(form, 'pmhx');
  const noSignificantPmhx = pmhxStatus === 'no-significant-pmhx' || isNoSignificantPmhx(rawPmhx);
  const pmhx = noSignificantPmhx ? '' : rawPmhx;
  const cancerHistory = valueFor(form, 'cancerHistory');
  const immunosuppression = valueFor(form, 'immunosuppression');
  const surgicalHistory = valueFor(form, 'surgicalHistory');
  const rawTone = form.tone ?? form.values.requisitionTone;
  const tone: 'polite' | 'direct' = rawTone === 'direct' ? 'direct' : 'polite';
  const symptom =
    valueFor(form, 'positiveSymptoms') ||
    valueFor(form, 'mainSymptom') ||
    valueFor(form, 'indication') ||
    valueFor(form, 'bodyPart') ||
    valueFor(form, 'painLocation') ||
    fallbackSymptom(template);
  const duration = valueFor(form, 'duration');
  const question = valueFor(form, 'clinicalQuestion') || template.defaultQuestion;
  const requestedProcedure = valueFor(form, 'requestedProcedure');
  const specialty = specialtyPhrases(form);
  const knownFor = join([
    pmhx,
    cancerHistory === 'yes' ? 'cancer history' : cancerHistory && cancerHistory !== 'no' ? cancerHistory : undefined,
    immunosuppression === 'yes' ? 'immunosuppression' : undefined,
  ]);
  const knownPhrase = knownFor ? `, known for ${knownFor}` : noSignificantPmhx ? ', with no significant past medical history' : '';
  const presenting = `presenting with ${duration ? `${duration} of ` : ''}${symptom}`;
  const requestedProcedureSentence = requestedProcedure ? `Requested imaging: ${requestedProcedure}.` : '';
  const questionSentence = formatQuestionSentence(question, tone);

  if (style === 'ultra') {
    return `${patient}${knownPhrase}, ${presenting}. ${requestedProcedureSentence ? `${requestedProcedureSentence} ` : ''}${questionSentence}`;
  }

  if (style === 'detailed') {
    const details = join([
      valueFor(form, 'negativeSymptoms') ? `Pertinent negatives: ${valueFor(form, 'negativeSymptoms')}` : undefined,
      surgicalHistory ? `Relevant surgical history: ${surgicalHistory}.` : undefined,
      specialty.length ? specialty.join('; ') : undefined,
      valueFor(form, 'redFlags') ? `Red flags: ${valueFor(form, 'redFlags')}` : undefined,
    ], ' ');
    return `${patient}${knownPhrase}, ${presenting}.${details ? ` ${details}` : ''} ${requestedProcedureSentence ? `${requestedProcedureSentence} ` : ''}${questionSentence}`;
  }

  const objective = join([
    valueFor(form, 'examFindings') ? `Exam: ${valueFor(form, 'examFindings')}` : undefined,
    valueFor(form, 'labs') ? `Labs: ${valueFor(form, 'labs')}` : undefined,
    valueFor(form, 'pregnancyStatus') ? `Pregnancy status: ${valueFor(form, 'pregnancyStatus')}` : undefined,
    valueFor(form, 'contrastSafety') ? `Contrast/safety: ${valueFor(form, 'contrastSafety')}` : undefined,
  ]);

  return `${patient}${knownPhrase}, ${presenting}.${objective ? ` ${objective}.` : ''} ${requestedProcedureSentence ? `${requestedProcedureSentence} ` : ''}${questionSentence}`;
}

export function generateConciseRequisition(
  form: ReferralFormState,
  style: RequisitionOutputStyle = form.outputStyle ?? 'standard',
): string {
  return generateReferralText(form, style);
}

export function toLegacyReferralTemplate(template: PrimaryCareContentTemplate) {
  return {
    id: template.id,
    title: template.title,
    category: template.bodySystem,
    modality: template.modality,
    description: template.description,
    fields: template.quickFields,
    requiredFields: template.essentialFields,
    defaultQuestion: template.defaultQuestion,
  };
}
