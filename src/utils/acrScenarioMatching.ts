import type { AppropriatenessTopic, AppropriatenessVariant } from '../data/appropriateness';
import type { ScenarioQuestion } from './acrScenarioQuestions';

export type ScenarioAnswerMap = Record<string, string[]>;

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

export function scoreVariantAgainstAnswers(
  variant: AppropriatenessVariant,
  answers: ScenarioAnswerMap,
  questions: ScenarioQuestion[] = [],
  topicText = ''
): number {
  const haystack = normalize([
    topicText,
    variant.title,
    variant.clinicalScenario,
    ...variant.imagingOptions.map((option) => option.procedure),
  ].join(' '));

  const chosenOptions = selectedOptions(questions, answers);

  return chosenOptions.reduce((score, option) => {
    const directVariantScore = option.mapsToVariantIds?.includes(variant.id) ? 100 : 0;
    const keywordTotal = option.mapsToKeywords.reduce((sum, keyword) => sum + keywordScore(keyword, haystack), 0);
    return score + directVariantScore + keywordTotal;
  }, 0);
}

export function rankVariants(
  topicMatches: AppropriatenessTopic[],
  answers: ScenarioAnswerMap,
  questions: ScenarioQuestion[] = []
): RankedScenario[] {
  const answerKeywords = selectedAnswerKeywords(questions, answers);

  return topicMatches
    .flatMap((topic) =>
      topic.variants.map((variant) => {
        const topicText = [topic.title, topic.clinicalArea, ...topic.keywords].join(' ');
        const score = scoreVariantAgainstAnswers(variant, answers, questions, topicText);
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
  questions: ScenarioQuestion[] = []
): RankedScenario | undefined {
  return rankVariants(topicMatches, answers, questions)[0];
}