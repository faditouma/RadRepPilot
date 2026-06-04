import { chronicPancreatitisTopic } from './topics/chronicPancreatitis';
import type { AppropriatenessTopic } from './types';

export const appropriatenessTopics: AppropriatenessTopic[] = [chronicPancreatitisTopic];

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
