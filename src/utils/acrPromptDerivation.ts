import type { AppropriatenessTopic, AppropriatenessVariant } from '../data/appropriateness';

export interface DerivedClinicalPrompt {
  id: string;
  label: string;
  type: 'history' | 'safety' | 'redFlag' | 'context';
  relevanceReason: string;
  requisitionPhrase: string;
}

function normalize(text: string) {
  return text.toLowerCase();
}

function pushUnique(prompts: DerivedClinicalPrompt[], prompt: DerivedClinicalPrompt) {
  if (prompts.some((item) => item.id === prompt.id || item.label.toLowerCase() === prompt.label.toLowerCase())) return;
  prompts.push(prompt);
}

function hasAny(text: string, words: string[]) {
  return words.some((word) => text.includes(word));
}

export function deriveClinicalPrompts(
  topic?: AppropriatenessTopic,
  variant?: AppropriatenessVariant,
  complaintText = '',
): DerivedClinicalPrompt[] {
  const text = normalize(
    [
      complaintText,
      topic?.title,
      topic?.clinicalArea,
      ...(topic?.keywords ?? []),
      variant?.title,
      variant?.clinicalScenario,
      ...(variant?.imagingOptions.map((option) => option.procedure) ?? []),
    ].join(' '),
  );
  const prompts: DerivedClinicalPrompt[] = [];

  pushUnique(prompts, {
    id: 'onset-duration',
    label: 'Onset and duration',
    type: 'history',
    relevanceReason: 'Most appropriateness scenarios depend on acuity and time course.',
    requisitionPhrase: 'Onset/duration provided',
  });

  if (hasAny(text, ['pain', 'headache', 'flank', 'abdomen', 'abdominal', 'back', 'renal', 'stone', 'colic'])) {
    pushUnique(prompts, {
      id: 'location-severity',
      label: 'Location, severity, and progression',
      type: 'history',
      relevanceReason: 'Pain location and progression help match the closest imaging scenario.',
      requisitionPhrase: 'Location/severity/progression provided',
    });
  }

  if (hasAny(text, ['headache', 'head', 'brain', 'stroke', 'hemorrhage', 'intracranial'])) {
    [
      ['thunderclap', 'Thunderclap or worst headache features', 'redFlag', 'Thunderclap/worst headache features addressed'],
      ['focal-neuro', 'Focal neurologic deficit', 'redFlag', 'Focal neurologic deficit addressed'],
      ['trauma-anticoagulation', 'Trauma or anticoagulation', 'safety', 'Trauma/anticoagulation status addressed'],
      ['fever-meningismus', 'Fever or meningismus', 'redFlag', 'Fever/meningismus addressed'],
    ].forEach(([id, label, type, phrase]) =>
      pushUnique(prompts, {
        id,
        label,
        type: type as DerivedClinicalPrompt['type'],
        relevanceReason: 'These details commonly change acute neuroimaging urgency and modality choice.',
        requisitionPhrase: phrase,
      }),
    );
  }

  if (hasAny(text, ['low back', 'lumbar', 'spine', 'radiculopathy', 'cauda', 'myelopathy'])) {
    [
      ['neuro-deficit-back', 'Weakness, numbness, or neurologic deficit', 'redFlag', 'Neurologic deficit status addressed'],
      ['cauda-equina', 'Bowel/bladder symptoms or saddle anesthesia', 'redFlag', 'Cauda equina symptoms addressed'],
      ['infection-cancer-back', 'Cancer, infection risk, or immunosuppression', 'redFlag', 'Cancer/infection/immunosuppression risk addressed'],
    ].forEach(([id, label, type, phrase]) =>
      pushUnique(prompts, {
        id,
        label,
        type: type as DerivedClinicalPrompt['type'],
        relevanceReason: 'Back-pain imaging appropriateness is strongly driven by red flags.',
        requisitionPhrase: phrase,
      }),
    );
  }

  if (hasAny(text, ['pulmonary embol', 'pe ', 'ctpa', 'dvt', 'venous thrombosis'])) {
    [
      ['vte-risk', 'VTE risk factors / pretest probability', 'context', 'VTE risk factors/pretest probability addressed'],
      ['d-dimer', 'D-dimer or clinical decision rule if available', 'context', 'D-dimer/decision-rule context provided'],
      ['hemodynamic', 'Hemodynamic or oxygenation status', 'redFlag', 'Hemodynamic/oxygenation status provided'],
    ].forEach(([id, label, type, phrase]) =>
      pushUnique(prompts, {
        id,
        label,
        type: type as DerivedClinicalPrompt['type'],
        relevanceReason: 'VTE imaging selection often depends on probability, acuity, and stability.',
        requisitionPhrase: phrase,
      }),
    );
  }

  if (hasAny(text, ['hematuria', 'renal', 'kidney', 'flank', 'urolithiasis', 'stone', 'colic'])) {
    [
      ['gross-micro-hematuria', 'Gross vs microscopic hematuria', 'history', 'Hematuria type addressed'],
      ['infection-symptoms', 'Infection symptoms or urinalysis findings', 'context', 'Infection/urinalysis context provided'],
      ['renal-function', 'Renal function or contrast concern', 'safety', 'Renal function/contrast concern addressed'],
    ].forEach(([id, label, type, phrase]) =>
      pushUnique(prompts, {
        id,
        label,
        type: type as DerivedClinicalPrompt['type'],
        relevanceReason: 'Urinary tract imaging choice depends on hematuria type, renal function, and contrast safety.',
        requisitionPhrase: phrase,
      }),
    );
  }

  if (hasAny(text, ['pancreatitis', 'ruq', 'biliary', 'gallbladder', 'abdomen', 'abdominal'])) {
    [
      ['labs-lipase-lfts', 'Relevant labs such as lipase/LFTs if available', 'context', 'Relevant labs provided'],
      ['biliary-risk', 'Gallstones, alcohol, or prior episodes', 'history', 'Relevant pancreatobiliary history provided'],
      ['complication-concern', 'Concern for complication or alternative diagnosis', 'redFlag', 'Complication/alternative diagnosis concern addressed'],
    ].forEach(([id, label, type, phrase]) =>
      pushUnique(prompts, {
        id,
        label,
        type: type as DerivedClinicalPrompt['type'],
        relevanceReason: 'Abdominal imaging requests are clearer when the suspected complication or alternative diagnosis is stated.',
        requisitionPhrase: phrase,
      }),
    );
  }

  if (hasAny(text, ['ct', 'contrast', 'abdomen', 'renal', 'hematuria', 'pulmonary embol', 'ctpa'])) {
    pushUnique(prompts, {
      id: 'contrast-safety',
      label: 'Renal function / contrast safety',
      type: 'safety',
      relevanceReason: 'Contrast-related context may affect protocol selection.',
      requisitionPhrase: 'Renal function/contrast safety addressed',
    });
  }

  if (hasAny(text, ['pregnancy', 'pelvis', 'abdomen', 'renal', 'pe ', 'pulmonary embol', 'hematuria', 'ct'])) {
    pushUnique(prompts, {
      id: 'pregnancy-status',
      label: 'Pregnancy status if relevant',
      type: 'safety',
      relevanceReason: 'Pregnancy status can change modality and radiation considerations.',
      requisitionPhrase: 'Pregnancy status addressed if relevant',
    });
  }

  pushUnique(prompts, {
    id: 'prior-imaging',
    label: 'Prior imaging or comparison',
    type: 'context',
    relevanceReason: 'Prior imaging can clarify whether a finding is new, stable, or already characterized.',
    requisitionPhrase: 'Prior imaging/comparison addressed',
  });

  return prompts.slice(0, 12);
}
