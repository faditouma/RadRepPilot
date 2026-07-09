import type { AcrScenarioQuestion, AppropriatenessTopic, AppropriatenessVariant } from '../data/appropriateness';
import type { ScenarioMatchingContext } from './acrScenarioMatching';
import { cleanVariantTitle } from './requisitionTopicMatching';

export type ScenarioQuestionType = 'single' | 'multi' | 'boolean';

export interface ScenarioQuestionOption {
  id: string;
  label: string;
  mapsToKeywords: string[];
  mapsToVariantIds?: string[];
  requisitionPhrase: string;
  includeInRequisition?: boolean;
  polarity?: 'present' | 'absent';
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

function unique<T>(values: T[]): T[] {
  return Array.from(new Set(values));
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
  includeInRequisition = true,
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

function scenarioLabel(variant: AppropriatenessVariant) {
  return cleanVariantTitle(variant.title || variant.clinicalScenario || 'Clinical situation');
}

function scenarioSelectionQuestion(topic: AppropriatenessTopic, context?: ScenarioMatchingContext): ScenarioQuestion | null {
  const options = topic.variants.map((variant) => ({
    id: variant.id,
    label: scenarioLabel(variant),
    mapsToKeywords: [variant.title, variant.clinicalScenario, ...((variant.extractedQuestions ?? []).map((item) => item.positivePhrase))],
    mapsToVariantIds: [variant.id],
    requisitionPhrase: '',
    includeInRequisition: false,
    polarity: 'present' as const,
  }));

  if (!options.length) return null;

  return {
    id: 'acr-scenario',
    label: context?.age || context?.sex ? 'Closest clinical situation after age/sex check' : 'Closest clinical situation',
    type: 'single' as const,
    required: false,
    options,
  };
}

function cleanQuestionPhrase(question: AcrScenarioQuestion) {
  return question.positivePhrase.replace(/[?]+$/g, '').trim();
}

function absentLabel(question: AcrScenarioQuestion) {
  const base = cleanQuestionPhrase(question).replace(/^known\s+/i, '').replace(/^history of\s+/i, '');
  return 'No ' + base;
}

function extractedQuestionGroup(topic: AppropriatenessTopic): ScenarioQuestion | null {
  const optionMap = new Map<string, ScenarioQuestionOption>();

  topic.variants.forEach((variant) => {
    (variant.extractedQuestions ?? []).forEach((question) => {
      const polarity = question.polarity ?? 'present';
      const key = question.id + ':' + polarity;
      const existing = optionMap.get(key);
      const phrase = polarity === 'absent' ? absentLabel(question) : cleanQuestionPhrase(question);
      const label = polarity === 'absent' ? absentLabel(question) : question.label;

      if (existing) {
        existing.mapsToVariantIds = unique([...(existing.mapsToVariantIds ?? []), variant.id]);
        return;
      }

      optionMap.set(key, {
        id: key,
        label,
        mapsToKeywords: [question.positivePhrase],
        mapsToVariantIds: [variant.id],
        requisitionPhrase: phrase,
        includeInRequisition: true,
        polarity,
      });
    });
  });

  const options = Array.from(optionMap.values()).sort((a, b) => {
    if (a.polarity !== b.polarity) return a.polarity === 'present' ? -1 : 1;
    return a.label.localeCompare(b.label);
  });

  if (!options.length) return null;

  return {
    id: 'acr-extracted-context',
    label: 'Which details are present?',
    type: 'multi' as const,
    required: false,
    options,
  };
}

function headacheQuestions(topic: AppropriatenessTopic): ScenarioQuestion[] {
  const variants = topic.variants;

  return [
    {
      id: 'headache-pattern',
      label: 'Which headache pattern best fits?',
      type: 'single' as const,
      required: false,
      options: [
        option('Sudden severe / thunderclap, maximal within 1 hour', ['sudden onset severe', 'thunderclap', 'maximal severity', 'within one hour'], variants, 'sudden severe thunderclap headache reaching maximal severity within 1 hour'),
        option('Typical migraine or tension-type headache with normal neurologic exam', ['primary migraine', 'tension type headache', 'normal neurologic examination'], variants, 'headache consistent with migraine or tension-type pattern with normal neurologic exam'),
        option('Trigeminal autonomic / cluster-type headache', ['trigeminal autonomic', 'cluster headache'], variants, 'trigeminal autonomic or cluster-type headache pattern'),
        option('Raised ICP features / papilledema / worse with Valsalva', ['intracranial hypertension', 'papilledema', 'pulsatile tinnitus', 'worse on valsalva'], variants, 'features concerning for raised intracranial pressure'),
        option('Intracranial hypotension pattern / positional, worse upright', ['intracranial hypotension', 'positional', 'worse when upright', 'better when lying down'], variants, 'positional headache concerning for intracranial hypotension'),
        option('Pregnancy or peripartum onset', ['pregnancy', 'peripartum', 'postpartum'], variants, 'new headache during pregnancy or peripartum period'),
        option('Red flags present', ['red flags', 'fever', 'neurologic deficit', 'cancer', 'immunocompromise', 'older age', 'posttraumatic'], variants, 'headache with red-flag features'),
        option('No red flags identified', ['without any of the following red flags', 'without red flags', 'no red flags'], variants, 'no red-flag headache features identified'),
      ].filter((item) => item.mapsToVariantIds?.length),
    },
  ].filter((question) => question.options.length);
}

function pelvicQuestions(topic: AppropriatenessTopic): ScenarioQuestion[] {
  const variants = topic.variants;

  return [
    {
      id: 'pelvic-problem',
      label: 'Which pelvic scenario best fits?',
      type: 'single' as const,
      required: false,
      options: [
        option('Acute pelvic pain, reproductive age', ['acute pelvic pain', 'reproductive age'], variants, 'acute pelvic pain in reproductive-age patient'),
        option('β-hCG positive', ['hcg positive', 'β hcg positive', 'pregnancy positive'], variants, 'β-hCG positive'),
        option('β-hCG negative', ['hcg negative', 'β hcg negative'], variants, 'β-hCG negative'),
        option('Gynecologic etiology suspected', ['gynecological etiology suspected', 'gynecologic etiology suspected'], variants, 'gynecologic etiology suspected'),
        option('Nongynecologic etiology suspected', ['nongynecological etiology suspected', 'nongynecologic etiology suspected'], variants, 'nongynecologic etiology suspected'),
        option('Adnexal mass suspected', ['adnexal mass'], variants, 'clinically suspected adnexal mass'),
        option('Endometriosis suspected', ['endometriosis'], variants, 'clinically suspected endometriosis'),
      ].filter((item) => item.mapsToVariantIds?.length),
    },
  ].filter((question) => question.options.length);
}

function abdominalQuestions(topic: AppropriatenessTopic): ScenarioQuestion[] {
  const variants = topic.variants;

  return [
    {
      id: 'abdominal-location',
      label: 'Which abdominal scenario best fits?',
      type: 'single' as const,
      required: false,
      options: [
        option('Right lower quadrant / appendicitis concern', ['right lower quadrant', 'appendicitis', 'rlq'], variants, 'right lower quadrant pain or appendicitis concern'),
        option('Right upper quadrant / biliary concern', ['right upper quadrant', 'biliary', 'cholecystitis', 'ruq'], variants, 'right upper quadrant or biliary concern'),
        option('Left lower quadrant / diverticulitis concern', ['left lower quadrant', 'diverticulitis', 'llq'], variants, 'left lower quadrant pain or diverticulitis concern'),
        option('Flank pain / renal colic / stone concern', ['flank pain', 'renal colic', 'urolithiasis', 'stone disease'], variants, 'flank pain, renal colic, or stone concern'),
        option('Pancreatitis concern', ['pancreatitis'], variants, 'pancreatitis concern'),
        option('Bowel obstruction concern', ['bowel obstruction', 'small bowel obstruction', 'obstruction'], variants, 'bowel obstruction concern'),
        option('Acute nonlocalized abdominal pain', ['acute nonlocalized abdominal pain', 'nonlocalized abdominal pain'], variants, 'acute nonlocalized abdominal pain'),
      ].filter((item) => item.mapsToVariantIds?.length),
    },
  ].filter((question) => question.options.length);
}

function backPainQuestions(topic: AppropriatenessTopic): ScenarioQuestion[] {
  const variants = topic.variants;

  return [
    {
      id: 'back-pain-red-flags',
      label: 'Which back-pain context applies?',
      type: 'multi' as const,
      required: false,
      options: [
        option('Objective neurologic deficit', ['neurologic deficit', 'objective neurologic'], variants, 'objective neurologic deficit'),
        option('Cauda equina symptoms', ['cauda equina', 'bowel', 'bladder', 'saddle'], variants, 'cauda equina symptoms'),
        option('Fever / infection risk', ['fever', 'infection', 'discitis', 'osteomyelitis'], variants, 'fever or infection risk'),
        option('Cancer history', ['cancer', 'malignancy', 'metastatic'], variants, 'history of cancer'),
        option('Recent trauma', ['trauma', 'fracture'], variants, 'recent trauma'),
        option('Prior lumbar surgery', ['prior surgery', 'postoperative'], variants, 'prior lumbar surgery'),
        option('No red flags identified', ['without red flags', 'no red flags', 'uncomplicated'], variants, 'no back-pain red flags identified'),
      ].filter((item) => item.mapsToVariantIds?.length),
    },
  ].filter((question) => question.options.length);
}

function peQuestions(topic: AppropriatenessTopic): ScenarioQuestion[] {
  const variants = topic.variants;

  return [
    {
      id: 'pe-context',
      label: 'Which suspected PE context applies?',
      type: 'multi' as const,
      required: false,
      options: [
        option('High pretest probability', ['high pretest probability'], variants, 'high pretest probability for PE'),
        option('Positive D-dimer', ['positive d dimer', 'd dimer'], variants, 'positive D-dimer'),
        option('Pregnancy', ['pregnancy', 'pregnant'], variants, 'pregnancy'),
        option('Hemodynamic instability', ['hemodynamic instability', 'unstable'], variants, 'hemodynamic instability'),
        option('Abnormal CXR', ['abnormal chest radiograph', 'abnormal cxr'], variants, 'abnormal chest radiograph'),
        option('Renal function / contrast concern', ['renal', 'contrast'], variants, 'renal function or contrast concern'),
      ].filter((item) => item.mapsToVariantIds?.length),
    },
  ].filter((question) => question.options.length);
}


function dvtQuestions(topic: AppropriatenessTopic): ScenarioQuestion[] {
  const variants = topic.variants;

  return [
    {
      id: 'dvt-context',
      label: 'Which DVT context applies?',
      type: 'multi' as const,
      required: false,
      options: [
        option('Leg swelling or calf pain', ['leg swelling', 'calf', 'lower extremity'], variants, 'lower-limb swelling or calf pain'),
        option('Pregnancy or postpartum', ['pregnancy', 'postpartum'], variants, 'pregnancy or postpartum context'),
        option('Prior DVT or high VTE risk', ['prior dvt', 'previous dvt', 'high risk', 'vte'], variants, 'prior VTE or high VTE risk'),
        option('Current anticoagulation', ['anticoagulation', 'anticoagulated'], variants, 'currently anticoagulated'),
        option('Upper-extremity symptoms or catheter concern', ['upper extremity', 'catheter'], variants, 'upper-extremity symptoms or catheter concern'),
      ].filter((item) => item.mapsToVariantIds?.length),
    },
  ].filter((question) => question.options.length);
}

function respiratoryQuestions(topic: AppropriatenessTopic): ScenarioQuestion[] {
  const variants = topic.variants;

  return [
    {
      id: 'respiratory-context',
      label: 'Which respiratory context applies?',
      type: 'multi' as const,
      required: false,
      options: [
        option('Acute cough, fever, or suspected pneumonia', ['acute respiratory illness', 'pneumonia', 'immunocompetent'], variants, 'acute cough or suspected pneumonia'),
        option('Immunocompromised', ['immunocompromised'], variants, 'immunocompromised status'),
        option('Chronic cough', ['chronic cough'], variants, 'chronic cough'),
        option('Chronic dyspnea', ['chronic dyspnea'], variants, 'chronic dyspnea'),
        option('Hemoptysis', ['hemoptysis'], variants, 'hemoptysis'),
        option('Possible TB or atypical infection', ['tuberculosis', 'tb'], variants, 'possible tuberculosis or atypical infection'),
      ].filter((item) => item.mapsToVariantIds?.length),
    },
  ].filter((question) => question.options.length);
}

function chestPainQuestions(topic: AppropriatenessTopic): ScenarioQuestion[] {
  const variants = topic.variants;

  return [
    {
      id: 'chest-pain-context',
      label: 'Which chest-pain context applies?',
      type: 'multi' as const,
      required: false,
      options: [
        option('Possible acute coronary syndrome', ['acute coronary syndrome', 'acs'], variants, 'possible acute coronary syndrome'),
        option('Low probability coronary artery disease', ['low probability', 'nonspecific chest pain'], variants, 'low probability coronary artery disease'),
        option('Pleuritic pain or PE concern', ['pulmonary embolism', 'pleuritic'], variants, 'pleuritic chest pain or PE concern'),
        option('Chest wall pain or trauma', ['chest wall', 'trauma'], variants, 'chest wall pain or trauma context'),
        option('Dyspnea or hypoxia', ['dyspnea', 'hypoxia'], variants, 'dyspnea or hypoxia'),
      ].filter((item) => item.mapsToVariantIds?.length),
    },
  ].filter((question) => question.options.length);
}

function hematuriaQuestions(topic: AppropriatenessTopic): ScenarioQuestion[] {
  const variants = topic.variants;

  return [
    {
      id: 'hematuria-context',
      label: 'Which hematuria context applies?',
      type: 'multi' as const,
      required: false,
      options: [
        option('Gross hematuria', ['gross hematuria'], variants, 'gross hematuria'),
        option('Microscopic hematuria', ['microhematuria', 'microscopic'], variants, 'microscopic hematuria'),
        option('Flank pain or stone symptoms', ['flank pain', 'stone', 'urolithiasis'], variants, 'flank pain or stone symptoms'),
        option('Painless hematuria / malignancy risk', ['malignancy', 'cancer', 'risk'], variants, 'painless hematuria or malignancy risk factors'),
        option('Renal function or contrast concern', ['renal', 'contrast'], variants, 'renal function or contrast concern'),
      ].filter((item) => item.mapsToVariantIds?.length),
    },
  ].filter((question) => question.options.length);
}

function mskTraumaQuestions(topic: AppropriatenessTopic): ScenarioQuestion[] {
  const variants = topic.variants;

  return [
    {
      id: 'msk-trauma-context',
      label: 'Which injury context applies?',
      type: 'multi' as const,
      required: false,
      options: [
        option('Initial radiographs not yet done', ['initial imaging', 'radiographs'], variants, 'initial injury imaging'),
        option('Persistent pain after negative radiographs', ['negative radiographs', 'persistent pain'], variants, 'persistent pain after negative radiographs'),
        option('Suspected fracture or dislocation', ['fracture', 'dislocation'], variants, 'suspected fracture or dislocation'),
        option('Post-reduction or follow-up', ['postreduction', 'follow up', 'follow-up'], variants, 'post-reduction or follow-up assessment'),
        option('Hardware or prior surgery', ['hardware', 'arthroplasty', 'postoperative'], variants, 'hardware or prior surgery'),
      ].filter((item) => item.mapsToVariantIds?.length),
    },
  ].filter((question) => question.options.length);
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
      type: 'multi' as const,
      options: candidateOptions,
    },
  ];
}

