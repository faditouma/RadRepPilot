import type { ReferralOption } from '../../radrep/types';
import type { ReportingWorkflowSchema, WorkflowField, WorkflowValues } from '../reportingWorkflowSchemas';

const assessment: ReferralOption[] = [
  { value: '', label: 'Select assessment…' },
  { value: 'absent', label: 'Absent' },
  { value: 'present', label: 'Present' },
  { value: 'indeterminate', label: 'Indeterminate' },
  { value: 'not assessed', label: 'Not assessed' },
];
const quality: ReferralOption[] = [
  { value: '', label: 'Select quality…' },
  { value: 'diagnostic', label: 'Diagnostic' },
  { value: 'limited', label: 'Limited' },
  { value: 'nondiagnostic', label: 'Nondiagnostic' },
];
const enhancement: ReferralOption[] = [
  { value: '', label: 'Select appearance…' },
  { value: 'absent', label: 'Absent' },
  { value: 'nonrim arterial phase hyperenhancement', label: 'Nonrim arterial-phase hyperenhancement' },
  { value: 'rim arterial phase hyperenhancement', label: 'Rim arterial-phase hyperenhancement' },
  { value: 'other enhancement', label: 'Other enhancement' },
  { value: 'indeterminate', label: 'Indeterminate' },
  { value: 'not assessed', label: 'Not assessed' },
];
const treatedStatus: ReferralOption[] = [
  { value: '', label: 'Select treatment status…' },
  { value: 'untreated', label: 'Untreated observation' },
  { value: 'treated', label: 'Treated observation' },
];
const response: ReferralOption[] = [
  { value: '', label: 'Select response appearance…' },
  { value: 'no masslike enhancement', label: 'No masslike enhancement' },
  { value: 'residual or recurrent masslike enhancement', label: 'Residual/recurrent masslike enhancement' },
  { value: 'equivocal enhancement', label: 'Equivocal enhancement' },
  { value: 'not assessed', label: 'Not assessed' },
];
const text = (id: string, label: string, placeholder = '', wide = false): WorkflowField => ({ id, label, type: 'text', placeholder, wide });
const area = (id: string, label: string, placeholder = ''): WorkflowField => ({ id, label, type: 'textarea', placeholder, wide: true });
const number = (id: string, label: string, suffix?: string): WorkflowField => ({ id, label, type: 'number', suffix });
const select = (id: string, label: string, options: ReferralOption[]): WorkflowField => ({ id, label, type: 'select', options });

const defaults: WorkflowValues = {
  clinicalIndication: '', riskContext: '', treatmentHistory: '', comparisonStudy: '', comparisonDate: '',
  modalityProtocol: '', examQuality: '', arterialPhaseAdequacy: '', portalVenousPhaseAdequacy: '',
  delayedPhaseAdequacy: '', technicalLimitations: '', liverBackground: '', observationStatus: '',
  observationNumber: '', segment: '', sizeApMm: '', sizeTrMm: '', sizeCcMm: '', treatmentStatus: '',
  arterialEnhancement: '', washout: '', capsule: '', thresholdGrowth: '', ancillaryFeatures: '',
  tumorInVein: '', tumorInVeinDetails: '', treatmentResponse: '', userAssignedLirads: '',
  userAssignedOptn: '', portalHypertension: '', portalHypertensionDetails: '', suspiciousNodes: '',
  suspiciousNodeDetails: '', extrahepaticMetastases: '', extrahepaticMetastasisDetails: '',
  additionalObservations: '', additionalFindings: '', incidentalFindings: '', limitationsUncertainty: '',
  findingsOverride: '', impressionOverride: '',
};

