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
  return text.toLowerCase().replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim();
}

export function selectedAnswerKeywords(questions: ScenarioQuestion[], answers: ScenarioAnswerMap): string[] {
  const keywords = questions.flatMap((question) =>
    question.options
      .filter((option) => answers[question.id]?.includes(option.id))
      .flatMap((option) => option.mapsToKeywords),
  );
  return Array.from(new Set(keywords.map(normalize).filter(Boolean)));
}

export function selectedAnswerPhrases(questions: ScenarioQuestion[], answers: ScenarioAnswerMap): string[] {
  const phrases = questions.flatMap((question) =>
    question.options
      .filter((option) => answers[question.id]?.includes(option.id))
      .map((option) => option.requisitionPhrase),
  );
  return Array.from(new Set(phrases.map((phrase) => phrase.trim()).filter(Boolean)));
}

export function scoreVariantAgainstAnswers(variant: AppropriatenessVariant, answers: ScenarioAnswerMap, topicText = ''): number {
  const haystack = normalize([
    topicText,
    variant.title,
    variant.clinicalScenario,
    ...variant.imagingOptions.map((option) => option.procedure),
  ].join(' '));
  const answerValues = Object.values(answers).flat().map(normalize);
  return answerValues.reduce((score, answer) => {
    if (!answer) return score;
    if (haystack.includes(answer)) return score + 6;
    const tokens = answer.split(' ').filter((token) => token.length > 3);
    const tokenHits = tokens.filter((token) => haystack.includes(token)).length;
    return score + tokenHits;
  }, 0);
}

export function rankVariants(topicMatches: AppropriatenessTopic[], answers: ScenarioAnswerMap, questions: ScenarioQuestion[] = []): RankedScenario[] {
  const answerKeywords = selectedAnswerKeywords(questions, answers);
  const expandedAnswers = {
    ...answers,
    __keywords: answerKeywords,
  };

  return topicMatches
    .flatMap((topic) =>
      topic.variants.map((variant) => {
        const topicContext = [topic.title, topic.clinicalArea, ...topic.keywords].join(' ');
        const score = scoreVariantAgainstAnswers(variant, expandedAnswers, topicContext);
        const scenarioText = normalize([topicContext, variant.title, variant.clinicalScenario].join(' '));
        const matchedKeywords = answerKeywords.filter((keyword) => scenarioText.includes(keyword));
        return { topic, variant, score, matchedKeywords };
      }),
    )
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      const aUsually = a.variant.imagingOptions.some((option) => option.appropriatenessCategory === 'Usually Appropriate') ? 1 : 0;
      const bUsually = b.variant.imagingOptions.some((option) => option.appropriatenessCategory === 'Usually Appropriate') ? 1 : 0;
      return bUsually - aUsually;
    });
}

export function getBestScenario(topicMatches: AppropriatenessTopic[], answers: ScenarioAnswerMap, questions: ScenarioQuestion[] = []): RankedScenario | undefined {
  return rankVariants(topicMatches, answers, questions)[0];
}
