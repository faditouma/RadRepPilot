import acrClinicalIndex from './normalized/acrClinicalIndex.json';
import { clinicalComplaintMappings } from './clinicalMappings';
import { chronicPancreatitisTopic } from './topics/chronicPancreatitis';
import type {
  AcrScenarioQuestion,
  AppropriatenessCategory,
  AppropriatenessTopic,
  ImagingOption,
  RadiationLevel,
} from './types';

type NormalizedAcrQuestion = {
  id?: string;
  label?: string;
  positivePhrase?: string;
  polarity?: 'present' | 'absent';
};

type NormalizedAcrOption = {
  procedure?: string;
  appropriateness?: string;
  appropriatenessCategory?: string;
  radiation?: string;
  radiationLevel?: string;
  optionKind?: string;
};

type NormalizedAcrTopic = {
  topicId: string;
  topicTitle: string;
  year?: string;
  clinicalArea?: string;
  complaintKeywords?: string[];
  keywords?: string[];
  scenarios?: Array<{
    scenarioId: string;
    scenarioTitle: string;
    clinicalScenario?: string;
    sourcePdf?: string;
    pageNumber?: string;
    questions?: NormalizedAcrQuestion[];
    imagingOptions?: NormalizedAcrOption[];
  }>;
};

function isPublicUsableTopic(topic: AppropriatenessTopic) {
  return ['extracted', 'needs_validation', 'reviewed', 'manually_curated'].includes(topic.reviewStatus);
}

