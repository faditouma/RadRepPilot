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
          workflow(
            'xray-cxr-infection-dyspnea',
            'Chest X-ray: Infection / Dyspnea',
            'Consolidation, edema, effusion, pneumothorax, and support devices.',
            'implemented',
            'chestXray',
          ),
          workflow('xray-cxr-chf', 'CHF / Pulmonary Edema', 'Congestion, edema, effusions, and cardiac size.'),
          workflow('xray-cxr-pneumothorax', 'Pneumothorax', 'Side, size estimate, tension features, and chest tube status.'),
          workflow('xray-cxr-effusion', 'Pleural Effusion', 'Laterality, size, loculation clues, and adjacent opacity.'),
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
          workflow(
            'xray-msk-acute-fracture',
            'MSK X-ray: Acute Fracture',
            'Body part, laterality, fracture location, displacement, articular extension, and alignment.',
            'implemented',
            'mskXrayFracture',
          ),
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
          workflow('us-liver-transplant', 'Liver-Transplant Ultrasound', 'Graft morphology, transplant Doppler, biliary tree, collections, and urgent vascular findings.', 'implemented', 'liverTransplantUltrasound'),
          workflow(
            'us-ruq-biliary',
            'RUQ Pain / Cholecystitis',
            'Gallstones, wall thickening, Murphy sign, CBD caliber, and biliary obstruction.',
            'implemented',
            'ruqUltrasound',
            ['Incidental liver/renal support'],
          ),
          workflow('us-liver-lesion-incidental', 'Liver Lesion', 'Ultrasound liver lesion descriptors and follow-up-safe wording.', 'partial', undefined, ['LI-RADS context']),
          workflow('incidental-ascites', 'Ascites', 'Ascites volume and clinically useful caveats.'),
        ],
      },
      {
        name: 'Renal/Bladder',
        description: 'Hydronephrosis, stones, renal parenchyma, cysts/masses, and bladder volume.',
        workflows: [
          workflow('us-kidney-transplant', 'Kidney-Transplant Ultrasound', 'Graft morphology, collecting system, collections, arterial and venous Doppler, waveforms, and bladder.', 'implemented', 'kidneyTransplantUltrasound'),
          workflow('us-renal-bladder', 'Hydronephrosis / Stone / Retention', 'Hydronephrosis grade, stones, renal size, bladder volume, and PVR.'),
          workflow('us-renal-lesion-incidental', 'Incidental Renal Finding', 'Ultrasound renal cyst/mass characterization and follow-up-safe wording.', 'partial', undefined, ['Bosniak']),
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
          workflow(
            'us-adnexal-cyst',
            'Ovarian and Adnexal Cyst Ultrasound',
            'Origin, dimensions, cyst architecture, wall and solid features, Doppler flow, ascites, and peritoneal findings.',
            'implemented',
            'adnexalCystUltrasound',
            ['O-RADS user entry'],
          ),
        ],
      },
      {
        name: 'Thyroid',
        description: 'Nodule descriptors, TI-RADS-style scoring, and follow-up-ready wording.',
        workflows: [workflow('us-thyroid-tirads', 'Thyroid Ultrasound', 'Gland background, nodule location and size, complete sonographic descriptors, interval change, and cervical nodes.', 'implemented', 'thyroidUltrasound', ['TI-RADS'])],
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
          workflow('ct-traumatic-brain-injury', 'Traumatic Brain Injury', 'Hemorrhage, contusions, mass effect, fractures, vascular concern, and communication.', 'implemented', 'traumaticBrainInjury'),
          workflow('ct-head-stroke-aspects', 'Stroke / ASPECTS', 'Hemorrhage, early ischemic change, ASPECTS, and mass effect.', 'implemented', 'stroke', ['ASPECTS']),
          workflow('ct-mri-ni-rads', 'Head and Neck Surveillance (NI-RADS)', 'Primary-site and nodal surveillance with user-entered categories.', 'implemented', 'niRads', ['NI-RADS user entry']),
          workflow('ct-head-headache', 'Headache / Acute Intracranial Abnormality', 'Hemorrhage, hydrocephalus, mass effect, and comparison.'),
        ],
      },
      {
        name: 'Chest',
        description: 'PE, nodules, infection, screening categories, and chest incidental findings.',
        workflows: [
          workflow('ctpa-pe', 'CT Pulmonary Angiography', 'Technical quality, PE distribution and chronicity, right-heart findings, complications, and communication.', 'implemented', 'ctpa', ['RV/LV']),
          workflow('ct-tracheobronchomalacia', 'Tracheobronchomalacia CT', 'Dynamic airway caliber, collapse, morphology, distribution, air trapping, and confidence.', 'implemented', 'tracheobronchomalacia'),
          workflow('ct-fibrotic-lung-disease', 'Fibrotic Lung Disease HRCT', 'Distribution, fibrotic features, air trapping, emphysema, progression, and acute abnormalities.', 'implemented', 'fibroticLungDisease'),
          workflow('ctpa-pulmonary-hypertension', 'Pulmonary Hypertension CTPA', 'Pulmonary arteries, chronic thromboembolic signs, right heart, reflux, parenchymal and left-heart clues.', 'implemented', 'pulmonaryHypertensionCtpa'),
          workflow('ct-copd', 'COPD CT', 'Emphysema, airway disease, air trapping, bullae, fissures, nodules, and associated disease.', 'implemented', 'copdCt'),
          workflow('ct-cystic-lung-disease', 'Cystic Lung Disease HRCT', 'Cyst morphology, walls, size, distribution, associated lung and extrapulmonary findings, and differential.', 'implemented', 'cysticLungDisease'),
          workflow('ct-lung-cancer-screening', 'Lung Cancer Screening CT', 'Screening context, dominant and additional nodules, size/volume, image reference, growth, and incidentals.', 'implemented', 'lungCancerScreening', ['Lung-RADS user entry']),
          workflow('ct-viral-pneumonia', 'Viral-Pneumonia Chest CT', 'Adaptable viral pattern, distribution, extent, atypical findings, pleura, embolic assessment, and complications.', 'implemented', 'viralPneumoniaCt'),
          workflow('ct-chest-nodule', 'Pulmonary Nodule / Fleischner', 'Nodule type, size, risk, stability, and simplified follow-up.', 'implemented', 'nodule', ['Fleischner']),
          workflow(
            'ct-lung-cancer-staging',
            'Lung Cancer CT Staging',
            'Primary tumor, local invasion, separate pulmonary nodules, nodal stations, pleural/pericardial disease, and distant metastases.',
            'implemented',
            'lungCancerCt',
          ),
          workflow('lung-rads', 'Lung Cancer Screening / Lung-RADS', 'Screening nodule category preview and follow-up sentence.', 'partial', undefined, ['Lung-RADS']),
          workflow('ct-chest-pneumonia-ild-mass', 'Pneumonia / ILD / Mass', 'Parenchymal pattern, distribution, airway/pleura, and mass concern.'),
          workflow('incidental-thyroid-nodule', 'Incidental Thyroid Nodule', 'Size, suspicious features, lymph nodes, and ultrasound consideration.', 'partial', undefined, ['TI-RADS']),
        ],
      },
      {
        name: 'Abdomen/Pelvis',
        description: 'Acute abdomen workflows plus integrated incidental follow-up language.',
        workflows: [
          workflow(
            'ct-colonography',
            'CT Colonography',
            'Preparation and segmental distention quality, polyps or masses, strictures, incomplete segments, and extracolonic findings.',
            'implemented',
            'ctColonography',
            ['C-RADS user entry'],
          ),
          workflow(
            'ct-mr-enterography',
            'CT/MR Enterography',
            'Bowel distention, segmental mural inflammation, strictures, penetrating complications, mesentery, and extraintestinal findings.',
            'implemented',
            'enterography',
          ),
          workflow('ct-ap-appendicitis', 'Appendicitis', 'Appendix visualization, diameter, inflammatory change, and complications.', 'implemented', 'appendicitis'),
          workflow('ct-ap-diverticulitis', 'Diverticulitis', 'Segment, inflammation, abscess, perforation, fistula, and obstruction.'),
          workflow('ct-ap-bowel-obstruction', 'Bowel Obstruction', 'Transition point, grade, cause, ischemia, closed loop, and perforation.', 'implemented', 'bowelObstruction'),
          workflow('ct-ap-abdominal-pain', 'Abdominal Pain General', 'Bowel, solid organs, free fluid/air, urinary tract, and alternative diagnosis.'),
          workflow('incidental-adrenal-nodule', 'Incidental Adrenal Lesion', 'Adrenal follow-up wording and washout context.', 'partial', undefined, ['Adrenal washout']),
          workflow(
            'ct-mri-adrenal-incidentaloma',
            'Adrenal Incidentaloma CT/MRI',
            'Adrenal morphology, attenuation or chemical shift, interval change, and aggressive features with user-controlled synthesis.',
            'implemented',
            'adrenalIncidentaloma',
          ),
          workflow('ct-renal-lesion-incidental', 'Incidental Renal Lesion', 'CT renal cyst/mass characterization language.', 'partial', undefined, ['Bosniak']),
          workflow('ct-liver-lesion-incidental', 'Incidental Liver Lesion', 'CT liver lesion characterization and follow-up-safe wording.', 'partial', undefined, ['LI-RADS context']),
          workflow('incidental-pancreatic-cyst', 'Incidental Pancreatic Cyst', 'Cyst size and high-risk feature language.', 'partial'),
          workflow(
            'ct-mri-pancreatic-cyst',
            'Cystic Pancreatic Lesions CT/MRI',
            'Cyst morphology and size, duct communication, enhancing components, growth, obstruction, atrophy, and nodes.',
            'implemented',
            'pancreaticCyst',
          ),
          workflow(
            'ct-mri-pancreatitis',
            'Acute and Chronic Pancreatitis CT/MRI',
            'Parenchymal enhancement and necrosis, collections, ductal disease, calcification, vascular and biliary complications.',
            'implemented',
            'pancreatitis',
          ),
        ],
      },
      {
        name: 'GU/Renal',
        description: 'Renal colic, urinary obstruction, renal cysts/masses, and Bosniak context.',
        workflows: [
          workflow('ct-kub-renal-colic', 'CT KUB / Renal Colic', 'Stone size/location, obstruction, infection risk context, and alternatives.', 'implemented', 'renalColic'),
          workflow(
            'ct-renal-bosniak',
            'Renal Mass CT/MRI',
            'Mass composition and enhancement, local extension, venous thrombus, nodes, metastases, and surgical anatomy.',
            'implemented',
            'renalMass',
            ['Bosniak'],
          ),
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
        workflows: [
          workflow('ct-aorta', 'Dissection / Aneurysm', 'Aortic segments, dissection flap, branch involvement, rupture signs.', 'partial'),
          workflow('ct-aaa-postprocedure', 'AAA Postprocedural Surveillance', 'Sac change, graft integrity, endoleak, branch patency, and complications.', 'implemented', 'aaaPostprocedure'),
          workflow('ct-aaa-preprocedure', 'AAA Preprocedural Evaluation', 'Aneurysm, neck, branches, landing zones, access vessels, and rupture signs.', 'implemented', 'aaaPreprocedure'),
        ],
      },
      {
        name: 'Cardiovascular',
        description: 'Coronary, valve-planning, calcium, and functional coronary CT workflows.',
        workflows: [
          workflow('ct-coronary-angiography', 'Coronary CT Angiography', 'Origins, dominance, segment plaque and stenosis, stents, grafts, and cardiac findings.', 'implemented', 'coronaryCta', ['CAD-RADS user entry']),
          workflow('ct-tavi-planning', 'TAVI Planning CTA', 'Annulus, coronary heights, root, fluoroscopic angle, and access anatomy.', 'implemented', 'taviPlanningCta'),
          workflow('ct-coronary-calcium-score', 'Coronary Artery Calcium Scoring', 'Vessel and total Agatston scores, optional percentile, and incidental findings.', 'implemented', 'calciumScore', ['CAC category user entry']),
          workflow('ct-fractional-flow-reserve', 'Fractional Flow Reserve CT', 'Source adequacy, lesion, standardized value, nadir, and pressure-drop pattern.', 'implemented', 'ffrCt'),
        ],
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
          workflow(
            'ct-mri-pancreatic-cancer',
            'Pancreatic Cancer Staging',
            'Primary tumor, ductal obstruction, vessel contact, local invasion, nodes, metastases, and surgical anatomy.',
            'implemented',
            'pancreaticCancer',
          ),
          workflow(
            'ct-mri-ovarian-cancer',
            'Ovarian Cancer Staging',
            'Adnexal primary, peritoneal disease by compartment, nodes, bowel/mesentery, pleural and distant disease, and surgical limiting sites.',
            'implemented',
            'ovarianCancer',
          ),
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
          workflow('mri-brain-tumor', 'Brain Tumor MRI', 'Enhancing and nonenhancing disease, advanced imaging, edema, mass effect, spread, and interval response.', 'implemented', 'brainTumorMri'),
          workflow('mri-brain-stroke', 'Brain Stroke', 'DWI/ADC, hemorrhage-sensitive sequence, vascular territory, and chronic disease.'),
          workflow('mri-brain-mass', 'Brain Mass', 'Enhancement, edema, mass effect, and location.'),
          workflow('mri-multiple-sclerosis', 'Multiple Sclerosis MRI', 'Protocol, lesion distribution, activity, comparison, and spine findings.', 'implemented', 'multipleSclerosisMri'),
          workflow('mri-dementia', 'Dementia MRI', 'Atrophy pattern, vascular burden, microbleeds, hydrocephalus, and cautious synthesis.', 'implemented', 'dementiaMri'),
          workflow('mri-brain-seizure', 'Seizure', 'Hippocampi, cortical malformation, mass, and gliosis.'),
        ],
      },
      {
        name: 'Cardiac',
        description: 'Chamber function, wall motion, tissue characterization, and cardiomyopathy phenotype.',
        workflows: [
          workflow('mri-cardiomyopathy', 'Cardiac MRI for Adult Cardiomyopathy', 'Indexed ventricular function, tissue characterization, thrombus, and phenotype synthesis.', 'implemented', 'cardiomyopathyMri'),
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
        description: 'Multiparametric prostate MRI lesion characterization and local staging.',
        workflows: [
          workflow(
            'mri-prostate-pirads',
            'Prostate MRI',
            'Gland volume, lesion location and sequences, user-assigned PI-RADS, local extension, nodes, and bone.',
            'implemented',
            'prostateMri',
            ['PI-RADS'],
          ),
        ],
      },
      {
        name: 'Liver/Abdomen',
        description: 'LI-RADS context, liver lesions, adrenal/renal characterization, and MRCP placeholders.',
        workflows: [
          workflow('ct-mri-living-donor-liver', 'Living-Donor Liver Evaluation', 'Liver volumetry, vascular and biliary variants, surgical planes, and venous drainage.', 'implemented', 'livingDonorLiver'),
          workflow(
            'mri-liver-lirads',
            'Hepatocellular Carcinoma CT/MRI',
            'Liver background, phase adequacy, observation features, tumor in vein, treatment response, portal hypertension, and extrahepatic disease.',
            'implemented',
            'hccLiver',
            ['LI-RADS', 'OPTN'],
          ),
          workflow(
            'mri-hilar-cholangiocarcinoma',
            'Hilar Cholangiocarcinoma CT/MRI',
            'Ductal extent, lobar atrophy, portal and arterial relationships, biliary anatomy, local invasion, nodes, and metastases.',
            'implemented',
            'hilarCholangiocarcinoma',
          ),
        ],
      },
      {
        name: 'Pelvis/Rectal',
        description: 'Rectal cancer staging and pelvic lesion descriptors.',
        workflows: [
          workflow(
            'mri-fibroid',
            'Fibroid MRI',
            'Uterine and dominant fibroid measurements, endometrial and serosal relationships, morphology, adenomyosis, and treatment-planning anatomy.',
            'implemented',
            'fibroidMri',
            ['FIGO user entry'],
          ),
          workflow(
            'mri-pelvic-floor-dysfunction',
            'Pelvic Floor Dysfunction Imaging',
            'Dynamic measurements, anterior/middle/posterior compartment descent, evacuation, and puborectalis behavior.',
            'implemented',
            'pelvicFloorImaging',
          ),
          workflow(
            'mri-endometriosis',
            'Endometriosis MRI',
            'Endometriomas, deep disease by compartment, bowel and urinary involvement, adhesions, obstruction, and surgical mapping.',
            'implemented',
            'endometriosisMri',
          ),
          workflow(
            'mri-placenta-accreta',
            'Placenta Accreta Spectrum MRI',
            'Placental location and previa, myometrial and vascular signs, bladder/parametrial/cervical interfaces, orientation, and confidence.',
            'implemented',
            'placentaAccretaMri',
          ),
          workflow(
            'mri-perianal-fistula',
            'Perianal Fistulizing Disease MRI',
            'Internal and external openings, sphincter relationships, secondary tracts, collections, extensions, and activity.',
            'implemented',
            'perianalFistulaMri',
          ),
          workflow(
            'mri-rectal-cancer',
            'Rectal Cancer MRI',
            'Tumor height and extent, mesorectal fascia, sphincter complex, EMVI, nodes, deposits, and response.',
            'implemented',
            'rectalCancerMri',
          ),
          workflow(
            'mri-endometrial-cancer',
            'Endometrial Cancer MRI',
            'Primary tumor, myometrial and cervical stromal invasion, extrauterine extension, nodes, and distant disease.',
            'implemented',
            'endometrialCancerMri',
          ),
          workflow(
            'mri-cervical-cancer',
            'Cervical Cancer MRI',
            'Primary tumor, vaginal and parametrial extent, pelvic sidewall, adjacent organs, urinary obstruction, nodes, and distant disease.',
            'implemented',
            'cervicalCancerMri',
          ),
        ],
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
        workflows: [workflow('mammo-diagnostic-birads', 'Diagnostic BI-RADS', 'Finding descriptors and category placeholder.', 'partial', undefined, ['BI-RADS'])],
      },
      {
        name: 'Breast Ultrasound',
        description: 'Breast mass morphology and BI-RADS-ready descriptors.',
        workflows: [workflow('breast-us-mass', 'Breast Mass Ultrasound', 'Shape, margin, orientation, echogenicity, and posterior features.', 'partial', undefined, ['BI-RADS'])],
      },
      {
        name: 'Breast MRI',
        description: 'MRI finding descriptors and BI-RADS context.',
        workflows: [workflow('mri-breast-birads', 'Breast MRI BI-RADS', 'Mass or non-mass enhancement descriptors and comparison.', 'partial', undefined, ['BI-RADS'])],
      },
      {
        name: 'BI-RADS',
        description: 'Clickable prototype category support with strict verification warning.',
        workflows: [workflow('breast-birads-preview', 'BI-RADS Preview Helper', 'Prototype category suggestion from user-entered breast imaging descriptors.', 'partial', undefined, ['BI-RADS'])],
      },
    ],
  },
  {
    name: 'Nuclear Medicine',
    iconName: 'nuclear',
    description: 'Structured PET/CT oncology reporting and planned endocrine nuclear medicine workflows.',
    bodySystems: [
      {
        name: 'Oncology',
        description: 'PET/CT staging and response assessment workflows.',
        workflows: [
          workflow(
            'pet-ct-lymphoma',
            'Lymphoma PET-CT',
            'Nodal and extranodal disease distribution, reference activity, interval change, and response synthesis.',
            'implemented',
            'lymphomaPetCt',
          ),
        ],
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