export const hccLiverWorkflowSchema: ReportingWorkflowSchema = {
  moduleType: 'hccLiver',
  moduleId: 'mri-liver-lirads',
  title: 'Hepatocellular Carcinoma CT/MRI',
  shortTitle: 'HCC CT/MRI',
  modality: 'CT/MRI',
  bodySystem: 'Oncology',
  clinicalQuestion: 'Characterize liver observations in an at-risk patient, including major imaging features, vascular invasion, treatment response, and extrahepatic disease.',
  techniqueDefault: 'Multiphase liver CT/MRI was performed with arterial, portal venous, and delayed phase imaging as available.',
  badges: ['Implemented', 'Educational draft', 'Observation mapping'],
  insertTargets: ['findings', 'impression', 'incidentalFindings', 'recommendations'],
  safetyNote: 'Verify at-risk population applicability, phase timing, every observation, tumor-in-vein findings, treatment history, and any user-assigned LI-RADS or OPTN category. No category or management recommendation is generated automatically.',
  contentMetadata: {
    sourceChapter: 'Chapter 10: Hepatocellular carcinoma',
    sourceType: 'Private development reference',
    guidelineOrClassificationName: 'LI-RADS and OPTN',
    guidelineVersion: 'Current official versions require primary-source verification',
    lastReviewedDate: '2026-07-24',
    reviewStatus: 'needs_clinical_review',
    clinicalValidationRequired: true,
  },
  defaultValues: defaults,
  sections: [
    {
      id: 'clinical-context', title: 'Clinical context', defaultOpen: true,
      fields: [
        area('clinicalIndication', 'Clinical indication', 'HCC screening, observation characterization, staging, or treatment response'),
        area('riskContext', 'HCC risk context', 'Cirrhosis, chronic liver disease, transplant status, or other eligibility context'),
        area('treatmentHistory', 'Treatment history', 'Ablation, embolization, radiation, resection, transplant, or systemic therapy'),
        text('comparisonStudy', 'Comparison examination'), { id: 'comparisonDate', label: 'Comparison date', type: 'date' },
      ],
    },
    {
      id: 'technical-quality', title: 'Protocol and technical quality', defaultOpen: true,
      fields: [
        text('modalityProtocol', 'Modality and protocol', 'e.g. multiphase liver MRI', true),
        select('examQuality', 'Examination quality', quality),
        select('arterialPhaseAdequacy', 'Arterial phase adequacy', assessment),
        select('portalVenousPhaseAdequacy', 'Portal venous phase adequacy', assessment),
        select('delayedPhaseAdequacy', 'Delayed phase adequacy', assessment),
        area('technicalLimitations', 'Technical limitations', 'Phase timing, motion, subtraction limitation, or other issue'),
        area('liverBackground', 'Background liver', 'Morphology, steatosis, iron, fibrosis/cirrhosis, and relevant diffuse findings'),
      ],
    },
    {
      id: 'dominant-observation', title: 'Dominant observation', defaultOpen: true,
      fields: [
        select('observationStatus', 'Focal liver observation', assessment),
        { ...text('observationNumber', 'Observation identifier', 'e.g. Observation 1'), visibleWhen: { field: 'observationStatus', equals: ['present', 'indeterminate'] } },
        { ...text('segment', 'Liver segment', 'e.g. segment 8'), visibleWhen: { field: 'observationStatus', equals: ['present', 'indeterminate'] } },
        { ...number('sizeApMm', 'AP dimension', 'mm'), visibleWhen: { field: 'observationStatus', equals: ['present', 'indeterminate'] } },
        { ...number('sizeTrMm', 'Transverse dimension', 'mm'), visibleWhen: { field: 'observationStatus', equals: ['present', 'indeterminate'] } },
        { ...number('sizeCcMm', 'Craniocaudal dimension', 'mm'), visibleWhen: { field: 'observationStatus', equals: ['present', 'indeterminate'] } },
        { ...select('treatmentStatus', 'Observation treatment status', treatedStatus), visibleWhen: { field: 'observationStatus', equals: ['present', 'indeterminate'] } },
        { ...select('arterialEnhancement', 'Arterial-phase enhancement', enhancement), visibleWhen: { field: 'observationStatus', equals: ['present', 'indeterminate'] } },
        { ...select('washout', 'Washout appearance', assessment), visibleWhen: { field: 'observationStatus', equals: ['present', 'indeterminate'] } },
        { ...select('capsule', 'Enhancing capsule appearance', assessment), visibleWhen: { field: 'observationStatus', equals: ['present', 'indeterminate'] } },
        { ...select('thresholdGrowth', 'Threshold growth', assessment), visibleWhen: { field: 'observationStatus', equals: ['present', 'indeterminate'] } },
        { ...area('ancillaryFeatures', 'Ancillary and other features', 'Diffusion, T2 signal, fat, blood products, mosaic architecture, or other descriptors'), visibleWhen: { field: 'observationStatus', equals: ['present', 'indeterminate'] } },
        { ...select('treatmentResponse', 'Treated-observation enhancement', response), visibleWhen: { field: 'treatmentStatus', equals: 'treated' } },
        { ...text('userAssignedLirads', 'User-assigned LI-RADS category', 'Optional; no category is calculated', true), visibleWhen: { field: 'observationStatus', equals: ['present', 'indeterminate'] } },
        { ...text('userAssignedOptn', 'User-assigned OPTN status', 'Optional; no status is calculated', true), visibleWhen: { field: 'observationStatus', equals: ['present', 'indeterminate'] } },
        area('additionalObservations', 'Additional observations', 'Identifier, segment, size, major features, treatment status, and user-assigned category'),
      ],
    },
    {
      id: 'vascular-extrahepatic', title: 'Vascular and extrahepatic findings', defaultOpen: true,
      fields: [
        select('tumorInVein', 'Tumor in vein', assessment),
        { ...area('tumorInVeinDetails', 'Tumor-in-vein details', 'Vessel, extent, enhancement, and confidence'), visibleWhen: { field: 'tumorInVein', equals: ['present', 'indeterminate'] } },
        select('portalHypertension', 'Portal hypertension findings', assessment),
        { ...area('portalHypertensionDetails', 'Portal hypertension details', 'Varices, ascites, splenomegaly, collaterals, or thrombosis'), visibleWhen: { field: 'portalHypertension', equals: ['present', 'indeterminate'] } },
        select('suspiciousNodes', 'Suspicious nodes', assessment),
        { ...area('suspiciousNodeDetails', 'Suspicious node details'), visibleWhen: { field: 'suspiciousNodes', equals: ['present', 'indeterminate'] } },
        select('extrahepaticMetastases', 'Extrahepatic metastases', assessment),
        { ...area('extrahepaticMetastasisDetails', 'Extrahepatic metastasis details', 'Sites, burden, measurements, and confidence'), visibleWhen: { field: 'extrahepaticMetastases', equals: ['present', 'indeterminate'] } },
      ],
    },
    {
      id: 'additional-overrides', title: 'Additional findings and overrides', defaultOpen: false,
      fields: [
        area('additionalFindings', 'Additional findings'), area('incidentalFindings', 'Incidental findings'),
        area('limitationsUncertainty', 'Additional uncertainty'),
        area('findingsOverride', 'Findings free-text override', 'When entered, this replaces generated findings'),
        area('impressionOverride', 'Impression free-text override', 'When entered, this replaces generated impression'),
      ],
    },
  ],
  keyNegatives: [], incidentalOptions: [],
  quickFills: [
    {
      id: 'no-focal-observation', label: 'No focal observation', description: 'Diagnostic multiphase study with no suspicious observation.', intent: 'normal',
      values: { examQuality: 'diagnostic', arterialPhaseAdequacy: 'present', portalVenousPhaseAdequacy: 'present', delayedPhaseAdequacy: 'present', observationStatus: 'absent', tumorInVein: 'absent', portalHypertension: 'absent', suspiciousNodes: 'absent', extrahepaticMetastases: 'absent' },
    },
    { id: 'dominant-observation', label: 'Dominant observation', description: 'Positive pathway for observation characterization.', intent: 'positive', values: { examQuality: 'diagnostic', observationStatus: 'present', treatmentStatus: 'untreated' } },
    { id: 'limited-liver-study', label: 'Limited examination', description: 'Limited phase adequacy and observation assessment.', intent: 'complicated', values: { examQuality: 'limited', arterialPhaseAdequacy: 'not assessed', portalVenousPhaseAdequacy: 'not assessed', delayedPhaseAdequacy: 'not assessed', observationStatus: 'indeterminate', tumorInVein: 'not assessed', portalHypertension: 'not assessed', suspiciousNodes: 'not assessed', extrahepaticMetastases: 'not assessed' } },
  ],
};

