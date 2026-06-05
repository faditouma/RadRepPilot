import type { PrimaryCareContentTemplate, ReferralFormState } from '../radrep/types';
import type { AppropriatenessTopic, AppropriatenessVariant, ImagingOption } from '../data/appropriateness';
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
        ? 'Appropriateness table available. Curated clinical notes may still require local validation.'
        : 'Appropriateness table pending. Curated clinical summary pending.',
      suggestedVariants: variantsToUse,
      topOptions,
    };
  });

  const curatedPrompts = relatedTopics.flatMap((item) => item.suggestedVariants.flatMap((variant) => variant.missingInformationPrompts));
  const missingInfoPrompts = Array.from(new Set([...mapping.missingInfoPrompts, ...curatedPrompts])).slice(0, 12);

  return {
    mapping,
    relatedTopics,
    missingInfoPrompts,
    requisitionLanguage: mapping.commonRequisitionLanguage,
  };
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
  const modalityPhrase = selectedProcedure ? ` Requested study: ${selectedProcedure}.` : '';

  return `${patient}${context ? `, ${context}` : ''}, presenting with ${symptom}. ${question}.${modalityPhrase}`.replace(/\s+/g, ' ').trim();
}
