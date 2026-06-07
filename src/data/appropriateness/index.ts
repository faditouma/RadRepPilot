import acrClinicalIndex from './normalized/acrClinicalIndex.json';
import { clinicalComplaintMappings } from './clinicalMappings';
import { chronicPancreatitisTopic } from './topics/chronicPancreatitis';
import type { AppropriatenessTopic } from './types';

type NormalizedAcrTopic = {
  topicId: string;
  topicTitle: string;
  clinicalArea?: string;
  complaintKeywords?: string[];
  keywords?: string[];
  scenarios?: Array<{
    scenarioId: string;
    scenarioTitle: string;
    clinicalScenario?: string;
    imagingOptions?: Array<{
      procedure?: string;
      appropriateness?: string;
      appropriatenessCategory?: string;
      radiation?: string;
      radiationLevel?: string;
      optionKind?: string;
    }>;
  }>;
};

function isPublicUsableTopic(topic: AppropriatenessTopic) {
  return ['extracted', 'needs_validation', 'reviewed', 'manually_curated'].includes(topic.reviewStatus);
}

function cleanScenarioTitle(value: string) {
  return String(value ?? '')
    .replace(/^variant\s+\d+\s*:\s*/i, '')
    .trim();
}

function isProcedureUsable(value?: string) {
  const text = String(value ?? '').trim();
  const lower = text.toLowerCase();

  if (!text) return false;
  if (text.length > 140) return false;

  if (
    lower.startsWith('panel members') ||
    lower.startsWith('summary of literature') ||
    lower.includes('summary of literature review') ||
    lower.includes('introduction/background') ||
    lower.includes('initial imaging definition') ||
    lower.includes('more than one procedure can be considered')
  ) {
    return false;
  }

  return true;
}

function normalizeAppropriateness(value?: string) {
  const text = String(value ?? '').trim();

  if (text === 'Usually Appropriate') return 'Usually Appropriate';
  if (text === 'May Be Appropriate') return 'May Be Appropriate';
  if (text === 'May Be Appropriate (Disagreement)') return 'May Be Appropriate (Disagreement)';
  if (text === 'Usually Not Appropriate') return 'Usually Not Appropriate';

  return 'May Be Appropriate';
}

function normalizeRadiation(value?: string) {
  const text = String(value ?? '').trim();

  if (text === 'O' || text === '0') return 'O';
  if (text === '☢') return '☢';
  if (text === '☢☢') return '☢☢';
  if (text === '☢☢☢') return '☢☢☢';
  if (text === '☢☢☢☢') return '☢☢☢☢';

  return 'Unknown';
}

function convertNormalizedTopic(topic: NormalizedAcrTopic): AppropriatenessTopic {
  const converted = {
    id: topic.topicId,
    title: topic.topicTitle,
    clinicalArea: topic.clinicalArea || 'General',
    sourceLabel: 'ACR Appropriateness Criteria · Extracted table',
    sourceUrl: '',
    reviewStatus: 'extracted',
    keywords: Array.from(
      new Set([
        ...(topic.complaintKeywords ?? []),
        ...(topic.keywords ?? []),
        topic.topicTitle,
      ].filter(Boolean)),
    ),
    variants: (topic.scenarios ?? [])
      .map((scenario) => {
        const imagingOptions = (scenario.imagingOptions ?? [])
          .filter((option) => isProcedureUsable(option.procedure))
          .map((option) => ({
            procedure: String(option.procedure ?? '').trim(),
            appropriatenessCategory: normalizeAppropriateness(
              option.appropriatenessCategory ?? option.appropriateness,
            ),
            radiationLevel: normalizeRadiation(option.radiationLevel ?? option.radiation),
            shortRationale: '',
            optionKind:
              option.optionKind === 'treatment_or_interventional'
                ? 'treatment_or_interventional'
                : 'diagnostic_imaging',
          }));

        return {
          id: scenario.scenarioId,
          title: cleanScenarioTitle(scenario.scenarioTitle),
          clinicalScenario: cleanScenarioTitle(scenario.clinicalScenario || scenario.scenarioTitle),
          imagingOptions,
          requisitionSuggestions: [],
        };
      })
      .filter((variant) => variant.imagingOptions.length > 0),
  };

  return converted as unknown as AppropriatenessTopic;
}

const normalizedAppropriatenessTopics: AppropriatenessTopic[] = (
  acrClinicalIndex as NormalizedAcrTopic[]
).map(convertNormalizedTopic);

const manuallyCuratedAppropriatenessTopics: AppropriatenessTopic[] = [
  chronicPancreatitisTopic,
];

const manualTopicIds = new Set(manuallyCuratedAppropriatenessTopics.map((topic) => topic.id));

const allAppropriatenessTopicCandidates: AppropriatenessTopic[] = [
  ...manuallyCuratedAppropriatenessTopics,
  ...normalizedAppropriatenessTopics.filter((topic) => !manualTopicIds.has(topic.id)),
];

export const pendingValidationAppropriatenessTopics: AppropriatenessTopic[] =
  allAppropriatenessTopicCandidates.filter(
    (topic) => topic.reviewStatus === 'extracted' || topic.reviewStatus === 'needs_validation',
  );

export const appropriatenessTopics: AppropriatenessTopic[] =
  allAppropriatenessTopicCandidates.filter(isPublicUsableTopic);

export function getAppropriatenessTopicById(topicId: string): AppropriatenessTopic | undefined {
  return appropriatenessTopics.find((topic) => topic.id === topicId);
}

export function searchAppropriatenessTopics(query: string): AppropriatenessTopic[] {
  const normalized = query.trim().toLowerCase();

  if (!normalized) return appropriatenessTopics;

  const mappedTopicIds = new Set(
    clinicalComplaintMappings
      .filter((mapping) => {
        const mappingHaystack = [
          mapping.complaint,
          ...mapping.synonyms,
          ...mapping.relatedTopicIds,
          ...(mapping.suggestedVariantIds ?? []),
          ...mapping.missingInfoPrompts,
          mapping.commonRequisitionLanguage,
        ]
          .join(' ')
          .toLowerCase();

        return mappingHaystack.includes(normalized);
      })
      .flatMap((mapping) => mapping.relatedTopicIds),
  );

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

    return haystack.includes(normalized) || mappedTopicIds.has(topic.id);
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