import type { PrimaryCareContentTemplate, ReferralFormState } from '../radrep/types';
import type { AppropriatenessCategory, AppropriatenessTopic, AppropriatenessVariant, ImagingOption } from '../data/appropriateness';
import type { ClinicalComplaintMapping } from '../data/appropriateness/clinicalMappings';
import { allClinicalMappings, getTopicById, sortImagingOptions } from './appropriatenessSearch';
import { valueFor } from './requisitionGenerators';

export interface ResolvedAppropriatenessTopic {
  topicId: string;
  topic?: AppropriatenessTopic;
  statusMessage: string;
  suggestedVariants: AppropriatenessVariant[];
  topOptions: ImagingOption[];
}

export interface RequisitionAppropriatenessResult {
  mapping?: ClinicalComplaintMapping;
  relatedTopics: ResolvedAppropriatenessTopic[];
  missingInfoPrompts: string[];
  requisitionLanguage: string;
}

export interface RequisitionRecommendationOption {
  topicId: string;
  topicTitle: string;
  variantId: string;
  variantTitle: string;
  reviewStatus?: AppropriatenessTopic['reviewStatus'];
  sourceLabel?: string;
  option: ImagingOption;
}

const templateComplaintMap: Record<string, string> = {
  'ct-head-headache': 'headache',
  'ct-head-trauma-request': 'headache',
  'ct-head-stroke-request': 'headache',
  'mri-spine-radiculopathy-request': 'low-back-pain',
  'mri-spine-cauda-request': 'low-back-pain',
  'ctpa-pe-request': 'suspected-pe',
  'ct-ap-rlq-appendicitis': 'abdominal-pain',
  'ct-ap-llq-diverticulitis': 'abdominal-pain',
  'ct-ap-bowel-obstruction-request': 'abdominal-pain',
  'ct-kub-renal-colic-request': 'renal-colic',
  'ruq-us-biliary-request': 'ruq-pain',
  'us-dvt-request': 'suspected-dvt',
};

function textMatches(text: string, query: string) {
  return text.toLowerCase().includes(query.toLowerCase());
}

function uniqueStrings(items: string[]): string[] {
  return Array.from(new Set(items.map((item) => item.trim()).filter(Boolean)));
}

function genericMissingInfoPrompts(context: string): string[] {
  const normalized = context.toLowerCase();
  const prompts = [
    'Onset/duration',
    'Location',
    'Severity/progression',
    'Relevant PMHx',
    'Prior imaging',
  ];

  if (/(abdomen|pelvis|renal|flank|hematuria|pregnan|x-ray|ct|radiograph|stone|appendicitis|biliary)/i.test(normalized)) {
    prompts.push('Pregnancy status where relevant');
  }

  if (/(ct|contrast|renal|kidney|pe|pulmonary embol|pancrea|abdomen|pelvis|hematuria|aorta)/i.test(normalized)) {
    prompts.push('Renal function/contrast contraindication where relevant');
  }

  if (/(head|trauma|stroke|hematuria|dvt|pe|embol|bleed|anticoag)/i.test(normalized)) {
    prompts.push('Anticoagulation where relevant');
  }

  if (/(cancer|immunosupp|infection|pancrea|lung|nodule|back|spine|fever|weight loss)/i.test(normalized)) {
    prompts.push('Cancer/immunosuppression where relevant');
  }

  return prompts;
}

function topicContext(topic?: AppropriatenessTopic, mapping?: ClinicalComplaintMapping): string {
  return [
    mapping?.complaint,
    ...(mapping?.synonyms ?? []),
    topic?.title,
    topic?.clinicalArea,
    ...(topic?.keywords ?? []),
    ...(topic?.variants.flatMap((variant) => [
      variant.title,
      variant.clinicalScenario,
      ...variant.imagingOptions.map((option) => option.procedure),
    ]) ?? []),
  ]
    .filter(Boolean)
    .join(' ');
}

export function getDefaultComplaintId(template: PrimaryCareContentTemplate): string {
  if (templateComplaintMap[template.id]) return templateComplaintMap[template.id];

  const haystack = [template.id, template.title, template.description, template.bodySystem, template.modality].join(' ');
  const match = allClinicalMappings().find((mapping) =>
    [mapping.id, mapping.complaint, ...mapping.synonyms].some((term) => textMatches(haystack, term)),
  );

  return match?.id ?? '';
}

export function getComplaintMappingById(id: string): ClinicalComplaintMapping | undefined {
  return allClinicalMappings().find((mapping) => mapping.id === id);
}