const vesselRelationship: ReferralOption[] = [
  { value: '', label: 'Select relationship…' },
  { value: 'no contact', label: 'No tumor contact' },
  { value: 'contact or encasement', label: 'Contact / encasement' },
  { value: 'narrowed', label: 'Narrowed' },
  { value: 'occluded', label: 'Occluded' },
  { value: 'indeterminate', label: 'Indeterminate' },
  { value: 'not assessed', label: 'Not assessed' },
];
const hilarDefaults: WorkflowValues = {
  clinicalIndication: '', clinicalContext: '', comparisonStudy: '', comparisonDate: '',
  modalityProtocol: '', examQuality: '', technicalLimitations: '', hilarLesion: '',
  ductalEpicenter: '', longitudinalExtent: '', lesionApMm: '', lesionTrMm: '', lesionCcMm: '',
  morphology: '', rightDuctExtent: '', leftDuctExtent: '', intrahepaticDuctDilation: '',
  lobarAtrophy: '', lobarAtrophyDetails: '', portalVeinRelationship: '', portalVeinDetails: '',
  hepaticArteryRelationship: '', hepaticArteryDetails: '', vascularVariants: '', biliaryVariants: '',
  liverInvasion: '', liverInvasionDetails: '', adjacentOrganInvasion: '', adjacentOrganDetails: '',
  suspiciousNodes: '', suspiciousNodeDetails: '', peritonealMetastases: '',
  peritonealMetastasisDetails: '', distantMetastases: '', distantMetastasisDetails: '',
  userAssignedBismuth: '', userStagingSynthesis: '', additionalFindings: '', incidentalFindings: '',
  limitationsUncertainty: '', findingsOverride: '', impressionOverride: '',
};

