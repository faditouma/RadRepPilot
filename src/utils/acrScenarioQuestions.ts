import type { AppropriatenessTopic } from '../data/appropriateness';
import { cleanVariantTitle } from './requisitionTopicMatching';

export type ScenarioQuestionType = 'single' | 'multi' | 'boolean';

export interface ScenarioQuestionOption {
  id: string;
  label: string;
  mapsToKeywords: string[];
  mapsToVariantIds?: string[];
  requisitionPhrase: string;
  includeInRequisition?: boolean;
}

export interface ScenarioQuestion {
  id: string;
  label: string;
  type: ScenarioQuestionType;
  required?: boolean;
  options: ScenarioQuestionOption[];
}

function normalizeId(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function contextOption(label: string, keywords: string[], phrase = label): ScenarioQuestionOption {
  return {
    id: normalizeId(label),
    label,
    mapsToKeywords: keywords,
    requisitionPhrase: phrase,
    includeInRequisition: true,
  };
}

function contextQuestion(topic: AppropriatenessTopic): ScenarioQuestion | undefined {
  const text = [
    topic.title,
    topic.clinicalArea,
    ...topic.keywords,
    ...topic.variants.flatMap((variant) => [variant.title, variant.clinicalScenario]),
  ].join(' ').toLowerCase();

  if (text.includes('headache')) {
    return {
      id: 'headache-additional-context',
      label: 'Additional known headache context',
      type: 'multi',
      options: [
        contextOption('Anticoagulation', ['anticoagulation', 'anticoagulant'], 'anticoagulation history'),
        contextOption('Focal neurologic deficit', ['focal neurologic deficit', 'neurologic deficit'], 'focal neurologic deficit'),
        contextOption('Fever / meningism', ['fever', 'meningism'], 'fever or meningismus'),
        contextOption('Cancer history', ['cancer', 'malignancy'], 'history of cancer'),
        contextOption('Immunosuppression', ['immunosuppression', 'immunocompromised'], 'immunosuppression'),
        contextOption('Recent trauma', ['trauma', 'posttraumatic'], 'recent trauma'),
      ],
    };
  }

  if (text.includes('low back pain')) {
    return {
      id: 'back-pain-additional-context',
      label: 'Additional known back-pain context',
      type: 'multi',
      options: [
        contextOption('Objective neurologic deficit', ['neurologic deficit'], 'objective neurologic deficit'),
        contextOption('Bowel/bladder or saddle symptoms', ['cauda', 'bowel', 'bladder', 'saddle'], 'bowel/bladder or saddle symptoms'),
        contextOption('Fever / infection risk', ['fever', 'infection'], 'fever or infection risk'),
        contextOption('Cancer history', ['cancer', 'malignancy'], 'history of cancer'),
        contextOption('Recent trauma', ['trauma'], 'recent trauma'),
        contextOption('Prior lumbar surgery', ['prior surgery'], 'prior lumbar surgery'),
      ],
    };
  }

  if (text.includes('pulmonary embol')) {
    return {
      id: 'pe-additional-context',
      label: 'Additional known PE context',
      type: 'multi',
      options: [
        contextOption('Positive D-dimer', ['positive d dimer'], 'positive D-dimer'),
        contextOption('High pretest probability', ['high pretest probability'], 'high pretest probability'),
        contextOption('Pregnancy', ['pregnancy', 'pregnant'], 'pregnancy'),
        contextOption('Hemodynamic instability', ['hemodynamic instability'], 'hemodynamic instability'),
        contextOption('Renal function / contrast concern', ['renal', 'contrast'], 'renal function or contrast concern'),
      ],
    };
  }

  if (text.includes('hematuria')) {
    return {
      id: 'hematuria-additional-context',
      label: 'Additional known hematuria context',
      type: 'multi',
      options: [
        contextOption('Flank pain', ['flank pain'], 'flank pain'),
        contextOption('Infection symptoms', ['infection', 'fever'], 'infection symptoms'),
        contextOption('Malignancy risk factors', ['malignancy', 'risk factors'], 'malignancy risk factors'),
        contextOption('Anticoagulation', ['anticoagulation'], 'anticoagulation history'),
        contextOption('Renal function / contrast concern', ['renal', 'contrast'], 'renal function or contrast concern'),
      ],
    };
  }

  if (/(abdominal|quadrant|pancreatitis|bowel obstruction|biliary|flank pain)/.test(text)) {
    return {
      id: 'abdominal-additional-context',
      label: 'Additional known abdominal context',
      type: 'multi',
      options: [
        contextOption('Fever', ['fever'], 'fever'),
        contextOption('Vomiting', ['vomiting'], 'vomiting'),
        contextOption('Prior abdominal surgery', ['postoperative', 'prior surgery'], 'prior abdominal surgery'),
        contextOption('Pregnancy', ['pregnancy', 'pregnant'], 'pregnancy'),
        contextOption('Abnormal inflammatory markers', ['leukocytosis', 'inflammatory'], 'abnormal inflammatory markers'),
        contextOption('Renal function / contrast concern', ['renal', 'contrast'], 'renal function or contrast concern'),
      ],
    };
  }

  return undefined;
}

export function deriveScenarioQuestions(topicMatches: AppropriatenessTopic[], _complaintText: string): ScenarioQuestion[] {
  const topic = topicMatches[0];
  if (!topic) return [];

  const questions: ScenarioQuestion[] = [];
  if (topic.variants.length > 1) {
    questions.push({
      id: 'acr-scenario',
      label: 'Which extracted ACR clinical scenario best fits?',
      type: 'single',
      required: true,
      options: topic.variants.map((variant) => ({
        id: variant.id,
        label: cleanVariantTitle(variant.title || variant.clinicalScenario),
        mapsToKeywords: [],
        mapsToVariantIds: [variant.id],
        requisitionPhrase: '',
        includeInRequisition: false,
      })),
    });
  }

  const additionalContext = contextQuestion(topic);
  if (additionalContext) questions.push(additionalContext);

  return questions;
}
