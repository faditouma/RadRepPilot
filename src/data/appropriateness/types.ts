export type AppropriatenessCategory =
  | 'Usually Appropriate'
  | 'May Be Appropriate'
  | 'May Be Appropriate (Disagreement)'
  | 'Usually Not Appropriate';

export type RadiationLevel = 'O' | '☢' | '☢☢' | '☢☢☢' | '☢☢☢☢' | '☢☢☢☢☢' | 'Varies';

export type ReviewStatus = 'extracted' | 'needs_validation' | 'reviewed' | 'manually_curated';

export type AcrScenarioQuestionPolarity = 'present' | 'absent';

export interface AcrScenarioQuestion {
  id: string;
  label: string;
  positivePhrase: string;
  polarity: AcrScenarioQuestionPolarity;
}

export interface ImagingOption {
  procedure: string;
  appropriatenessCategory: AppropriatenessCategory;
  radiationLevel: RadiationLevel;
  shortRationale: string;
  extractionConfidence?: 'high' | 'medium' | 'low';
  optionKind?: 'diagnostic_imaging' | 'treatment_or_interventional';
}

export interface AppropriatenessVariant {
  id: string;
  title: string;
  clinicalScenario: string;
  sourcePdf?: string;
  pageNumber?: string;
  extractedQuestions?: AcrScenarioQuestion[];
  clinicalSummary?: string;
  keyClinicalConsiderations?: string[];
  missingClinicalInfoPrompts?: string[];
  missingInformationPrompts: string[];
  imagingOptions: ImagingOption[];
  requisitionSuggestions: string[];
  requisitionPearls?: string[];
  reportingPearls: string[];
  followUpPearls?: string[];
  cautions: string[];
  sourceExcerptPreview?: string;
  extractionConfidence?: 'high' | 'medium' | 'low';
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
  clinicalSummary?: string;
  keyClinicalConsiderations?: string[];
  missingClinicalInfoPrompts?: string[];
  requisitionPearls?: string[];
  reportingPearls?: string[];
  cautions?: string[];
  followUpPearls?: string[];
  sourceExcerptPreview?: string;
  reviewStatus: ReviewStatus;
  extractionConfidence?: 'high' | 'medium' | 'low';
  variants: AppropriatenessVariant[];
}
