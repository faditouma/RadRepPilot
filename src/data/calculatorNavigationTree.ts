export interface CalculatorCategory {
  id: string;
  name: string;
  description: string;
  iconName: string;
  calculatorIds: string[];
}

export const calculatorNavigationTree: CalculatorCategory[] = [
  {
    id: 'chest',
    name: 'Chest',
    iconName: 'chest',
    description: 'PE strain, pulmonary nodules, lung screening, and chest follow-up helpers.',
    calculatorIds: ['rv-lv-ratio', 'fleischner', 'lungrads'],
  },
  {
    id: 'neuro',
    name: 'Neuro',
    iconName: 'neuro',
    description: 'Stroke scoring and neuro reporting support.',
    calculatorIds: ['aspects', 'nirads'],
  },
  {
    id: 'abdomen-liver',
    name: 'Abdomen/Liver',
    iconName: 'liver',
    description: 'Adrenal, liver, renal, and incidental abdominal finding helpers.',
    calculatorIds: ['adrenal-washout', 'lirads', 'incidental-lesions'],
  },
  {
    id: 'gu',
    name: 'GU',
    iconName: 'pelvisGu',
    description: 'Renal cysts/masses, prostate MRI, bladder staging, and GU classifications.',
    calculatorIds: ['bosniak', 'pirads', 'virads', 'renal-mass'],
  },
  {
    id: 'breast',
    name: 'Breast',
    iconName: 'mammography',
    description: 'Breast imaging descriptor and BI-RADS preview support.',
    calculatorIds: ['birads'],
  },
  {
    id: 'gyn-adnexa',
    name: 'Gyn/Adnexa',
    iconName: 'pelvisGu',
    description: 'Adnexal lesion and O-RADS-style preview support.',
    calculatorIds: ['orads'],
  },
  {
    id: 'msk',
    name: 'MSK',
    iconName: 'msk',
    description: 'Bone lesion management buckets and MSK incidental support.',
    calculatorIds: ['bonerads'],
  },
  {
    id: 'cardiac-vascular',
    name: 'Cardiac/Vascular',
    iconName: 'cardiacVascular',
    description: 'Coronary CTA, vascular categories, and follow-up language.',
    calculatorIds: ['cadrads'],
  },
  {
    id: 'oncology',
    name: 'Oncology',
    iconName: 'oncology',
    description: 'Target lesion tracking and response assessment support.',
    calculatorIds: ['recist'],
  },
  {
    id: 'thyroid',
    name: 'Thyroid',
    iconName: 'thyroid',
    description: 'Thyroid nodule scoring and report-ready category language.',
    calculatorIds: ['tirads'],
  },
];
