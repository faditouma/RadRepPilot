import type { AppropriatenessTopic } from '../types';

export const chronicPancreatitisTopic: AppropriatenessTopic = {
  id: 'chronic-pancreatitis',
  title: 'Chronic Pancreatitis',
  year: 'Needs validation',
  clinicalArea: 'Abdomen',
  keywords: [
    'chronic pancreatitis',
    'pancreatitis',
    'pancreatic calcifications',
    'MRCP',
    'pancreatic duct',
    'acute on chronic pancreatitis',
  ],
  sourceLabel: 'ACR Appropriateness Criteria: Chronic Pancreatitis',
  sourceUrl: 'https://www.acr.org/clinical-resources/acr-appropriateness-criteria',
  sourceNote:
    'Concise educational table summary. Confirm against the original ACR criteria, current updates, local protocol, and radiologist judgment.',
  reviewStatus: 'needs_validation',
  extractionConfidence: 'high',
  variants: [
    {
      id: 'suspected-initial-imaging',
      title: 'Suspected chronic pancreatitis or complications, initial imaging',
      clinicalScenario: 'Adult with suspected chronic pancreatitis or suspected complications.',
      missingInformationPrompts: [
        'Duration and pattern of abdominal pain',
        'Prior acute pancreatitis episodes',
        'Alcohol/smoking history',
        'Exocrine insufficiency or steatorrhea',
        'New diabetes or weight loss',
        'Prior imaging',
        'Suspicion for complication',
        'Renal function/contrast contraindication',
      ],
      imagingOptions: [
        {
          procedure: 'MRI abdomen without and with IV contrast with MRCP',
          appropriatenessCategory: 'Usually Appropriate',
          radiationLevel: 'O',
          shortRationale: 'Useful for ductal and parenchymal assessment, especially early disease and MRCP evaluation.',
        },
        {
          procedure: 'CT abdomen and pelvis with IV contrast',
          appropriatenessCategory: 'Usually Appropriate',
          radiationLevel: '☢☢☢',
          shortRationale: 'Useful for calcifications, complications, alternative diagnoses, and presurgical planning.',
        },
        {
          procedure: 'CT abdomen and pelvis without and with IV contrast',
          appropriatenessCategory: 'Usually Appropriate',
          radiationLevel: '☢☢☢☢',
          shortRationale: 'May help detect calcifications and complications but adds radiation.',
        },
        {
          procedure: 'Endoscopic ultrasound',
          appropriatenessCategory: 'May Be Appropriate',
          radiationLevel: 'O',
          shortRationale: 'May be useful when suspicion persists after CT/MRI or when tissue sampling/intervention is needed.',
        },
        {
          procedure: 'MRI abdomen without IV contrast with MRCP',
          appropriatenessCategory: 'May Be Appropriate',
          radiationLevel: 'O',
          shortRationale: 'Can evaluate ducts without radiation, but lacks contrast assessment.',
        },
        {
          procedure: 'Ultrasound abdomen',
          appropriatenessCategory: 'Usually Not Appropriate',
          radiationLevel: 'O',
          shortRationale: 'Limited sensitivity for chronic pancreatitis, especially early disease and limited pancreatic visualization.',
        },
        {
          procedure: 'CT abdomen and pelvis without IV contrast',
          appropriatenessCategory: 'Usually Not Appropriate',
          radiationLevel: '☢☢☢',
          shortRationale: 'Limited for subtle parenchymal/ductal disease and complications compared with contrast imaging.',
        },
      ],
      requisitionSuggestions: [
        'Adult with suspected chronic pancreatitis with [clinical features/risk factors]. Please assess pancreatic parenchyma, ductal morphology, calcifications, complications, and alternative causes of symptoms.',
      ],
      reportingPearls: [
        'Comment on calcifications, pancreatic atrophy, main duct dilation/irregularity, side branch changes, pseudocyst/fluid collections, biliary obstruction, vascular complications, and suspicious mass.',
        'If CT is negative but suspicion remains high, MRI/MRCP or EUS may be considered depending on local practice.',
      ],
      followUpPearls: [
        'Follow-up imaging should be individualized to symptoms, suspected complications, and local pancreatic imaging pathways.',
      ],
      cautions: [
        'This is an educational summary, not an imaging-ordering rule.',
        'Contrast use and modality selection depend on renal function, contraindications, availability, and local protocol.',
      ],
    },
    {
      id: 'acute-on-chronic',
      title: 'Known chronic pancreatitis with suspected superimposed acute pancreatitis',
      clinicalScenario: 'Adult with established chronic pancreatitis and acute worsening of pain or suspected acute-on-chronic pancreatitis.',
      missingInformationPrompts: [
        'Known chronic pancreatitis history',
        'Acute pain onset/severity',
        'Lipase/amylase trend if available',
        'Fever or sepsis',
        'Jaundice or biliary obstruction',
        'Known pseudocyst/fluid collection',
        'Concern for necrosis, hemorrhage, vascular complication, or obstruction',
        'Renal function/contrast contraindication',
      ],
      imagingOptions: [
        {
          procedure: 'CT abdomen and pelvis with IV contrast',
          appropriatenessCategory: 'Usually Appropriate',
          radiationLevel: '☢☢☢',
          shortRationale: 'Preferred for rapid assessment of acute inflammatory changes, complications, and alternative causes.',
        },
        {
          procedure: 'MRI abdomen without and with IV contrast with MRCP',
          appropriatenessCategory: 'May Be Appropriate',
          radiationLevel: 'O',
          shortRationale: 'Alternative or complementary option, especially for ductal/biliary assessment or repeated imaging, but less practical acutely.',
        },
        {
          procedure: 'MRI abdomen without IV contrast with MRCP',
          appropriatenessCategory: 'May Be Appropriate',
          radiationLevel: 'O',
          shortRationale: 'May help in select stable patients but lacks contrast-enhanced complication assessment.',
        },
        {
          procedure: 'CT abdomen and pelvis without and with IV contrast',
          appropriatenessCategory: 'May Be Appropriate (Disagreement)',
          radiationLevel: '☢☢☢☢',
          shortRationale: 'Not routine; may be considered in select cases such as suspected hemorrhage.',
        },
        {
          procedure: 'Ultrasound abdomen',
          appropriatenessCategory: 'Usually Not Appropriate',
          radiationLevel: 'O',
          shortRationale: 'Limited for acute-on-chronic pancreatitis assessment.',
        },
        {
          procedure: 'Endoscopic ultrasound',
          appropriatenessCategory: 'Usually Not Appropriate',
          radiationLevel: 'O',
          shortRationale: 'Not routine for acute diagnosis; may have therapeutic/sampling roles in selected contexts.',
        },
        {
          procedure: 'CT abdomen and pelvis without IV contrast',
          appropriatenessCategory: 'Usually Not Appropriate',
          radiationLevel: '☢☢☢',
          shortRationale: 'Limited for necrosis, complications, and alternative diagnoses compared with contrast CT.',
        },
      ],
      requisitionSuggestions: [
        'Adult with known chronic pancreatitis and acute worsening abdominal pain. Please assess for acute-on-chronic pancreatitis, complications including necrosis/fluid collection/vascular complication, and alternative causes of pain.',
      ],
      reportingPearls: [
        'Compare to prior imaging if available.',
        'Distinguish chronic baseline changes from new acute inflammatory change.',
        'Comment on necrosis, peripancreatic inflammation, new/enlarging fluid collections, biliary obstruction, vascular complications, and alternative diagnosis.',
      ],
      followUpPearls: [
        'Follow-up depends on severity, complications, clinical course, and local protocol.',
      ],
      cautions: [
        'Acute abdominal presentations may require local emergency imaging pathways.',
        'Clinical stability, renal function, contrast contraindication, and suspected complication should guide protocol choice.',
      ],
    },
  ],
};
