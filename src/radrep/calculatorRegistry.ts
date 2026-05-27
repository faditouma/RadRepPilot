import {
  computeAdrenalWashout,
  computeAspects,
  computeBirads,
  computeBosniak,
  computeBoneRads,
  computeCadRads,
  computeFleischner,
  computeLirads,
  computeLungRads,
  computeNiRads,
  computeOrads,
  computePirads,
  computeRecist,
  computeRvLv,
  computeTirads,
  computeViRads,
} from './calculators';
import type { CalculatorDefinition } from './types';

export const calculatorRegistry: CalculatorDefinition[] = [
  {
    id: 'rv-lv-ratio',
    name: 'RV/LV ratio calculator',
    modality: 'CT',
    bodySystem: 'Chest',
    status: 'implemented',
    description: 'Calculate RV/LV ratio from user-entered RV and LV diameters.',
    fields: [
      { id: 'rvDiameterMm', label: 'RV diameter (mm)', type: 'number' },
      { id: 'lvDiameterMm', label: 'LV diameter (mm)', type: 'number' },
    ],
    defaultValues: { rvDiameterMm: '', lvDiameterMm: '' },
    compute: computeRvLv,
  },
  {
    id: 'aspects',
    name: 'ASPECTS calculator',
    modality: 'CT',
    bodySystem: 'Neuro',
    status: 'implemented',
    description: 'Select involved ASPECTS regions and generate report-ready stroke language.',
    fields: [
      {
        id: 'side',
        label: 'Side',
        type: 'select',
        options: [
          { value: 'right', label: 'Right' },
          { value: 'left', label: 'Left' },
        ],
      },
      {
        id: 'regions',
        label: 'Involved regions',
        type: 'checkbox-group',
        options: ['Caudate', 'Lentiform', 'Internal capsule', 'Insula', 'M1', 'M2', 'M3', 'M4', 'M5', 'M6'].map(
          (region) => ({ value: region, label: region }),
        ),
      },
    ],
    defaultValues: { side: 'right', regions: [] },
    compute: computeAspects,
  },
  {
    id: 'fleischner',
    name: 'Simplified Fleischner pulmonary nodule assistant',
    modality: 'CT',
    bodySystem: 'Chest',
    status: 'implemented',
    description: 'Generate simplified prototype pulmonary nodule follow-up language with applicability warnings.',
    applicabilityWarning: 'Fleischner guidance may not apply to patients <35, known cancer, or immunocompromised patients.',
    fields: [
      { id: 'patientAge', label: 'Patient age', type: 'number' },
      {
        id: 'knownMalignancy',
        label: 'Known cancer?',
        type: 'select',
        options: [
          { value: 'no', label: 'No' },
          { value: 'yes', label: 'Yes' },
        ],
      },
      {
        id: 'immunocompromised',
        label: 'Immunocompromised?',
        type: 'select',
        options: [
          { value: 'no', label: 'No' },
          { value: 'yes', label: 'Yes' },
        ],
      },
      {
        id: 'noduleType',
        label: 'Nodule type',
        type: 'select',
        options: [
          { value: 'solid', label: 'Solid' },
          { value: 'subsolid ground-glass', label: 'Subsolid ground-glass' },
          { value: 'part-solid', label: 'Part-solid' },
        ],
      },
      {
        id: 'numberOfNodules',
        label: 'Number of nodules',
        type: 'select',
        options: [
          { value: 'solitary', label: 'Solitary' },
          { value: 'multiple', label: 'Multiple' },
        ],
      },
      { id: 'sizeMm', label: 'Size (mm)', type: 'number' },
      { id: 'location', label: 'Location', type: 'text', placeholder: 'e.g. right upper lobe' },
      {
        id: 'morphology',
        label: 'Morphology',
        type: 'select',
        options: [
          { value: 'smooth', label: 'Smooth' },
          { value: 'irregular', label: 'Irregular' },
          { value: 'spiculated', label: 'Spiculated' },
          { value: 'calcified benign pattern', label: 'Calcified benign pattern' },
        ],
      },
      {
        id: 'patientRisk',
        label: 'Risk',
        type: 'select',
        options: [
          { value: 'low risk', label: 'Low risk' },
          { value: 'high risk', label: 'High risk' },
        ],
      },
    ],
    defaultValues: {
      patientAge: '',
      knownMalignancy: 'no',
      immunocompromised: 'no',
      noduleType: 'solid',
      numberOfNodules: 'solitary',
      sizeMm: '',
      location: '',
      morphology: 'smooth',
      patientRisk: 'low risk',
    },
    compute: computeFleischner,
  },
  {
    id: 'adrenal-washout',
    name: 'Adrenal washout calculator',
    modality: 'CT',
    bodySystem: 'Abdomen/Pelvis',
    status: 'implemented',
    description: 'Compute absolute and relative adrenal washout from HU measurements.',
    fields: [
      { id: 'noncontrastHu', label: 'Noncontrast HU', type: 'number' },
      { id: 'enhancedHu', label: 'Portal venous/enhanced HU', type: 'number' },
      { id: 'delayedHu', label: 'Delayed HU', type: 'number' },
    ],
    defaultValues: { noncontrastHu: '', enhancedHu: '', delayedHu: '' },
    compute: computeAdrenalWashout,
  },
  {
    id: 'bosniak',
    name: 'Simplified Bosniak renal cyst helper',
    modality: 'CT',
    bodySystem: 'GU',
    status: 'implemented',
    description: 'Structure renal cystic lesion features and generate a simplified Bosniak suggestion.',
    fields: [
      {
        id: 'simpleCyst',
        label: 'Simple cyst features?',
        type: 'select',
        options: [
          { value: 'no', label: 'No' },
          { value: 'yes', label: 'Yes' },
        ],
      },
      {
        id: 'septa',
        label: 'Septa',
        type: 'select',
        options: [
          { value: 'none', label: 'None' },
          { value: 'few', label: 'Few' },
          { value: 'multiple', label: 'Multiple' },
        ],
      },
      {
        id: 'thickening',
        label: 'Wall/septal thickening',
        type: 'select',
        options: [
          { value: 'none', label: 'None' },
          { value: 'thin', label: 'Thin' },
          { value: 'minimally thickened', label: 'Minimally thickened' },
          { value: 'thick irregular', label: 'Thick irregular' },
        ],
      },
      {
        id: 'calcification',
        label: 'Calcification',
        type: 'select',
        options: [
          { value: 'none', label: 'None' },
          { value: 'thin', label: 'Thin' },
          { value: 'thick/nodular', label: 'Thick/nodular' },
        ],
      },
      {
        id: 'enhancement',
        label: 'Enhancement',
        type: 'select',
        options: [
          { value: 'none', label: 'None' },
          { value: 'perceived', label: 'Perceived' },
          { value: 'measurable', label: 'Measurable' },
        ],
      },
      {
        id: 'nodularComponent',
        label: 'Nodular enhancing component?',
        type: 'select',
        options: [
          { value: 'no', label: 'No' },
          { value: 'yes', label: 'Yes' },
        ],
      },
    ],
    defaultValues: {
      simpleCyst: 'no',
      septa: 'none',
      thickening: 'none',
      calcification: 'none',
      enhancement: 'none',
      nodularComponent: 'no',
    },
    compute: computeBosniak,
  },
  {
    id: 'tirads',
    name: 'Simplified TI-RADS thyroid nodule helper',
    modality: 'Ultrasound',
    bodySystem: 'Neuro',
    status: 'implemented',
    description: 'ACR TI-RADS-style point interface with report-ready category language.',
    fields: [
      {
        id: 'composition',
        label: 'Composition',
        type: 'select',
        options: [
          { value: 'cystic', label: 'Cystic/almost completely cystic' },
          { value: 'spongiform', label: 'Spongiform' },
          { value: 'mixed', label: 'Mixed cystic and solid' },
          { value: 'solid', label: 'Solid/almost completely solid' },
        ],
      },
      {
        id: 'echogenicity',
        label: 'Echogenicity',
        type: 'select',
        options: [
          { value: 'anechoic', label: 'Anechoic' },
          { value: 'iso_hyperechoic', label: 'Iso/hyperechoic' },
          { value: 'hypoechoic', label: 'Hypoechoic' },
          { value: 'very_hypoechoic', label: 'Very hypoechoic' },
        ],
      },
      {
        id: 'shape',
        label: 'Shape',
        type: 'select',
        options: [
          { value: 'wider_than_tall', label: 'Wider-than-tall' },
          { value: 'taller_than_wide', label: 'Taller-than-wide' },
        ],
      },
      {
        id: 'margin',
        label: 'Margin',
        type: 'select',
        options: [
          { value: 'smooth', label: 'Smooth' },
          { value: 'ill_defined', label: 'Ill-defined' },
          { value: 'lobulated_irregular', label: 'Lobulated/irregular' },
          { value: 'extrathyroidal_extension', label: 'Extrathyroidal extension' },
        ],
      },
      {
        id: 'echogenicFoci',
        label: 'Echogenic foci',
        type: 'select',
        options: [
          { value: 'none', label: 'None' },
          { value: 'comet_tail', label: 'Comet-tail artifact' },
          { value: 'macrocalcifications', label: 'Macrocalcifications' },
          { value: 'peripheral_calcifications', label: 'Peripheral calcifications' },
          { value: 'punctate_foci', label: 'Punctate echogenic foci' },
        ],
      },
      { id: 'sizeCm', label: 'Size (cm)', type: 'number' },
    ],
    defaultValues: {
      composition: 'solid',
      echogenicity: 'hypoechoic',
      shape: 'wider_than_tall',
      margin: 'smooth',
      echogenicFoci: 'none',
      sizeCm: '',
    },
    compute: computeTirads,
  },
  {
    id: 'recist',
    name: 'RECIST 1.1 measurement tracker',
    modality: 'Multimodality',
    bodySystem: 'Oncology',
    status: 'implemented',
    description: 'Track up to five target lesion measurements and generate a simplified response category.',
    fields: [{ id: 'lesions', label: 'Target lesions', type: 'lesion-tracker' }],
    defaultValues: {},
    compute: computeRecist,
  },
  {
    id: 'birads',
    name: 'BI-RADS preview helper',
    modality: 'Mammography',
    bodySystem: 'Breast',
    status: 'partial',
    description: 'Clickable breast imaging descriptor helper that suggests a non-final BI-RADS placeholder category.',
    fields: [
      {
        id: 'modality',
        label: 'Modality',
        type: 'select',
        options: [
          { value: 'mammography', label: 'Mammography' },
          { value: 'ultrasound', label: 'Ultrasound' },
          { value: 'MRI', label: 'MRI' },
        ],
      },
      {
        id: 'findingType',
        label: 'Finding type',
        type: 'select',
        options: [
          { value: 'none', label: 'No finding' },
          { value: 'mass', label: 'Mass' },
          { value: 'calcifications', label: 'Calcifications' },
          { value: 'asymmetry', label: 'Asymmetry' },
          { value: 'architectural distortion', label: 'Architectural distortion' },
          { value: 'non-mass enhancement', label: 'Non-mass enhancement' },
        ],
      },
      { id: 'location', label: 'Laterality/location', type: 'text', placeholder: 'e.g. right upper outer breast' },
      { id: 'size', label: 'Size', type: 'text', placeholder: 'e.g. 12 mm' },
      {
        id: 'shape',
        label: 'Shape',
        type: 'select',
        options: [
          { value: 'round', label: 'Round' },
          { value: 'oval', label: 'Oval' },
          { value: 'irregular', label: 'Irregular' },
        ],
      },
      {
        id: 'margin',
        label: 'Margin',
        type: 'select',
        options: [
          { value: 'circumscribed', label: 'Circumscribed' },
          { value: 'obscured', label: 'Obscured' },
          { value: 'microlobulated', label: 'Microlobulated' },
          { value: 'indistinct', label: 'Indistinct' },
          { value: 'spiculated', label: 'Spiculated' },
        ],
      },
      {
        id: 'comparison',
        label: 'Comparison',
        type: 'select',
        options: [
          { value: 'no prior', label: 'No prior' },
          { value: 'new', label: 'New' },
          { value: 'stable', label: 'Stable' },
          { value: 'decreased', label: 'Decreased' },
          { value: 'increased', label: 'Increased' },
        ],
      },
      {
        id: 'suspiciousFeatures',
        label: 'Suspicious associated features?',
        type: 'select',
        options: [
          { value: 'no', label: 'No' },
          { value: 'yes', label: 'Yes' },
        ],
      },
      {
        id: 'knownMalignancy',
        label: 'Known biopsy-proven malignancy?',
        type: 'select',
        options: [
          { value: 'no', label: 'No' },
          { value: 'yes', label: 'Yes' },
        ],
      },
      {
        id: 'needsAdditionalImaging',
        label: 'Needs additional imaging?',
        type: 'select',
        options: [
          { value: 'no', label: 'No' },
          { value: 'yes', label: 'Yes' },
        ],
      },
    ],
    defaultValues: {
      modality: 'mammography',
      findingType: 'mass',
      location: '',
      size: '',
      shape: 'oval',
      margin: 'circumscribed',
      comparison: 'no prior',
      suspiciousFeatures: 'no',
      knownMalignancy: 'no',
      needsAdditionalImaging: 'no',
    },
    compute: computeBirads,
  },
  {
    id: 'orads',
    name: 'O-RADS interactive preview helper',
    modality: 'Ultrasound',
    bodySystem: 'GU',
    status: 'partial',
    description: 'Prototype adnexal lesion category helper from user-entered morphology and vascularity.',
    fields: [
      {
        id: 'menopausalStatus',
        label: 'Menopausal status',
        type: 'select',
        options: [
          { value: 'premenopausal', label: 'Premenopausal' },
          { value: 'postmenopausal', label: 'Postmenopausal' },
          { value: 'unknown', label: 'Unknown' },
        ],
      },
      {
        id: 'lesionType',
        label: 'Lesion type',
        type: 'select',
        options: [
          { value: 'simple cyst', label: 'Simple cyst' },
          { value: 'hemorrhagic cyst', label: 'Hemorrhagic cyst' },
          { value: 'endometrioma', label: 'Endometrioma' },
          { value: 'dermoid', label: 'Dermoid' },
          { value: 'multilocular cyst', label: 'Multilocular cyst' },
          { value: 'solid lesion', label: 'Solid lesion' },
          { value: 'cyst with solid component', label: 'Cyst with solid component' },
        ],
      },
      { id: 'sizeCm', label: 'Size (cm)', type: 'number' },
      {
        id: 'papillaryProjections',
        label: 'Papillary projections',
        type: 'select',
        options: [
          { value: 'none', label: 'None' },
          { value: '1-3', label: '1-3' },
          { value: '>=4', label: '>=4' },
        ],
      },
      {
        id: 'solidComponent',
        label: 'Solid component?',
        type: 'select',
        options: [
          { value: 'no', label: 'No' },
          { value: 'yes', label: 'Yes' },
        ],
      },
      {
        id: 'vascularity',
        label: 'Vascularity',
        type: 'select',
        options: [
          { value: 'none', label: 'None' },
          { value: 'minimal', label: 'Minimal' },
          { value: 'moderate', label: 'Moderate' },
          { value: 'strong', label: 'Strong' },
        ],
      },
      {
        id: 'ascitesPeritoneal',
        label: 'Ascites/peritoneal nodularity?',
        type: 'select',
        options: [
          { value: 'no', label: 'No' },
          { value: 'yes', label: 'Yes' },
        ],
      },
    ],
    defaultValues: {
      menopausalStatus: 'unknown',
      lesionType: 'simple cyst',
      sizeCm: '',
      papillaryProjections: 'none',
      solidComponent: 'no',
      vascularity: 'none',
      ascitesPeritoneal: 'no',
    },
    compute: computeOrads,
  },
  {
    id: 'pirads',
    name: 'PI-RADS interactive preview helper',
    modality: 'MRI',
    bodySystem: 'GU',
    status: 'partial',
    description: 'Prototype prostate MRI category helper emphasizing dominant sequence concepts.',
    fields: [
      {
        id: 'zone',
        label: 'Zone',
        type: 'select',
        options: [
          { value: 'peripheral', label: 'Peripheral' },
          { value: 'transition', label: 'Transition' },
        ],
      },
      { id: 'size', label: 'Lesion size', type: 'text', placeholder: 'e.g. 1.4 cm' },
      {
        id: 'dwiScore',
        label: 'DWI score',
        type: 'select',
        options: ['1', '2', '3', '4', '5'].map((score) => ({ value: score, label: score })),
      },
      {
        id: 't2Score',
        label: 'T2 score',
        type: 'select',
        options: ['1', '2', '3', '4', '5'].map((score) => ({ value: score, label: score })),
      },
      {
        id: 'dce',
        label: 'DCE',
        type: 'select',
        options: [
          { value: 'negative', label: 'Negative' },
          { value: 'positive', label: 'Positive' },
        ],
      },
      {
        id: 'epe',
        label: 'EPE suspicion?',
        type: 'select',
        options: [
          { value: 'no', label: 'No' },
          { value: 'yes', label: 'Yes' },
        ],
      },
    ],
    defaultValues: { zone: 'peripheral', size: '', dwiScore: '3', t2Score: '3', dce: 'negative', epe: 'no' },
    compute: computePirads,
  },
  {
    id: 'lirads',
    name: 'LI-RADS interactive preview helper',
    modality: 'MRI',
    bodySystem: 'Abdomen/Pelvis',
    status: 'partial',
    description: 'Prototype liver observation helper with HCC-risk applicability warning.',
    fields: [
      {
        id: 'hccRisk',
        label: 'Appropriate HCC-risk population?',
        type: 'select',
        options: [
          { value: 'no', label: 'No' },
          { value: 'yes', label: 'Yes' },
        ],
      },
      { id: 'segment', label: 'Segment', type: 'text', placeholder: 'e.g. 8' },
      { id: 'sizeMm', label: 'Observation size (mm)', type: 'number' },
      ...['aphe', 'washout', 'capsule', 'thresholdGrowth', 'tumorInVein', 'malignantNotHcc'].map((id) => ({
        id,
        label:
          id === 'aphe'
            ? 'Arterial phase hyperenhancement?'
            : id === 'washout'
              ? 'Nonperipheral washout?'
              : id === 'capsule'
                ? 'Enhancing capsule?'
                : id === 'thresholdGrowth'
                  ? 'Threshold growth?'
                  : id === 'tumorInVein'
                    ? 'Tumor in vein?'
                    : 'Probably malignant, not HCC-specific?',
        type: 'select' as const,
        options: [
          { value: 'no', label: 'No' },
          { value: 'yes', label: 'Yes' },
        ],
      })),
    ],
    defaultValues: {
      hccRisk: 'yes',
      segment: '',
      sizeMm: '',
      aphe: 'no',
      washout: 'no',
      capsule: 'no',
      thresholdGrowth: 'no',
      tumorInVein: 'no',
      malignantNotHcc: 'no',
    },
    compute: computeLirads,
  },
  {
    id: 'bonerads',
    name: 'Bone-RADS interactive preview helper',
    modality: 'MRI',
    bodySystem: 'MSK',
    status: 'partial',
    description: 'Prototype incidental solitary bone lesion management bucket helper.',
    fields: [
      {
        id: 'modality',
        label: 'Modality',
        type: 'select',
        options: [
          { value: 'CT', label: 'CT' },
          { value: 'MRI', label: 'MRI' },
        ],
      },
      { id: 'location', label: 'Lesion location', type: 'text', placeholder: 'e.g. right iliac bone' },
      {
        id: 'pain',
        label: 'Pain attributable to lesion?',
        type: 'select',
        options: [
          { value: 'no', label: 'No' },
          { value: 'yes', label: 'Yes' },
        ],
      },
      {
        id: 'knownMalignancy',
        label: 'Known malignancy?',
        type: 'select',
        options: [
          { value: 'no', label: 'No' },
          { value: 'yes', label: 'Yes' },
        ],
      },
      {
        id: 'aggressiveFeatures',
        label: 'Aggressive features',
        type: 'checkbox-group',
        options: ['cortical destruction', 'soft tissue mass', 'pathologic fracture', 'aggressive periosteal reaction'].map((item) => ({
          value: item,
          label: item,
        })),
      },
      {
        id: 'benignFeatures',
        label: 'Clearly benign features',
        type: 'checkbox-group',
        options: ['internal fat', 'classic bone island', 'nonaggressive cystic lesion'].map((item) => ({ value: item, label: item })),
      },
      {
        id: 'priorStability',
        label: 'Prior stability',
        type: 'select',
        options: [
          { value: 'unknown', label: 'Unknown' },
          { value: 'stable', label: 'Stable' },
          { value: 'new/increased', label: 'New/increased' },
        ],
      },
    ],
    defaultValues: {
      modality: 'CT',
      location: '',
      pain: 'no',
      knownMalignancy: 'no',
      aggressiveFeatures: [],
      benignFeatures: [],
      priorStability: 'unknown',
    },
    compute: computeBoneRads,
  },
  {
    id: 'cadrads',
    name: 'CAD-RADS interactive preview helper',
    modality: 'CT',
    bodySystem: 'Vascular',
    status: 'partial',
    description: 'Prototype coronary CTA category and modifier helper.',
    fields: [
      {
        id: 'maxStenosis',
        label: 'Max stenosis',
        type: 'select',
        options: ['none', '1-24%', '25-49%', '50-69%', '70-99%', 'occluded'].map((item) => ({ value: item, label: item })),
      },
      { id: 'vessel', label: 'Vessel/segment', type: 'text', placeholder: 'e.g. proximal LAD' },
      ...['highRiskPlaque', 'stent', 'cabg', 'nondiagnostic'].map((id) => ({
        id,
        label:
          id === 'highRiskPlaque'
            ? 'High-risk plaque features?'
            : id === 'stent'
              ? 'Stent present?'
              : id === 'cabg'
                ? 'CABG present?'
                : 'Non-diagnostic segments?',
        type: 'select' as const,
        options: [
          { value: 'no', label: 'No' },
          { value: 'yes', label: 'Yes' },
        ],
      })),
    ],
    defaultValues: { maxStenosis: 'none', vessel: '', highRiskPlaque: 'no', stent: 'no', cabg: 'no', nondiagnostic: 'no' },
    compute: computeCadRads,
  },
  {
    id: 'lungrads',
    name: 'Lung-RADS interactive preview helper',
    modality: 'CT',
    bodySystem: 'Chest',
    status: 'partial',
    description: 'Prototype lung cancer screening nodule category helper with screening-context warning.',
    fields: [
      {
        id: 'screeningContext',
        label: 'Lung cancer screening CT?',
        type: 'select',
        options: [
          { value: 'yes', label: 'Yes' },
          { value: 'no', label: 'No' },
        ],
      },
      {
        id: 'screeningRound',
        label: 'Screening round',
        type: 'select',
        options: [
          { value: 'baseline', label: 'Baseline' },
          { value: 'annual', label: 'Annual' },
          { value: 'follow-up', label: 'Follow-up' },
        ],
      },
      {
        id: 'noduleType',
        label: 'Nodule type',
        type: 'select',
        options: [
          { value: 'solid', label: 'Solid' },
          { value: 'part-solid', label: 'Part-solid' },
          { value: 'ground-glass', label: 'Ground-glass' },
        ],
      },
      { id: 'sizeMm', label: 'Size (mm)', type: 'number' },
      ...['growth', 'newNodule', 'suspiciousFeatures'].map((id) => ({
        id,
        label:
          id === 'growth'
            ? 'Growth?'
            : id === 'newNodule'
              ? 'New nodule?'
              : 'Suspicious features?',
        type: 'select' as const,
        options: [
          { value: 'no', label: 'No' },
          { value: 'yes', label: 'Yes' },
        ],
      })),
    ],
    defaultValues: {
      screeningContext: 'yes',
      screeningRound: 'baseline',
      noduleType: 'solid',
      sizeMm: '',
      growth: 'no',
      newNodule: 'no',
      suspiciousFeatures: 'no',
    },
    compute: computeLungRads,
  },
  {
    id: 'nirads',
    name: 'NI-RADS partial surveillance helper',
    modality: 'MRI',
    bodySystem: 'Oncology',
    status: 'partial',
    description: 'Prototype head and neck post-treatment surveillance helper.',
    fields: [
      {
        id: 'surveillance',
        label: 'Post-treatment surveillance context?',
        type: 'select',
        options: [
          { value: 'yes', label: 'Yes' },
          { value: 'no', label: 'No/unclear' },
        ],
      },
      ...[
        ['primaryConcern', 'Primary site concern?'],
        ['neckNodes', 'Suspicious neck nodes?'],
        ['fdgUptake', 'FDG uptake?'],
        ['suspiciousMass', 'Suspicious mass/enhancement?'],
      ].map(([id, label]) => ({
        id,
        label,
        type: 'select' as const,
        options: [
          { value: 'no', label: 'No' },
          { value: 'yes', label: 'Yes' },
        ],
      })),
    ],
    defaultValues: {
      surveillance: 'yes',
      primaryConcern: 'no',
      neckNodes: 'no',
      fdgUptake: 'no',
      suspiciousMass: 'no',
    },
    compute: computeNiRads,
  },
  {
    id: 'virads',
    name: 'VI-RADS partial helper',
    modality: 'MRI',
    bodySystem: 'GU',
    status: 'partial',
    description: 'Prototype bladder MRI muscle invasion likelihood helper.',
    fields: [
      ...['t2Category', 'dwiCategory', 'dceCategory'].map((id) => ({
        id,
        label: id === 't2Category' ? 'T2 category' : id === 'dwiCategory' ? 'DWI category' : 'DCE category',
        type: 'select' as const,
        options: ['1', '2', '3', '4', '5'].map((score) => ({ value: score, label: score })),
      })),
      {
        id: 'muscleInvasion',
        label: 'Muscle invasion suspected?',
        type: 'select',
        options: [
          { value: 'no', label: 'No' },
          { value: 'yes', label: 'Yes' },
        ],
      },
    ],
    defaultValues: { t2Category: '2', dwiCategory: '2', dceCategory: '2', muscleInvasion: 'no' },
    compute: computeViRads,
  },
  ...[
    ['renal-mass', 'Renal mass characterization', 'Multimodality', 'GU', 'Renal mass descriptor and management language.'],
    [
      'incidental-lesions',
      'Incidental adrenal/thyroid/liver/renal lesion follow-up',
      'Multimodality',
      'Multisystem',
      'Cross-sectional incidental finding follow-up support.',
    ],
  ].map(([id, name, modality, bodySystem, description]) => ({
    id,
    name,
    modality: modality as CalculatorDefinition['modality'],
    bodySystem: bodySystem as CalculatorDefinition['bodySystem'],
    status: 'placeholder' as const,
    description,
    fields: [],
  })),
];
