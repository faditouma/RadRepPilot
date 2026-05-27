export interface AnatomyNavigationRegion {
  id: string;
  title: string;
  label: string;
  iconName: string;
  subtitle: string;
  description: string;
  reporting: Array<{ label: string; path: string; workflowId?: string }>;
  helpers: Array<{ label: string; helperId: string }>;
  incidentalFindings: Array<{ label: string; helperId?: string }>;
  incidental: string[];
}

export const anatomyNavigationMap: AnatomyNavigationRegion[] = [
  {
    id: 'head-neck',
    title: 'Head / Neck',
    label: 'Head/Neck',
    iconName: 'headNeck',
    subtitle: 'Neuro, CT head, MRI brain, thyroid/neck incidental findings',
    description: 'Stroke, trauma, headache, seizure, thyroid, and head/neck surveillance helpers.',
    reporting: [
      { label: 'CT head trauma', path: 'CT > Neuro/Head', workflowId: 'ct-head-trauma' },
      { label: 'CT head stroke / ASPECTS', path: 'CT > Neuro/Head', workflowId: 'ct-head-stroke-aspects' },
      { label: 'MRI brain seizure', path: 'MRI > Brain', workflowId: 'mri-brain-seizure' },
    ],
    helpers: [
      { label: 'ASPECTS', helperId: 'aspects' },
      { label: 'TI-RADS', helperId: 'tirads' },
      { label: 'NI-RADS', helperId: 'nirads' },
    ],
    incidentalFindings: [
      { label: 'Thyroid nodule', helperId: 'tirads' },
      { label: 'Bone lesion', helperId: 'bonerads' },
      { label: 'Sinus disease placeholder' },
    ],
    incidental: ['Thyroid nodule', 'Bone lesion', 'Sinus disease placeholder'],
  },
  {
    id: 'chest',
    title: 'Chest',
    label: 'Chest',
    iconName: 'chest',
    subtitle: 'CTPA, CXR, pulmonary nodules, Lung-RADS',
    description: 'PE, pulmonary nodules, chest X-ray, lung screening, and chest incidental findings.',
    reporting: [
      { label: 'CTPA pulmonary embolism', path: 'CT > Chest', workflowId: 'ctpa-pe' },
      { label: 'Pulmonary nodule / Fleischner', path: 'CT > Chest', workflowId: 'ct-chest-nodule' },
      { label: 'CXR pneumonia / CHF', path: 'X-ray > Chest', workflowId: 'xray-cxr-pneumonia' },
    ],
    helpers: [
      { label: 'RV/LV ratio', helperId: 'rv-lv-ratio' },
      { label: 'Fleischner', helperId: 'fleischner' },
      { label: 'Lung-RADS', helperId: 'lungrads' },
    ],
    incidentalFindings: [
      { label: 'Pulmonary nodule', helperId: 'fleischner' },
      { label: 'Thyroid nodule', helperId: 'tirads' },
      { label: 'Adrenal nodule', helperId: 'adrenal-washout' },
      { label: 'Aortic aneurysm', helperId: 'cadrads' },
    ],
    incidental: ['Pulmonary nodule', 'Thyroid nodule', 'Adrenal nodule', 'Aortic aneurysm'],
  },
  {
    id: 'abdomen',
    title: 'Abdomen',
    label: 'Abdomen',
    iconName: 'abdomen',
    subtitle: 'Appendicitis, obstruction, liver/adrenal/renal findings',
    description: 'Acute abdomen workflows, RUQ ultrasound, liver/adrenal/renal/pancreatic follow-up.',
    reporting: [
      { label: 'CT appendicitis', path: 'CT > Abdomen/Pelvis', workflowId: 'ct-ap-appendicitis' },
      { label: 'CT bowel obstruction', path: 'CT > Abdomen/Pelvis', workflowId: 'ct-ap-bowel-obstruction' },
      { label: 'CT renal colic', path: 'CT > GU/Renal', workflowId: 'ct-kub-renal-colic' },
      { label: 'RUQ ultrasound', path: 'Ultrasound > Abdomen/RUQ', workflowId: 'us-ruq-biliary' },
    ],
    helpers: [
      { label: 'Adrenal washout', helperId: 'adrenal-washout' },
      { label: 'Bosniak', helperId: 'bosniak' },
      { label: 'LI-RADS', helperId: 'lirads' },
    ],
    incidentalFindings: [
      { label: 'Adrenal nodule', helperId: 'adrenal-washout' },
      { label: 'Renal cyst/mass', helperId: 'bosniak' },
      { label: 'Liver lesion', helperId: 'lirads' },
      { label: 'Pancreatic cyst' },
      { label: 'Aortic aneurysm', helperId: 'cadrads' },
    ],
    incidental: ['Adrenal nodule', 'Renal cyst/mass', 'Liver lesion', 'Pancreatic cyst', 'Aortic aneurysm'],
  },
  {
    id: 'pelvis-gu',
    title: 'Pelvis / GU',
    label: 'Pelvis/GU',
    iconName: 'pelvisGu',
    subtitle: 'Pelvic US, renal colic, adnexal findings, prostate MRI',
    description: 'Renal colic, pelvic ultrasound, adnexal lesions, prostate, bladder, and GU helpers.',
    reporting: [
      { label: 'CT KUB / renal colic', path: 'CT > GU/Renal', workflowId: 'ct-kub-renal-colic' },
      { label: 'Pelvic ultrasound', path: 'Ultrasound > Pelvic/Gynecology', workflowId: 'us-pelvic-pain' },
    ],
    helpers: [
      { label: 'O-RADS', helperId: 'orads' },
      { label: 'PI-RADS', helperId: 'pirads' },
      { label: 'VI-RADS', helperId: 'virads' },
    ],
    incidentalFindings: [
      { label: 'Adnexal cyst', helperId: 'orads' },
      { label: 'Renal cyst/mass', helperId: 'bosniak' },
      { label: 'Endometrial thickening placeholder' },
    ],
    incidental: ['Adnexal cyst', 'Renal cyst/mass', 'Endometrial thickening placeholder'],
  },
  {
    id: 'spine',
    title: 'Spine',
    label: 'Spine',
    iconName: 'spine',
    subtitle: 'Radiculopathy, cauda equina, trauma, infection',
    description: 'Radiculopathy, cauda equina, infection, malignancy, and spine trauma pathways.',
    reporting: [
      { label: 'MRI spine cauda equina', path: 'MRI > Spine', workflowId: 'mri-spine-cauda' },
      { label: 'MRI lumbar radiculopathy', path: 'MRI > Spine', workflowId: 'mri-lumbar-radiculopathy' },
      { label: 'CT C-spine trauma', path: 'CT > Spine', workflowId: 'ct-cspine-trauma' },
    ],
    helpers: [{ label: 'Bone-RADS', helperId: 'bonerads' }],
    incidentalFindings: [
      { label: 'Bone lesion', helperId: 'bonerads' },
      { label: 'Soft tissue mass' },
    ],
    incidental: ['Bone lesion', 'Soft tissue mass'],
  },
  {
    id: 'msk',
    title: 'MSK / Extremities',
    label: 'MSK/Extremities',
    iconName: 'msk',
    subtitle: 'X-ray trauma, MRI knee/shoulder, Bone-RADS',
    description: 'Fracture, arthritis, knee, shoulder, soft tissue mass, and incidental bone lesion support.',
    reporting: [
      { label: 'MSK X-ray trauma', path: 'X-ray > MSK', workflowId: 'xray-msk-trauma' },
      { label: 'MRI knee internal derangement', path: 'MRI > MSK', workflowId: 'mri-knee' },
      { label: 'MRI shoulder rotator cuff', path: 'MRI > MSK', workflowId: 'mri-shoulder' },
    ],
    helpers: [{ label: 'Bone-RADS', helperId: 'bonerads' }],
    incidentalFindings: [
      { label: 'Bone lesion', helperId: 'bonerads' },
      { label: 'Soft tissue mass' },
    ],
    incidental: ['Bone lesion', 'Soft tissue mass'],
  },
  {
    id: 'vascular',
    title: 'Vascular',
    label: 'Vascular',
    iconName: 'vascular',
    subtitle: 'DVT, aorta, CAD-RADS, aneurysm follow-up',
    description: 'DVT, aortic aneurysm/dissection, coronary CTA, and vascular follow-up.',
    reporting: [
      { label: 'Lower-limb DVT ultrasound', path: 'Ultrasound > Vascular/DVT', workflowId: 'us-dvt' },
      { label: 'CT aorta', path: 'CT > Vascular/Aorta', workflowId: 'ct-aorta' },
    ],
    helpers: [
      { label: 'CAD-RADS', helperId: 'cadrads' },
      { label: 'Aneurysm follow-up', helperId: 'incidental-lesions' },
    ],
    incidentalFindings: [
      { label: 'Aortic aneurysm', helperId: 'cadrads' },
      { label: 'Baker cyst/popliteal fossa collection' },
    ],
    incidental: ['Aortic aneurysm', 'Baker cyst/popliteal fossa collection'],
  },
  {
    id: 'oncology',
    title: 'Oncology / Response',
    label: 'Oncology/Response',
    iconName: 'oncology',
    subtitle: 'RECIST, treatment response, surveillance',
    description: 'Response assessment, target lesion tracking, surveillance, and cancer-specific classifications.',
    reporting: [
      { label: 'RECIST tracker', path: 'CT > Oncology', workflowId: 'oncology-recist' },
      { label: 'Treatment response comparison', path: 'CT > Oncology', workflowId: 'oncology-response' },
    ],
    helpers: [
      { label: 'RECIST 1.1', helperId: 'recist' },
      { label: 'LI-RADS', helperId: 'lirads' },
      { label: 'NI-RADS', helperId: 'nirads' },
    ],
    incidentalFindings: [
      { label: 'Adrenal nodule in known malignancy', helperId: 'adrenal-washout' },
      { label: 'Liver lesion', helperId: 'lirads' },
      { label: 'Bone lesion', helperId: 'bonerads' },
    ],
    incidental: ['Adrenal nodule in known malignancy', 'Liver lesion', 'Bone lesion'],
  },
];