function cleanScenarioTitle(value: string) {
  return String(value ?? '')
    .replace(/^variant\s+\d+\s*:\s*/i, '')
    .replace(/\s*initial imaging\.?\s*$/i, '')
    .replace(/[.\s]+$/g, '')
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

function normalizeAppropriateness(value?: string): AppropriatenessCategory | undefined {
  const text = String(value ?? '').trim().toLowerCase();

  if (!text) return undefined;
  if (text.includes('may be appropriate') && text.includes('disagreement')) return 'May Be Appropriate (Disagreement)';
  if (text === 'usually appropriate' || text.includes('usually appropriate')) return 'Usually Appropriate';
  if (text === 'may be appropriate' || text.includes('may be appropriate')) return 'May Be Appropriate';
  if (text === 'usually not appropriate' || text.includes('usually not appropriate')) return 'Usually Not Appropriate';

  return undefined;
}

function normalizeRadiation(value?: string): RadiationLevel | undefined {
  const text = String(value ?? '').trim();
  const lower = text.toLowerCase();

  if (!text) return undefined;
  if (text === 'O' || text === '0' || lower === 'none' || lower === 'no radiation') return 'O';
  if (text === '☢') return '☢';
  if (text === '☢☢') return '☢☢';
  if (text === '☢☢☢') return '☢☢☢';
  if (text === '☢☢☢☢') return '☢☢☢☢';
  if (text === '☢☢☢☢☢') return '☢☢☢☢☢';
  if (lower === 'varies' || lower === 'variable') return 'Varies';
  if (lower === 'very_low' || lower === 'very low') return '☢';
  if (lower === 'low') return '☢☢';
  if (lower === 'moderate') return '☢☢☢';
  if (lower === 'higher' || lower === 'high') return '☢☢☢☢';
  if (lower === 'highest') return '☢☢☢☢☢';

  return undefined;
}

function normalizeQuestion(question: NormalizedAcrQuestion): AcrScenarioQuestion | undefined {
  const id = String(question.id ?? '').trim();
  const label = String(question.label ?? '').trim();
  const positivePhrase = String(question.positivePhrase ?? label).trim();

  if (!id || !label || !positivePhrase) return undefined;

  return {
    id,
    label,
    positivePhrase,
    polarity: question.polarity === 'absent' ? 'absent' : 'present',
  };
}

function optionKey(option: Pick<ImagingOption, 'procedure' | 'appropriatenessCategory' | 'radiationLevel'>) {
  return [
    option.procedure.toLowerCase().replace(/\s+/g, ' ').trim(),
    option.appropriatenessCategory,
    option.radiationLevel,
  ].join('|');
}

function normalizeOption(option: NormalizedAcrOption): ImagingOption | undefined {
  if (!isProcedureUsable(option.procedure)) return undefined;

  const appropriatenessCategory = normalizeAppropriateness(option.appropriatenessCategory ?? option.appropriateness);
  const radiationLevel = normalizeRadiation(option.radiationLevel ?? option.radiation);
  const procedure = String(option.procedure ?? '').trim();

  if (!procedure || !appropriatenessCategory || !radiationLevel) return undefined;

  return {
    procedure,
    appropriatenessCategory,
    radiationLevel,
    shortRationale: procedure + ' is listed as ' + appropriatenessCategory + ' for this extracted ACR scenario.',
    optionKind:
      option.optionKind === 'treatment_or_interventional'
        ? 'treatment_or_interventional'
        : 'diagnostic_imaging',
  };
}

function dedupeOptions(options: ImagingOption[]) {
  const seen = new Set<string>();
  return options.filter((option) => {
    const key = optionKey(option);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function convertNormalizedTopic(topic: NormalizedAcrTopic): AppropriatenessTopic {
  const variants = (topic.scenarios ?? [])
    .map((scenario) => {
      const imagingOptions = dedupeOptions(
        (scenario.imagingOptions ?? [])
          .map(normalizeOption)
          .filter((option): option is ImagingOption => Boolean(option)),
      );

      const extractedQuestions = (scenario.questions ?? [])
        .map(normalizeQuestion)
        .filter((question): question is AcrScenarioQuestion => Boolean(question));

      return {
        id: scenario.scenarioId,
        title: cleanScenarioTitle(scenario.scenarioTitle),
        clinicalScenario: cleanScenarioTitle(scenario.clinicalScenario || scenario.scenarioTitle),
        sourcePdf: scenario.sourcePdf || undefined,
        pageNumber: scenario.pageNumber || undefined,
        extractedQuestions,
        imagingOptions,
        requisitionSuggestions: [],
        missingInformationPrompts: extractedQuestions.map((question) => question.label),
        reportingPearls: [],
        cautions: [],
      };
    })
    .filter((variant) => variant.imagingOptions.length > 0);

  return {
    id: topic.topicId,
    title: topic.topicTitle,
    year: topic.year || '',
    clinicalArea: topic.clinicalArea || 'General',
    sourceLabel: 'ACR Appropriateness Criteria · Extracted table',
    sourceUrl: '',
    sourceNote: 'Extracted structured table summary. Validate against the original criteria and local protocol before clinical use.',
    reviewStatus: 'extracted',
    clinicalSummary: 'Appropriateness table extracted. Clinical summary pending.',
    reportingPearls: [],
    cautions: [
      'This is an educational summary, not an imaging-ordering rule.',
      'Confirm modality choice with local protocol and radiology guidance when needed.',
    ],
    followUpPearls: [],
    missingClinicalInfoPrompts: [],
    requisitionPearls: [],
    keywords: Array.from(
      new Set([
        ...(topic.complaintKeywords ?? []),
        ...(topic.keywords ?? []),
        topic.topicTitle,
        ...variants.flatMap((variant) => [
          variant.title,
          variant.clinicalScenario,
          ...variant.extractedQuestions.map((question) => question.positivePhrase),
        ]),
      ].filter(Boolean)),
    ),
    variants,
  };
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
        variant.sourcePdf ?? '',
        ...((variant.extractedQuestions ?? []).map((question) => question.positivePhrase)),
        ...variant.imagingOptions.map((option) => option.procedure),
      ]),
    ]
      .join(' ')
      .toLowerCase();

    return haystack.includes(normalized) || mappedTopicIds.has(topic.id);
  });
}

export type {
  AcrScenarioQuestion,
  AcrScenarioQuestionPolarity,
  AppropriatenessCategory,
  AppropriatenessTopic,
  AppropriatenessVariant,
  ImagingOption,
  RadiationLevel,
  ReviewStatus,
} from './types';
