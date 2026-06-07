import type { AppropriatenessTopic, AppropriatenessVariant } from '../data/appropriateness';

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

function normalizeText(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9β]+/g, ' ').replace(/\s+/g, ' ').trim();
}

function normalizeId(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function variantText(variant: AppropriatenessVariant) {
  return normalizeText([variant.title, variant.clinicalScenario].join(' '));
}

function matchesAny(text: string, keywords: string[]) {
  return keywords.some((keyword) => text.includes(normalizeText(keyword)));
}

function variantIdsForKeywords(variants: AppropriatenessVariant[], keywords: string[]) {
  return variants
    .filter((variant) => matchesAny(variantText(variant), keywords))
    .map((variant) => variant.id);
}

function option(
  label: string,
  keywords: string[],
  variants: AppropriatenessVariant[],
  phrase = label,
  includeInRequisition = true
): ScenarioQuestionOption {
  return {
    id: normalizeId(label),
    label,
    mapsToKeywords: keywords,
    mapsToVariantIds: variantIdsForKeywords(variants, keywords),
    requisitionPhrase: phrase,
    includeInRequisition,
  };
}

function hasTopicText(topic: AppropriatenessTopic, keywords: string[]) {
  const text = normalizeText([
    topic.title,
    topic.clinicalArea,
    ...topic.keywords,
    ...topic.variants.flatMap((variant) => [variant.title, variant.clinicalScenario]),
  ].join(' '));

  return matchesAny(text, keywords);
}

function headacheQuestions(topic: AppropriatenessTopic): ScenarioQuestion[] {
  const variants = topic.variants;

  return [
    {
      id: 'headache-pattern',
      label: 'Which headache pattern best fits?',
      type: 'single',
      required: true,
      options: [
        option(
          'Sudden severe / thunderclap, maximal within 1 hour',
          ['sudden onset severe', 'thunderclap', 'maximal severity', 'within one hour'],
          variants,
          'sudden severe thunderclap headache reaching maximal severity within 1 hour'
        ),
        option(
          'Typical migraine or tension-type headache with normal neurologic exam',
          ['primary migraine', 'tension type headache', 'normal neurologic examination'],
          variants,
          'headache consistent with migraine or tension-type pattern with normal neurologic exam'
        ),
        option(
          'Trigeminal autonomic / cluster-type headache',
          ['trigeminal autonomic', 'cluster headache'],
          variants,
          'trigeminal autonomic or cluster-type headache pattern'
        ),
        option(
          'Raised ICP features / papilledema / worse with Valsalva',
          ['intracranial hypertension', 'papilledema', 'pulsatile tinnitus', 'worse on valsalva'],
          variants,
          'features concerning for raised intracranial pressure'
        ),
        option(
          'Intracranial hypotension pattern / positional, worse upright',
          ['intracranial hypotension', 'positional', 'worse when upright', 'better when lying down'],
          variants,
          'positional headache concerning for intracranial hypotension'
        ),
        option(
          'Pregnancy or peripartum onset',
          ['pregnancy', 'peripartum', 'postpartum'],
          variants,
          'new headache during pregnancy or peripartum period'
        ),
        option(
          'Red flags present',
          ['red flags', 'fever', 'neurologic deficit', 'cancer', 'immunocompromise', 'older age', 'posttraumatic'],
          variants,
          'headache with red-flag features'
        ),
        option(
          'No red flags identified',
          ['without any of the following red flags', 'without red flags', 'no red flags'],
          variants,
          'no red-flag headache features identified'
        ),
      ],
    },
    {
      id: 'headache-red-flags',
      label: 'Which red flags are present?',
      type: 'multi',
      options: [
        option('Focal neurologic deficit', ['focal neurologic deficit', 'neurologic deficit'], variants, 'focal neurologic deficit'),
        option('Fever / meningism', ['fever', 'meningism'], variants, 'fever or meningismus'),
        option('Cancer history', ['cancer', 'malignancy'], variants, 'history of cancer'),
        option('Immunosuppression', ['immunosuppression', 'immunocompromise', 'immunocompromised'], variants, 'immunosuppression'),
        option('Recent trauma', ['trauma', 'posttraumatic', 'post traumatic'], variants, 'recent trauma'),
        option('Anticoagulation', ['anticoagulation', 'anticoagulant'], variants, 'anticoagulation'),
      ],
    },
  ];
}

function pelvicQuestions(topic: AppropriatenessTopic): ScenarioQuestion[] {
  const variants = topic.variants;

  return [
    {
      id: 'pelvic-problem',
      label: 'Which pelvic scenario best fits?',
      type: 'single',
      required: true,
      options: [
        option('Acute pelvic pain, reproductive age', ['acute pelvic pain', 'reproductive age'], variants, 'acute pelvic pain in reproductive-age patient'),
        option('β-hCG positive', ['hcg positive', 'β hcg positive', 'pregnancy positive'], variants, 'β-hCG positive'),
        option('β-hCG negative', ['hcg negative', 'β hcg negative'], variants, 'β-hCG negative'),
        option('Gynecologic etiology suspected', ['gynecological etiology suspected', 'gynecologic etiology suspected'], variants, 'gynecologic etiology suspected'),
        option('Nongynecologic etiology suspected', ['nongynecological etiology suspected', 'nongynecologic etiology suspected'], variants, 'nongynecologic etiology suspected'),
        option('Adnexal mass suspected', ['adnexal mass'], variants, 'clinically suspected adnexal mass'),
        option('Endometriosis suspected', ['endometriosis'], variants, 'clinically suspected endometriosis'),
      ],
    },
  ];
}

function abdominalQuestions(topic: AppropriatenessTopic): ScenarioQuestion[] {
  const variants = topic.variants;

  return [
    {
      id: 'abdominal-location',
      label: 'Which abdominal scenario best fits?',
      type: 'single',
      required: true,
      options: [
        option('Right lower quadrant / appendicitis concern', ['right lower quadrant', 'appendicitis', 'rlq'], variants, 'right lower quadrant pain or appendicitis concern'),
        option('Right upper quadrant / biliary concern', ['right upper quadrant', 'biliary', 'cholecystitis', 'ruq'], variants, 'right upper quadrant or biliary concern'),
        option('Left lower quadrant / diverticulitis concern', ['left lower quadrant', 'diverticulitis', 'llq'], variants, 'left lower quadrant pain or diverticulitis concern'),
        option('Flank pain / renal colic / stone concern', ['flank pain', 'renal colic', 'urolithiasis', 'stone disease'], variants, 'flank pain, renal colic, or stone concern'),
        option('Pancreatitis concern', ['pancreatitis'], variants, 'pancreatitis concern'),
        option('Bowel obstruction concern', ['bowel obstruction', 'small bowel obstruction', 'obstruction'], variants, 'bowel obstruction concern'),
        option('Acute nonlocalized abdominal pain', ['acute nonlocalized abdominal pain', 'nonlocalized abdominal pain'], variants, 'acute nonlocalized abdominal pain'),
      ],
    },
    {
      id: 'abdominal-context',
      label: 'Which additional abdominal context is known?',
      type: 'multi',
      options: [
        option('Fever / infection concern', ['fever', 'infection', 'abscess', 'sepsis'], variants, 'fever or infection concern'),
        option('Vomiting', ['vomiting'], variants, 'vomiting'),
        option('Prior abdominal surgery / postoperative', ['prior surgery', 'postoperative', 'post op'], variants, 'prior abdominal surgery or postoperative state'),
        option('Pregnancy', ['pregnancy', 'pregnant'], variants, 'pregnancy'),
        option('Abnormal inflammatory markers', ['leukocytosis', 'inflammatory markers'], variants, 'abnormal inflammatory markers'),
        option('Renal function / contrast concern', ['renal function', 'renal insufficiency', 'contrast'], variants, 'renal function or contrast concern'),
      ],
    },
  ];
}

function backPainQuestions(topic: AppropriatenessTopic): ScenarioQuestion[] {
  const variants = topic.variants;

  return [
    {
      id: 'back-pain-red-flags',
      label: 'Which back-pain red flags are present?',
      type: 'multi',
      required: true,
      options: [
        option('Objective neurologic deficit', ['neurologic deficit', 'objective neurologic'], variants, 'objective neurologic deficit'),
        option('Cauda equina symptoms', ['cauda equina', 'bowel', 'bladder', 'saddle'], variants, 'cauda equina symptoms'),
        option('Fever / infection risk', ['fever', 'infection', 'discitis', 'osteomyelitis'], variants, 'fever or infection risk'),
        option('Cancer history', ['cancer', 'malignancy', 'metastatic'], variants, 'history of cancer'),
        option('Recent trauma', ['trauma', 'fracture'], variants, 'recent trauma'),
        option('Prior lumbar surgery', ['prior surgery', 'postoperative'], variants, 'prior lumbar surgery'),
        option('No red flags identified', ['without red flags', 'no red flags', 'uncomplicated'], variants, 'no back-pain red flags identified'),
      ],
    },
  ];
}

function peQuestions(topic: AppropriatenessTopic): ScenarioQuestion[] {
  const variants = topic.variants;

  return [
    {
      id: 'pe-context',
      label: 'Which suspected PE context applies?',
      type: 'multi',
      required: true,
      options: [
        option('High pretest probability', ['high pretest probability'], variants, 'high pretest probability for PE'),
        option('Positive D-dimer', ['positive d dimer', 'd dimer'], variants, 'positive D-dimer'),
        option('Pregnancy', ['pregnancy', 'pregnant'], variants, 'pregnancy'),
        option('Hemodynamic instability', ['hemodynamic instability', 'unstable'], variants, 'hemodynamic instability'),
        option('Abnormal CXR', ['abnormal chest radiograph', 'abnormal cxr'], variants, 'abnormal chest radiograph'),
        option('Renal function / contrast concern', ['renal', 'contrast'], variants, 'renal function or contrast concern'),
      ],
    },
  ];
}

function genericScenarioQuestions(topic: AppropriatenessTopic): ScenarioQuestion[] {
  const variants = topic.variants;

  const candidateOptions = [
    option('Acute presentation', ['acute', 'new onset', 'initial imaging'], variants, 'acute presentation'),
    option('Chronic or recurrent symptoms', ['chronic', 'recurrent'], variants, 'chronic or recurrent symptoms'),
    option('Follow-up / surveillance', ['follow up', 'follow-up', 'surveillance', 'monitoring'], variants, 'follow-up or surveillance'),
    option('Trauma or recent injury', ['trauma', 'injury', 'fracture'], variants, 'trauma or recent injury'),
    option('Fever / infection concern', ['fever', 'infection', 'abscess', 'sepsis'], variants, 'fever or infection concern'),
    option('Cancer / malignancy concern', ['cancer', 'malignancy', 'neoplasm', 'tumor', 'staging'], variants, 'cancer or malignancy concern'),
    option('Postoperative / prior surgery', ['postoperative', 'prior surgery', 'post op'], variants, 'postoperative or prior surgery context'),
    option('Pregnancy', ['pregnancy', 'pregnant'], variants, 'pregnancy'),
    option('Renal function / contrast concern', ['renal function', 'renal insufficiency', 'contrast'], variants, 'renal function or contrast concern'),
  ].filter((item) => item.mapsToVariantIds?.length);

  if (!candidateOptions.length) return [];

  return [
    {
      id: 'scenario-context',
      label: 'Which clinical context applies?',
      type: 'multi',
      options: candidateOptions,
    },
  ];
}

export function deriveScenarioQuestions(topicMatches: AppropriatenessTopic[], _complaintText: string): ScenarioQuestion[] {
  const topic = topicMatches[0];
  if (!topic) return [];

  if (hasTopicText(topic, ['headache'])) return headacheQuestions(topic);
  if (hasTopicText(topic, ['pelvic pain', 'adnexal', 'endometriosis'])) return pelvicQuestions(topic);
  if (hasTopicText(topic, ['low back pain', 'radiculopathy', 'cauda equina'])) return backPainQuestions(topic);
  if (hasTopicText(topic, ['pulmonary embol'])) return peQuestions(topic);
  if (hasTopicText(topic, ['abdominal', 'quadrant', 'pancreatitis', 'bowel obstruction', 'biliary', 'flank pain', 'urolithiasis'])) {
    return abdominalQuestions(topic);
  }

  return genericScenarioQuestions(topic);
}