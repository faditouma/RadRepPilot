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

function cleanQuestion(question: string): string {
  return question
    .replace(/^\s*(please\s+)?(assess\s+for|rule\s+out|assess\s+for\/rule\s+out)\s+/i, '')
    .replace(/\.$/, '')
    .trim();
}

function fallbackSymptom(template: PrimaryCareContentTemplate): string {
  const fromTitle = template.title.match(/\bfor\s+(.+)$/i)?.[1];
  if (fromTitle) return fromTitle.replace(/\s*\/.*$/, '').trim().toLowerCase();
  return template.description.split(/[,.]/)[0]?.trim().toLowerCase() || 'the selected clinical indication';
}

export function getMissingEssentials(form: ReferralFormState): string[] {
  const template = getPrimaryCareTemplate(form.requestType);
  return template.essentialFields
    .filter((id) => !valueFor(form, id))
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
  const pmhx = valueFor(form, 'pmhx');
  const cancerHistory = valueFor(form, 'cancerHistory');
  const immunosuppression = valueFor(form, 'immunosuppression');
  const surgicalHistory = valueFor(form, 'surgicalHistory');
  const tone = form.tone ?? (typeof form.values.requisitionTone === 'string' ? form.values.requisitionTone : 'polite');
  const thanks = tone === 'polite' ? ' Thank you.' : '';
  const symptom =
    valueFor(form, 'positiveSymptoms') ||
    valueFor(form, 'mainSymptom') ||
    valueFor(form, 'indication') ||
    valueFor(form, 'bodyPart') ||
    valueFor(form, 'painLocation') ||
    fallbackSymptom(template);
  const duration = valueFor(form, 'duration');
  const question = cleanQuestion(valueFor(form, 'clinicalQuestion') || template.defaultQuestion);
  const specialty = specialtyPhrases(form);
  const knownFor = join([
    pmhx,
    cancerHistory === 'yes' ? 'cancer history' : cancerHistory && cancerHistory !== 'no' ? cancerHistory : undefined,
    immunosuppression === 'yes' ? 'immunosuppression' : undefined,
  ]);
  const knownPhrase = knownFor ? `, known for ${knownFor}` : '';
  const presenting = `presenting with ${duration ? `${duration} of ` : ''}${symptom}`;
  const questionSentence = `Please assess for/rule out ${question}.${thanks}`;

  if (style === 'ultra') {
    return `${patient}${knownPhrase}, ${presenting}. ${questionSentence}`;
  }

  if (style === 'detailed') {
    return `${patient}${knownPhrase}, ${presenting}. ${join([
      valueFor(form, 'negativeSymptoms') ? `Pertinent negatives: ${valueFor(form, 'negativeSymptoms')}` : undefined,
      surgicalHistory ? `Relevant surgical history: ${surgicalHistory}.` : undefined,
      specialty.length ? specialty.join('; ') : undefined,
      valueFor(form, 'redFlags') ? `Red flags: ${valueFor(form, 'redFlags')}` : undefined,
    ], ' ')} Question for radiology: ${question}.${thanks}`;
  }

  const objective = join([
    valueFor(form, 'examFindings') ? `Exam: ${valueFor(form, 'examFindings')}` : undefined,
    valueFor(form, 'labs') ? `Labs: ${valueFor(form, 'labs')}` : undefined,
    valueFor(form, 'pregnancyStatus') ? `Pregnancy status: ${valueFor(form, 'pregnancyStatus')}` : undefined,
    valueFor(form, 'contrastSafety') ? `Contrast/safety: ${valueFor(form, 'contrastSafety')}` : undefined,
  ]);

  return `${patient}${knownPhrase}, ${presenting}.${objective ? ` ${objective}.` : ''} ${questionSentence}`;
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
