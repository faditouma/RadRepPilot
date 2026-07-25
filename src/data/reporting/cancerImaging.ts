import type { ReferralOption } from '../../radrep/types';
import type {
  ReportingWorkflowSchema,
  WorkflowField,
  WorkflowValues,
} from '../reportingWorkflowSchemas';

const assessmentOptions: ReferralOption[] = [
  { value: '', label: 'Select assessment…' },
  { value: 'absent', label: 'Absent' },
  { value: 'present', label: 'Present' },
  { value: 'indeterminate', label: 'Indeterminate' },
  { value: 'not assessed', label: 'Not assessed' },
];

const examPurposeOptions: ReferralOption[] = [
  { value: '', label: 'Select purpose…' },
  { value: 'initial staging', label: 'Initial staging' },
  { value: 'interim response assessment', label: 'Interim response assessment' },
  { value: 'end-of-treatment response assessment', label: 'End-of-treatment response assessment' },
  { value: 'surveillance or suspected recurrence', label: 'Surveillance / suspected recurrence' },
];

const technicalQualityOptions: ReferralOption[] = [
  { value: '', label: 'Select quality…' },
  { value: 'diagnostic', label: 'Diagnostic' },
  { value: 'limited', label: 'Limited' },
  { value: 'nondiagnostic', label: 'Nondiagnostic' },
];