export const hilarCholangiocarcinomaWorkflowSchema: ReportingWorkflowSchema = {
  moduleType: 'hilarCholangiocarcinoma',
  moduleId: 'mri-hilar-cholangiocarcinoma',
  title: 'Hilar Cholangiocarcinoma CT/MRI',
  shortTitle: 'Hilar cholangiocarcinoma',
  modality: 'CT/MRI/MRCP',
  bodySystem: 'Oncology',
  clinicalQuestion: 'Map hilar biliary tumor extent, vascular relationships, lobar atrophy, local invasion, nodal disease, and metastases.',
  techniqueDefault: 'Multiphase hepatobiliary CT/MRI with MRCP sequences as available was reviewed.',
  badges: ['Implemented', 'Educational draft', 'Ductal mapping'],
  insertTargets: ['findings', 'impression', 'incidentalFindings', 'recommendations'],
  safetyNote: 'Verify ductal anatomy and extent, vascular relationships, lobar atrophy, invasion, nodes, metastases, and any user-assigned classification. No stage, operability, or treatment recommendation is generated automatically.',
  contentMetadata: {
    sourceChapter: 'Chapter 11: Hilar cholangiocarcinoma',
    sourceType: 'Private development reference',
    guidelineOrClassificationName: 'Bismuth-Corlette and cholangiocarcinoma TNM',
    guidelineVersion: 'Current versions require primary-source verification',
    lastReviewedDate: '2026-07-24',
    reviewStatus: 'needs_clinical_review',
    clinicalValidationRequired: true,
  },
  defaultValues: hilarDefaults,
  sections: [
    {
      id: 'clinical-context', title: 'Clinical context', defaultOpen: true,
      fields: [
        area('clinicalIndication', 'Clinical indication', 'Suspected or confirmed hilar biliary malignancy and staging question'),
        area('clinicalContext', 'Relevant clinical context', 'Pathology, cholangitis, biliary drainage/stents, surgery, or treatment'),
        text('comparisonStudy', 'Comparison examination'), { id: 'comparisonDate', label: 'Comparison date', type: 'date' },
      ],
    },
    {
      id: 'technical-quality', title: 'Protocol and technical quality', defaultOpen: true,
      fields: [
        text('modalityProtocol', 'Modality and protocol', 'e.g. multiphase liver MRI with MRCP', true),
        select('examQuality', 'Examination quality', quality),
        area('technicalLimitations', 'Technical limitations', 'Motion, incomplete ductal visualization, stent artifact, missing phase, or other issue'),
      ],
    },
    {
      id: 'primary-ductal-tumor', title: 'Primary tumor and ductal extent', defaultOpen: true,
      fields: [
        select('hilarLesion', 'Hilar biliary lesion', assessment),
        { ...text('ductalEpicenter', 'Ductal epicenter', 'Common hepatic duct, confluence, right/left duct, or other site', true), visibleWhen: { field: 'hilarLesion', equals: ['present', 'indeterminate'] } },
        { ...area('longitudinalExtent', 'Longitudinal ductal extent', 'Proximal and distal extent by duct/branch'), visibleWhen: { field: 'hilarLesion', equals: ['present', 'indeterminate'] } },
        { ...number('lesionApMm', 'AP dimension', 'mm'), visibleWhen: { field: 'hilarLesion', equals: ['present', 'indeterminate'] } },
        { ...number('lesionTrMm', 'Transverse dimension', 'mm'), visibleWhen: { field: 'hilarLesion', equals: ['present', 'indeterminate'] } },
        { ...number('lesionCcMm', 'Craniocaudal dimension', 'mm'), visibleWhen: { field: 'hilarLesion', equals: ['present', 'indeterminate'] } },
        { ...area('morphology', 'Tumor morphology', 'Periductal infiltrating, mass-forming, intraductal, enhancement, and confidence'), visibleWhen: { field: 'hilarLesion', equals: ['present', 'indeterminate'] } },
        { ...area('rightDuctExtent', 'Right ductal extent', 'Right hepatic duct and sectoral branch involvement'), visibleWhen: { field: 'hilarLesion', equals: ['present', 'indeterminate'] } },
        { ...area('leftDuctExtent', 'Left ductal extent', 'Left hepatic duct and segmental branch involvement'), visibleWhen: { field: 'hilarLesion', equals: ['present', 'indeterminate'] } },
        select('intrahepaticDuctDilation', 'Intrahepatic duct dilation', assessment),
        select('lobarAtrophy', 'Lobar atrophy', assessment),
        { ...area('lobarAtrophyDetails', 'Lobar atrophy details', 'Lobe/segments and severity'), visibleWhen: { field: 'lobarAtrophy', equals: ['present', 'indeterminate'] } },
        text('userAssignedBismuth', 'User-assigned ductal classification', 'Optional; no category is calculated', true),
      ],
    },
    {
      id: 'vascular-anatomy', title: 'Vascular relationships and anatomy', defaultOpen: true,
      fields: [
        select('portalVeinRelationship', 'Portal vein relationship', vesselRelationship),
        { ...area('portalVeinDetails', 'Portal vein details', 'Side/branch, circumferential extent, narrowing, occlusion, and collaterals'), visibleWhen: { field: 'portalVeinRelationship', equals: ['contact or encasement', 'narrowed', 'occluded', 'indeterminate'] } },
        select('hepaticArteryRelationship', 'Hepatic artery relationship', vesselRelationship),
        { ...area('hepaticArteryDetails', 'Hepatic artery details', 'Side/branch, circumferential extent, narrowing, occlusion, and collaterals'), visibleWhen: { field: 'hepaticArteryRelationship', equals: ['contact or encasement', 'narrowed', 'occluded', 'indeterminate'] } },
        area('vascularVariants', 'Surgically relevant vascular variants'),
        area('biliaryVariants', 'Surgically relevant biliary variants'),
      ],
    },
    {
      id: 'extension-metastases', title: 'Local extension, nodes, and metastases', defaultOpen: true,
      fields: [
        select('liverInvasion', 'Liver invasion', assessment),
        { ...area('liverInvasionDetails', 'Liver invasion details'), visibleWhen: { field: 'liverInvasion', equals: ['present', 'indeterminate'] } },
        select('adjacentOrganInvasion', 'Adjacent-organ invasion', assessment),
        { ...area('adjacentOrganDetails', 'Adjacent-organ invasion details'), visibleWhen: { field: 'adjacentOrganInvasion', equals: ['present', 'indeterminate'] } },
        select('suspiciousNodes', 'Suspicious nodes', assessment),
        { ...area('suspiciousNodeDetails', 'Suspicious node details'), visibleWhen: { field: 'suspiciousNodes', equals: ['present', 'indeterminate'] } },
        select('peritonealMetastases', 'Peritoneal metastases', assessment),
        { ...area('peritonealMetastasisDetails', 'Peritoneal disease details'), visibleWhen: { field: 'peritonealMetastases', equals: ['present', 'indeterminate'] } },
        select('distantMetastases', 'Other distant metastases', assessment),
        { ...area('distantMetastasisDetails', 'Distant metastatic disease details'), visibleWhen: { field: 'distantMetastases', equals: ['present', 'indeterminate'] } },
        area('userStagingSynthesis', 'User-controlled staging/resectability synthesis', 'Optional; no category is calculated'),
      ],
    },
    {
      id: 'additional-overrides', title: 'Additional findings and overrides', defaultOpen: false,
      fields: [
        area('additionalFindings', 'Additional findings'), area('incidentalFindings', 'Incidental findings'),
        area('limitationsUncertainty', 'Additional uncertainty'),
        area('findingsOverride', 'Findings free-text override', 'When entered, this replaces generated findings'),
        area('impressionOverride', 'Impression free-text override', 'When entered, this replaces generated impression'),
      ],
    },
  ],
  keyNegatives: [], incidentalOptions: [],
  quickFills: [
    { id: 'no-hilar-lesion', label: 'No hilar lesion', description: 'Diagnostic examination with no hilar lesion or metastatic disease entered.', intent: 'normal', values: { examQuality: 'diagnostic', hilarLesion: 'absent', intrahepaticDuctDilation: 'absent', lobarAtrophy: 'absent', portalVeinRelationship: 'no contact', hepaticArteryRelationship: 'no contact', liverInvasion: 'absent', adjacentOrganInvasion: 'absent', suspiciousNodes: 'absent', peritonealMetastases: 'absent', distantMetastases: 'absent' } },
    { id: 'hilar-tumor-mapping', label: 'Hilar tumor mapping', description: 'Positive pathway for ductal and vascular mapping.', intent: 'positive', values: { examQuality: 'diagnostic', hilarLesion: 'present' } },
    { id: 'limited-hilar-study', label: 'Limited examination', description: 'Limited ductal and vascular assessment.', intent: 'complicated', values: { examQuality: 'limited', hilarLesion: 'indeterminate', intrahepaticDuctDilation: 'not assessed', lobarAtrophy: 'not assessed', portalVeinRelationship: 'not assessed', hepaticArteryRelationship: 'not assessed', liverInvasion: 'not assessed', adjacentOrganInvasion: 'not assessed', suspiciousNodes: 'not assessed', peritonealMetastases: 'not assessed', distantMetastases: 'not assessed' } },
  ],
};

