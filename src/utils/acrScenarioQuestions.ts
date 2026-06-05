import type { AppropriatenessTopic } from '../data/appropriateness';

export type ScenarioQuestionType = 'single' | 'multi' | 'boolean';

export interface ScenarioQuestionOption {
  id: string;
  label: string;
  mapsToKeywords: string[];
  requisitionPhrase: string;
}

export interface ScenarioQuestion {
  id: string;
  label: string;
  type: ScenarioQuestionType;
  options: ScenarioQuestionOption[];
}

function includesAny(text: string, terms: string[]) {
  return terms.some((term) => text.includes(term));
}

function normalizeId(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function option(label: string, keywords: string[], phrase = label): ScenarioQuestionOption {
  return {
    id: normalizeId(label),
    label,
    mapsToKeywords: keywords,
    requisitionPhrase: phrase,
  };
}

function addQuestion(questions: ScenarioQuestion[], question: ScenarioQuestion) {
  if (questions.some((item) => item.id === question.id)) return;
  questions.push(question);
}

function topicText(topicMatches: AppropriatenessTopic[], complaintText: string) {
  return [
    complaintText,
    ...topicMatches.flatMap((topic) => [
      topic.title,
      topic.clinicalArea,
      ...topic.keywords,
      ...topic.variants.flatMap((variant) => [
        variant.title,
        variant.clinicalScenario,
        ...variant.imagingOptions.map((item) => item.procedure),
      ]),
    ]),
  ]
    .join(' ')
    .toLowerCase();
}

export function deriveScenarioQuestions(topicMatches: AppropriatenessTopic[], complaintText: string): ScenarioQuestion[] {
  const text = topicText(topicMatches, complaintText);
  const questions: ScenarioQuestion[] = [];

  if (includesAny(text, ['headache', 'migraine', 'intracranial', 'brain', 'head'])) {
    addQuestion(questions, {
      id: 'headache-pattern',
      label: 'Headache pattern',
      type: 'multi',
      options: [
        option('Sudden severe / thunderclap', ['sudden', 'severe', 'thunderclap', 'maximal', '1 hour'], 'sudden severe headache reaching maximal intensity within 1 hour'),
        option('Trauma', ['trauma', 'injury'], 'headache after trauma'),
        option('Focal neurologic deficit', ['neurologic deficit', 'focal', 'stroke', 'weakness'], 'focal neurologic deficit'),
        option('Cancer history', ['cancer', 'malignancy', 'metastatic'], 'history of cancer'),
        option('Immunosuppression', ['immunosuppression', 'immunocompromised'], 'immunosuppression'),
        option('Pregnancy / postpartum', ['pregnancy', 'pregnant', 'postpartum'], 'pregnancy/postpartum status relevant'),
        option('Fever / meningism', ['fever', 'meningism', 'meningitis', 'infection'], 'fever or meningismus'),
        option('Papilledema / raised ICP concern', ['papilledema', 'intracranial hypertension', 'raised icp'], 'papilledema or raised intracranial pressure concern'),
        option('Chronic stable headache', ['chronic', 'stable', 'migraine'], 'chronic stable headache pattern'),
        option('Anticoagulation', ['anticoagulation', 'anticoagulant'], 'anticoagulation history'),
      ],
    });
  }

  if (includesAny(text, ['low back', 'back pain', 'lumbar', 'spine', 'radiculopathy', 'cauda'])) {
    addQuestion(questions, {
      id: 'back-pain-red-flags',
      label: 'Back pain context',
      type: 'multi',
      options: [
        option('Trauma', ['trauma', 'fracture'], 'trauma history'),
        option('Cancer history', ['cancer', 'malignancy'], 'cancer history'),
        option('Fever / infection risk', ['fever', 'infection', 'discitis', 'osteomyelitis'], 'fever or infection risk'),
        option('Neurologic deficit', ['neurologic deficit', 'radiculopathy', 'weakness'], 'neurologic deficit'),
        option('Cauda equina symptoms', ['cauda', 'bowel', 'bladder', 'saddle'], 'cauda equina symptoms'),
        option('Prior surgery', ['prior surgery', 'postoperative'], 'prior spine surgery'),
        option('Duration > 6 weeks / failed conservative therapy', ['6 weeks', 'chronic', 'failed conservative'], 'symptoms persisting despite conservative treatment'),
      ],
    });
  }

  if (includesAny(text, ['pulmonary embol', 'pe ', 'ctpa'])) {
    addQuestion(questions, {
      id: 'pe-context',
      label: 'Suspected PE context',
      type: 'multi',
      options: [
        option('Pregnancy', ['pregnancy', 'pregnant'], 'pregnancy status relevant'),
        option('Hemodynamic instability', ['unstable', 'hemodynamic', 'hypoxia'], 'hemodynamic instability or oxygenation concern'),
        option('Contrast / renal concern', ['contrast', 'renal', 'kidney'], 'renal function or contrast concern'),
        option('Pretest probability / D-dimer available', ['d-dimer', 'pretest', 'probability'], 'pretest probability/D-dimer context available'),
        option('Abnormal CXR', ['abnormal chest radiograph', 'abnormal cxr'], 'abnormal chest radiograph'),
      ],
    });
  }

  if (includesAny(text, ['dvt', 'venous thrombosis', 'leg swelling'])) {
    addQuestion(questions, {
      id: 'dvt-context',
      label: 'DVT context',
      type: 'multi',
      options: [
        option('Unilateral leg swelling/pain', ['unilateral', 'leg swelling', 'pain'], 'unilateral leg swelling/pain'),
        option('Pregnancy', ['pregnancy', 'pregnant'], 'pregnancy status relevant'),
        option('Prior DVT', ['prior dvt', 'recurrent'], 'prior DVT history'),
        option('Anticoagulation', ['anticoagulation', 'anticoagulant'], 'anticoagulation status'),
        option('Suspected recurrent DVT', ['recurrent', 'prior dvt'], 'suspected recurrent DVT'),
      ],
    });
  }

  if (includesAny(text, ['hematuria', 'renal', 'flank', 'stone', 'urolithiasis', 'colic'])) {
    addQuestion(questions, {
      id: 'urinary-context',
      label: 'Urinary tract context',
      type: 'multi',
      options: [
        option('Gross hematuria', ['gross hematuria'], 'gross hematuria'),
        option('Microscopic hematuria', ['microscopic hematuria'], 'microscopic hematuria'),
        option('Flank pain / renal colic', ['flank', 'colic', 'stone', 'urolithiasis'], 'flank pain/renal colic'),
        option('Infection symptoms', ['infection', 'fever', 'uti'], 'infection symptoms'),
        option('Malignancy risk', ['malignancy', 'cancer', 'risk'], 'malignancy risk factors'),
        option('Renal function / contrast concern', ['renal', 'contrast', 'kidney'], 'renal function/contrast concern'),
        option('Pregnancy', ['pregnancy', 'pregnant'], 'pregnancy status relevant'),
      ],
    });
  }

  if (includesAny(text, ['abdominal', 'abdomen', 'appendicitis', 'obstruction', 'biliary', 'pancreatitis', 'ruq'])) {
    addQuestion(questions, {
      id: 'abdominal-context',
      label: 'Abdominal pain context',
      type: 'multi',
      options: [
        option('Right lower quadrant / appendicitis concern', ['appendicitis', 'right lower quadrant', 'rlq'], 'right lower quadrant pain/appendicitis concern'),
        option('Bowel obstruction concern', ['obstruction', 'transition', 'distension'], 'bowel obstruction concern'),
        option('RUQ / biliary concern', ['ruq', 'biliary', 'gallbladder', 'cholecystitis'], 'right upper quadrant/biliary concern'),
        option('Pancreatitis concern', ['pancreatitis', 'lipase', 'pancreatic'], 'pancreatitis concern'),
        option('Fever', ['fever', 'infection'], 'fever'),
        option('Pregnancy', ['pregnancy', 'pregnant'], 'pregnancy status relevant'),
        option('Prior surgery', ['prior surgery', 'adhesion'], 'prior surgery'),
        option('Renal colic / hematuria', ['renal colic', 'flank', 'hematuria'], 'renal colic or hematuria'),
      ],
    });
  }

  addQuestion(questions, {
    id: 'general-context',
    label: 'General clinical context',
    type: 'multi',
    options: [
      option('Acute presentation', ['acute', 'initial'], 'acute presentation'),
      option('Chronic or recurrent', ['chronic', 'recurrent'], 'chronic or recurrent symptoms'),
      option('Trauma', ['trauma', 'injury'], 'trauma history'),
      option('Fever / infection concern', ['fever', 'infection'], 'fever or infection concern'),
      option('Cancer history', ['cancer', 'malignancy'], 'cancer history'),
      option('Immunosuppression', ['immunosuppression', 'immunocompromised'], 'immunosuppression'),
      option('Pregnancy', ['pregnancy', 'pregnant'], 'pregnancy status relevant'),
      option('Renal function / contrast concern', ['renal', 'contrast'], 'renal function/contrast concern'),
      option('Prior imaging', ['prior imaging', 'comparison'], 'prior imaging/comparison available'),
    ],
  });

  return questions.slice(0, 3);
}
