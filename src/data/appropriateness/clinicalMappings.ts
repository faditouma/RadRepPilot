export interface ClinicalComplaintMapping {
  id: string;
  complaint: string;
  synonyms: string[];
  relatedTopicIds: string[];
  suggestedVariantIds?: string[];
  missingInfoPrompts: string[];
  commonRequisitionLanguage: string;
}

export const clinicalComplaintMappings: ClinicalComplaintMapping[] = [
  {
    id: 'headache',
    complaint: 'Headache',
    synonyms: ['migraine', 'thunderclap headache', 'worst headache', 'new headache', 'focal neurologic deficit'],
    relatedTopicIds: ['headache'],
    missingInfoPrompts: [
      'Onset and duration',
      'Thunderclap or worst headache of life',
      'Focal neurologic deficit',
      'Trauma or anticoagulation',
      'Fever, meningismus, cancer, or immunosuppression',
    ],
    commonRequisitionLanguage:
      'Patient with headache and [red flags/clinical features]. Please assess for acute intracranial abnormality or other imaging-relevant cause as clinically appropriate.',
  },
  {
    id: 'low-back-pain',
    complaint: 'Low back pain',
    synonyms: ['back pain', 'radiculopathy', 'sciatica', 'cauda equina', 'lumbar pain'],
    relatedTopicIds: ['low-back-pain'],
    missingInfoPrompts: [
      'Duration and acuity',
      'Radicular symptoms and neurologic deficits',
      'Bowel/bladder symptoms or saddle anesthesia',
      'Cancer, infection risk, trauma, or steroid use',
      'Prior spine surgery or prior imaging',
    ],
    commonRequisitionLanguage:
      'Patient with low back pain and [neurologic/red flag features]. Please assess for clinically relevant spinal pathology and correlate with local imaging pathway.',
  },
  {
    id: 'ruq-pain',
    complaint: 'RUQ pain',
    synonyms: ['right upper quadrant pain', 'biliary colic', 'cholecystitis', 'gallbladder pain', 'jaundice'],
    relatedTopicIds: ['right-upper-quadrant-pain'],
    missingInfoPrompts: [
      'Pain duration and meal association',
      'Fever or Murphy sign',
      'Bilirubin, ALP/GGT, ALT/AST, WBC/CRP if available',
      'Known gallstones or prior biliary intervention',
      'Pregnancy status when relevant',
    ],
    commonRequisitionLanguage:
      'Patient with right upper quadrant pain and [fever/labs/Murphy sign if present]. Please assess for cholelithiasis, cholecystitis, biliary obstruction, or alternative biliary pathology.',
  },
  {
    id: 'renal-colic',
    complaint: 'Renal colic',
    synonyms: ['flank pain', 'kidney stone', 'ureteric stone', 'urolithiasis', 'hematuria with flank pain'],
    relatedTopicIds: ['acute-onset-flank-pain-suspicion-of-stone-disease-urolithiasis'],
    missingInfoPrompts: [
      'Side and duration of pain',
      'Hematuria',
      'Fever or infection concern',
      'Solitary kidney or renal dysfunction',
      'Pregnancy status and prior stone history',
    ],
    commonRequisitionLanguage:
      'Patient with [side] flank pain and suspected stone disease. Please assess for urinary tract calculus, obstruction, and complications.',
  },
  {
    id: 'suspected-pe',
    complaint: 'Suspected PE',
    synonyms: ['pulmonary embolism', 'pleuritic chest pain', 'acute dyspnea', 'elevated d-dimer', 'VTE concern'],
    relatedTopicIds: ['suspected-pulmonary-embolism'],
    missingInfoPrompts: [
      'Symptoms and duration',
      'Oxygen saturation and hemodynamic status',
      'D-dimer and pretest probability if available',
      'VTE risk factors including cancer, surgery, immobility, pregnancy, or prior VTE',
      'Renal function and contrast allergy',
    ],
    commonRequisitionLanguage:
      'Patient with acute dyspnea/pleuritic chest pain and concern for pulmonary embolism. Please assess for PE and signs of right heart strain if CTPA is performed.',
  },
  {
    id: 'suspected-dvt',
    complaint: 'Suspected DVT',
    synonyms: ['leg swelling', 'leg pain', 'calf swelling', 'venous thrombosis', 'lower extremity DVT'],
    relatedTopicIds: ['suspected-lower-extremity-deep-vein-thrombosis'],
    missingInfoPrompts: [
      'Laterality and symptom duration',
      'Swelling, pain, erythema, or clinical Wells features',
      'Cancer, pregnancy/estrogen, surgery, immobility, prior VTE',
      'Current anticoagulation',
      'Concern for proximal versus calf DVT',
    ],
    commonRequisitionLanguage:
      'Patient with [side] lower-limb swelling/pain and concern for DVT. Please assess for lower-extremity venous thrombosis.',
  },
  {
    id: 'chronic-pancreatitis',
    complaint: 'Chronic pancreatitis',
    synonyms: ['pancreas', 'pancreatic calcifications', 'pancreatic duct dilation', 'steatorrhea', 'exocrine insufficiency', 'recurrent pancreatitis'],
    relatedTopicIds: ['chronic-pancreatitis'],
    suggestedVariantIds: ['suspected-initial-imaging'],
    missingInfoPrompts: [
      'Pain pattern and duration',
      'Prior acute pancreatitis episodes',
      'Alcohol/smoking history',
      'Exocrine insufficiency, steatorrhea, diabetes, or weight loss',
      'Prior imaging and suspected complications',
    ],
    commonRequisitionLanguage:
      'Adult with suspected chronic pancreatitis and [clinical features/risk factors]. Please assess pancreatic parenchyma, ductal morphology, calcifications, complications, and alternative causes of symptoms.',
  },
  {
    id: 'acute-pancreatitis',
    complaint: 'Acute pancreatitis',
    synonyms: ['acute on chronic pancreatitis', 'elevated lipase', 'epigastric pain', 'pancreatic necrosis', 'peripancreatic collection'],
    relatedTopicIds: ['acute-pancreatitis', 'chronic-pancreatitis'],
    suggestedVariantIds: ['acute-on-chronic'],
    missingInfoPrompts: [
      'Pain onset and severity',
      'Lipase/amylase trend if available',
      'Fever, sepsis, jaundice, or biliary obstruction',
      'Concern for necrosis, hemorrhage, vascular complication, or collection',
      'Renal function and contrast contraindication',
    ],
    commonRequisitionLanguage:
      'Patient with acute worsening epigastric pain and suspected pancreatitis. Please assess for acute inflammatory change, complications, and alternative causes of pain.',
  },
  {
    id: 'abdominal-pain',
    complaint: 'Abdominal pain',
    synonyms: ['abdomen', 'abdominal pain', 'acute abdomen', 'RLQ pain', 'LLQ pain', 'diffuse abdominal pain', 'bowel obstruction', 'appendicitis'],
    relatedTopicIds: [
      'acute-nonlocalized-abdominal-pain',
      'right-lower-quadrant-pain',
      'left-lower-quadrant-pain',
      'suspected-small-bowel-obstruction',
      'right-upper-quadrant-pain',
      'acute-pancreatitis',
      'acute-onset-flank-pain-suspicion-of-stone-disease-urolithiasis',
    ],
    missingInfoPrompts: [
      'Pain location, onset, and duration',
      'Fever, vomiting, bowel changes, or urinary symptoms',
      'Pregnancy status when relevant',
      'Prior surgery, hernia, inflammatory bowel disease, or cancer history',
      'WBC/CRP and renal function if available',
    ],
    commonRequisitionLanguage:
      'Patient with abdominal pain localized to [location] for [duration]. Please assess for acute intra-abdominal pathology and relevant complications.',
  },
  {
    id: 'hematuria',
    complaint: 'Hematuria',
    synonyms: ['gross hematuria', 'microscopic hematuria', 'blood in urine', 'urothelial malignancy concern', 'flank pain hematuria'],
    relatedTopicIds: ['hematuria', 'acute-onset-flank-pain-suspicion-of-stone-disease-urolithiasis'],
    missingInfoPrompts: [
      'Gross versus microscopic hematuria',
      'Painful versus painless hematuria',
      'Flank pain, fever, infection, or stone symptoms',
      'Smoking, occupational exposure, anticoagulation, or malignancy history',
      'Renal function and contrast contraindication',
    ],
    commonRequisitionLanguage:
      'Patient with hematuria and [risk factors/symptoms]. Please assess for urinary tract stone, mass, obstruction, or other imaging-relevant cause as appropriate.',
  },
  {
    id: 'chest-pain',
    complaint: 'Chest pain',
    synonyms: ['acute chest pain', 'pleuritic chest pain', 'cardiac chest pain', 'ACS concern', 'noncardiac chest pain'],
    relatedTopicIds: [
      'chest-pain-possible-acute-coronary-syndrome',
      'acute-nonspecific-chest-pain-low-probability-of-coronary-artery-disease',
      'nontraumatic-chest-wall-pain',
      'suspected-pulmonary-embolism',
    ],
    missingInfoPrompts: [
      'Pain onset, character, and duration',
      'Hemodynamic status and ECG/troponin context if available',
      'Pleuritic symptoms, dyspnea, hypoxia, or PE risk factors',
      'Trauma or chest wall tenderness',
      'Renal function and contrast contraindication if CT is being considered',
    ],
    commonRequisitionLanguage:
      'Patient with chest pain and [relevant features/risk factors]. Please assess for the most likely imaging-relevant cardiopulmonary or chest wall cause as appropriate.',
  },
  {
    id: 'cough-dyspnea',
    complaint: 'Cough / dyspnea',
    synonyms: ['shortness of breath', 'dyspnea', 'cough', 'pneumonia', 'respiratory infection', 'chronic cough'],
    relatedTopicIds: [
      'acute-respiratory-illness-in-immunocompetent-patients',
      'acute-respiratory-illness-in-immunocompromised-patients',
      'chronic-cough',
      'chronic-dyspnea-noncardiovascular-origin',
      'pneumonia-in-the-immunocompetent-child',
    ],
    missingInfoPrompts: [
      'Acute versus chronic duration',
      'Fever, sputum, hypoxia, chest pain, or hemoptysis',
      'Immunocompromised status or cancer history',
      'Smoking/COPD/asthma history when relevant',
      'Prior chest imaging and treatment response',
    ],
    commonRequisitionLanguage:
      'Patient with cough/dyspnea for [duration] with [key features]. Please assess for imaging-relevant cardiopulmonary abnormality.',
  },
  {
    id: 'msk-trauma',
    complaint: 'MSK trauma / acute joint pain',
    synonyms: ['injury', 'fall', 'fracture', 'ankle injury', 'wrist injury', 'shoulder pain', 'hip pain', 'acute joint pain'],
    relatedTopicIds: [
      'acute-hand-and-wrist-trauma',
      'acute-trauma-to-the-ankle',
      'acute-trauma-to-the-foot',
      'acute-shoulder-pain',
      'acute-hip-pain',
      'acute-elbow-and-forearm-pain',
    ],
    missingInfoPrompts: [
      'Body part and laterality',
      'Mechanism and timing of injury',
      'Focal bony tenderness, inability to weight bear, deformity, or neurovascular concern',
      'Prior surgery/hardware or prior fracture',
      'Persistent pain despite negative initial radiographs if applicable',
    ],
    commonRequisitionLanguage:
      'Patient with [body part/laterality] injury and [exam findings]. Please assess for acute osseous or joint abnormality on radiographs.',
  },

];

function normalizeComplaintText(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim();
}

export function searchClinicalMappings(query: string): ClinicalComplaintMapping[] {
  const normalized = normalizeComplaintText(query);

  if (!normalized) return [];

  const queryTerms = normalized.split(' ').filter((term) => term.length > 2);

  return clinicalComplaintMappings.filter((mapping) => {
    const phrases = [
      mapping.complaint,
      ...mapping.synonyms,
      ...mapping.relatedTopicIds,
      ...(mapping.suggestedVariantIds ?? []),
      ...mapping.missingInfoPrompts,
      mapping.commonRequisitionLanguage,
    ].map(normalizeComplaintText);

    const haystack = phrases.join(' ');
    const directPhraseMatch = phrases.some((phrase) => phrase.includes(normalized) || normalized.includes(phrase));
    const termMatch = queryTerms.length > 0 && queryTerms.every((term) => haystack.includes(term));

    return directPhraseMatch || termMatch;
  });
}
