import type { InsertTarget, ModuleType, ReferralOption } from '../radrep/types';

export type WorkflowFieldType = 'text' | 'textarea' | 'number' | 'select';
export type WorkflowValue = string | string[];
export type WorkflowValues = Record<string, WorkflowValue>;

export interface WorkflowField {
  id: string;
  label: string;
  type: WorkflowFieldType;
  placeholder?: string;
  options?: ReferralOption[];
  wide?: boolean;
  suffix?: string;
}

export interface WorkflowSection {
  id: string;
  title: string;
  description?: string;
  defaultOpen?: boolean;
  fields: WorkflowField[];
}

export interface WorkflowQuickFill {
  id: string;
  label: string;
  description: string;
  values: WorkflowValues;
  intent?: 'normal' | 'positive' | 'complicated' | 'negative';
}

export interface WorkflowIncidentalOption {
  label: string;
  sentence: string;
}

export interface ReportingWorkflowSchema {
  moduleType: ModuleType;
  moduleId: string;
  title: string;
  shortTitle: string;
  modality: string;
  bodySystem: string;
  clinicalQuestion: string;
  techniqueDefault: string;
  defaultValues: WorkflowValues;
  sections: WorkflowSection[];
  keyNegatives: string[];
  incidentalOptions: WorkflowIncidentalOption[];
  quickFills: WorkflowQuickFill[];
  badges: string[];
  insertTargets: InsertTarget[];
  safetyNote: string;
}

const yesNoUnknown = [
  { value: 'unknown', label: 'Unknown' },
  { value: 'no', label: 'No' },
  { value: 'yes', label: 'Yes' },
];

const yesNo = [
  { value: 'no', label: 'No' },
  { value: 'yes', label: 'Yes' },
];

const absentPresentUnknown = [
  { value: 'unknown', label: 'Unknown' },
  { value: 'absent', label: 'Absent' },
  { value: 'present', label: 'Present' },
];

const notSpecifiedOptions = [
  { value: 'not specified', label: 'Not specified' },
];

const cxrStudyQualityOptions = [
  ...notSpecifiedOptions,
  { value: 'adequate', label: 'Adequate' },
  { value: 'low volume film', label: 'Low volume film' },
  { value: 'rotated', label: 'Rotated' },
  { value: 'portable/AP technique', label: 'Portable/AP technique' },
  { value: 'limited study', label: 'Limited study' },
];

const cxrCardiomediastinalOptions = [
  ...notSpecifiedOptions,
  { value: 'normal', label: 'Normal' },
  { value: 'mildly enlarged', label: 'Mildly enlarged' },
  { value: 'enlarged', label: 'Enlarged' },
  { value: 'postoperative/device-related findings', label: 'Postoperative/device-related findings' },
];

const cxrLungVolumeOptions = [
  ...notSpecifiedOptions,
  { value: 'normal', label: 'Normal' },
  { value: 'low volume', label: 'Low volume' },
  { value: 'hyperinflated', label: 'Hyperinflated' },
];

const cxrConsolidationOptions = [
  ...notSpecifiedOptions,
  { value: 'none', label: 'None' },
  { value: 'focal consolidation', label: 'Focal consolidation' },
  { value: 'multifocal consolidation', label: 'Multifocal consolidation' },
  { value: 'bibasal opacity/atelectatic change', label: 'Bibasal opacity/atelectatic change' },
];

const cxrEdemaOptions = [
  ...notSpecifiedOptions,
  { value: 'absent', label: 'Absent' },
  { value: 'mild', label: 'Mild' },
  { value: 'moderate/severe', label: 'Moderate/severe' },
];

const cxrEffusionOptions = [
  ...notSpecifiedOptions,
  { value: 'none', label: 'None' },
  { value: 'small unilateral', label: 'Small unilateral' },
  { value: 'small bilateral', label: 'Small bilateral' },
  { value: 'moderate/large', label: 'Moderate/large' },
];

const cxrPneumothoraxOptions = [
  ...notSpecifiedOptions,
  { value: 'none', label: 'None' },
  { value: 'present', label: 'Present' },
];

const lateralityOptions = [
  ...notSpecifiedOptions,
  { value: 'right', label: 'Right' },
  { value: 'left', label: 'Left' },
  { value: 'bilateral', label: 'Bilateral' },
  { value: 'midline/not applicable', label: 'Midline/not applicable' },
];

const fractureOptions = [
  ...notSpecifiedOptions,
  { value: 'no acute fracture identified', label: 'No acute fracture identified' },
  { value: 'acute fracture present', label: 'Acute fracture present' },
  { value: 'age-indeterminate fracture', label: 'Age-indeterminate fracture' },
  { value: 'healing/subacute fracture', label: 'Healing/subacute fracture' },
];

const displacementOptions = [
  ...notSpecifiedOptions,
  { value: 'non-displaced', label: 'Non-displaced' },
  { value: 'minimally displaced', label: 'Minimally displaced' },
  { value: 'displaced', label: 'Displaced' },
  { value: 'angulated', label: 'Angulated' },
  { value: 'comminuted', label: 'Comminuted' },
];

const intraArticularOptions = [
  ...notSpecifiedOptions,
  { value: 'absent', label: 'Absent' },
  { value: 'present', label: 'Present' },
  { value: 'cannot assess', label: 'Cannot assess' },
];

const jointAlignmentOptions = [
  ...notSpecifiedOptions,
  { value: 'normal alignment', label: 'Normal alignment' },
  { value: 'subluxation', label: 'Subluxation' },
  { value: 'dislocation', label: 'Dislocation' },
  { value: 'reduced dislocation', label: 'Reduced dislocation' },
];

const softTissueOptions = [
  ...notSpecifiedOptions,
  { value: 'none', label: 'None' },
  { value: 'soft tissue swelling', label: 'Soft tissue swelling' },
  { value: 'joint effusion', label: 'Joint effusion' },
  { value: 'both swelling and effusion', label: 'Both swelling and effusion' },
];

function text(id: string, label: string, placeholder?: string, wide = false): WorkflowField {
  return { id, label, type: 'text', placeholder, wide };
}

function area(id: string, label: string, placeholder?: string): WorkflowField {
  return { id, label, type: 'textarea', placeholder, wide: true };
}

function number(id: string, label: string, suffix?: string): WorkflowField {
  return { id, label, type: 'number', suffix };
}

function select(id: string, label: string, options: ReferralOption[]): WorkflowField {
  return { id, label, type: 'select', options };
}

function yn(id: string, label: string): WorkflowField {
  return select(id, label, yesNo);
}

function ynu(id: string, label: string): WorkflowField {
  return select(id, label, yesNoUnknown);
}

