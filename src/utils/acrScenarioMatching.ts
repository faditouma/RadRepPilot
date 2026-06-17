import type { AppropriatenessTopic, AppropriatenessVariant } from '../data/appropriateness';
import type { ScenarioQuestion } from './acrScenarioQuestions';

export type ScenarioAnswerMap = Record<string, string[]>;

export interface ScenarioMatchingContext {
  age?: string;
  sex?: string;
}

export interface RankedScenario {
  topic: AppropriatenessTopic;
  variant: AppropriatenessVariant;
  score: number;
  matchedKeywords: string[];
}

function normalize(text: string) {
  return String(text)
    .toLowerCase()
    .replace(/[^a-z0-9β]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function selectedOptions(questions: ScenarioQuestion[], answers: ScenarioAnswerMap) {
  return questions.flatMap((question) =>
    question.options.filter((option) => answers[question.id]?.includes(option.id))
  );
}

function numericAge(age?: string): number | undefined {
  const match = String(age ?? '').match(/\d+/);
  if (!match) return undefined;
  const parsed = Number(match[0]);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function normalizedSex(sex?: string) {
  const value = normalize(String(sex ?? ''));
  if (['f', 'female', 'woman'].includes(value)) return 'female';
  if (['m', 'male', 'man'].includes(value)) return 'male';
  return '';
}

export function selectedAnswerKeywords(questions: ScenarioQuestion[], answers: ScenarioAnswerMap): string[] {
  const keywords = selectedOptions(questions, answers).flatMap((option) => option.mapsToKeywords);
  return Array.from(new Set(keywords.map(normalize).filter(Boolean)));
}

export function selectedAnswerPhrases(questions: ScenarioQuestion[], answers: ScenarioAnswerMap): string[] {
  const phrases = selectedOptions(questions, answers)
    .filter((option) => option.includeInRequisition !== false)
    .map((option) => option.requisitionPhrase);

  return Array.from(new Set(phrases.map((phrase) => phrase.trim()).filter(Boolean)));
}

function keywordScore(keyword: string, haystack: string) {
  const normalizedKeyword = normalize(keyword);
  if (!normalizedKeyword) return 0;

  if (haystack.includes(normalizedKeyword)) return 12;

  const tokens = normalizedKeyword.split(' ').filter((token) => token.length > 3);
  if (!tokens.length) return 0;

  const tokenHits = tokens.filter((token) => haystack.includes(token)).length;
  if (!tokenHits) return 0;

  return tokenHits * 2;
}

function populationScore(variant: AppropriatenessVariant, context?: ScenarioMatchingContext) {
  const text = normalize([variant.title, variant.clinicalScenario].join(' '));
  const age = numericAge(context?.age);
  const sex = normalizedSex(context?.sex);
  let score = 0;

  if (age !== undefined) {
    if (age >= 50 && /(older age|greater than 50|>50|over 50)/.test(text)) score += 35;
    if (age < 18 && /(child|children|pediatric|paediatric|adolescent)/.test(text)) score += 45;
    if (age >= 18 && /(adult|adults)/.test(text)) score += 20;
    if (age >= 18 && /(child|children|pediatric|paediatric)/.test(text)) score -= 35;
  }

  if (sex === 'female') {
    if (/(female|woman|women|pregnan|peripartum|postpartum|hcg|gynecologic|gynaecologic|adnexal|ovarian|uterine)/.test(text)) score += 18;
    if (/(male|prostate|testicular|scrotal)/.test(text)) score -= 45;
  }

  if (sex === 'male') {
    if (/(male|prostate|testicular|scrotal)/.test(text)) score += 18;
    if (/(pregnan|peripartum|postpartum|hcg|gynecologic|gynaecologic|adnexal|ovarian|uterine)/.test(text)) score -= 45;
  }

  return score;
}

export function scoreVariantAgainstAnswers(
  variant: AppropriatenessVariant,
  answers: ScenarioAnswerMap,
  questions: ScenarioQuestion[] = [],
  topicText = '',
  context?: ScenarioMatchingContext,
): number {
  const haystack = normalize([
    topicText,
    variant.title,
    variant.clinicalScenario,
    ...variant.imagingOptions.map((option) => option.procedure),
  ].join(' '));

  const chosenOptions = selectedOptions(questions, answers);
  const answerScore = chosenOptions.reduce((score, option) => {
    if (option.mapsToVariantIds?.length) {
      return score + (option.mapsToVariantIds.includes(variant.id) ? 120 : 0);
    }

    const keywordTotal = option.mapsToKeywords.reduce((sum, keyword) => sum + keywordScore(keyword, haystack), 0);
    return score + keywordTotal;
  }, 0);

  return answerScore + populationScore(variant, context);
}

export function rankVariants(
  topicMatches: AppropriatenessTopic[],
  answers: ScenarioAnswerMap,
  questions: ScenarioQuestion[] = [],
  context?: ScenarioMatchingContext,
): RankedScenario[] {
  const answerKeywords = selectedAnswerKeywords(questions, answers);

  return topicMatches
    .flatMap((topic) =>
      topic.variants.map((variant) => {
        const topicText = [topic.title, topic.clinicalArea, ...topic.keywords].join(' ');
        const score = scoreVariantAgainstAnswers(variant, answers, questions, topicText, context);
        const scenarioText = normalize([variant.title, variant.clinicalScenario].join(' '));
        const matchedKeywords = answerKeywords.filter((keyword) => scenarioText.includes(keyword));

        return { topic, variant, score, matchedKeywords };
      })
    )
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;

      const aUsually = a.variant.imagingOptions.some((option) => option.appropriatenessCategory === 'Usually Appropriate') ? 1 : 0;
      const bUsually = b.variant.imagingOptions.some((option) => option.appropriatenessCategory === 'Usually Appropriate') ? 1 : 0;

      if (bUsually !== aUsually) return bUsually - aUsually;

      return a.variant.title.localeCompare(b.variant.title);
    });
}

export function getBestScenario(
  topicMatches: AppropriatenessTopic[],
  answers: ScenarioAnswerMap,
  questions: ScenarioQuestion[] = [],
  context?: ScenarioMatchingContext,
): RankedScenario | undefined {
  return rankVariants(topicMatches, answers, questions, context)[0];
}
