import type { IncidentalFindingDefinition, PrimaryCareFieldDefinition } from '../radrep/types';
import { prototypeSafetyNote, sourceLinks } from './sourceMetadata';

const yesNoOptions = [
  { value: '', label: 'Not specified' },
  { value: 'no', label: 'No' },
  { value: 'yes', label: 'Yes' },
];

function text(id: string, label: string, placeholder?: string): PrimaryCareFieldDefinition {
  return { id, label, type: 'text', placeholder };
}

function select(id: string, label: string, options: Array<{ value: string; label: string }>): PrimaryCareFieldDefinition {
  return { id, label, type: 'select', options };
}

function yesNo(id: string, label: string): PrimaryCareFieldDefinition {
  return select(id, label, yesNoOptions);
}

function item(definition: IncidentalFindingDefinition): IncidentalFindingDefinition {
  return definition;
}

export const incidentalFindingsRegistry: IncidentalFindingDefinition[] = [
  item({
    id: 'incidental-pulmonary-nodule',
    name: 'Incidental pulmonary nodule',
    organSystem: 'Chest',
    commonModalities: ['CT chest', 'CTPA', 'CT abdomen/pelvis lung bases'],
    purpose: 'Generate consistent, guideline-aware pulmonary nodule description and simplified follow-up language from user-entered findings.',
    appliesTo: ['Incidentally detected pulmonary nodules when guideline applicability is appropriate', 'Radiologist-verified size, type, risk, and prior stability'],
    keyInputs: [
      text('age', 'Patient age'),
      yesNo('knownCancer', 'Known cancer?'),
      yesNo('immunocompromised', 'Immunocompromised?'),
      select('noduleType', 'Nodule type', [
        { value: 'solid', label: 'Solid' },
        { value: 'ground-glass', label: 'Ground-glass' },
        { value: 'part-solid', label: 'Part-solid' },
      ]),
      select('count', 'Solitary or multiple', [
        { value: 'solitary', label: 'Solitary' },
        { value: 'multiple', label: 'Multiple' },
      ]),
      text('sizeMm', 'Size (mm)'),
      text('location', 'Location/lobe'),
      select('riskCategory', 'Patient risk', [
        { value: 'low risk', label: 'Low risk' },
        { value: 'high risk', label: 'High risk' },
      ]),
      select('stability', 'Stability', [
        { value: 'unknown', label: 'Unknown' },
        { value: 'new', label: 'New' },
        { value: 'stable', label: 'Stable' },
        { value: 'increased', label: 'Increased' },
        { value: 'decreased', label: 'Decreased' },
      ]),
    ],
    redFlagsOrHighRiskFeatures: ['Known malignancy', 'Immunocompromised status', 'Patient age under 35', 'Growth', 'Suspicious morphology'],
    simplifiedOutputLogic: 'Uses the same simplified Fleischner-style prototype logic as the pulmonary nodule assistant.',
    reportReadySentenceTemplates: [
      'Incidental [solid/subsolid] pulmonary nodule measuring [size] mm in the [location]. Follow-up recommendation should be based on nodule type, size, patient risk, and guideline applicability.',
      'Based on simplified Fleischner guidance, consider [interval/action], assuming guideline applicability.',
    ],
    recommendationPlaceholder: 'Compare with prior imaging and verify current Fleischner/ACR applicability before final wording.',
    safetyWarning: 'Fleischner guidance generally may not apply to patients younger than 35, patients with known cancer, or immunocompromised patients.',
    sourceNames: ['Fleischner Society 2017', 'ACR Incidental Findings'],
    sourceLinks: [sourceLinks.acrIncidentalFindings],
  }),
  item({
    id: 'incidental-adrenal-nodule',
    name: 'Incidental adrenal nodule',
    organSystem: 'Abdomen/Endocrine',
    commonModalities: ['CT abdomen/pelvis', 'CT chest', 'MRI abdomen'],
    purpose: 'Structure incidental adrenal nodule wording with size, attenuation, homogeneity, malignancy history, stability, and washout context.',
    appliesTo: ['Incidentally detected adrenal nodules', 'Radiologist-verified attenuation and comparison'],
    keyInputs: [
      select('side', 'Side', [
        { value: 'left', label: 'Left' },
        { value: 'right', label: 'Right' },
        { value: 'bilateral', label: 'Bilateral' },
      ]),
      text('sizeCm', 'Size (cm)'),
      text('noncontrastHu', 'Noncontrast HU if available'),
      yesNo('homogeneous', 'Homogeneous?'),
      yesNo('knownMalignancy', 'Known malignancy?'),
      select('priorStability', 'Prior stability', [
        { value: 'unknown', label: 'Unknown' },
        { value: 'stable', label: 'Stable' },
        { value: 'new', label: 'New' },
        { value: 'increased', label: 'Increased' },
      ]),
      text('washout', 'Washout result if available'),
    ],
    redFlagsOrHighRiskFeatures: ['Large size', 'Heterogeneous features', 'Known extra-adrenal malignancy', 'Interval growth', 'Indeterminate HU'],
    simplifiedOutputLogic: 'Paraphrases ACR-style incidental adrenal considerations and optionally incorporates washout compatibility if entered.',
    reportReadySentenceTemplates: [
      'Incidental [size] cm [left/right] adrenal nodule with [HU/features]. If not previously characterized, consider adrenal protocol CT/MRI or biochemical/clinical correlation as appropriate.',
      'Washout characteristics are compatible with adenoma in this prototype; final characterization requires verification.',
    ],
    recommendationPlaceholder: 'Follow-up depends on size, imaging phenotype, malignancy history, stability, and local adrenal protocol.',
    safetyWarning: prototypeSafetyNote,
    sourceNames: ['ACR Incidental Findings Committee adrenal guidance'],
    sourceLinks: [sourceLinks.acrIncidentalFindings],
  }),
  item({
    id: 'incidental-renal-lesion',
    name: 'Incidental renal cyst/mass',
    organSystem: 'GU/Renal',
    commonModalities: ['CT abdomen/pelvis', 'MRI abdomen', 'Ultrasound'],
    purpose: 'Draft renal cyst or mass follow-up wording using simple cyst features, enhancement, complexity, and stability.',
    appliesTo: ['Incidental renal cystic or solid lesions', 'Radiologist-verified enhancement and morphology'],
    keyInputs: [
      select('lesionType', 'Lesion type', [
        { value: 'cystic', label: 'Cystic' },
        { value: 'solid', label: 'Solid' },
        { value: 'indeterminate', label: 'Indeterminate' },
      ]),
      text('sizeCm', 'Size (cm)'),
      yesNo('simpleCyst', 'Simple cyst features?'),
      select('enhancement', 'Enhancement', [
        { value: 'unknown', label: 'Unknown' },
        { value: 'none', label: 'None' },
        { value: 'present', label: 'Present' },
      ]),
      text('complexFeatures', 'Septa/wall/nodule features'),
      select('priorStability', 'Prior stability', [
        { value: 'unknown', label: 'Unknown' },
        { value: 'stable', label: 'Stable' },
        { value: 'increased', label: 'Increased' },
      ]),
    ],
    redFlagsOrHighRiskFeatures: ['Enhancing solid component', 'Measurable enhancement', 'Thick septa or mural nodule', 'Growth'],
    simplifiedOutputLogic: 'Suggests no specific imaging follow-up for simple cyst language and characterization for indeterminate/enhancing lesions.',
    reportReadySentenceTemplates: [
      'Simple-appearing renal cyst. No specific imaging follow-up is suggested in this prototype.',
      'Indeterminate renal lesion; consider renal protocol CT/MRI for characterization if not previously evaluated.',
    ],
    recommendationPlaceholder: 'Final Bosniak or renal mass pathway requires radiologist verification of enhancement and lesion type.',
    safetyWarning: prototypeSafetyNote,
    sourceNames: ['ACR Incidental Findings Committee renal mass guidance', 'Bosniak v2019'],
    sourceLinks: [sourceLinks.acrIncidentalFindings],
  }),
  item({
    id: 'incidental-thyroid-nodule',
    name: 'Incidental thyroid nodule',
    organSystem: 'Neck/Endocrine',
    commonModalities: ['CT neck', 'CT chest', 'MRI neck', 'Ultrasound'],
    purpose: 'Draft incidental thyroid nodule follow-up wording using size, age, suspicious features, lymph nodes, and modality.',
    appliesTo: ['Incidentally noted thyroid nodules on CT/MRI or ultrasound descriptors', 'Radiologist-verified size and suspicious features'],
    keyInputs: [
      text('sizeCm', 'Size (cm)'),
      text('age', 'Patient age'),
      yesNo('suspiciousFeatures', 'Suspicious imaging features?'),
      yesNo('lymphadenopathy', 'Suspicious lymphadenopathy?'),
      select('modality', 'Modality', [
        { value: 'CT/MRI', label: 'CT/MRI' },
        { value: 'Ultrasound', label: 'Ultrasound' },
      ]),
    ],
    redFlagsOrHighRiskFeatures: ['Suspicious lymphadenopathy', 'Invasive features', 'Large size', 'High-risk clinical context'],
    simplifiedOutputLogic: 'Suggests dedicated ultrasound consideration based on age, size, and suspicious features without exact threshold claims.',
    reportReadySentenceTemplates: [
      'Incidental thyroid nodule measuring [size] cm. Consider dedicated thyroid ultrasound depending on patient age, size, and suspicious imaging features.',
      'Further management should be based on ultrasound features/TI-RADS if performed.',
    ],
    recommendationPlaceholder: 'Dedicated thyroid ultrasound and TI-RADS/FNA decisions require verification against current criteria.',
    safetyWarning: prototypeSafetyNote,
    sourceNames: ['ACR Incidental Findings', 'ACR TI-RADS'],
    sourceLinks: [sourceLinks.acrIncidentalFindings],
  }),
  item({
    id: 'incidental-liver-lesion',
    name: 'Incidental liver lesion',
    organSystem: 'Abdomen/Liver',
    commonModalities: ['CT abdomen/pelvis', 'MRI abdomen', 'Ultrasound'],
    purpose: 'Draft incidental liver lesion wording using size, risk status, benign features, HCC risk, malignancy history, and prior stability.',
    appliesTo: ['Incidental liver lesions when imaging phenotype and risk category are user-entered', 'Radiologist-verified benign versus indeterminate features'],
    keyInputs: [
      text('sizeCm', 'Size (cm)'),
      select('riskCategory', 'Patient risk', [
        { value: 'low risk', label: 'Low risk' },
        { value: 'high risk', label: 'High risk' },
      ]),
      yesNo('benignFeatures', 'Benign imaging features?'),
      yesNo('hccRisk', 'Cirrhosis/HCC risk?'),
      yesNo('knownMalignancy', 'Known malignancy?'),
      text('features', 'Key imaging features'),
    ],
    redFlagsOrHighRiskFeatures: ['Cirrhosis/HCC risk', 'Known malignancy', 'Indeterminate enhancement', 'Growth', 'Large or multiple lesions'],
    simplifiedOutputLogic: 'Separates low-risk benign-appearing language from indeterminate/high-risk MRI characterization language.',
    reportReadySentenceTemplates: [
      'Incidental liver lesion measuring [size] cm with [features]. In a [low/high]-risk patient, consider [no follow-up/MRI characterization] depending on imaging features and prior stability.',
      'LI-RADS should only be applied in an appropriate HCC-risk population.',
    ],
    recommendationPlaceholder: 'Follow-up depends on patient risk, enhancement pattern, comparison, and whether LI-RADS population criteria apply.',
    safetyWarning: prototypeSafetyNote,
    sourceNames: ['ACR Incidental Findings Committee liver lesion guidance', 'ACR LI-RADS'],
    sourceLinks: [sourceLinks.acrIncidentalFindings, sourceLinks.liRads],
  }),
  item({
    id: 'incidental-pancreatic-cyst',
    name: 'Incidental pancreatic cyst',
    organSystem: 'Abdomen/Pancreas',
    commonModalities: ['CT abdomen/pelvis', 'MRI/MRCP'],
    purpose: 'Draft pancreatic cyst follow-up wording with size, duct dilation, mural nodule, solid component, symptoms, and age.',
    appliesTo: ['Incidentally detected pancreatic cystic lesions without definitive high-risk management already determined'],
    keyInputs: [
      text('sizeCm', 'Size (cm)'),
      yesNo('ductDilation', 'Main duct dilation?'),
      yesNo('muralNodule', 'Mural nodule?'),
      yesNo('solidComponent', 'Solid component?'),
      yesNo('symptoms', 'Symptoms attributable to cyst?'),
      text('age', 'Patient age'),
      select('interval', 'Surveillance interval if used', [
        { value: 'per local protocol', label: 'Per local protocol' },
        { value: '6 months', label: '6 months' },
        { value: '12 months', label: '12 months' },
        { value: '2 years', label: '2 years' },
      ]),
    ],
    redFlagsOrHighRiskFeatures: ['Main duct dilation', 'Mural nodule', 'Solid component', 'Symptoms', 'Growth'],
    simplifiedOutputLogic: 'Uses high-risk feature flags to choose surveillance-style versus specialist-directed language.',
    reportReadySentenceTemplates: [
      'Incidental pancreatic cystic lesion measuring [size] cm without high-risk features in this prototype. Consider MRI/MRCP surveillance based on size, age, and local guideline.',
      'High-risk features such as duct dilation, mural nodule, or solid component warrant specialist/radiologist-directed management.',
    ],
    recommendationPlaceholder: 'Surveillance interval requires current guideline, age/comorbidity, cyst type, and local pancreatic pathway verification.',
    safetyWarning: prototypeSafetyNote,
    sourceNames: ['ACR Incidental Findings Committee pancreatic cyst guidance'],
    sourceLinks: [sourceLinks.acrIncidentalFindings],
  }),
  item({
    id: 'incidental-adnexal-cyst',
    name: 'Incidental adnexal cyst',
    organSystem: 'GU/Adnexa',
    commonModalities: ['CT abdomen/pelvis', 'MRI pelvis', 'Pelvic ultrasound'],
    purpose: 'Draft adnexal cyst follow-up wording based on menopausal status, size, simple versus complex appearance, and symptoms.',
    appliesTo: ['Incidentally detected adnexal cysts when morphology and symptoms are user-entered'],
    keyInputs: [
      select('menopausalStatus', 'Menopausal status', [
        { value: 'premenopausal', label: 'Premenopausal' },
        { value: 'postmenopausal', label: 'Postmenopausal' },
        { value: 'unknown', label: 'Unknown' },
      ]),
      text('sizeCm', 'Size (cm)'),
      select('complexity', 'Simple or complex', [
        { value: 'simple', label: 'Simple' },
        { value: 'complex', label: 'Complex' },
        { value: 'indeterminate', label: 'Indeterminate' },
      ]),
      yesNo('symptoms', 'Symptoms?'),
    ],
    redFlagsOrHighRiskFeatures: ['Complex morphology', 'Symptoms', 'Postmenopausal status', 'Large size', 'Solid component or vascularity if known'],
    simplifiedOutputLogic: 'Generates non-thresholded follow-up language and points to O-RADS when ultrasound/MRI characterization is applicable.',
    reportReadySentenceTemplates: [
      'Incidental [simple/complex] adnexal cyst measuring [size] cm in a [pre/post]menopausal patient. Follow-up depends on size, complexity, symptoms, and menopausal status.',
      'O-RADS may be used for ultrasound/MRI risk stratification when applicable.',
    ],
    recommendationPlaceholder: 'Follow-up depends on size thresholds, morphology, symptoms, menopausal status, and O-RADS applicability.',
    safetyWarning: prototypeSafetyNote,
    sourceNames: ['ACR Incidental Findings Committee adnexal findings', 'ACR O-RADS'],
    sourceLinks: [sourceLinks.acrIncidentalFindings, sourceLinks.oRads],
  }),
  item({
    id: 'aortic-aneurysm',
    name: 'Aortic aneurysm',
    organSystem: 'Vascular',
    commonModalities: ['CT', 'Ultrasound', 'MRI'],
    purpose: 'Draft aortic aneurysm follow-up wording with location, diameter, symptoms, sex, prior size, and growth.',
    appliesTo: ['Incidentally detected or followed thoracic/abdominal aortic aneurysm measurements'],
    keyInputs: [
      select('location', 'Location', [
        { value: 'abdominal', label: 'Abdominal' },
        { value: 'thoracic', label: 'Thoracic' },
      ]),
      text('diameterCm', 'Maximum diameter (cm)'),
      yesNo('symptoms', 'Symptoms?'),
      select('sex', 'Sex if relevant to local threshold', [
        { value: '', label: 'Not specified' },
        { value: 'female', label: 'Female' },
        { value: 'male', label: 'Male' },
      ]),
      text('priorSizeGrowth', 'Prior size/growth'),
      select('interval', 'Follow-up interval/action', [
        { value: 'per vascular protocol', label: 'Per vascular protocol' },
        { value: '6 months', label: '6 months' },
        { value: '12 months', label: '12 months' },
        { value: '2-3 years', label: '2-3 years' },
        { value: 'urgent vascular correlation', label: 'Urgent vascular correlation' },
      ]),
    ],
    redFlagsOrHighRiskFeatures: ['Symptoms', 'Rapid growth', 'Large diameter', 'Rupture/leak signs', 'Branch vessel involvement'],
    simplifiedOutputLogic: 'Uses size/growth/symptom context to produce protocol-safe comparison and follow-up/referral language without exact threshold claims.',
    reportReadySentenceTemplates: [
      '[Abdominal/thoracic] aortic aneurysm measuring [size] cm. Recommend comparison with prior imaging and follow-up/referral according to size, growth rate, symptoms, and local vascular protocol.',
    ],
    recommendationPlaceholder: 'Follow-up and referral thresholds must be checked against vascular protocol and patient-specific factors.',
    safetyWarning: prototypeSafetyNote,
    sourceNames: ['ACR Incidental Findings', 'Vascular society guidance placeholder'],
    sourceLinks: [sourceLinks.acrIncidentalFindings],
  }),
];