export function resolveAppropriatenessForComplaint(mapping?: ClinicalComplaintMapping): RequisitionAppropriatenessResult {
  if (!mapping) {
    return {
      relatedTopics: [],
      missingInfoPrompts: [],
      requisitionLanguage: '',
    };
  }

  const relatedTopics = mapping.relatedTopicIds.map((topicId) => {
    const topic = getTopicById(topicId);
    const suggestedVariants =
      topic && mapping.suggestedVariantIds?.length
        ? topic.variants.filter((variant) => mapping.suggestedVariantIds?.includes(variant.id))
        : topic?.variants ?? [];
    const variantsToUse = suggestedVariants.length ? suggestedVariants : topic?.variants ?? [];
    const topOptions = sortImagingOptions(variantsToUse.flatMap((variant) => variant.imagingOptions)).slice(0, 6);

    return {
      topicId,
      topic,
      statusMessage: topic
        ? 'Appropriateness table available. Clinical summary may still require validation.'
        : 'Appropriateness table not extracted yet. Clinical summary pending.',
      suggestedVariants: variantsToUse,
      topOptions,
    };
  });

  const curatedPrompts = relatedTopics.flatMap((item) => item.suggestedVariants.flatMap((variant) => variant.missingInformationPrompts));
  const fallbackPrompts = relatedTopics.flatMap((item) => genericMissingInfoPrompts(topicContext(item.topic, mapping)));
  const missingInfoPrompts = uniqueStrings([...mapping.missingInfoPrompts, ...curatedPrompts, ...fallbackPrompts]).slice(0, 12);

  return {
    mapping,
    relatedTopics,
    missingInfoPrompts,
    requisitionLanguage: mapping.commonRequisitionLanguage || 'Requisition wording pending for this topic.',
  };
}

export function resolveAppropriatenessForTopic(topicId: string): RequisitionAppropriatenessResult {
  const topic = getTopicById(topicId);

  if (!topic) {
    return {
      relatedTopics: [
        {
          topicId,
          statusMessage: 'Appropriateness table not extracted yet. Clinical summary pending.',
          suggestedVariants: [],
          topOptions: [],
        },
      ],
      missingInfoPrompts: genericMissingInfoPrompts(topicId),
      requisitionLanguage: 'Requisition wording pending for this topic.',
    };
  }

  const variantsToUse = topic.variants;
  const relatedTopics = [
    {
      topicId,
      topic,
      statusMessage:
        topic.reviewStatus === 'manually_curated' || topic.reviewStatus === 'reviewed'
          ? 'Curated requisition support available.'
          : 'Appropriateness table extracted. Requisition wording may require local adaptation.',
      suggestedVariants: variantsToUse,
      topOptions: sortImagingOptions(variantsToUse.flatMap((variant) => variant.imagingOptions)).slice(0, 6),
    },
  ];
  const curatedPrompts = variantsToUse.flatMap((variant) => variant.missingInformationPrompts);
  const fallbackPrompts = genericMissingInfoPrompts(topicContext(topic));
  const requisitionSuggestion = variantsToUse.flatMap((variant) => variant.requisitionSuggestions).find(Boolean);

  return {
    relatedTopics,
    missingInfoPrompts: uniqueStrings([...curatedPrompts, ...fallbackPrompts]).slice(0, 12),
    requisitionLanguage: requisitionSuggestion || 'Requisition wording pending for this topic.',
  };
}

export function getGroupedRecommendationOptions(
  result: RequisitionAppropriatenessResult,
): Record<AppropriatenessCategory, RequisitionRecommendationOption[]> {
  const grouped: Record<AppropriatenessCategory, RequisitionRecommendationOption[]> = {
    'Usually Appropriate': [],
    'May Be Appropriate': [],
    'May Be Appropriate (Disagreement)': [],
    'Usually Not Appropriate': [],
  };
  const seen = new Set<string>();

  result.relatedTopics.forEach((item) => {
    item.suggestedVariants.forEach((variant) => {
      sortImagingOptions(variant.imagingOptions).forEach((option) => {
        const key = `${item.topicId}:${variant.id}:${option.procedure}:${option.appropriatenessCategory}`;
        if (seen.has(key)) return;
        seen.add(key);
        grouped[option.appropriatenessCategory].push({
          topicId: item.topicId,
          topicTitle: item.topic?.title ?? item.topicId.replace(/-/g, ' '),
          variantId: variant.id,
          variantTitle: variant.title,
          reviewStatus: item.topic?.reviewStatus,
          sourceLabel: item.topic?.sourceLabel,
          option,
        });
      });
    });
  });

  return grouped;
}

export function generateAppropriatenessAwareRequisitionSentence(
  form: ReferralFormState,
  template: PrimaryCareContentTemplate,
  selectedProcedure?: string,
): string {
  const age = valueFor(form, 'age').replace(/-?year-?old/i, '').trim();
  const sex = valueFor(form, 'sex');
  const patient = age || sex ? `${age}${sex && sex !== 'Prefer not to specify' ? sex : ''}` : 'Patient';
  const pmhx = valueFor(form, 'pmhx');
  const symptom =
    valueFor(form, 'positiveSymptoms') ||
    valueFor(form, 'mainSymptom') ||
    valueFor(form, 'indication') ||
    valueFor(form, 'painLocation') ||
    template.description;
  const context = [
    pmhx ? `known for ${pmhx}` : undefined,
    valueFor(form, 'anticoagulation') === 'yes' ? 'on anticoagulation' : undefined,
    valueFor(form, 'cancerHistory') === 'yes' ? 'history of cancer' : undefined,
    valueFor(form, 'immunosuppression') === 'yes' ? 'immunosuppressed' : undefined,
  ]
    .filter(Boolean)
    .join(', ');
  const question = valueFor(form, 'clinicalQuestion') || template.defaultQuestion;
  const requestedProcedure = selectedProcedure || valueFor(form, 'requestedProcedure');
  const modalityPhrase = requestedProcedure ? ` Requested study: ${requestedProcedure}.` : '';

  return `${patient}${context ? `, ${context}` : ''}, presenting with ${symptom}. ${question}.${modalityPhrase}`.replace(/\s+/g, ' ').trim();
}