export function deriveScenarioQuestions(
  topicMatches: AppropriatenessTopic[],
  _complaintText: string,
  context?: ScenarioMatchingContext,
): ScenarioQuestion[] {
  const topic = topicMatches[0];
  if (!topic) return [];

  const scenarioQuestion = scenarioSelectionQuestion(topic, context);
  const extractedQuestion = extractedQuestionGroup(topic);

  const fallbackQuestions = (() => {
    if (hasTopicText(topic, ['headache'])) return headacheQuestions(topic);
    if (hasTopicText(topic, ['pelvic pain', 'adnexal', 'endometriosis'])) return pelvicQuestions(topic);
    if (hasTopicText(topic, ['low back pain', 'radiculopathy', 'cauda equina'])) return backPainQuestions(topic);
    if (hasTopicText(topic, ['pulmonary embol'])) return peQuestions(topic);
    if (hasTopicText(topic, ['deep vein thrombosis', 'dvt', 'venous thrombosis'])) return dvtQuestions(topic);
    if (hasTopicText(topic, ['chest pain', 'coronary artery disease', 'acute coronary'])) return chestPainQuestions(topic);
    if (hasTopicText(topic, ['respiratory', 'cough', 'dyspnea', 'pneumonia', 'hemoptysis'])) return respiratoryQuestions(topic);
    if (hasTopicText(topic, ['hematuria'])) return hematuriaQuestions(topic);
    if (hasTopicText(topic, ['trauma', 'acute hand', 'acute hip', 'acute shoulder', 'acute elbow', 'acute ankle', 'acute foot'])) {
      return mskTraumaQuestions(topic);
    }
    if (hasTopicText(topic, ['abdominal', 'quadrant', 'pancreatitis', 'bowel obstruction', 'biliary', 'flank pain', 'urolithiasis'])) {
      return abdominalQuestions(topic);
    }

    return genericScenarioQuestions(topic);
  })();

  const clinicalQuestions = [extractedQuestion, ...fallbackQuestions].filter(
    (question): question is ScenarioQuestion => Boolean(question && question.options.length),
  );

  return clinicalQuestions.length
    ? clinicalQuestions
    : [scenarioQuestion].filter((question): question is ScenarioQuestion => Boolean(question && question.options.length));
}
