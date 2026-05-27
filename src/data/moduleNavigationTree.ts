import type { ModuleType } from '../radrep/types';

export type NavigationStatus = 'implemented' | 'partial' | 'planned';

export interface NavigationWorkflow {
  id: string;
  moduleId: string;
  title: string;
  description: string;
  status: NavigationStatus;
  moduleType?: ModuleType;
  toolBadges?: string[];
}

export interface NavigationBodySystem {
  name: string;
  description: string;
  workflows: NavigationWorkflow[];
}

export interface NavigationModality {
  name: string;
  description: string;
  iconName: string;
  bodySystems: NavigationBodySystem[];
}

function workflow(
  moduleId: string,
  title: string,
  description: string,
  status: NavigationStatus = 'planned',
  moduleType?: ModuleType,
  toolBadges: string[] = [],
): NavigationWorkflow {
  return { id: moduleType ?? moduleId, moduleId, title, description, status, moduleType, toolBadges };
}

export const moduleNavigationTree: NavigationModality[] = [
  {
    name: 'X-ray',
    iconName: 'xray',
    description: 'Fast structured reports for common radiographic questions.',
    bodySystems: [
      {
        name: 'Chest',
        description: 'Airspace disease, edema, pleural findings, pneumothorax, and support devices.',
        workflows: [
          workflow('xray-cxr-pneumonia', 'Pneumonia / Infection', 'Opacity pattern, complications, and follow-up-ready impression.'),
          workflow('xray-cxr-chf', 'CHF / Pulmonary Edema', 'Congestion, edema, effusions, and cardiac size.'),
          workflow('xray-cxr-pneumothorax', 'Pneumothorax', 'Side, size estimate, tension features, and chest tube status.'),
          workflow('xray-cxr-effusion', 'Pleural Effusion', 'Laterality, size, loculation clues, and adjacent opacity.'),
          workflow('xray-cxr-lines', 'Line / Tube Placement', 'Support device positions and complication check.'),
        ],
      },
      {
        name: 'Abdomen',
        description: 'Bowel gas pattern, obstruction, ileus, and stool burden.',
        workflows: [
          workflow('xray-abd-obstruction', 'Bowel Obstruction / Ileus', 'Dilation pattern, air-fluid levels, rectal gas, and free air screen.'),
          workflow('xray-abd-constipation', 'Constipation / Fecal Loading', 'Stool burden, rectal stool ball, caliber, and obstruction exclusions.'),
        ],
      },
      {
        name: 'MSK',
        description: 'Fracture, alignment, arthritis, hardware, and soft tissue checks.',
        workflows: [
          workflow('xray-msk-trauma', 'Trauma / Fracture', 'Fracture location, displacement, articular extension, and alignment.'),
          workflow('xray-msk-arthritis', 'Arthritis / Degenerative Disease', 'Joint space, osteophytes, erosions, and alignment.'),
        ],
      },
      {
        name: 'Spine',
        description: 'Alignment, vertebral height, trauma, and degenerative change.',
        workflows: [workflow('xray-spine-trauma', 'Trauma / Alignment', 'Alignment, vertebral body height, and acute osseous concern.')],
      },
      {
        name: 'Lines/Tubes',
        description: 'Support device location and post-procedure complication checks.',
        workflows: [workflow('xray-cxr-lines', 'Chest Line / Tube Placement', 'ETT, enteric tube, central line, and pneumothorax check.')],
      },
    ],
  },
  {
    name: 'Ultrasound',
    iconName: 'ultrasound',
    description: 'Focused ultrasound workflows with measurements and follow-up language.',
    bodySystems: [
      {
        name: 'Abdomen/RUQ',
        description: 'Gallbladder, biliary tree, liver, ascites, and visualized renal findings.',
        workflows: [
          workflow(
            'us-ruq-biliary',
            'RUQ Pain / Cholecystitis',
            'Gallstones, wall thickening, Murphy sign, CBD caliber, and biliary obstruction.',
            'implemented',
            'ruqUltrasound',
            ['Incidental liver/renal support'],
          ),
          workflow('incidental-liver-lesion', 'Liver Lesion', 'Incidental liver lesion descriptors and follow-up-safe wording.', 'partial', undefined, ['LI-RADS context']),
          workflow('us-ruq-biliary', 'Abnormal LFTs / Biliary Dilation', 'Biliary dilation, duct measurement, and cholestatic lab correlation.'),
          workflow('incidental-ascites', 'Ascites', 'Ascites volume and clinically useful caveats.'),
        ],
      },
      {
        name: 'Renal/Bladder',
        description: 'Hydronephrosis, stones, renal parenchyma, cysts/masses, and bladder volume.',
        workflows: [
          workflow('us-renal-bladder', 'Hydronephrosis / Stone / Retention', 'Hydronephrosis grade, stones, renal size, bladder volume, and PVR.'),
          workflow('incidental-renal-lesion', 'Incidental Renal Finding', 'Renal cyst/mass follow-up language and Bosniak context.', 'partial', undefined, ['Bosniak']),
        ],
      },
      {
        name: 'Pelvic/Gynecology',
        description: 'Adnexa, uterus, bleeding, torsion concern, pregnancy location, and free fluid.',
        workflows: [
          workflow('us-pelvic-pain', 'Pelvic Pain / Adnexal Lesion', 'Ovarian size, Doppler context, cyst/mass morphology, and free fluid.'),
          workflow('us-pelvic-aub', 'Abnormal Uterine Bleeding', 'Endometrium, fibroids/polyps, ovaries, and menopausal context.'),
          workflow('us-early-pregnancy', 'Early Pregnancy / Ectopic Concern', 'Pregnancy location, viability markers, adnexa, and free fluid.'),
          workflow('incidental-adnexal-cyst', 'Incidental Adnexal Cyst', 'Adnexal cyst wording and O-RADS context.', 'partial', undefined, ['O-RADS']),
        ],
      },
      {
        name: 'Thyroid',
        description: 'Nodule descriptors, TI-RADS-style scoring, and follow-up-ready wording.',
        workflows: [workflow('us-thyroid-tirads', 'Thyroid Nodule / TI-RADS', 'Composition, echogenicity, margins, foci, and size.', 'partial', undefined, ['TI-RADS'])],
      },
      {
        name: 'Scrotal',
        description: 'Perfusion, epididymis, hydrocele/varicocele, and mass descriptors.',
        workflows: [workflow('us-scrotal', 'Torsion / Epididymitis / Mass', 'Testicular flow, epididymal findings, and focal mass language.')],
      },
      {
        name: 'Vascular/DVT',
        description: 'Compression and Doppler workflows for venous thrombosis.',
        workflows: [
          workflow(
            'us-dvt',
            'Lower-Limb DVT',
            'Compressibility, thrombus location, acuity, and superficial thrombophlebitis.',
            'implemented',
            'dvtUltrasound',
          ),
          workflow('us-dvt-superficial', 'Superficial Thrombophlebitis', 'Superficial venous thrombus and assessed deep vein exclusions.', 'partial'),
        ],
      },
      {
        name: 'Soft Tissue',
        description: 'Lumps, collections, edema, foreign bodies, and vascularity descriptors.',
        workflows: [workflow('us-soft-tissue-lump', 'Soft Tissue Lump', 'Location, size, cystic/solid features, vascularity, and infection signs.')],
      },
    ],
  },
  {
    name: 'CT',
    iconName: 'ct',
    description: 'High-yield CT workflows for acute care, chest, abdomen, GU, vascular, and oncology reporting.',
    bodySystems: [
      {
        name: 'Neuro/Head',
        description: 'Stroke, trauma, headache, hemorrhage, mass effect, and ASPECTS support.',
        workflows: [
          workflow('ct-head-trauma', 'Head Trauma', 'Hemorrhage, fracture, mass effect, and extra-axial collection.'),
          workflow('ct-head-stroke-aspects', 'Stroke / ASPECTS', 'Hemorrhage, early ischemic change, ASPECTS, and mass effect.', 'implemented', 'stroke', ['ASPECTS']),
          workflow('ct-head-headache', 'Headache / Acute Intracranial Abnormality', 'Hemorrhage, hydrocephalus, mass effect, and comparison.'),
        ],
      },
      {
        name: 'Chest',
        description: 'PE, nodules, infection, screening categories, and chest incidental findings.',
        workflows: [
          workflow('ctpa-pe', 'CTPA Pulmonary Embolism', 'PE presence, most proximal level, RV/LV ratio, infarct, and effusion.', 'implemented', 'ctpa', ['RV/LV']),
          workflow('ct-chest-nodule', 'Pulmonary Nodule / Fleischner', 'Nodule type, size, risk, stability, and simplified follow-up.', 'implemented', 'nodule', ['Fleischner']),
          workflow('lung-rads', 'Lung Cancer Screening / Lung-RADS', 'Screening nodule category preview and follow-up sentence.', 'partial', undefined, ['Lung-RADS']),
          workflow('ct-chest-pneumonia-ild-mass', 'Pneumonia / ILD / Mass', 'Parenchymal pattern, distribution, airway/pleura, and mass concern.'),
          workflow('incidental-thyroid-nodule', 'Incidental Thyroid Nodule', 'Size, suspicious features, lymph nodes, and ultrasound consideration.', 'partial', undefined, ['TI-RADS']),
          workflow('incidental-adrenal-nodule', 'Incidental Adrenal Nodule', 'Adrenal size, HU, homogeneity, stability, and washout context.', 'partial', undefined, ['Adrenal washout']),
        ],
      },
      {
        name: 'Abdomen/Pelvis',
        description: 'Acute abdomen workflows plus integrated incidental follow-up language.',
        workflows: [
          workflow('ct-ap-appendicitis', 'Appendicitis', 'Appendix visualization, diameter, inflammatory change, and complications.', 'implemented', 'appendicitis'),
          workflow('ct-ap-diverticulitis', 'Diverticulitis', 'Segment, inflammation, abscess, perforation, fistula, and obstruction.'),
          workflow('ct-ap-bowel-obstruction', 'Bowel Obstruction', 'Transition point, grade, cause, ischemia, closed loop, and perforation.', 'implemented', 'bowelObstruction'),
          workflow('ct-ap-abdominal-pain', 'Abdominal Pain General', 'Bowel, solid organs, free fluid/air, urinary tract, and alternative diagnosis.'),
          workflow('ct-trauma-cap', 'Trauma Abdomen/Pelvis', 'Solid organ injury, bowel/mesentery, active bleeding, pelvis, and spine.'),
          workflow('incidental-adrenal-nodule', 'Incidental Adrenal Lesion', 'Adrenal follow-up wording and washout context.', 'partial', undefined, ['Adrenal washout']),
          workflow('incidental-renal-lesion', 'Incidental Renal Lesion', 'Renal cyst/mass characterization language.', 'partial', undefined, ['Bosniak']),
          workflow('incidental-liver-lesion', 'Incidental Liver Lesion', 'Risk-based liver lesion follow-up wording.', 'partial', undefined, ['LI-RADS context']),
          workflow('incidental-pancreatic-cyst', 'Incidental Pancreatic Cyst', 'Cyst size and high-risk feature language.', 'partial'),
        ],
      },
      {
        name: 'GU/Renal',
        description: 'Renal colic, urinary obstruction, renal cysts/masses, and Bosniak context.',
        workflows: [
          workflow('ct-kub-renal-colic', 'CT KUB / Renal Colic', 'Stone size/location, obstruction, infection risk context, and alternatives.', 'implemented', 'renalColic'),
          workflow('ct-renal-bosniak', 'Renal Mass / Cyst / Bosniak', 'Cystic renal lesion features and simplified Bosniak support.', 'partial', undefined, ['Bosniak']),
        ],
      },
      {
        name: 'Spine',
        description: 'Trauma, stenosis, infection, and malignancy checklists.',
        workflows: [workflow('ct-cspine-trauma', 'C-Spine Trauma', 'Alignment, fracture, prevertebral soft tissues, and canal stenosis.')],
      },
      {
        name: 'Vascular/Aorta',
        description: 'Aortic syndrome, aneurysm, rupture, and follow-up language.',
        workflows: [workflow('ct-aorta', 'Dissection / Aneurysm', 'Aortic segments, dissection flap, branch involvement, rupture signs.', 'partial', undefined, ['CAD-RADS context'])],
      },
      {
        name: 'Trauma',
        description: 'Whole-body trauma checklist and urgent finding language.',
        workflows: [workflow('ct-trauma-cap', 'Trauma Chest/Abdomen/Pelvis', 'Thoracic, solid organ, bowel/mesentery, pelvic, and spine injury.')],
      },
      {
        name: 'Oncology',
        description: 'Response assessment, target lesions, and treatment comparison language.',
        workflows: [
          workflow('oncology-recist', 'RECIST 1.1 Measurement Tracker', 'Target lesion sums, percent change, and simplified category.', 'partial', undefined, ['RECIST']),
          workflow('oncology-response', 'Treatment Response Comparison', 'Tumor burden, new lesions, non-target disease, and overall impression.'),
        ],
      },
    ],
  },
  {
    name: 'MRI',
    iconName: 'mri',
    description: 'MRI modules for neuro, spine, MSK, prostate, liver, pelvis, breast, and oncology.',
    bodySystems: [
      {
        name: 'Brain',
        description: 'Stroke, mass, demyelination, seizure, and comparison-ready descriptors.',
        workflows: [
          workflow('mri-brain-stroke', 'Brain Stroke', 'DWI/ADC, hemorrhage-sensitive sequence, vascular territory, and chronic disease.'),
          workflow('mri-brain-mass', 'Brain Mass', 'Enhancement, edema, mass effect, and location.'),
          workflow('mri-brain-ms', 'Demyelination / MS', 'Distribution, enhancement, and comparison.'),
          workflow('mri-brain-seizure', 'Seizure', 'Hippocampi, cortical malformation, mass, and gliosis.'),
        ],
      },
      {
        name: 'Spine',
        description: 'Degeneration, cauda equina, infection, malignancy, and urgent communication.',
        workflows: [
          workflow('mri-lumbar-radiculopathy', 'Radiculopathy / Degenerative Disease', 'Level-by-level disc and stenosis language.'),
          workflow('mri-spine-cauda', 'Cauda Equina', 'Canal stenosis, disc herniation, and cauda equina compression.'),
          workflow('mri-spine-infection-malignancy', 'Infection / Malignancy', 'Marrow, endplates, epidural disease, and paraspinal soft tissues.'),
        ],
      },
      {
        name: 'MSK',
        description: 'Meniscus, ligament, rotator cuff, marrow, cartilage, and effusion workflows.',
        workflows: [
          workflow('mri-knee', 'Knee Internal Derangement', 'Menisci, cruciates/collaterals, cartilage, marrow, and effusion.'),
          workflow('mri-shoulder', 'Shoulder Rotator Cuff / Labrum', 'Tear thickness, retraction, atrophy, labrum, and biceps.'),
        ],
      },
      {
        name: 'Prostate',
        description: 'PI-RADS preview support and staging descriptors.',
        workflows: [workflow('mri-prostate-pirads', 'PI-RADS', 'Zone, DWI/T2/DCE, size, EPE, and report sentence.', 'partial', undefined, ['PI-RADS'])],
      },
      {
        name: 'Liver/Abdomen',
        description: 'LI-RADS context, liver lesions, adrenal/renal characterization, and MRCP placeholders.',
        workflows: [
          workflow('mri-liver-lirads', 'LI-RADS', 'HCC-risk context, observation size, major features, and category sentence.', 'partial', undefined, ['LI-RADS']),
          workflow('incidental-pancreatic-cyst', 'Pancreatic Cyst / MRCP Follow-up', 'Cyst size, duct dilation, mural nodule, and surveillance wording.', 'partial'),
        ],
      },
      {
        name: 'Pelvis/Rectal',
        description: 'Rectal cancer staging and pelvic lesion descriptors.',
        workflows: [workflow('mri-rectal-cancer', 'Rectal Cancer Staging', 'Tumor height, T stage, MRF, EMVI, and nodes.')],
      },
      {
        name: 'Breast',
        description: 'Breast MRI descriptors and BI-RADS context.',
        workflows: [workflow('breast-birads', 'Breast MRI / BI-RADS', 'Enhancement pattern, lesion type, comparison, and category placeholder.', 'partial', undefined, ['BI-RADS'])],
      },
    ],
  },
  {
    name: 'Mammography/Breast',
    iconName: 'mammography',
    description: 'Breast imaging workflow previews and BI-RADS support.',
    bodySystems: [
      {
        name: 'Screening',
        description: 'Screening callback reasons and comparison-aware language.',
        workflows: [workflow('breast-screen-callback', 'Screening Callback', 'Asymmetry, mass, calcifications, location, and additional views.')],
      },
      {
        name: 'Diagnostic Mammography',
        description: 'Mass, calcification, distortion, asymmetry, and assessment language.',
        workflows: [workflow('breast-birads', 'Diagnostic BI-RADS', 'Finding descriptors and category placeholder.', 'partial', undefined, ['BI-RADS'])],
      },
      {
        name: 'Breast Ultrasound',
        description: 'Breast mass morphology and BI-RADS-ready descriptors.',
        workflows: [workflow('breast-us-mass', 'Breast Mass Ultrasound', 'Shape, margin, orientation, echogenicity, and posterior features.', 'partial', undefined, ['BI-RADS'])],
      },
      {
        name: 'Breast MRI',
        description: 'MRI finding descriptors and BI-RADS context.',
        workflows: [workflow('breast-birads', 'Breast MRI BI-RADS', 'Mass or non-mass enhancement descriptors and comparison.', 'partial', undefined, ['BI-RADS'])],
      },
      {
        name: 'BI-RADS',
        description: 'Clickable prototype category support with strict verification warning.',
        workflows: [workflow('breast-birads', 'BI-RADS Preview Helper', 'Prototype category suggestion from user-entered breast imaging descriptors.', 'partial', undefined, ['BI-RADS'])],
      },
    ],
  },
  {
    name: 'Nuclear Medicine',
    iconName: 'nuclear',
    description: 'Planned nuclear medicine structured reporting workflows.',
    bodySystems: [
      {
        name: 'Oncology',
        description: 'Planned PET/CT response and surveillance workflows.',
        workflows: [workflow('nuc-med-pet-response', 'PET/CT Response Preview', 'Target lesions, uptake pattern, and comparison language.')],
      },
      {
        name: 'Endocrine',
        description: 'Planned thyroid/parathyroid nuclear medicine workflows.',
        workflows: [workflow('nuc-med-thyroid', 'Thyroid / Parathyroid Preview', 'Tracer distribution and localization language.')],
      },
    ],
  },
  {
    name: 'Interventional Radiology',
    iconName: 'ir',
    description: 'Planned procedural reporting and post-procedure language.',
    bodySystems: [
      {
        name: 'Vascular',
        description: 'Access, device, complication, and post-procedure recommendation language.',
        workflows: [workflow('ir-vascular-procedure', 'Vascular Procedure Preview', 'Access site, device position, completion imaging, and complications.')],
      },
      {
        name: 'Drainage/Biopsy',
        description: 'Procedure indication, specimen/drain details, and complication checks.',
        workflows: [workflow('ir-drain-biopsy', 'Drainage / Biopsy Preview', 'Target, guidance, specimen/drain, and immediate complication language.')],
      },
    ],
  },
  {
    name: 'Oncology/Response Assessment',
    iconName: 'oncology',
    description: 'Measurement, comparison, and response assessment cockpit.',
    bodySystems: [
      {
        name: 'RECIST / Solid Tumors',
        description: 'Target lesion measurement and simplified response language.',
        workflows: [workflow('oncology-recist', 'RECIST 1.1 Tracker', 'Target lesion sums, percent change, and simplified response category.', 'partial', undefined, ['RECIST'])],
      },
      {
        name: 'Treatment Comparison',
        description: 'Structured tumor burden and non-target disease comparison.',
        workflows: [workflow('oncology-response', 'Treatment Response Comparison', 'Target disease, non-target disease, new lesions, and overall impression.')],
      },
    ],
  },
];
