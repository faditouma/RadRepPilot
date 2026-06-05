import {
  appropriatenessTopics,
  getAppropriatenessTopicById,
  searchAppropriatenessTopics,
  type AppropriatenessCategory,
  type AppropriatenessTopic,
  type ImagingOption,
  type RadiationLevel,
  type ReviewStatus,
} from '../data/appropriateness';
import { clinicalComplaintMappings, searchClinicalMappings, type ClinicalComplaintMapping } from '../data/appropriateness/clinicalMappings';

export const radiationLegend: Array<{ level: RadiationLevel; label: string }> = [
  { level: 'O', label: 'no ionizing radiation' },
  { level: '☢', label: 'very low' },
  { level: '☢☢', label: 'low' },
  { level: '☢☢☢', label: 'moderate' },
  { level: '☢☢☢☢', label: 'higher' },
  { level: '☢☢☢☢☢', label: 'highest relative range' },
  { level: 'Varies', label: 'depends on technique/procedure' },
];

export const categoryRank: Record<AppropriatenessCategory, number> = {
  'Usually Appropriate': 1,
  'May Be Appropriate': 2,
  'May Be Appropriate (Disagreement)': 3,
  'Usually Not Appropriate': 4,
};

export function reviewStatusLabel(status: ReviewStatus): string {
  if (status === 'manually_curated') return 'Manually curated';
  if (status === 'reviewed') return 'Reviewed';
  if (status === 'needs_validation') return 'Needs validation';
  return 'Extracted table';
}

export function reviewStatusSummary(status?: ReviewStatus): string {
  if (status === 'manually_curated') return 'Reviewed table with curated clinical summary.';
  if (status === 'reviewed') return 'Reviewed appropriateness table available.';
  if (status === 'needs_validation') return 'Extracted from appropriateness criteria. Validate against source before clinical use.';
  if (status === 'extracted') return 'Appropriateness table extracted. Clinical summary pending.';
  return 'Appropriateness table pending. Curated clinical notes not yet added.';
}

export function sortImagingOptions(options: ImagingOption[]) {
  return [...options].sort((a, b) => categoryRank[a.appropriatenessCategory] - categoryRank[b.appropriatenessCategory]);
}

export function getTopicById(topicId: string): AppropriatenessTopic | undefined {
  return getAppropriatenessTopicById(topicId);
}

export function searchAppropriatenessLayer(query: string): {
  topics: AppropriatenessTopic[];
  complaintMappings: ClinicalComplaintMapping[];
} {
  return {
    topics: searchAppropriatenessTopics(query),
    complaintMappings: searchClinicalMappings(query),
  };
}

export function allClinicalMappings() {
  return clinicalComplaintMappings;
}

export function allAppropriatenessTopics() {
  return appropriatenessTopics;
}