const intervalChangeOptions: ReferralOption[] = [
  { value: '', label: 'Select interval assessment…' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'decreased', label: 'Decreased' },
  { value: 'stable', label: 'Stable' },
  { value: 'increased', label: 'Increased' },
  { value: 'mixed', label: 'Mixed response' },
  { value: 'new disease', label: 'New disease' },
  { value: 'not assessed', label: 'Not assessed' },
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

const defaultValues: WorkflowValues = {
  clinicalIndication: '',
  relevantClinicalContext: '',
  lymphomaSubtype: '',
  examPurpose: '',
  comparisonStudy: '',
  comparisonDate: '',
  tracer: 'F-18 FDG',
  administeredActivity: '',
  uptakeTimeMinutes: '',
  serumGlucose: '',
  examQuality: '',
  technicalLimitations: '',
  nodalDisease: '',
  nodalDistribution: '',
  dominantNodalSite: '',
  dominantNodeSizeMm: '',
  dominantNodeSuvMax: '',
  bulkyDisease: '',
  extranodalDisease: '',
  extranodalSites: '',
  dominantExtranodalSite: '',
  dominantExtranodalSizeMm: '',
  dominantExtranodalSuvMax: '',
  spleenAssessment: '',
  marrowAssessment: '',
  liverAssessment: '',
  bloodPoolSuvMean: '',
  liverSuvMean: '',
  highestUptakeSite: '',
  highestLesionSuvMax: '',
  intervalChange: '',
  newLesions: '',
  newLesionDescription: '',
  userResponseSynthesis: '',
  additionalFindings: '',
  incidentalFindings: '',
  limitationsUncertainty: '',
  findingsOverride: '',
  impressionOverride: '',
};

export const lymphomaPetCtWorkflowSchema: ReportingWorkflowSchema = {
  moduleType: 'lymphomaPetCt',
  moduleId: 'pet-ct-lymphoma',
  title: 'Lymphoma PET-CT',
  shortTitle: 'Lymphoma PET-CT',
  modality: 'PET/CT',
  bodySystem: 'Oncology',
  clinicalQuestion: 'Define metabolically active nodal and extranodal disease and assess interval response when applicable.',
  techniqueDefault: 'Whole-body FDG PET/CT was performed with low-dose CT for attenuation correction and anatomic localization.',
  badges: ['Implemented', 'Educational draft', 'Response assessment'],
  insertTargets: ['findings', 'impression', 'incidentalFindings', 'recommendations'],
  safetyNote:
    'Educational reporting workflow. Verify tracer administration, technical quality, all disease sites, comparison imaging, and final response synthesis. No treatment recommendation is generated.',
  contentMetadata: {
    sourceChapter: 'Chapter 5: Lymphoma staging PET-CT',
    sourceType: 'Private development reference',
    guidelineOrClassificationName: 'Lugano / Deauville response assessment',
    guidelineVersion: 'Current version requires primary-source verification',
    lastReviewedDate: '2026-07-24',
    reviewStatus: 'needs_clinical_review',
    clinicalValidationRequired: true,
  },
  defaultValues,
  sections: [
    {
      id: 'clinical-context',
      title: 'Clinical context',
      defaultOpen: true,
      fields: [
        area('clinicalIndication', 'Clinical indication', 'Known or suspected lymphoma and the specific imaging question'),
        area('relevantClinicalContext', 'Relevant clinical context', 'Histology, treatment dates, symptoms, or other relevant history'),
        text('lymphomaSubtype', 'Lymphoma subtype', 'If known'),
        select('examPurpose', 'Examination purpose', examPurposeOptions),
        text('comparisonStudy', 'Comparison examination', 'e.g. PET/CT'),
        { id: 'comparisonDate', label: 'Comparison date', type: 'date' },
      ],
    },
    {
      id: 'technical-quality',
      title: 'Technique and quality',
      defaultOpen: true,
      fields: [
        text('tracer', 'Tracer'),
        number('administeredActivity', 'Administered activity', 'MBq'),
        number('uptakeTimeMinutes', 'Uptake time', 'min'),
        number('serumGlucose', 'Serum glucose', 'mmol/L'),
        select('examQuality', 'Examination quality', technicalQualityOptions),
        area('technicalLimitations', 'Technical limitations', 'Motion, altered biodistribution, hyperglycemia, incomplete coverage, or other limitation'),
      ],
    },
    {
      id: 'nodal-disease',
      title: 'Nodal disease',
      defaultOpen: true,
      fields: [
        select('nodalDisease', 'Metabolically active nodal disease', assessmentOptions),
        {
          ...area('nodalDistribution', 'Involved nodal stations', 'List involved nodal regions and laterality'),
          visibleWhen: { field: 'nodalDisease', equals: ['present', 'indeterminate'] },
        },
        {
          ...text('dominantNodalSite', 'Dominant nodal site', 'Most clinically important or most avid nodal site', true),
          visibleWhen: { field: 'nodalDisease', equals: ['present', 'indeterminate'] },
        },
        {
          ...number('dominantNodeSizeMm', 'Dominant node short axis', 'mm'),
          visibleWhen: { field: 'nodalDisease', equals: ['present', 'indeterminate'] },
        },
        {
          ...number('dominantNodeSuvMax', 'Dominant nodal SUVmax'),
          visibleWhen: { field: 'nodalDisease', equals: ['present', 'indeterminate'] },
        },
        {
          ...select('bulkyDisease', 'Bulky nodal disease', assessmentOptions),
          visibleWhen: { field: 'nodalDisease', equals: ['present', 'indeterminate'] },
        },
      ],
    },
    {
      id: 'extranodal-disease',
      title: 'Extranodal disease',
      defaultOpen: true,
      fields: [
        select('extranodalDisease', 'Metabolically active extranodal disease', assessmentOptions),
        {
          ...area('extranodalSites', 'Extranodal disease sites', 'Organs, bones, soft tissues, or other involved sites'),
          visibleWhen: { field: 'extranodalDisease', equals: ['present', 'indeterminate'] },
        },
        {
          ...text('dominantExtranodalSite', 'Dominant extranodal site', 'Most clinically important or most avid site', true),
          visibleWhen: { field: 'extranodalDisease', equals: ['present', 'indeterminate'] },
        },
        {
          ...number('dominantExtranodalSizeMm', 'Dominant extranodal lesion size', 'mm'),
          visibleWhen: { field: 'extranodalDisease', equals: ['present', 'indeterminate'] },
        },
        {
          ...number('dominantExtranodalSuvMax', 'Dominant extranodal SUVmax'),
          visibleWhen: { field: 'extranodalDisease', equals: ['present', 'indeterminate'] },
        },
        select('spleenAssessment', 'Spleen involvement', assessmentOptions),
        select('marrowAssessment', 'Marrow involvement', assessmentOptions),
        select('liverAssessment', 'Liver involvement', assessmentOptions),
      ],
    },
    {
      id: 'response-assessment',
      title: 'Reference activity and response',
      defaultOpen: false,
      description: 'Reference values and response synthesis are descriptive. No response category is calculated automatically.',
      fields: [
        number('bloodPoolSuvMean', 'Blood-pool SUVmean'),
        number('liverSuvMean', 'Liver SUVmean'),
        text('highestUptakeSite', 'Highest-uptake lesion or site', 'Anatomic site', true),
        number('highestLesionSuvMax', 'Highest lesion SUVmax'),
        select('intervalChange', 'Interval metabolic change', intervalChangeOptions),
        select('newLesions', 'New metabolically active lesions', assessmentOptions),
        {
          ...area('newLesionDescription', 'New lesion description', 'Location, size, uptake, and confidence'),
          visibleWhen: { field: 'newLesions', equals: ['present', 'indeterminate'] },
        },
        area('userResponseSynthesis', 'User-assigned response synthesis', 'Optional radiologist-entered response category or descriptive synthesis'),
      ],
    },
    {
      id: 'additional-findings',
      title: 'Additional findings and overrides',
      defaultOpen: false,
      fields: [
        area('additionalFindings', 'Additional findings', 'Other clinically relevant findings'),
        area('incidentalFindings', 'Incidental findings', 'Actionable or otherwise important incidental findings'),
        area('limitationsUncertainty', 'Additional uncertainty', 'Diagnostic uncertainty not already described'),
        area('findingsOverride', 'Findings free-text override', 'When entered, this replaces generated findings'),
        area('impressionOverride', 'Impression free-text override', 'When entered, this replaces generated impression'),
      ],
    },
  ],
  keyNegatives: [],
  incidentalOptions: [],
  quickFills: [
    {
      id: 'no-active-disease',
      label: 'No active disease',
      description: 'Diagnostic examination with no metabolically active nodal or extranodal disease.',
      intent: 'normal',
      values: {
        examQuality: 'diagnostic',
        nodalDisease: 'absent',
        extranodalDisease: 'absent',
        spleenAssessment: 'absent',
        marrowAssessment: 'absent',
        liverAssessment: 'absent',
        newLesions: 'absent',
      },
    },
    {
      id: 'active-nodal-and-extranodal-disease',
      label: 'Nodal + extranodal disease',
      description: 'Positive pathway revealing disease-distribution and dominant-lesion fields.',
      intent: 'positive',
      values: {
        examQuality: 'diagnostic',
        nodalDisease: 'present',
        extranodalDisease: 'present',
        newLesions: 'not assessed',
      },
    },
    {
      id: 'limited-examination',
      label: 'Limited examination',
      description: 'Technically limited examination requiring explicit limitation documentation.',
      intent: 'complicated',
      values: {
        examQuality: 'limited',
        nodalDisease: 'not assessed',
        extranodalDisease: 'not assessed',
        spleenAssessment: 'not assessed',
        marrowAssessment: 'not assessed',
        liverAssessment: 'not assessed',
        newLesions: 'not assessed',
      },
    },
  ],
};

const pancreaticTumorLocationOptions: ReferralOption[] = [
  { value: '', label: 'Select location…' },
  { value: 'head or uncinate process', label: 'Head / uncinate process' },
  { value: 'neck', label: 'Neck' },
  { value: 'body', label: 'Body' },
  { value: 'tail', label: 'Tail' },
  { value: 'multifocal', label: 'Multifocal' },
  { value: 'indeterminate', label: 'Indeterminate' },
];

const tumorMorphologyOptions: ReferralOption[] = [
  { value: '', label: 'Select morphology…' },
  { value: 'solid', label: 'Solid' },
  { value: 'cystic', label: 'Cystic' },
  { value: 'mixed solid and cystic', label: 'Mixed solid and cystic' },
  { value: 'infiltrative', label: 'Infiltrative / ill-defined' },
  { value: 'indeterminate', label: 'Indeterminate' },
];

const enhancementOptions: ReferralOption[] = [
  { value: '', label: 'Select enhancement…' },
  { value: 'hypoenhancing', label: 'Hypoenhancing' },
  { value: 'isoenhancing', label: 'Isoenhancing' },
  { value: 'hyperenhancing', label: 'Hyperenhancing' },
  { value: 'heterogeneous', label: 'Heterogeneous' },
  { value: 'not assessed', label: 'Not assessed' },
];

const vascularContactOptions: ReferralOption[] = [
  { value: '', label: 'Select vessel relationship…' },
  { value: 'no contact', label: 'No tumor contact' },
  { value: 'contact less than 180 degrees', label: 'Contact <180°' },
  { value: 'contact 180 degrees or greater', label: 'Contact ≥180°' },
  { value: 'occlusion', label: 'Occlusion' },
  { value: 'indeterminate', label: 'Indeterminate' },
  { value: 'not assessed', label: 'Not assessed' },
];

const pancreaticCancerDefaults: WorkflowValues = {
  clinicalIndication: '',
  relevantClinicalContext: '',
  pathologyStatus: '',
  comparisonStudy: '',
  comparisonDate: '',
  modalityProtocol: '',
  examQuality: '',
  technicalLimitations: '',
  pancreaticMass: '',
  tumorLocation: '',
  tumorSizeApMm: '',
  tumorSizeTrMm: '',
  tumorSizeCcMm: '',
  tumorMorphology: '',
  tumorEnhancement: '',
  tumorDescription: '',
  pancreaticDuctObstruction: '',
  pancreaticDuctDiameterMm: '',
  biliaryObstruction: '',
  commonBileDuctDiameterMm: '',
  upstreamAtrophy: '',
  smaContact: '',
  celiacContact: '',
  commonHepaticArteryContact: '',
  smvContact: '',
  portalVeinContact: '',
  vascularDeformity: '',
  vascularThrombosis: '',
  collateralVessels: '',
  vascularVariants: '',
  adjacentOrganInvasion: '',
  adjacentOrganDetails: '',
  regionalNodes: '',
  regionalNodeDetails: '',
  liverMetastases: '',
  liverMetastasisDetails: '',
  peritonealMetastases: '',
  peritonealMetastasisDetails: '',
  otherMetastases: '',
  otherMetastasisDetails: '',
  userResectabilitySynthesis: '',
  additionalFindings: '',
  incidentalFindings: '',
  limitationsUncertainty: '',
  findingsOverride: '',
  impressionOverride: '',
};

export const pancreaticCancerWorkflowSchema: ReportingWorkflowSchema = {
  moduleType: 'pancreaticCancer',
  moduleId: 'ct-mri-pancreatic-cancer',
  title: 'Pancreatic Cancer Initial Staging',
  shortTitle: 'Pancreatic cancer staging',
  modality: 'CT/MRI',
  bodySystem: 'Oncology',
  clinicalQuestion: 'Characterize the pancreatic primary, vascular relationships, local extension, nodal disease, and distant metastases.',
  techniqueDefault: 'Pancreas-protocol cross-sectional imaging was performed with multiplanar review.',
  badges: ['Implemented', 'Educational draft', 'Vascular mapping'],
  insertTargets: ['findings', 'impression', 'incidentalFindings', 'recommendations'],
  safetyNote:
    'Educational reporting workflow. Verify protocol adequacy, orthogonal tumor measurements, vessel-by-vessel relationships, metastatic disease, and the final multidisciplinary synthesis. No treatment or operability decision is generated automatically.',
  contentMetadata: {
    sourceChapter: 'Chapter 6: Pancreatic cancer initial staging',
    sourceType: 'Private development reference',
    guidelineOrClassificationName: 'Pancreatic cancer TNM and resectability terminology',
    guidelineVersion: 'Current versions require primary-source verification',
    lastReviewedDate: '2026-07-24',
    reviewStatus: 'needs_clinical_review',
    clinicalValidationRequired: true,
  },
  defaultValues: pancreaticCancerDefaults,
  sections: [
    {
      id: 'clinical-context',
      title: 'Clinical context',
      defaultOpen: true,
      fields: [
        area('clinicalIndication', 'Clinical indication', 'Suspected or confirmed pancreatic malignancy and staging question'),
        area('relevantClinicalContext', 'Relevant clinical context', 'Symptoms, pathology, tumor markers, prior treatment, or surgical history'),
        text('pathologyStatus', 'Pathology status', 'If known'),
        text('comparisonStudy', 'Comparison examination', 'e.g. CT abdomen'),
        { id: 'comparisonDate', label: 'Comparison date', type: 'date' },
      ],
    },
    {
      id: 'technical-quality',
      title: 'Protocol and technical quality',
      defaultOpen: true,
      fields: [
        text('modalityProtocol', 'Modality and protocol', 'e.g. multiphase pancreas-protocol CT', true),
        select('examQuality', 'Examination quality', technicalQualityOptions),
        area('technicalLimitations', 'Technical limitations', 'Missing phase, motion, incomplete coverage, or other limitation'),
      ],
    },
    {
      id: 'primary-tumor',
      title: 'Primary pancreatic lesion',
      defaultOpen: true,
      fields: [
        select('pancreaticMass', 'Pancreatic mass', assessmentOptions),
        {
          ...select('tumorLocation', 'Tumor location', pancreaticTumorLocationOptions),
          visibleWhen: { field: 'pancreaticMass', equals: ['present', 'indeterminate'] },
        },
        {
          ...number('tumorSizeApMm', 'Tumor AP dimension', 'mm'),
          visibleWhen: { field: 'pancreaticMass', equals: ['present', 'indeterminate'] },
        },
        {
          ...number('tumorSizeTrMm', 'Tumor transverse dimension', 'mm'),
          visibleWhen: { field: 'pancreaticMass', equals: ['present', 'indeterminate'] },
        },
        {
          ...number('tumorSizeCcMm', 'Tumor craniocaudal dimension', 'mm'),
          visibleWhen: { field: 'pancreaticMass', equals: ['present', 'indeterminate'] },
        },
        {
          ...select('tumorMorphology', 'Tumor morphology', tumorMorphologyOptions),
          visibleWhen: { field: 'pancreaticMass', equals: ['present', 'indeterminate'] },
        },
        {
          ...select('tumorEnhancement', 'Tumor enhancement', enhancementOptions),
          visibleWhen: { field: 'pancreaticMass', equals: ['present', 'indeterminate'] },
        },
        {
          ...area('tumorDescription', 'Additional tumor characterization', 'Margins, necrosis, calcification, multiplicity, or diagnostic uncertainty'),
          visibleWhen: { field: 'pancreaticMass', equals: ['present', 'indeterminate'] },
        },
      ],
    },
    {
      id: 'ducts',
      title: 'Pancreaticobiliary obstruction',
      defaultOpen: true,
      fields: [
        select('pancreaticDuctObstruction', 'Pancreatic duct obstruction', assessmentOptions),
        {
          ...number('pancreaticDuctDiameterMm', 'Main pancreatic duct diameter', 'mm'),
          visibleWhen: { field: 'pancreaticDuctObstruction', equals: ['present', 'indeterminate'] },
        },
        select('biliaryObstruction', 'Biliary obstruction', assessmentOptions),
        {
          ...number('commonBileDuctDiameterMm', 'Common bile duct diameter', 'mm'),
          visibleWhen: { field: 'biliaryObstruction', equals: ['present', 'indeterminate'] },
        },
        select('upstreamAtrophy', 'Upstream pancreatic atrophy', assessmentOptions),
      ],
    },
    {
      id: 'vascular-relationships',
      title: 'Vascular relationships',
      defaultOpen: true,
      description: 'Record observed vessel relationships. The application does not calculate resectability.',
      fields: [
        select('smaContact', 'Superior mesenteric artery', vascularContactOptions),
        select('celiacContact', 'Celiac axis', vascularContactOptions),
        select('commonHepaticArteryContact', 'Common hepatic artery', vascularContactOptions),
        select('smvContact', 'Superior mesenteric vein', vascularContactOptions),
        select('portalVeinContact', 'Portal vein', vascularContactOptions),
        area('vascularDeformity', 'Vessel narrowing, deformity, or occlusion', 'Describe vessel, length, and severity'),
        area('vascularThrombosis', 'Vascular thrombosis', 'Describe bland or tumor thrombus when present or indeterminate'),
        area('collateralVessels', 'Collateral vessels', 'Describe relevant collateralization'),
        area('vascularVariants', 'Surgically relevant vascular variants', 'Arterial or venous variants'),
      ],
    },
    {
      id: 'extension-metastases',
      title: 'Local extension, nodes, and metastases',
      defaultOpen: true,
      fields: [
        select('adjacentOrganInvasion', 'Adjacent-organ invasion', assessmentOptions),
        {
          ...area('adjacentOrganDetails', 'Adjacent-organ invasion details', 'Duodenum, stomach, spleen, colon, adrenal, or other structure'),
          visibleWhen: { field: 'adjacentOrganInvasion', equals: ['present', 'indeterminate'] },
        },
        select('regionalNodes', 'Suspicious regional nodes', assessmentOptions),
        {
          ...area('regionalNodeDetails', 'Regional node details', 'Stations, size, morphology, and confidence'),
          visibleWhen: { field: 'regionalNodes', equals: ['present', 'indeterminate'] },
        },
        select('liverMetastases', 'Liver metastases', assessmentOptions),
        {
          ...area('liverMetastasisDetails', 'Liver metastasis details', 'Number, distribution, measurements, and confidence'),
          visibleWhen: { field: 'liverMetastases', equals: ['present', 'indeterminate'] },
        },
        select('peritonealMetastases', 'Peritoneal metastases', assessmentOptions),
        {
          ...area('peritonealMetastasisDetails', 'Peritoneal disease details', 'Sites, burden, ascites, and confidence'),
          visibleWhen: { field: 'peritonealMetastases', equals: ['present', 'indeterminate'] },
        },
        select('otherMetastases', 'Other distant metastases', assessmentOptions),
        {
          ...area('otherMetastasisDetails', 'Other metastatic disease details', 'Sites, burden, measurements, and confidence'),
          visibleWhen: {
            field: 'otherMetastases',
            equals: ['present', 'indeterminate'],
          },
        },
      ],
    },
    {
      id: 'synthesis-overrides',
      title: 'Synthesis and overrides',
      defaultOpen: false,
      fields: [
        area('userResectabilitySynthesis', 'User-controlled resectability synthesis', 'Optional multidisciplinary or radiologist-entered synthesis; no category is calculated'),
        area('additionalFindings', 'Additional findings', 'Other clinically important findings'),
        area('incidentalFindings', 'Incidental findings', 'Incidental findings requiring documentation'),
        area('limitationsUncertainty', 'Additional uncertainty', 'Diagnostic uncertainty not already described'),
        area('findingsOverride', 'Findings free-text override', 'When entered, this replaces generated findings'),
        area('impressionOverride', 'Impression free-text override', 'When entered, this replaces generated impression'),
      ],
    },
  ],
  keyNegatives: [],
  incidentalOptions: [],
  quickFills: [
    {
      id: 'no-pancreatic-mass',
      label: 'No pancreatic mass',
      description: 'Diagnostic examination with no pancreatic mass or metastatic disease entered.',
      intent: 'normal',
      values: {
        examQuality: 'diagnostic',
        pancreaticMass: 'absent',
        pancreaticDuctObstruction: 'absent',
        biliaryObstruction: 'absent',
        upstreamAtrophy: 'absent',
        smaContact: 'no contact',
        celiacContact: 'no contact',
        commonHepaticArteryContact: 'no contact',
        smvContact: 'no contact',
        portalVeinContact: 'no contact',
        adjacentOrganInvasion: 'absent',
        regionalNodes: 'absent',
        liverMetastases: 'absent',
        peritonealMetastases: 'absent',
        otherMetastases: 'absent',
      },
    },
    {
      id: 'pancreatic-mass-staging',
      label: 'Pancreatic mass staging',
      description: 'Positive pathway revealing tumor characterization and staging fields.',
      intent: 'positive',
      values: {
        examQuality: 'diagnostic',
        pancreaticMass: 'present',
      },
    },
    {
      id: 'limited-pancreas-study',
      label: 'Limited examination',
      description: 'Limited examination with staging structures not adequately assessed.',
      intent: 'complicated',
      values: {
        examQuality: 'limited',
        pancreaticMass: 'indeterminate',
        pancreaticDuctObstruction: 'not assessed',
        biliaryObstruction: 'not assessed',
        upstreamAtrophy: 'not assessed',
        smaContact: 'not assessed',
        celiacContact: 'not assessed',
        commonHepaticArteryContact: 'not assessed',
        smvContact: 'not assessed',
        portalVeinContact: 'not assessed',
        adjacentOrganInvasion: 'not assessed',
        regionalNodes: 'not assessed',
        liverMetastases: 'not assessed',
        peritonealMetastases: 'not assessed',
        otherMetastases: 'not assessed',
      },
    },
  ],
};

const rectalExamPurposeOptions: ReferralOption[] = [
  { value: '', label: 'Select purpose…' },
  { value: 'initial staging', label: 'Initial staging' },
  { value: 'post-treatment restaging', label: 'Post-treatment restaging' },
  { value: 'surveillance or suspected recurrence', label: 'Surveillance / suspected recurrence' },
];

const circumferentialLocationOptions: ReferralOption[] = [
  { value: '', label: 'Select location…' },
  { value: 'anterior', label: 'Anterior' },
  { value: 'posterior', label: 'Posterior' },
  { value: 'right lateral', label: 'Right lateral' },
  { value: 'left lateral', label: 'Left lateral' },
  { value: 'circumferential', label: 'Circumferential' },
  { value: 'multifocal', label: 'Multifocal' },
  { value: 'indeterminate', label: 'Indeterminate' },
];

const rectalTumorMorphologyOptions: ReferralOption[] = [
  { value: '', label: 'Select morphology…' },
  { value: 'polypoid', label: 'Polypoid' },
  { value: 'semiannular', label: 'Semiannular' },
  { value: 'annular', label: 'Annular' },
  { value: 'infiltrative', label: 'Infiltrative' },
  { value: 'mucinous features', label: 'Mucinous features' },
  { value: 'indeterminate', label: 'Indeterminate' },
];

const fasciaRelationshipOptions: ReferralOption[] = [
  { value: '', label: 'Select relationship…' },
  { value: 'clear', label: 'Clear' },
  { value: 'threatened', label: 'Threatened' },
  { value: 'involved', label: 'Involved' },
  { value: 'not applicable', label: 'Not applicable' },
  { value: 'indeterminate', label: 'Indeterminate' },
  { value: 'not assessed', label: 'Not assessed' },
];

const rectalCancerDefaults: WorkflowValues = {
  clinicalIndication: '',
  relevantClinicalContext: '',
  examPurpose: '',
  treatmentHistory: '',
  comparisonStudy: '',
  comparisonDate: '',
  modalityProtocol: 'High-resolution rectal MRI',
  examQuality: '',
  technicalLimitations: '',
  rectalTumor: '',
  distanceFromAnalVergeCm: '',
  relationToAnorectalJunction: '',
  craniocaudalLengthMm: '',
  circumferentialLocation: '',
  tumorMorphology: '',
  extramuralDepthMm: '',
  userAssignedTCategory: '',
  mesorectalFasciaRelationship: '',
  minimumMesorectalFasciaDistanceMm: '',
  fasciaThreatSite: '',
  sphincterInvolvement: '',
  sphincterDetails: '',
  levatorInvolvement: '',
  levatorDetails: '',
  emvi: '',
  emviDetails: '',
  mesorectalNodes: '',
  mesorectalNodeDetails: '',
  extramesorectalNodes: '',
  extramesorectalNodeDetails: '',
  tumorDeposits: '',
  tumorDepositDetails: '',
  adjacentOrganInvasion: '',
  adjacentOrganDetails: '',
  distantMetastases: '',
  distantMetastasisDetails: '',
  intervalChange: '',
  userResponseSynthesis: '',
  additionalFindings: '',
  incidentalFindings: '',
  limitationsUncertainty: '',
  findingsOverride: '',
  impressionOverride: '',
};

export const rectalCancerMriWorkflowSchema: ReportingWorkflowSchema = {
  moduleType: 'rectalCancerMri',
  moduleId: 'mri-rectal-cancer',
  title: 'Rectal Cancer MRI',
  shortTitle: 'Rectal cancer MRI',
  modality: 'MRI',
  bodySystem: 'Oncology',
  clinicalQuestion: 'Define rectal tumor location and extent, threatened surgical planes, nodal disease, deposits, and treatment response when applicable.',
  techniqueDefault: 'High-resolution multiplanar pelvic MRI was performed using a rectal cancer protocol.',
  badges: ['Implemented', 'Educational draft', 'Pelvic staging'],
  insertTargets: ['findings', 'impression', 'incidentalFindings', 'recommendations'],
  safetyNote:
    'Educational reporting workflow. Verify tumor measurements, surgical-plane relationships, sphincter and levator involvement, nodal findings, treatment history, and final staging synthesis. No stage or treatment is assigned automatically.',
  contentMetadata: {
    sourceChapter: 'Chapter 7: Rectal cancer MRI',
    sourceType: 'Private development reference',
    guidelineOrClassificationName: 'Rectal cancer TNM and MRI response terminology',
    guidelineVersion: 'Current versions require primary-source verification',
    lastReviewedDate: '2026-07-24',
    reviewStatus: 'needs_clinical_review',
    clinicalValidationRequired: true,
  },
  defaultValues: rectalCancerDefaults,
  sections: [
    {
      id: 'clinical-context',
      title: 'Clinical context',
      defaultOpen: true,
      fields: [
        area('clinicalIndication', 'Clinical indication', 'Known or suspected rectal malignancy and imaging question'),
        area('relevantClinicalContext', 'Relevant clinical context', 'Pathology, symptoms, surgical history, or other relevant information'),
        select('examPurpose', 'Examination purpose', rectalExamPurposeOptions),
        area('treatmentHistory', 'Treatment history', 'Neoadjuvant therapy and completion date when applicable'),
        text('comparisonStudy', 'Comparison examination', 'e.g. rectal MRI'),
        { id: 'comparisonDate', label: 'Comparison date', type: 'date' },
      ],
    },
    {
      id: 'technical-quality',
      title: 'Protocol and technical quality',
      defaultOpen: true,
      fields: [
        text('modalityProtocol', 'MRI protocol', 'High-resolution rectal MRI', true),
        select('examQuality', 'Examination quality', technicalQualityOptions),
        area('technicalLimitations', 'Technical limitations', 'Motion, inadequate coverage or plane angulation, distention, or other limitation'),
      ],
    },
    {
      id: 'primary-tumor',
      title: 'Primary tumor',
      defaultOpen: true,
      fields: [
        select('rectalTumor', 'Rectal tumor', assessmentOptions),
        {
          ...number('distanceFromAnalVergeCm', 'Distance from anal verge', 'cm'),
          visibleWhen: { field: 'rectalTumor', equals: ['present', 'indeterminate'] },
        },
        {
          ...text('relationToAnorectalJunction', 'Relation to anorectal junction', 'Above, at, or below', true),
          visibleWhen: { field: 'rectalTumor', equals: ['present', 'indeterminate'] },
        },
        {
          ...number('craniocaudalLengthMm', 'Craniocaudal tumor length', 'mm'),
          visibleWhen: { field: 'rectalTumor', equals: ['present', 'indeterminate'] },
        },
        {
          ...select('circumferentialLocation', 'Circumferential location', circumferentialLocationOptions),
          visibleWhen: { field: 'rectalTumor', equals: ['present', 'indeterminate'] },
        },
        {
          ...select('tumorMorphology', 'Tumor morphology', rectalTumorMorphologyOptions),
          visibleWhen: { field: 'rectalTumor', equals: ['present', 'indeterminate'] },
        },
        {
          ...number('extramuralDepthMm', 'Maximum extramural depth', 'mm'),
          visibleWhen: { field: 'rectalTumor', equals: ['present', 'indeterminate'] },
        },
        {
          ...text('userAssignedTCategory', 'User-assigned T category', 'Optional; no category is calculated', true),
          visibleWhen: { field: 'rectalTumor', equals: ['present', 'indeterminate'] },
        },
      ],
    },
    {
      id: 'surgical-planes',
      title: 'Mesorectal fascia and pelvic floor',
      defaultOpen: true,
      fields: [
        select('mesorectalFasciaRelationship', 'Mesorectal fascia relationship', fasciaRelationshipOptions),
        {
          ...number('minimumMesorectalFasciaDistanceMm', 'Minimum tumor-to-fascia distance', 'mm'),
          visibleWhen: {
            field: 'mesorectalFasciaRelationship',
            equals: ['clear', 'threatened', 'involved', 'indeterminate'],
          },
        },
        {
          ...text('fasciaThreatSite', 'Closest or involved fascia site', 'Clock-face location or anatomic site', true),
          visibleWhen: {
            field: 'mesorectalFasciaRelationship',
            equals: ['threatened', 'involved', 'indeterminate'],
          },
        },
        select('sphincterInvolvement', 'Sphincter complex involvement', assessmentOptions),
        {
          ...area('sphincterDetails', 'Sphincter involvement details', 'Internal/external sphincter, intersphincteric plane, and craniocaudal extent'),
          visibleWhen: { field: 'sphincterInvolvement', equals: ['present', 'indeterminate'] },
        },
        select('levatorInvolvement', 'Levator involvement', assessmentOptions),
        {
          ...area('levatorDetails', 'Levator involvement details', 'Side, level, and extent'),
          visibleWhen: { field: 'levatorInvolvement', equals: ['present', 'indeterminate'] },
        },
        select('adjacentOrganInvasion', 'Adjacent-organ invasion', assessmentOptions),
        {
          ...area('adjacentOrganDetails', 'Adjacent-organ invasion details', 'Structure, side, extent, and confidence'),
          visibleWhen: { field: 'adjacentOrganInvasion', equals: ['present', 'indeterminate'] },
        },
      ],
    },
    {
      id: 'emvi-nodes',
      title: 'EMVI, nodes, and deposits',
      defaultOpen: true,
      fields: [
        select('emvi', 'Extramural venous invasion', assessmentOptions),
        {
          ...area('emviDetails', 'EMVI details', 'Vessel, location, extent, and confidence'),
          visibleWhen: { field: 'emvi', equals: ['present', 'indeterminate'] },
        },
        select('mesorectalNodes', 'Suspicious mesorectal nodes', assessmentOptions),
        {
          ...area('mesorectalNodeDetails', 'Mesorectal node details', 'Number, location, size, morphology, and fascia relationship'),
          visibleWhen: { field: 'mesorectalNodes', equals: ['present', 'indeterminate'] },
        },
        select('extramesorectalNodes', 'Suspicious extramesorectal nodes', assessmentOptions),
        {
          ...area('extramesorectalNodeDetails', 'Extramesorectal node details', 'Stations, laterality, size, morphology, and confidence'),
          visibleWhen: { field: 'extramesorectalNodes', equals: ['present', 'indeterminate'] },
        },
        select('tumorDeposits', 'Tumor deposits', assessmentOptions),
        {
          ...area('tumorDepositDetails', 'Tumor deposit details', 'Number, site, size, and fascia relationship'),
          visibleWhen: { field: 'tumorDeposits', equals: ['present', 'indeterminate'] },
        },
        select('distantMetastases', 'Distant metastatic disease on this examination', assessmentOptions),
        {
          ...area('distantMetastasisDetails', 'Distant metastatic disease details', 'Sites, burden, measurements, and confidence'),
          visibleWhen: { field: 'distantMetastases', equals: ['present', 'indeterminate'] },
        },
      ],
    },
    {
      id: 'response-overrides',
      title: 'Response and overrides',
      defaultOpen: false,
      fields: [
        select('intervalChange', 'Interval tumor change', intervalChangeOptions),
        area('userResponseSynthesis', 'User-assigned response synthesis', 'Optional descriptive response or regression assessment; no category is calculated'),
        area('additionalFindings', 'Additional findings', 'Other clinically important pelvic findings'),
        area('incidentalFindings', 'Incidental findings', 'Incidental findings requiring documentation'),
        area('limitationsUncertainty', 'Additional uncertainty', 'Diagnostic uncertainty not already described'),
        area('findingsOverride', 'Findings free-text override', 'When entered, this replaces generated findings'),
        area('impressionOverride', 'Impression free-text override', 'When entered, this replaces generated impression'),
      ],
    },
  ],
  keyNegatives: [],
  incidentalOptions: [],
  quickFills: [
    {
      id: 'no-visible-tumor',
      label: 'No visible tumor',
      description: 'Diagnostic examination with no visible rectal tumor or suspicious disease entered.',
      intent: 'normal',
      values: {
        examQuality: 'diagnostic',
        rectalTumor: 'absent',
        mesorectalFasciaRelationship: 'not applicable',
        sphincterInvolvement: 'absent',
        levatorInvolvement: 'absent',
        adjacentOrganInvasion: 'absent',
        emvi: 'absent',
        mesorectalNodes: 'absent',
        extramesorectalNodes: 'absent',
        tumorDeposits: 'absent',
        distantMetastases: 'absent',
      },
    },
    {
      id: 'rectal-tumor-staging',
      label: 'Rectal tumor staging',
      description: 'Positive pathway revealing tumor extent and surgical-plane fields.',
      intent: 'positive',
      values: {
        examQuality: 'diagnostic',
        rectalTumor: 'present',
      },
    },
    {
      id: 'limited-rectal-mri',
      label: 'Limited examination',
      description: 'Limited examination with staging structures not adequately assessed.',
      intent: 'complicated',
      values: {
        examQuality: 'limited',
        rectalTumor: 'indeterminate',
        mesorectalFasciaRelationship: 'not assessed',
        sphincterInvolvement: 'not assessed',
        levatorInvolvement: 'not assessed',
        adjacentOrganInvasion: 'not assessed',
        emvi: 'not assessed',
        mesorectalNodes: 'not assessed',
        extramesorectalNodes: 'not assessed',
        tumorDeposits: 'not assessed',
        distantMetastases: 'not assessed',
      },
    },
  ],
};
