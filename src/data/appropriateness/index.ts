import { generatedAppropriatenessTopics } from './generated';
import { chronicPancreatitisTopic } from './topics/chronicPancreatitis';
import type { AppropriatenessTopic } from './types';

function isPublicUsableTopic(topic: AppropriatenessTopic) {
  return ['extracted', 'needs_validation', 'reviewed', 'manually_curated'].includes(topic.reviewStatus);
}

const manuallyCuratedAppropriatenessTopics: AppropriatenessTopic[] = [
  chronicPancreatitisTopic,
];

const manualTopicIds = new Set(manuallyCuratedAppropriatenessTopics.map((topic) => topic.id));

// Curated/generated topic import workflow:
// 1. Import a topic from ./topics/[topicName].
//    Generated extracted summaries are imported through ./generated/index.ts.
// 2. Add manually reviewed topics to manuallyCuratedAppropriatenessTopics above.
// 3. Use reviewStatus to label the topic honestly:
//    extracted -> source table extracted only
//    needs_validation -> usable table/summary but source validation pending
//    reviewed -> reviewed against source
//    manually_curated -> reviewed and enriched with local educational summaries
// 4. Do not import raw JSON or full PDF text directly. Convert/review first.
const allAppropriatenessTopicCandidates: AppropriatenessTopic[] = [
  ...manuallyCuratedAppropriatenessTopics,
  ...generatedAppropriatenessTopics.filter((topic) => !manualTopicIds.has(topic.id)),
];

export const pendingValidationAppropriatenessTopics: AppropriatenessTopic[] = allAppropriatenessTopicCandidates.filter(
  (topic) => topic.reviewStatus === 'extracted' || topic.reviewStatus === 'needs_validation',
);

export const appropriatenessTopics: AppropriatenessTopic[] = allAppropriatenessTopicCandidates.filter(isPublicUsableTopic);

export function getAppropriatenessTopicById(topicId: string): AppropriatenessTopic | undefined {
  return appropriatenessTopics.find((topic) => topic.id === topicId);
}

export function searchAppropriatenessTopics(query: string): AppropriatenessTopic[] {
  const normalized = query.trim().toLowerCase();

  if (!normalized) return appropriatenessTopics;

  return appropriatenessTopics.filter((topic) => {
    const haystack = [
      topic.title,
      topic.clinicalArea,
      topic.sourceLabel,
      ...topic.keywords,
      ...topic.variants.flatMap((variant) => [
        variant.title,
        variant.clinicalScenario,
        ...variant.imagingOptions.map((option) => option.procedure),
      ]),
    ]
      .join(' ')
      .toLowerCase();

    return haystack.includes(normalized);
  });
}

export type {
  AppropriatenessCategory,
  AppropriatenessTopic,
  AppropriatenessVariant,
  ImagingOption,
  RadiationLevel,
  ReviewStatus,
} from './types';
