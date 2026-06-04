export type AppropriatenessCategory =
  | 'Usually Appropriate'
  | 'May Be Appropriate'
  | 'May Be Appropriate (Disagreement)'
  | 'Usually Not Appropriate';

export type RadiationLevel = 'O' | '☢' | '☢☢' | '☢☢☢' | '☢☢☢☢' | '☢☢☢☢☢' | 'Varies';

export type ReviewStatus = 'unreviewed' | 'reviewed';

export interface ImagingOption {
  procedure: string;
  appropriatenessCategory: AppropriatenessCategory;
  radiationLevel: RadiationLevel;
  shortRationale: string;
}

export interface AppropriatenessVariant {
  id: string;
  title: string;
  clinicalScenario: string;
  missingInformationPrompts: string[];
  imagingOptions: ImagingOption[];
  requisitionSuggestions: string[];
  reportingPearls: string[];
  cautions: string[];
}

export interface AppropriatenessTopic {
  id: string;
  title: string;
  year: string;
  clinicalArea: string;
  keywords: string[];
  sourceLabel: string;
  sourceUrl?: string;
  sourceNote: string;
  reviewStatus: ReviewStatus;
  variants: AppropriatenessVariant[];
}