const laterality: ReferralOption[] = [
  { value: '', label: 'Select laterality…' },
  { value: 'right', label: 'Right' },
  { value: 'left', label: 'Left' },
  { value: 'bilateral', label: 'Bilateral' },
  { value: 'midline or indeterminate origin', label: 'Midline / indeterminate origin' },
];
const ovarianDefaults: WorkflowValues = {
  clinicalIndication: '', clinicalContext: '', pathology: '', comparisonStudy: '', comparisonDate: '',
  modalityProtocol: '', examQuality: '', technicalLimitations: '', adnexalPrimary: '', laterality: '',
  primarySite: '', sizeApMm: '', sizeTrMm: '', sizeCcMm: '', morphology: '', solidComponents: '',
  contralateralAdnexa: '', ascites: '', pelvicPeritoneum: '', pelvicPeritoneumDetails: '',
  omentum: '', omentumDetails: '', upperAbdominalPeritoneum: '', upperAbdominalDetails: '',
  bowelMesentery: '', bowelMesenteryDetails: '', abdominalWallDiaphragm: '', abdominalWallDiaphragmDetails: '',
  suspiciousNodes: '', suspiciousNodeDetails: '', pleuralDisease: '', pleuralDiseaseDetails: '',
  distantMetastases: '', distantMetastasisDetails: '', cytoreductionLimitingSites: '',
  userAssignedFigo: '', additionalFindings: '', incidentalFindings: '', limitationsUncertainty: '',
  findingsOverride: '', impressionOverride: '',
};
export const ovarianCancerWorkflowSchema: ReportingWorkflowSchema = {
  moduleType: 'ovarianCancer',
  moduleId: 'ct-mri-ovarian-cancer',
  title: 'Ovarian Cancer Staging',
  shortTitle: 'Ovarian cancer staging',
  modality: 'CT/MRI',
  bodySystem: 'Oncology',
  clinicalQuestion: 'Characterize the adnexal primary and map peritoneal, nodal, pleural, and distant disease relevant to staging and surgical planning.',
  techniqueDefault: 'Cross-sectional abdomen and pelvis imaging was performed with multiplanar review.',
  badges: ['Implemented', 'Educational draft', 'Peritoneal mapping'],
  insertTargets: ['findings', 'impression', 'incidentalFindings', 'recommendations'],
  safetyNote: 'Verify the primary site, disease distribution by surgical compartment, bowel and mesenteric involvement, nodes, pleural/distant disease, and any user-assigned staging. No stage, cytoreduction assessment, treatment, or management advice is generated automatically.',
  contentMetadata: {
    sourceChapter: 'Chapter 12: Ovarian cancer staging', sourceType: 'Private development reference',
    guidelineOrClassificationName: 'FIGO and TNM ovarian cancer staging',
    guidelineVersion: 'Current versions require primary-source verification', lastReviewedDate: '2026-07-26',
    reviewStatus: 'needs_clinical_review', clinicalValidationRequired: true,
  },
  defaultValues: ovarianDefaults,
  sections: [
    {
      id: 'clinical-context', title: 'Clinical context', defaultOpen: true,
      fields: [
        area('clinicalIndication', 'Clinical indication', 'Suspected or confirmed ovarian malignancy and staging question'),
        area('clinicalContext', 'Relevant clinical context', 'Symptoms, tumor markers, surgery, treatment, or hereditary risk'),
        text('pathology', 'Pathology', 'If known', true), text('comparisonStudy', 'Comparison examination'),
        { id: 'comparisonDate', label: 'Comparison date', type: 'date' },
      ],
    },
    {
      id: 'technical-quality', title: 'Protocol and technical quality', defaultOpen: true,
      fields: [
        text('modalityProtocol', 'Modality and protocol', 'e.g. contrast-enhanced CT chest/abdomen/pelvis', true),
        select('examQuality', 'Examination quality', quality),
        area('technicalLimitations', 'Technical limitations', 'Motion, incomplete coverage, absent contrast, or other issue'),
      ],
    },
    {
      id: 'primary-tumor', title: 'Primary adnexal tumor', defaultOpen: true,
      fields: [
        select('adnexalPrimary', 'Adnexal primary tumor', assessment),
        { ...select('laterality', 'Laterality', laterality), visibleWhen: { field: 'adnexalPrimary', equals: ['present', 'indeterminate'] } },
        { ...text('primarySite', 'Primary site/origin', 'Ovary, fallopian tube, peritoneal, or indeterminate', true), visibleWhen: { field: 'adnexalPrimary', equals: ['present', 'indeterminate'] } },
        { ...number('sizeApMm', 'AP dimension', 'mm'), visibleWhen: { field: 'adnexalPrimary', equals: ['present', 'indeterminate'] } },
        { ...number('sizeTrMm', 'Transverse dimension', 'mm'), visibleWhen: { field: 'adnexalPrimary', equals: ['present', 'indeterminate'] } },
        { ...number('sizeCcMm', 'Craniocaudal dimension', 'mm'), visibleWhen: { field: 'adnexalPrimary', equals: ['present', 'indeterminate'] } },
        { ...area('morphology', 'Primary tumor morphology', 'Solid/cystic components, septa, papillary projections, necrosis, enhancement, and invasion'), visibleWhen: { field: 'adnexalPrimary', equals: ['present', 'indeterminate'] } },
        { ...area('solidComponents', 'Solid component details', 'Size, enhancement, and diffusion if applicable'), visibleWhen: { field: 'adnexalPrimary', equals: ['present', 'indeterminate'] } },
        area('contralateralAdnexa', 'Contralateral adnexa'),
        select('ascites', 'Ascites', assessment),
      ],
    },
    {
      id: 'peritoneal-map', title: 'Peritoneal disease by compartment', defaultOpen: true,
      fields: [
        select('pelvicPeritoneum', 'Pelvic peritoneal disease', assessment),
        { ...area('pelvicPeritoneumDetails', 'Pelvic peritoneal details'), visibleWhen: { field: 'pelvicPeritoneum', equals: ['present', 'indeterminate'] } },
        select('omentum', 'Omental disease', assessment),
        { ...area('omentumDetails', 'Omental disease details'), visibleWhen: { field: 'omentum', equals: ['present', 'indeterminate'] } },
        select('upperAbdominalPeritoneum', 'Upper abdominal peritoneal disease', assessment),
        { ...area('upperAbdominalDetails', 'Upper abdominal disease details', 'Diaphragmatic, hepatic/splenic surface, lesser sac, porta hepatis, or other sites'), visibleWhen: { field: 'upperAbdominalPeritoneum', equals: ['present', 'indeterminate'] } },
        select('bowelMesentery', 'Bowel or mesenteric involvement', assessment),
        { ...area('bowelMesenteryDetails', 'Bowel/mesenteric details', 'Segments, serosal versus transmural disease, obstruction, mesenteric root, or multifocal involvement'), visibleWhen: { field: 'bowelMesentery', equals: ['present', 'indeterminate'] } },
        select('abdominalWallDiaphragm', 'Abdominal wall or diaphragmatic invasion', assessment),
        { ...area('abdominalWallDiaphragmDetails', 'Wall/diaphragm details'), visibleWhen: { field: 'abdominalWallDiaphragm', equals: ['present', 'indeterminate'] } },
      ],
    },
    {
      id: 'nodes-distant', title: 'Nodes, pleura, and distant disease', defaultOpen: true,
      fields: [
        select('suspiciousNodes', 'Suspicious nodes', assessment),
        { ...area('suspiciousNodeDetails', 'Suspicious node details', 'Stations, size, morphology, and confidence'), visibleWhen: { field: 'suspiciousNodes', equals: ['present', 'indeterminate'] } },
        select('pleuralDisease', 'Pleural disease or effusion suspicious for involvement', assessment),
        { ...area('pleuralDiseaseDetails', 'Pleural disease details'), visibleWhen: { field: 'pleuralDisease', equals: ['present', 'indeterminate'] } },
        select('distantMetastases', 'Other distant metastases', assessment),
        { ...area('distantMetastasisDetails', 'Distant metastatic disease details'), visibleWhen: { field: 'distantMetastases', equals: ['present', 'indeterminate'] } },
        area('cytoreductionLimitingSites', 'Potentially surgery-limiting sites', 'Describe observed anatomy only; no operability conclusion is generated'),
        text('userAssignedFigo', 'User-assigned FIGO stage', 'Optional; no stage is calculated', true),
      ],
    },
    {
      id: 'additional-overrides', title: 'Additional findings and overrides', defaultOpen: false,
      fields: [
        area('additionalFindings', 'Additional findings'), area('incidentalFindings', 'Incidental findings'),
        area('limitationsUncertainty', 'Additional uncertainty'),
        area('findingsOverride', 'Findings free-text override', 'When entered, this replaces generated findings'),
        area('impressionOverride', 'Impression free-text override', 'When entered, this replaces generated impression'),
      ],
    },
  ],
  keyNegatives: [], incidentalOptions: [],
  quickFills: [
    { id: 'no-staging-disease', label: 'No staging disease', description: 'Diagnostic exam with no adnexal primary or metastatic disease entered.', intent: 'normal', values: { examQuality: 'diagnostic', adnexalPrimary: 'absent', ascites: 'absent', pelvicPeritoneum: 'absent', omentum: 'absent', upperAbdominalPeritoneum: 'absent', bowelMesentery: 'absent', abdominalWallDiaphragm: 'absent', suspiciousNodes: 'absent', pleuralDisease: 'absent', distantMetastases: 'absent' } },
    { id: 'ovarian-primary-staging', label: 'Adnexal primary staging', description: 'Positive pathway for primary and compartment mapping.', intent: 'positive', values: { examQuality: 'diagnostic', adnexalPrimary: 'present' } },
    { id: 'limited-ovarian-staging', label: 'Limited examination', description: 'Limited primary and metastatic assessment.', intent: 'complicated', values: { examQuality: 'limited', adnexalPrimary: 'indeterminate', ascites: 'not assessed', pelvicPeritoneum: 'not assessed', omentum: 'not assessed', upperAbdominalPeritoneum: 'not assessed', bowelMesentery: 'not assessed', abdominalWallDiaphragm: 'not assessed', suspiciousNodes: 'not assessed', pleuralDisease: 'not assessed', distantMetastases: 'not assessed' } },
  ],
};
