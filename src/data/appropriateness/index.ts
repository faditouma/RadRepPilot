import { chronicPancreatitisTopic } from './topics/chronicPancreatitis';
import type { AppropriatenessTopic } from './types';

function isReviewedTopic(topic: AppropriatenessTopic) {
  return topic.reviewStatus === 'reviewed';
}

// Curated topic import workflow:
// 1. Import a reviewed topic from ./topics/[topicName].
// 2. Add it to allAppropriatenessTopicCandidates below.
// 3. Keep reviewStatus: "reviewed" only after source/radiologist/local review.
// 4. The public appropriatenessTopics export automatically excludes unreviewed drafts.
const allAppropriatenessTopicCandidates: AppropriatenessTopic[] = [
  chronicPancreatitisTopic,
];

export const unreviewedAppropriatenessTopics: AppropriatenessTopic[] = allAppropriatenessTopicCandidates.filter(
  (topic) => !isReviewedTopic(topic),
);

export const appropriatenessTopics: AppropriatenessTopic[] = allAppropriatenessTopicCandidates.filter(isReviewedTopic);

export function searchAppropriatenessTopics(query: string): AppropriatenessTopic[] {
  const normalized = query.trim().toLowerCase();

  if (!normalized) return appropriatenessTopics;

  return appropriatenessTopics.filter((topic) => {
    const haystack = [
      topic.title,
      topic.clinicalArea,
      topic.sourceLabel,
      ...topic.keywords,
      ...topic.variants.flatMap((variant) => [variant.title, variant.clinicalScenario]),
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