const incidentalAbdomen = [
  { label: 'Adrenal nodule', sentence: 'Incidental adrenal nodule. Consider adrenal protocol CT/MRI or comparison with prior imaging if not previously characterized, as clinically appropriate.' },
  { label: 'Renal cyst/mass', sentence: 'Incidental renal lesion. Consider renal protocol characterization if indeterminate and not previously evaluated.' },
  { label: 'Liver lesion', sentence: 'Incidental liver lesion. Follow-up depends on imaging features, risk factors, and prior stability.' },
  { label: 'Pancreatic cyst', sentence: 'Incidental pancreatic cystic lesion. Consider MRI/MRCP surveillance based on size, age, and local guideline after verification.' },
  { label: 'Adnexal cyst', sentence: 'Incidental adnexal cyst. Follow-up depends on size, complexity, symptoms, and menopausal status.' },
  { label: 'Aortic aneurysm', sentence: 'Aortic aneurysm. Recommend comparison with prior imaging and follow-up/referral according to size, growth rate, symptoms, and local vascular protocol.' },
  { label: 'Pulmonary nodule at lung bases', sentence: 'Incidental pulmonary nodule at the lung bases. Follow-up depends on nodule type, size, risk, and guideline applicability.' },
  { label: 'Bone lesion', sentence: 'Incidental bone lesion. Consider comparison with prior imaging or dedicated characterization if aggressive features, pain, or malignancy history are present.' },
];

const incidentalDvt = [
  { label: 'Baker cyst/popliteal fossa collection', sentence: 'Popliteal fossa fluid collection/Baker cyst. Follow-up depends on symptoms, complexity, and clinical concern.' },
  { label: 'Soft tissue edema/fluid collection', sentence: 'Soft tissue edema/fluid collection is present. Correlate clinically; consider follow-up imaging if symptoms persist or infection/hematoma is a concern.' },
];

const prototypeSafety =
  'Prototype reporting workflow only. RadRepPilot organizes user-entered findings and does not interpret images or diagnose. Verify all source imaging findings, measurements, complications, guideline applicability, and final wording.';

export const reportingWorkflowSchemas: Record<
  'chestXray' | 'mskXrayFracture' | 'appendicitis' | 'bowelObstruction' | 'renalColic' | 'ruqUltrasound' | 'dvtUltrasound',
  ReportingWorkflowSchema
