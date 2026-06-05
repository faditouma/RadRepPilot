import type { AppropriatenessTopic } from '../types';

// Generated from suspected-upper-extremity-deep-vein-thrombosis.raw.json.
// Appropriateness table extracted. Clinical summary pending.
// Validate against source document before clinical use.
export const suspectedUpperExtremityDeepVeinThrombosisGeneratedTopic: AppropriatenessTopic = {
  id: "suspected-upper-extremity-deep-vein-thrombosis",
  title: "Suspected Upper-Extremity Deep Vein Thrombosis",
  year: "2019",
  clinicalArea: "Vascular",
  keywords: [
    "suspected",
    "upper",
    "extremity",
    "deep",
    "vein",
    "thrombosis",
    "variant",
    "initial",
    "duplex",
    "doppler",
    "mrv",
    "contrast",
    "ctv",
    "radiography",
    "chest",
    "catheter",
    "venography",
    "nuclear",
    "medicine",
  ],
  sourceLabel: "ACR Appropriateness Criteria",
  sourceNote: "Extracted structured table summary. Validate against source document before clinical use.",
  reviewStatus: "extracted",
  extractionConfidence: "high",
  variants: [
    {
      id: "variant-1-suspected-upper-extremity-deep-vein-thrombosis-initial-imaging",
      title: "Variant 1: Suspected upper-extremity deep vein thrombosis. Initial imaging.",
      clinicalScenario: "Suspected upper-extremity deep vein thrombosis. Initial imaging.",
      missingInformationPrompts: [],
      imagingOptions: [
        {
          procedure: "US duplex Doppler upper extremity",
          appropriatenessCategory: "Usually Appropriate",
          radiationLevel: "O",
          shortRationale: "US duplex Doppler upper extremity is listed as Usually Appropriate for this scenario.",
          extractionConfidence: "high",
        },
        {
          procedure: "MRV upper extremity without and with IV contrast",
          appropriatenessCategory: "May Be Appropriate",
          radiationLevel: "O",
          shortRationale: "MRV upper extremity without and with IV contrast is listed as May Be Appropriate for this scenario.",
          extractionConfidence: "high",
        },
        {
          procedure: "MRV upper extremity without IV contrast",
          appropriatenessCategory: "May Be Appropriate",
          radiationLevel: "O",
          shortRationale: "MRV upper extremity without IV contrast is listed as May Be Appropriate for this scenario.",
          extractionConfidence: "high",
        },
        {
          procedure: "CTV upper extremity with IV contrast",
          appropriatenessCategory: "May Be Appropriate",
          radiationLevel: "☢☢☢☢",
          shortRationale: "CTV upper extremity with IV contrast is listed as May Be Appropriate for this scenario.",
          extractionConfidence: "high",
        },
        {
          procedure: "Radiography chest",
          appropriatenessCategory: "Usually Not Appropriate",
          radiationLevel: "☢",
          shortRationale: "Radiography chest is listed as Usually Not Appropriate for this scenario.",
          extractionConfidence: "high",
        },
        {
          procedure: "Catheter venography upper extremity",
          appropriatenessCategory: "Usually Not Appropriate",
          radiationLevel: "☢☢☢",
          shortRationale: "Catheter venography upper extremity is listed as Usually Not Appropriate for this scenario.",
          extractionConfidence: "high",
        },
        {
          procedure: "Nuclear medicine venography upper extremity",
          appropriatenessCategory: "Usually Not Appropriate",
          radiationLevel: "☢☢☢",
          shortRationale: "Nuclear medicine venography upper extremity is listed as Usually Not Appropriate for this scenario.",
          extractionConfidence: "high",
        }
      ],
      requisitionSuggestions: [],
      reportingPearls: [],
      followUpPearls: [],
      cautions: [
        "Appropriateness table extracted. Clinical summary pending.",
        "Validate extracted table rows against the source document before clinical use.",
      ],
      extractionConfidence: "high",
    }
  ],
};
