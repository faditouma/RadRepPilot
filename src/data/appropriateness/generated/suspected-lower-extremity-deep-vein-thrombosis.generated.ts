import type { AppropriatenessTopic } from '../types';

// Generated from suspected-lower-extremity-deep-vein-thrombosis.raw.json.
// Appropriateness table extracted. Clinical summary pending.
// Validate against source document before clinical use.
export const suspectedLowerExtremityDeepVeinThrombosisGeneratedTopic: AppropriatenessTopic = {
  id: "suspected-lower-extremity-deep-vein-thrombosis",
  title: "Suspected Lower Extremity Deep Vein Thrombosis",
  year: "2018",
  clinicalArea: "Vascular",
  keywords: [
    "suspected",
    "lower",
    "extremity",
    "deep",
    "vein",
    "thrombosis",
    "variant",
    "initial",
    "duplex",
    "doppler",
    "mrv",
    "pelvis",
    "contrast",
    "ctv",
    "catheter",
    "venography",
  ],
  sourceLabel: "ACR Appropriateness Criteria",
  sourceNote: "Extracted structured table summary. Validate against source document before clinical use.",
  reviewStatus: "extracted",
  extractionConfidence: "high",
  variants: [
    {
      id: "variant-1-suspected-lower-extremity-deep-vein-thrombosis-initial-imaging",
      title: "Variant 1: Suspected lower extremity deep vein thrombosis. Initial imaging.",
      clinicalScenario: "Suspected lower extremity deep vein thrombosis. Initial imaging.",
      missingInformationPrompts: [],
      imagingOptions: [
        {
          procedure: "US duplex Doppler lower extremity",
          appropriatenessCategory: "Usually Appropriate",
          radiationLevel: "O",
          shortRationale: "US duplex Doppler lower extremity is listed as Usually Appropriate for this scenario.",
          extractionConfidence: "high",
        },
        {
          procedure: "MRV lower extremity and pelvis without and with IV contrast",
          appropriatenessCategory: "May Be Appropriate",
          radiationLevel: "O",
          shortRationale: "MRV lower extremity and pelvis without and with IV contrast is listed as May Be Appropriate for this scenario.",
          extractionConfidence: "high",
        },
        {
          procedure: "MRV lower extremity and pelvis without IV contrast",
          appropriatenessCategory: "May Be Appropriate",
          radiationLevel: "O",
          shortRationale: "MRV lower extremity and pelvis without IV contrast is listed as May Be Appropriate for this scenario.",
          extractionConfidence: "high",
        },
        {
          procedure: "CTV lower extremity and pelvis with IV contrast",
          appropriatenessCategory: "May Be Appropriate",
          radiationLevel: "☢☢☢",
          shortRationale: "CTV lower extremity and pelvis with IV contrast is listed as May Be Appropriate for this scenario.",
          extractionConfidence: "high",
        },
        {
          procedure: "Catheter venography pelvis and lower extremity",
          appropriatenessCategory: "Usually Not Appropriate",
          radiationLevel: "☢☢☢",
          shortRationale: "Catheter venography pelvis and lower extremity is listed as Usually Not Appropriate for this scenario.",
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