> = {
  chestXray: {
    moduleType: 'chestXray',
    moduleId: 'xray-cxr-infection-dyspnea',
    title: 'Chest X-ray: Infection / Dyspnea',
    shortTitle: 'CXR infection/dyspnea',
    modality: 'X-ray',
    bodySystem: 'Chest',
    clinicalQuestion: 'Assess for acute cardiopulmonary abnormality.',
    techniqueDefault: 'Chest radiographs obtained.',
    badges: ['Implemented', 'Prototype', 'Primary care / ED'],
    insertTargets: ['findings', 'impression', 'recommendations'],
    safetyNote: prototypeSafety,
    defaultValues: {
      indication: '',
      technique: 'Chest radiographs obtained.',
      studyQuality: 'not specified',
      cardiomediastinalSilhouette: 'not specified',
      lungVolumes: 'not specified',
      consolidation: 'not specified',
      consolidationLocation: '',
      interstitialEdema: 'not specified',
      pleuralEffusion: 'not specified',
      pleuralEffusionLocation: '',
      pneumothorax: 'not specified',
      pneumothoraxSideSize: '',
      linesTubesDevices: '',
      incidentalFindings: '',
      additionalFindings: '',
      limitationsUncertainty: '',
    },
    sections: [
      {
        id: 'context',
        title: 'Clinical context',
        defaultOpen: true,
        fields: [
          area('indication', 'Indication', 'Cough, fever, dyspnea, hypoxia, chest pain, or follow-up question'),
          text('technique', 'Technique', 'Chest radiographs obtained.', true),
        ],
      },
      {
        id: 'image-quality',
        title: 'Study quality and overview',
        description: 'Keep this high-level and radiograph-focused.',
        fields: [
          select('studyQuality', 'Study quality', cxrStudyQualityOptions),
          select('cardiomediastinalSilhouette', 'Cardiomediastinal silhouette', cxrCardiomediastinalOptions),
          select('lungVolumes', 'Lung volumes', cxrLungVolumeOptions),
        ],
      },
      {
        id: 'lungs-pleura',
        title: 'Lungs and pleura',
        description: 'Enter only findings verified by the user/radiologist.',
        fields: [
          select('consolidation', 'Consolidation', cxrConsolidationOptions),
          text('consolidationLocation', 'Consolidation location if present', 'e.g. right lower lobe, left perihilar, multifocal', true),
          select('interstitialEdema', 'Interstitial edema', cxrEdemaOptions),
          select('pleuralEffusion', 'Pleural effusion', cxrEffusionOptions),
          text('pleuralEffusionLocation', 'Effusion side/location if present', 'e.g. small right pleural effusion', true),
          select('pneumothorax', 'Pneumothorax', cxrPneumothoraxOptions),
          text('pneumothoraxSideSize', 'Pneumothorax side/size if present', 'e.g. small left apical pneumothorax', true),
          area('linesTubesDevices', 'Lines/tubes/devices', 'e.g. right IJ central line tip overlies the SVC; left chest wall pacemaker'),
        ],
      },
    ],
    keyNegatives: ['No focal consolidation', 'No pleural effusion', 'No pneumothorax', 'No pulmonary edema'],
    incidentalOptions: [
      { label: 'Pulmonary nodule', sentence: 'Possible pulmonary nodule. Consider comparison with prior imaging or dedicated follow-up according to size, risk, and local protocol.' },
      { label: 'Aortic atherosclerosis/tortuosity', sentence: 'Aortic atherosclerotic/tortuous change is noted. Correlate with clinical cardiovascular risk context.' },
      { label: 'Hiatal hernia', sentence: 'Hiatal hernia is noted.' },
    ],
    quickFills: [
      {
        id: 'normal',
        label: 'No acute cardiopulmonary abnormality',
        description: 'Normal silhouette with no consolidation, edema, effusion, or pneumothorax.',
        intent: 'normal',
        values: {
          studyQuality: 'adequate',
          cardiomediastinalSilhouette: 'normal',
          lungVolumes: 'normal',
          consolidation: 'none',
          consolidationLocation: '',
          interstitialEdema: 'absent',
          pleuralEffusion: 'none',
          pleuralEffusionLocation: '',
          pneumothorax: 'none',
          pneumothoraxSideSize: '',
        },
      },
      {
        id: 'focal-pneumonia',
        label: 'Focal consolidation / pneumonia pattern',
        description: 'Focal airspace consolidation with no pleural complication entered.',
        intent: 'positive',
        values: {
          studyQuality: 'adequate',
          cardiomediastinalSilhouette: 'normal',
          lungVolumes: 'normal',
          consolidation: 'focal consolidation',
          consolidationLocation: 'right lower lobe',
          interstitialEdema: 'absent',
          pleuralEffusion: 'none',
          pneumothorax: 'none',
        },
      },
      {
        id: 'edema',
        label: 'Pulmonary edema pattern',
        description: 'Interstitial edema with bilateral effusions.',
        intent: 'positive',
        values: {
          cardiomediastinalSilhouette: 'enlarged',
          interstitialEdema: 'mild',
          pleuralEffusion: 'small bilateral',
          pleuralEffusionLocation: 'small bilateral pleural effusions',
          consolidation: 'none',
          pneumothorax: 'none',
        },
      },
      {
        id: 'pneumothorax',
        label: 'Pneumothorax present',
        description: 'Pneumothorax clearly stated in findings and impression.',
        intent: 'complicated',
        values: {
          pneumothorax: 'present',
          pneumothoraxSideSize: 'small left apical pneumothorax',
          consolidation: 'none',
          pleuralEffusion: 'none',
          interstitialEdema: 'absent',
        },
      },
    ],
  },
  mskXrayFracture: {
    moduleType: 'mskXrayFracture',
    moduleId: 'xray-msk-acute-fracture',
    title: 'MSK X-ray: Acute Fracture',
    shortTitle: 'MSK fracture X-ray',
    modality: 'X-ray',
    bodySystem: 'MSK',
    clinicalQuestion: 'Assess for acute osseous injury or malalignment.',
    techniqueDefault: 'Radiographs obtained.',
    badges: ['Implemented', 'Prototype', 'Emergency / Primary care'],
    insertTargets: ['findings', 'impression', 'recommendations'],
    safetyNote: prototypeSafety,
    defaultValues: {
      indication: '',
      technique: 'Radiographs obtained.',
      bodyPart: '',
      laterality: 'not specified',
      fracture: 'not specified',
      fractureLocation: '',
      displacementAlignment: 'not specified',
      intraArticularExtension: 'not specified',
      jointAlignment: 'not specified',
      softTissueEffusion: 'not specified',
      chronicFindings: '',
      incidentalFindings: '',
      additionalFindings: '',
      limitationsUncertainty: '',
    },
    sections: [
      {
        id: 'context',
        title: 'Clinical context',
        defaultOpen: true,
        fields: [
          area('indication', 'Indication', 'Trauma, pain, swelling, fall, or focal bony tenderness'),
          text('technique', 'Technique', 'Radiographs obtained.', true),
        ],
      },
      {
        id: 'exam-overview',
        title: 'Exam overview',
        description: 'Define the body part and side before generating the draft.',
        fields: [
          text('bodyPart', 'Body part', 'e.g. wrist, ankle, knee, shoulder, hip, foot', true),
          select('laterality', 'Laterality', lateralityOptions),
        ],
      },
      {
        id: 'osseous-alignment',
        title: 'Osseous findings and alignment',
        description: 'Use radiograph-safe language and avoid overclaiming occult injury.',
        fields: [
          select('fracture', 'Fracture', fractureOptions),
          text('fractureLocation', 'Fracture location', 'e.g. distal radius metaphysis, lateral malleolus, fifth metatarsal base', true),
          select('displacementAlignment', 'Displacement/alignment', displacementOptions),
          select('intraArticularExtension', 'Intra-articular extension', intraArticularOptions),
          select('jointAlignment', 'Joint alignment/dislocation', jointAlignmentOptions),
          select('softTissueEffusion', 'Joint effusion / soft tissue swelling', softTissueOptions),
          area('chronicFindings', 'Degenerative/chronic findings', 'e.g. mild osteoarthrosis, chronic enthesopathy, old healed fracture deformity'),
        ],
      },
    ],
    keyNegatives: ['No acute fracture identified', 'Normal alignment', 'No dislocation'],
    incidentalOptions: [
      { label: 'Bone lesion', sentence: 'Incidental osseous lesion. Consider comparison with prior imaging or dedicated characterization if aggressive features, pain, or malignancy history are present.' },
      { label: 'Soft tissue calcification/foreign body', sentence: 'Soft tissue calcification/foreign body is noted. Correlate with clinical history and local symptoms.' },
      { label: 'Degenerative change', sentence: 'Degenerative change is present. Correlate with symptoms and clinical context.' },
    ],
    quickFills: [
      {
        id: 'no-fracture',
        label: 'No acute fracture',
        description: 'No acute osseous abnormality with normal alignment.',
        intent: 'normal',
        values: {
          fracture: 'no acute fracture identified',
          fractureLocation: '',
          displacementAlignment: 'not specified',
          intraArticularExtension: 'not specified',
          jointAlignment: 'normal alignment',
          softTissueEffusion: 'none',
        },
      },
      {
        id: 'nondisplaced-fracture',
        label: 'Non-displaced fracture',
        description: 'Acute fracture without displacement or intra-articular extension entered.',
        intent: 'positive',
        values: {
          fracture: 'acute fracture present',
          displacementAlignment: 'non-displaced',
          intraArticularExtension: 'absent',
          jointAlignment: 'normal alignment',
          softTissueEffusion: 'soft tissue swelling',
        },
      },
      {
        id: 'displaced-fracture',
        label: 'Displaced fracture',
        description: 'Acute displaced fracture with swelling.',
        intent: 'complicated',
        values: {
          fracture: 'acute fracture present',
          displacementAlignment: 'displaced',
          intraArticularExtension: 'not specified',
          jointAlignment: 'normal alignment',
          softTissueEffusion: 'soft tissue swelling',
        },
      },
      {
        id: 'dislocation',
        label: 'Dislocation / malalignment',
        description: 'No fracture selected, but joint malalignment is present.',
        intent: 'complicated',
        values: {
          fracture: 'not specified',
          jointAlignment: 'dislocation',
          softTissueEffusion: 'soft tissue swelling',
        },
      },
    ],
  },
  appendicitis: {
    moduleType: 'appendicitis',
    moduleId: 'ct-ap-appendicitis',
    title: 'CT Abdomen/Pelvis: Appendicitis',
    shortTitle: 'CT appendicitis',
    modality: 'CT',
    bodySystem: 'Abdomen/Pelvis',
    clinicalQuestion: 'Assess for appendicitis, complication, or alternative acute intra-abdominal pathology.',
    techniqueDefault: 'CT abdomen and pelvis performed with IV contrast, unless otherwise specified.',
    badges: ['Implemented', 'Prototype', 'Incidental support'],
    insertTargets: ['findings', 'impression', 'incidentalFindings', 'recommendations'],
    safetyNote: prototypeSafety,
    defaultValues: {
      indication: '',
      technique: 'CT abdomen and pelvis performed with IV contrast, unless otherwise specified.',
      painLocation: '',
      duration: '',
      fever: 'unknown',
      wbc: '',
      crp: '',
      pregnancyStatus: '',
      priorComparison: '',
      appendixVisualized: 'yes',
      appendixDiameterMm: '',
      wallThickeningEnhancement: 'no',
      fatStranding: 'none',
      appendicolith: 'no',
      periappendicealFluid: 'no',
      abscessPhlegmon: 'no',
      abscessSize: '',
      freeAirPerforation: 'no',
      obstructionIleus: 'no',
      cecalTerminalIlealInflammation: 'no',
      alternativeDiagnosis: '',
      keyNegatives: ['No periappendiceal abscess', 'No free air/perforation', 'No bowel obstruction'],
      incidentalFindings: '',
      additionalFindings: '',
      limitationsUncertainty: '',
    },
    sections: [
      {
        id: 'context',
        title: 'Clinical context',
        defaultOpen: true,
        fields: [
          area('indication', 'Indication', 'RLQ pain, fever, leukocytosis, concern for appendicitis'),
          text('painLocation', 'Pain location', 'Right lower quadrant'),
          text('duration', 'Symptom duration', '2 days'),
          ynu('fever', 'Fever'),
          text('wbc', 'WBC value'),
          text('crp', 'CRP value'),
          text('pregnancyStatus', 'Pregnancy status if relevant'),
          text('priorComparison', 'Prior comparison'),
        ],
      },
      {
        id: 'appendix',
        title: 'Appendix findings',
        defaultOpen: true,
        fields: [
          yn('appendixVisualized', 'Appendix visualized'),
          number('appendixDiameterMm', 'Appendix diameter', 'mm'),
          yn('wallThickeningEnhancement', 'Wall thickening/enhancement'),
          select('fatStranding', 'Periappendiceal fat stranding', [
            { value: 'none', label: 'None' },
            { value: 'mild', label: 'Mild' },
            { value: 'moderate', label: 'Moderate' },
            { value: 'severe', label: 'Severe' },
          ]),
          yn('appendicolith', 'Appendicolith'),
          yn('periappendicealFluid', 'Periappendiceal fluid'),
          yn('abscessPhlegmon', 'Abscess/phlegmon'),
          text('abscessSize', 'Abscess size'),
          yn('freeAirPerforation', 'Free air/perforation'),
          yn('obstructionIleus', 'Bowel obstruction/ileus'),
          yn('cecalTerminalIlealInflammation', 'Cecal/terminal ileal inflammation'),
          area('alternativeDiagnosis', 'Alternative diagnosis'),
        ],
      },
    ],
    keyNegatives: [
      'No periappendiceal abscess',
      'No free air/perforation',
      'No bowel obstruction',
      'No alternative acute intra-abdominal pathology',
    ],
    incidentalOptions: incidentalAbdomen,
    quickFills: [
      {
        id: 'normal',
        label: 'Normal appendix',
        description: 'Visualized normal caliber appendix without secondary signs.',
        intent: 'normal',
        values: {
          appendixVisualized: 'yes',
          appendixDiameterMm: '5',
          wallThickeningEnhancement: 'no',
          fatStranding: 'none',
          appendicolith: 'no',
          periappendicealFluid: 'no',
          abscessPhlegmon: 'no',
          freeAirPerforation: 'no',
          obstructionIleus: 'no',
          keyNegatives: ['No periappendiceal abscess', 'No free air/perforation', 'No bowel obstruction', 'No alternative acute intra-abdominal pathology'],
        },
      },
      {
        id: 'uncomplicated',
        label: 'Acute uncomplicated appendicitis',
        description: 'Enlarged inflamed appendix without abscess or perforation.',
        intent: 'positive',
        values: {
          appendixVisualized: 'yes',
          appendixDiameterMm: '10',
          wallThickeningEnhancement: 'yes',
          fatStranding: 'moderate',
          appendicolith: 'no',
          periappendicealFluid: 'no',
          abscessPhlegmon: 'no',
          freeAirPerforation: 'no',
          obstructionIleus: 'no',
          keyNegatives: ['No periappendiceal abscess', 'No free air/perforation', 'No bowel obstruction'],
        },
      },
      {
        id: 'abscess',
        label: 'Complicated appendicitis with abscess',
        description: 'Inflamed appendix with periappendiceal abscess/phlegmon.',
        intent: 'complicated',
        values: {
          appendixVisualized: 'yes',
          appendixDiameterMm: '12',
          wallThickeningEnhancement: 'yes',
          fatStranding: 'severe',
          periappendicealFluid: 'yes',
          abscessPhlegmon: 'yes',
          abscessSize: '3.0 cm',
          freeAirPerforation: 'no',
          keyNegatives: ['No free air/perforation'],
        },
      },
      {
        id: 'perforation',
        label: 'Complicated appendicitis with perforation',
        description: 'Inflamed appendix with free air/perforation.',
        intent: 'complicated',
        values: {
          appendixVisualized: 'yes',
          appendixDiameterMm: '12',
          wallThickeningEnhancement: 'yes',
          fatStranding: 'severe',
          periappendicealFluid: 'yes',
          abscessPhlegmon: 'no',
          freeAirPerforation: 'yes',
          keyNegatives: ['No bowel obstruction'],
        },
      },
      {
        id: 'not-visualized',
        label: 'Appendix not visualized, no secondary signs',
        description: 'Appendix not seen without RLQ inflammatory change.',
        intent: 'negative',
        values: {
          appendixVisualized: 'no',
          appendixDiameterMm: '',
          wallThickeningEnhancement: 'no',
          fatStranding: 'none',
          abscessPhlegmon: 'no',
          freeAirPerforation: 'no',
          obstructionIleus: 'no',
          keyNegatives: ['No periappendiceal abscess', 'No free air/perforation', 'No bowel obstruction'],
        },
      },
    ],
  },
  bowelObstruction: {
    moduleType: 'bowelObstruction',
    moduleId: 'ct-ap-bowel-obstruction',
    title: 'CT Abdomen/Pelvis: Bowel Obstruction',
    shortTitle: 'CT bowel obstruction',
    modality: 'CT',
    bodySystem: 'Abdomen/Pelvis',
    clinicalQuestion: 'Assess for bowel obstruction, transition point, cause, and complications.',
    techniqueDefault: 'CT abdomen and pelvis performed with IV contrast, unless otherwise specified.',
    badges: ['Implemented', 'Prototype', 'Surgical red flags'],
    insertTargets: ['findings', 'impression', 'incidentalFindings', 'recommendations'],
    safetyNote: prototypeSafety,
    defaultValues: {
      indication: '',
      technique: 'CT abdomen and pelvis performed with IV contrast, unless otherwise specified.',
      vomiting: 'unknown',
      distension: 'unknown',
      obstipation: 'unknown',
      priorSurgery: 'unknown',
      knownHernia: 'unknown',
      priorComparison: '',
      obstructionPresent: 'no',
      obstructionType: 'small bowel',
      degree: 'low-grade',
      transitionPoint: '',
      suspectedCause: 'adhesions',
      smallBowelDiameterCm: '',
      largeBowelDiameterCm: '',
      closedLoop: 'no',
      hypoenhancement: 'no',
      pneumatosis: 'no',
      portalVenousGas: 'no',
      mesentericEdema: 'no',
      freeFluid: 'none',
      freeAirPerforation: 'no',
      herniaLocation: '',
      alternativeDiagnosis: '',
      keyNegatives: ['No closed-loop obstruction', 'No CT evidence of ischemia', 'No pneumatosis', 'No portal venous gas', 'No free air/perforation'],
      incidentalFindings: '',
      additionalFindings: '',
      limitationsUncertainty: '',
    },
    sections: [
      {
        id: 'context',
        title: 'Clinical context',
        defaultOpen: true,
        fields: [
          area('indication', 'Indication', 'Vomiting, abdominal distension, concern for obstruction'),
          ynu('vomiting', 'Vomiting'),
          ynu('distension', 'Abdominal distension'),
          ynu('obstipation', 'Obstipation/no flatus'),
          ynu('priorSurgery', 'Prior abdominal surgery'),
          ynu('knownHernia', 'Known hernia'),
          text('priorComparison', 'Prior comparison'),
        ],
      },
      {
        id: 'obstruction',
        title: 'Obstruction findings',
        defaultOpen: true,
        fields: [
          select('obstructionPresent', 'Obstruction present', [
            { value: 'no', label: 'No' },
            { value: 'partial', label: 'Partial' },
            { value: 'yes', label: 'Yes' },
            { value: 'indeterminate', label: 'Indeterminate' },
          ]),
          select('obstructionType', 'Type', [
            { value: 'small bowel', label: 'Small bowel' },
            { value: 'large bowel', label: 'Large bowel' },
            { value: 'both', label: 'Both' },
          ]),
          select('degree', 'Degree', [
            { value: 'low-grade', label: 'Low-grade' },
            { value: 'high-grade', label: 'High-grade' },
          ]),
          text('transitionPoint', 'Transition point'),
          select('suspectedCause', 'Suspected cause', [
            { value: 'adhesions', label: 'Adhesions' },
            { value: 'hernia', label: 'Hernia' },
            { value: 'mass', label: 'Mass' },
            { value: 'volvulus', label: 'Volvulus' },
            { value: 'stricture', label: 'Stricture' },
            { value: 'inflammatory', label: 'Inflammatory' },
            { value: 'other', label: 'Other' },
          ]),
          number('smallBowelDiameterCm', 'Max small bowel diameter', 'cm'),
          number('largeBowelDiameterCm', 'Max large bowel diameter', 'cm'),
          yn('closedLoop', 'Closed-loop features'),
          yn('hypoenhancement', 'Bowel wall hypoenhancement'),
          yn('pneumatosis', 'Pneumatosis'),
          yn('portalVenousGas', 'Portal venous gas'),
          yn('mesentericEdema', 'Mesenteric edema'),
          select('freeFluid', 'Free fluid', [
            { value: 'none', label: 'None' },
            { value: 'small', label: 'Small' },
            { value: 'moderate', label: 'Moderate' },
            { value: 'large', label: 'Large' },
          ]),
          yn('freeAirPerforation', 'Free air/perforation'),
          text('herniaLocation', 'Hernia location'),
          area('alternativeDiagnosis', 'Alternative diagnosis'),
        ],
      },
    ],
    keyNegatives: ['No closed-loop obstruction', 'No CT evidence of ischemia', 'No pneumatosis', 'No portal venous gas', 'No free air/perforation'],
    incidentalOptions: incidentalAbdomen,
    quickFills: [
      {
        id: 'none',
        label: 'No bowel obstruction',
        description: 'No dilated bowel loops or transition point.',
        intent: 'normal',
        values: {
          obstructionPresent: 'no',
          transitionPoint: '',
          closedLoop: 'no',
          hypoenhancement: 'no',
          pneumatosis: 'no',
          portalVenousGas: 'no',
          mesentericEdema: 'no',
          freeFluid: 'none',
          freeAirPerforation: 'no',
          keyNegatives: ['No closed-loop obstruction', 'No CT evidence of ischemia', 'No pneumatosis', 'No portal venous gas', 'No free air/perforation'],
        },
      },
      {
        id: 'low-grade-sbo',
        label: 'Low-grade SBO without complication',
        description: 'Low-grade SBO with no ischemia or perforation features.',
        intent: 'positive',
        values: {
          obstructionPresent: 'yes',
          obstructionType: 'small bowel',
          degree: 'low-grade',
          smallBowelDiameterCm: '3.2',
          transitionPoint: 'right lower quadrant',
          suspectedCause: 'adhesions',
          closedLoop: 'no',
          hypoenhancement: 'no',
          pneumatosis: 'no',
          portalVenousGas: 'no',
          mesentericEdema: 'no',
          freeAirPerforation: 'no',
        },
      },
      {
        id: 'high-grade-sbo',
        label: 'High-grade SBO without ischemia',
        description: 'High-grade SBO with no ischemia/perforation.',
        intent: 'positive',
        values: {
          obstructionPresent: 'yes',
          obstructionType: 'small bowel',
          degree: 'high-grade',
          smallBowelDiameterCm: '4.0',
          transitionPoint: 'mid abdomen',
          suspectedCause: 'adhesions',
          closedLoop: 'no',
          hypoenhancement: 'no',
          pneumatosis: 'no',
          portalVenousGas: 'no',
          mesentericEdema: 'no',
          freeAirPerforation: 'no',
        },
      },
      {
        id: 'closed-loop',
        label: 'Closed-loop SBO',
        description: 'SBO configuration concerning for closed-loop.',
        intent: 'complicated',
        values: {
          obstructionPresent: 'yes',
          obstructionType: 'small bowel',
          degree: 'high-grade',
          transitionPoint: 'right lower quadrant',
          suspectedCause: 'adhesions',
          closedLoop: 'yes',
          mesentericEdema: 'yes',
          freeFluid: 'small',
        },
      },
      {
        id: 'ischemia',
        label: 'SBO with ischemic features',
        description: 'SBO with ischemia warning features.',
        intent: 'complicated',
        values: {
          obstructionPresent: 'yes',
          obstructionType: 'small bowel',
          degree: 'high-grade',
          transitionPoint: 'mid abdomen',
          suspectedCause: 'hernia',
          hypoenhancement: 'yes',
          pneumatosis: 'yes',
          mesentericEdema: 'yes',
          freeFluid: 'moderate',
        },
      },
      {
        id: 'large-bowel',
        label: 'Large bowel obstruction',
        description: 'Large bowel obstruction with transition point.',
        intent: 'positive',
        values: {
          obstructionPresent: 'yes',
          obstructionType: 'large bowel',
          degree: 'high-grade',
          largeBowelDiameterCm: '7.0',
          transitionPoint: 'sigmoid colon',
          suspectedCause: 'mass',
          freeAirPerforation: 'no',
        },
      },
    ],
  },
  renalColic: {
    moduleType: 'renalColic',
    moduleId: 'ct-kub-renal-colic',
    title: 'CT KUB: Renal Colic',
    shortTitle: 'CT KUB renal colic',
    modality: 'CT',
    bodySystem: 'GU',
    clinicalQuestion: 'Assess for urinary tract calculus, obstruction, and alternative cause of flank pain.',
    techniqueDefault: 'Non-contrast CT KUB performed, unless otherwise specified.',
    badges: ['Implemented', 'Prototype', 'Incidental support'],
    insertTargets: ['findings', 'impression', 'incidentalFindings', 'recommendations'],
    safetyNote: prototypeSafety,
    defaultValues: {
      indication: '',
      technique: 'Non-contrast CT KUB performed, unless otherwise specified.',
      painSide: 'left',
      duration: '',
      hematuria: 'unknown',
      fever: 'unknown',
      solitaryKidney: 'unknown',
      renalFunctionConcern: 'unknown',
      priorComparison: '',
      stonePresent: 'no',
      stoneSide: 'left',
      stoneLocation: 'distal ureter',
      stoneSizeMm: '',
      numberOfStones: '',
      hydronephrosis: 'none',
      hydroureter: 'no',
      stranding: 'no',
      additionalNonobstructingStones: 'no',
      bilateralObstruction: 'no',
      alternativeDiagnosis: '',
      keyNegatives: ['No hydronephrosis', 'No obstructing urinary tract calculus', 'No perinephric collection'],
      incidentalFindings: '',
      additionalFindings: '',
      limitationsUncertainty: '',
    },
    sections: [
      {
        id: 'context',
        title: 'Clinical context',
        defaultOpen: true,
        fields: [
          area('indication', 'Indication', 'Flank pain, hematuria, concern for renal colic'),
          select('painSide', 'Side of pain', [
            { value: 'left', label: 'Left' },
            { value: 'right', label: 'Right' },
            { value: 'bilateral', label: 'Bilateral' },
          ]),
          text('duration', 'Duration'),
          ynu('hematuria', 'Hematuria'),
          ynu('fever', 'Fever'),
          ynu('solitaryKidney', 'Solitary kidney'),
          ynu('renalFunctionConcern', 'Renal function concern'),
          text('priorComparison', 'Prior comparison'),
        ],
      },
      {
        id: 'stone',
        title: 'Stone findings',
        defaultOpen: true,
        fields: [
          yn('stonePresent', 'Stone present'),
          select('stoneSide', 'Stone side', [
            { value: 'left', label: 'Left' },
            { value: 'right', label: 'Right' },
            { value: 'bilateral', label: 'Bilateral' },
          ]),
          select('stoneLocation', 'Stone location', [
            { value: 'kidney', label: 'Kidney' },
            { value: 'UPJ', label: 'UPJ' },
            { value: 'proximal ureter', label: 'Proximal ureter' },
            { value: 'mid ureter', label: 'Mid ureter' },
            { value: 'distal ureter', label: 'Distal ureter' },
            { value: 'UVJ', label: 'UVJ' },
            { value: 'bladder', label: 'Bladder' },
          ]),
          number('stoneSizeMm', 'Stone size', 'mm'),
          text('numberOfStones', 'Number of stones'),
          select('hydronephrosis', 'Hydronephrosis', [
            { value: 'none', label: 'None' },
            { value: 'mild', label: 'Mild' },
            { value: 'moderate', label: 'Moderate' },
            { value: 'severe', label: 'Severe' },
          ]),
          yn('hydroureter', 'Hydroureter'),
          yn('stranding', 'Perinephric/periureteric stranding'),
          yn('additionalNonobstructingStones', 'Additional nonobstructing stones'),
          yn('bilateralObstruction', 'Bilateral obstruction'),
          area('alternativeDiagnosis', 'Alternative diagnosis'),
        ],
      },
    ],
    keyNegatives: [
      'No hydronephrosis',
      'No obstructing urinary tract calculus',
      'No perinephric collection',
      'No alternative acute abdominal/pelvic abnormality on noncontrast CT',
    ],
    incidentalOptions: incidentalAbdomen.filter((item) => item.label !== 'Pancreatic cyst'),
    quickFills: [
      {
        id: 'none',
        label: 'No stone/no hydronephrosis',
        description: 'No urinary tract calculus or collecting system dilation.',
        intent: 'normal',
        values: {
          stonePresent: 'no',
          hydronephrosis: 'none',
          hydroureter: 'no',
          stranding: 'no',
          additionalNonobstructingStones: 'no',
          bilateralObstruction: 'no',
          keyNegatives: ['No hydronephrosis', 'No obstructing urinary tract calculus', 'No perinephric collection'],
        },
      },
      {
        id: 'distal',
        label: 'Obstructing distal ureteric stone',
        description: 'Distal ureteric calculus with hydroureteronephrosis.',
        intent: 'positive',
        values: {
          stonePresent: 'yes',
          stoneSide: 'left',
          stoneLocation: 'distal ureter',
          stoneSizeMm: '5',
          numberOfStones: '1',
          hydronephrosis: 'mild',
          hydroureter: 'yes',
          stranding: 'yes',
        },
      },
      {
        id: 'uvj',
        label: 'Obstructing UVJ stone',
        description: 'UVJ calculus with obstruction.',
        intent: 'positive',
        values: {
          stonePresent: 'yes',
          stoneSide: 'right',
          stoneLocation: 'UVJ',
          stoneSizeMm: '4',
          numberOfStones: '1',
          hydronephrosis: 'mild',
          hydroureter: 'yes',
          stranding: 'yes',
        },
      },
      {
        id: 'nonobstructing',
        label: 'Nonobstructing renal calculus',
        description: 'Renal calculus without hydronephrosis.',
        intent: 'positive',
        values: {
          stonePresent: 'yes',
          stoneSide: 'left',
          stoneLocation: 'kidney',
          stoneSizeMm: '3',
          hydronephrosis: 'none',
          hydroureter: 'no',
          stranding: 'no',
        },
      },
      {
        id: 'bilateral',
        label: 'Bilateral stones',
        description: 'Bilateral calculi; check obstruction on both sides.',
        intent: 'positive',
        values: {
          stonePresent: 'yes',
          stoneSide: 'bilateral',
          stoneLocation: 'kidney',
          stoneSizeMm: '4',
          numberOfStones: 'multiple',
          additionalNonobstructingStones: 'yes',
        },
      },
      {
        id: 'moderate-severe',
        label: 'Stone with moderate/severe hydronephrosis',
        description: 'Obstructing stone with higher-grade obstruction.',
        intent: 'complicated',
        values: {
          stonePresent: 'yes',
          stoneSide: 'right',
          stoneLocation: 'proximal ureter',
          stoneSizeMm: '7',
          hydronephrosis: 'moderate',
          hydroureter: 'yes',
          stranding: 'yes',
        },
      },
    ],
  },
  ruqUltrasound: {
    moduleType: 'ruqUltrasound',
    moduleId: 'us-ruq-biliary',
    title: 'RUQ Ultrasound: Biliary Colic / Cholecystitis',
    shortTitle: 'RUQ ultrasound',
    modality: 'Ultrasound',
    bodySystem: 'Abdomen/Pelvis',
    clinicalQuestion: 'Assess for cholelithiasis, acute cholecystitis, and biliary obstruction.',
    techniqueDefault: 'Right upper quadrant ultrasound performed.',
    badges: ['Implemented', 'Prototype', 'Incidental support'],
    insertTargets: ['findings', 'impression', 'incidentalFindings', 'recommendations'],
    safetyNote: prototypeSafety,
    defaultValues: {
      indication: '',
      technique: 'Right upper quadrant ultrasound performed.',
      painDuration: '',
      fever: 'unknown',
      clinicalMurphy: 'unknown',
      wbc: '',
      bilirubin: '',
      lfts: '',
      priorComparison: '',
      gallstones: 'no',
      sludge: 'no',
      gallbladderDistension: 'no',
      wallThicknessMm: '',
      pericholecysticFluid: 'no',
      sonographicMurphy: 'negative',
      hyperemia: 'unknown',
      impactedStone: 'unknown',
      cbdDiameterMm: '',
      intrahepaticDuctDilation: 'no',
      choledocholithiasis: 'unknown',
      liverLesion: '',
      hepaticSteatosis: 'no',
      ascites: 'no',
      alternativeDiagnosis: '',
      keyNegatives: ['No gallstones', 'No gallbladder wall thickening', 'No pericholecystic fluid', 'Negative sonographic Murphy sign', 'No biliary ductal dilation'],
      incidentalFindings: '',
      additionalFindings: '',
      limitationsUncertainty: '',
    },
    sections: [
      {
        id: 'context',
        title: 'Clinical context',
        defaultOpen: true,
        fields: [
          area('indication', 'Indication', 'RUQ pain, abnormal LFTs, concern for biliary disease'),
          text('painDuration', 'RUQ/epigastric pain duration'),
          ynu('fever', 'Fever'),
          ynu('clinicalMurphy', 'Clinical Murphy sign'),
          text('wbc', 'WBC'),
          text('bilirubin', 'Bilirubin'),
          text('lfts', 'ALP/GGT/ALT'),
          text('priorComparison', 'Prior comparison'),
        ],
      },
      {
        id: 'gallbladder',
        title: 'Gallbladder / biliary tree',
        defaultOpen: true,
        fields: [
          yn('gallstones', 'Gallstones'),
          yn('sludge', 'Sludge'),
          yn('gallbladderDistension', 'Gallbladder distension'),
          number('wallThicknessMm', 'Wall thickness', 'mm'),
          yn('pericholecysticFluid', 'Pericholecystic fluid'),
          select('sonographicMurphy', 'Sonographic Murphy sign', [
            { value: 'positive', label: 'Positive' },
            { value: 'negative', label: 'Negative' },
            { value: 'equivocal', label: 'Equivocal' },
            { value: 'not assessed', label: 'Not assessed' },
          ]),
          ynu('hyperemia', 'Hyperemia'),
          ynu('impactedStone', 'Impacted neck/cystic duct stone'),
          number('cbdDiameterMm', 'CBD diameter', 'mm'),
          yn('intrahepaticDuctDilation', 'Intrahepatic duct dilation'),
          ynu('choledocholithiasis', 'Choledocholithiasis seen'),
          text('liverLesion', 'Liver lesion / incidental'),
          yn('hepaticSteatosis', 'Hepatic steatosis'),
          yn('ascites', 'Ascites'),
          area('alternativeDiagnosis', 'Alternative diagnosis'),
        ],
      },
    ],
    keyNegatives: [
      'No gallstones',
      'No gallbladder wall thickening',
      'No pericholecystic fluid',
      'Negative sonographic Murphy sign',
      'No biliary ductal dilation',
    ],
    incidentalOptions: [
      { label: 'Liver lesion', sentence: 'Incidental liver lesion. Follow-up depends on imaging features, risk status, and prior stability.' },
      { label: 'Renal cyst/mass', sentence: 'Incidental renal lesion if visualized. Consider characterization if indeterminate and not previously evaluated.' },
      { label: 'Ascites', sentence: 'Small volume ascites is present. Correlate clinically and with liver disease context.' },
    ],
    quickFills: [
      {
        id: 'normal',
        label: 'Normal RUQ ultrasound',
        description: 'No gallstones, cholecystitis, or biliary dilation.',
        intent: 'normal',
        values: {
          gallstones: 'no',
          sludge: 'no',
          gallbladderDistension: 'no',
          wallThicknessMm: '2',
          pericholecysticFluid: 'no',
          sonographicMurphy: 'negative',
          cbdDiameterMm: '4',
          intrahepaticDuctDilation: 'no',
          choledocholithiasis: 'no',
          keyNegatives: ['No gallstones', 'No gallbladder wall thickening', 'No pericholecystic fluid', 'Negative sonographic Murphy sign', 'No biliary ductal dilation'],
        },
      },
      {
        id: 'stones-no-chole',
        label: 'Cholelithiasis without cholecystitis',
        description: 'Gallstones without inflammatory features.',
        intent: 'positive',
        values: {
          gallstones: 'yes',
          wallThicknessMm: '2',
          pericholecysticFluid: 'no',
          sonographicMurphy: 'negative',
          intrahepaticDuctDilation: 'no',
          keyNegatives: ['No gallbladder wall thickening', 'No pericholecystic fluid', 'Negative sonographic Murphy sign', 'No biliary ductal dilation'],
        },
      },
      {
        id: 'acute-chole',
        label: 'Acute cholecystitis',
        description: 'Gallstones with wall thickening and inflammatory features.',
        intent: 'positive',
        values: {
          gallstones: 'yes',
          gallbladderDistension: 'yes',
          wallThicknessMm: '5',
          pericholecysticFluid: 'yes',
          sonographicMurphy: 'positive',
          hyperemia: 'yes',
        },
      },
      {
        id: 'duct-dilation',
        label: 'Biliary ductal dilation',
        description: 'Dilated CBD and/or intrahepatic ducts.',
        intent: 'positive',
        values: {
          cbdDiameterMm: '10',
          intrahepaticDuctDilation: 'yes',
          gallstones: 'no',
          pericholecysticFluid: 'no',
        },
      },
      {
        id: 'choledo-suspected',
        label: 'Choledocholithiasis suspected',
        description: 'Ductal dilation with possible stone.',
        intent: 'complicated',
        values: {
          gallstones: 'yes',
          cbdDiameterMm: '10',
          intrahepaticDuctDilation: 'yes',
          choledocholithiasis: 'yes',
        },
      },
    ],
  },
  dvtUltrasound: {
    moduleType: 'dvtUltrasound',
    moduleId: 'us-dvt',
    title: 'Lower-Limb Venous Ultrasound: DVT',
    shortTitle: 'Lower-limb DVT US',
    modality: 'Ultrasound',
    bodySystem: 'Vascular',
    clinicalQuestion: 'Assess for deep venous thrombosis.',
    techniqueDefault: 'Grayscale compression and Doppler ultrasound of the lower-limb deep venous system performed.',
    badges: ['Implemented', 'Prototype', 'Vascular workflow'],
    insertTargets: ['findings', 'impression', 'recommendations'],
    safetyNote: prototypeSafety,
    defaultValues: {
      indication: '',
      technique: 'Grayscale compression and Doppler ultrasound of the lower-limb deep venous system performed.',
      examSide: 'left',
      duration: '',
      priorDvt: 'unknown',
      anticoagulationStatus: '',
      priorComparison: '',
      dvtPresent: 'no',
      dvtSide: 'left',
      veinSegments: [],
      occlusion: 'occlusive',
      acuity: 'acute',
      compressibility: 'normal',
      dopplerFlow: 'normal',
      iliacExtension: 'no',
      softTissueFinding: '',
      superficialThrombosis: 'no',
      superficialVein: '',
      keyNegatives: ['No DVT in assessed veins', 'No extension to common femoral vein', 'No superficial thrombophlebitis', 'No popliteal fossa collection'],
      incidentalFindings: '',
      additionalFindings: '',
      limitationsUncertainty: '',
    },
    sections: [
      {
        id: 'context',
        title: 'Clinical context',
        defaultOpen: true,
        fields: [
          area('indication', 'Indication', 'Leg swelling/pain, concern for DVT'),
          select('examSide', 'Side', [
            { value: 'left', label: 'Left' },
            { value: 'right', label: 'Right' },
            { value: 'bilateral', label: 'Bilateral' },
          ]),
          text('duration', 'Swelling/pain duration'),
          ynu('priorDvt', 'Prior DVT'),
          text('anticoagulationStatus', 'Anticoagulation status'),
          text('priorComparison', 'Prior comparison'),
        ],
      },
      {
        id: 'dvt',
        title: 'DVT findings',
        defaultOpen: true,
        fields: [
          yn('dvtPresent', 'DVT present'),
          select('dvtSide', 'DVT side', [
            { value: 'left', label: 'Left' },
            { value: 'right', label: 'Right' },
            { value: 'bilateral', label: 'Bilateral' },
          ]),
          select('veinSegments', 'Primary vein segment', [
            { value: '', label: 'Not specified' },
            { value: 'common femoral vein', label: 'Common femoral vein' },
            { value: 'femoral vein', label: 'Femoral vein' },
            { value: 'profunda femoris', label: 'Profunda femoris' },
            { value: 'popliteal vein', label: 'Popliteal vein' },
            { value: 'posterior tibial veins', label: 'Posterior tibial veins' },
            { value: 'peroneal veins', label: 'Peroneal veins' },
            { value: 'calf veins', label: 'Calf veins' },
            { value: 'great saphenous vein', label: 'Great saphenous/superficial vein' },
          ]),
          select('occlusion', 'Occlusive vs nonocclusive', [
            { value: 'occlusive', label: 'Occlusive' },
            { value: 'nonocclusive', label: 'Nonocclusive' },
          ]),
          select('acuity', 'Acute/chronic features', [
            { value: 'acute', label: 'Acute' },
            { value: 'chronic', label: 'Chronic' },
            { value: 'indeterminate', label: 'Indeterminate' },
          ]),
          select('compressibility', 'Compressibility', [
            { value: 'normal', label: 'Normal' },
            { value: 'reduced', label: 'Reduced' },
            { value: 'absent', label: 'Absent' },
          ]),
          select('dopplerFlow', 'Doppler flow', [
            { value: 'normal', label: 'Normal' },
            { value: 'reduced', label: 'Reduced' },
            { value: 'absent', label: 'Absent' },
          ]),
          yn('iliacExtension', 'Extension into iliac veins suspected'),
          area('softTissueFinding', 'Soft tissue edema/fluid collection'),
          yn('superficialThrombosis', 'Superficial thrombophlebitis'),
          text('superficialVein', 'Superficial vein'),
        ],
      },
    ],
    keyNegatives: [
      'No DVT in assessed veins',
      'No extension to common femoral vein',
      'No superficial thrombophlebitis',
      'No popliteal fossa collection',
    ],
    incidentalOptions: incidentalDvt,
    quickFills: [
      {
        id: 'no-dvt',
        label: 'No DVT',
        description: 'Compressible assessed veins with preserved flow.',
        intent: 'normal',
        values: {
          dvtPresent: 'no',
          compressibility: 'normal',
          dopplerFlow: 'normal',
          superficialThrombosis: 'no',
          keyNegatives: ['No DVT in assessed veins', 'No extension to common femoral vein', 'No superficial thrombophlebitis', 'No popliteal fossa collection'],
        },
      },
      {
        id: 'femoropopliteal',
        label: 'Acute femoropopliteal DVT',
        description: 'Acute occlusive proximal DVT.',
        intent: 'positive',
        values: {
          dvtPresent: 'yes',
          dvtSide: 'left',
          veinSegments: 'femoral vein',
          occlusion: 'occlusive',
          acuity: 'acute',
          compressibility: 'absent',
          dopplerFlow: 'absent',
        },
      },
      {
        id: 'calf',
        label: 'Isolated calf DVT',
        description: 'Calf vein thrombosis.',
        intent: 'positive',
        values: {
          dvtPresent: 'yes',
          veinSegments: 'posterior tibial veins',
          occlusion: 'occlusive',
          acuity: 'acute',
          compressibility: 'absent',
          dopplerFlow: 'reduced',
        },
      },
      {
        id: 'nonocclusive',
        label: 'Nonocclusive DVT',
        description: 'Nonocclusive thrombus with reduced compressibility/flow.',
        intent: 'positive',
        values: {
          dvtPresent: 'yes',
          veinSegments: 'popliteal vein',
          occlusion: 'nonocclusive',
          acuity: 'acute',
          compressibility: 'reduced',
          dopplerFlow: 'reduced',
        },
      },
      {
        id: 'superficial',
        label: 'Superficial thrombophlebitis',
        description: 'Superficial venous thrombosis without DVT if selected.',
        intent: 'positive',
        values: {
          dvtPresent: 'no',
          superficialThrombosis: 'yes',
          superficialVein: 'great saphenous vein',
          compressibility: 'normal',
          dopplerFlow: 'normal',
        },
      },
    ],
  },
};

export const schemaDrivenModuleTypes = Object.keys(reportingWorkflowSchemas) as Array<keyof typeof reportingWorkflowSchemas>;
