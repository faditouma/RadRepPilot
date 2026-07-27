import type { ReferralOption } from '../../radrep/types';
import type { ReportingWorkflowSchema, WorkflowField, WorkflowValues } from '../reportingWorkflowSchemas';

const assessment: ReferralOption[] = [
  { value: '', label: 'Select assessment…' }, { value: 'absent', label: 'Absent' },
  { value: 'present', label: 'Present' }, { value: 'indeterminate', label: 'Indeterminate' },
  { value: 'not assessed', label: 'Not assessed' },
];
const quality: ReferralOption[] = [
  { value: '', label: 'Select quality…' }, { value: 'diagnostic', label: 'Diagnostic' },
  { value: 'limited', label: 'Limited' }, { value: 'nondiagnostic', label: 'Nondiagnostic' },
];
const text = (id: string, label: string, placeholder = '', wide = false): WorkflowField => ({ id, label, type: 'text', placeholder, wide });
const area = (id: string, label: string, placeholder = ''): WorkflowField => ({ id, label, type: 'textarea', placeholder, wide: true });
const number = (id: string, label: string, suffix?: string): WorkflowField => ({ id, label, type: 'number', suffix });
const select = (id: string, label: string, options: ReferralOption[]): WorkflowField => ({ id, label, type: 'select', options });

const pancreaticCystDefaults: WorkflowValues = {
  clinicalIndication: '', clinicalContext: '', cancerFamilyHistory: '', pancreatitisHistory: '',
  comparisonStudy: '', comparisonDate: '', modalityProtocol: '', examQuality: '',
  technicalLimitations: '', cysticLesion: '', multiplicity: '', dominantCystSite: '',
  cystApMm: '', cystTrMm: '', cystCcMm: '', cystMorphology: '', ductCommunication: '',
  mainDuctDiameterMm: '', branchDuctDilation: '', muralNodule: '', muralNoduleDetails: '',
  solidComponent: '', solidComponentDetails: '', wallEnhancement: '', septalEnhancement: '',
  intervalGrowth: '', intervalGrowthDetails: '', pancreatitis: '', biliaryObstruction: '',
  parenchymalAtrophy: '', suspiciousNodes: '', suspiciousNodeDetails: '', additionalCysts: '',
  userRiskFeatureSynthesis: '', userGuidelineCategory: '', additionalFindings: '',
  incidentalFindings: '', limitationsUncertainty: '', findingsOverride: '', impressionOverride: '',
};

export const pancreaticCystWorkflowSchema: ReportingWorkflowSchema = {
  moduleType: 'pancreaticCyst',
  moduleId: 'ct-mri-pancreatic-cyst',
  title: 'Cystic Pancreatic Lesions CT/MRI',
  shortTitle: 'Pancreatic cyst CT/MRI',
  modality: 'CT/MRI/MRCP',
  bodySystem: 'Pancreas',
  clinicalQuestion: 'Characterize pancreatic cystic lesions, duct relationships, mural or solid components, interval growth, obstruction, atrophy, and nodes.',
  techniqueDefault: 'Pancreas-protocol CT or MRI/MRCP was performed with noncontrast and postcontrast sequences or phases as available.',
  badges: ['Implemented', 'Educational draft', 'Risk-feature capture'],
  insertTargets: ['findings', 'impression', 'incidentalFindings', 'recommendations'],
  safetyNote: 'Verify protocol, every cyst and measurement, duct communication and caliber, enhancing mural or solid components, growth, pancreatitis, obstruction, atrophy, and nodes. No risk category or management recommendation is calculated.',
  contentMetadata: {
    sourceChapter: 'Chapter 25: Cystic pancreatic lesions',
    sourceType: 'Private development reference',
    guidelineOrClassificationName: 'Pancreatic cyst imaging guidance',
    guidelineVersion: 'Current selected guideline and thresholds require primary-source verification',
    lastReviewedDate: '2026-07-27',
    reviewStatus: 'needs_clinical_review',
    clinicalValidationRequired: true,
  },
  defaultValues: pancreaticCystDefaults,
  sections: [
    { id: 'context', title: 'Clinical context', defaultOpen: true, fields: [
      area('clinicalIndication', 'Clinical indication'), area('clinicalContext', 'Relevant clinical context'),
      area('cancerFamilyHistory', 'Cancer and family history'), area('pancreatitisHistory', 'Pancreatitis history'),
      text('comparisonStudy', 'Comparison examination'), { id: 'comparisonDate', label: 'Comparison date', type: 'date' },
    ] },
    { id: 'quality', title: 'Protocol and technical quality', defaultOpen: true, fields: [
      text('modalityProtocol', 'Modality and protocol', 'Pancreas CT, MRI, or MRCP protocol', true),
      select('examQuality', 'Examination quality', quality), area('technicalLimitations', 'Technical limitations'),
    ] },
    { id: 'dominant-cyst', title: 'Dominant pancreatic cyst', defaultOpen: true, fields: [
      select('cysticLesion', 'Pancreatic cystic lesion', assessment),
      { ...text('multiplicity', 'Multiplicity', 'Solitary, multiple, or innumerable'), visibleWhen: { field: 'cysticLesion', equals: ['present', 'indeterminate'] } },
      { ...text('dominantCystSite', 'Dominant cyst location', 'Head, uncinate, neck, body, or tail'), visibleWhen: { field: 'cysticLesion', equals: ['present', 'indeterminate'] } },
      { ...number('cystApMm', 'AP dimension', 'mm'), visibleWhen: { field: 'cysticLesion', equals: ['present', 'indeterminate'] } },
      { ...number('cystTrMm', 'Transverse dimension', 'mm'), visibleWhen: { field: 'cysticLesion', equals: ['present', 'indeterminate'] } },
      { ...number('cystCcMm', 'Craniocaudal dimension', 'mm'), visibleWhen: { field: 'cysticLesion', equals: ['present', 'indeterminate'] } },
      { ...text('cystMorphology', 'Morphology', 'Unilocular, multilocular, cluster, internal debris, or other'), visibleWhen: { field: 'cysticLesion', equals: ['present', 'indeterminate'] } },
      { ...select('ductCommunication', 'Communication with pancreatic duct', assessment), visibleWhen: { field: 'cysticLesion', equals: ['present', 'indeterminate'] } },
      { ...number('mainDuctDiameterMm', 'Main pancreatic duct diameter', 'mm'), visibleWhen: { field: 'cysticLesion', equals: ['present', 'indeterminate'] } },
      { ...select('branchDuctDilation', 'Branch-duct dilation', assessment), visibleWhen: { field: 'cysticLesion', equals: ['present', 'indeterminate'] } },
      area('additionalCysts', 'Additional cystic lesions', 'Location, dimensions, morphology, and duct relationship'),
    ] },
    { id: 'risk-features', title: 'Morphologic and associated features', defaultOpen: true, fields: [
      select('muralNodule', 'Enhancing mural nodule', assessment),
      { ...area('muralNoduleDetails', 'Mural nodule details', 'Size, enhancement, and location'), visibleWhen: { field: 'muralNodule', equals: ['present', 'indeterminate'] } },
      select('solidComponent', 'Solid component', assessment),
      { ...area('solidComponentDetails', 'Solid component details', 'Size, enhancement, and relationship'), visibleWhen: { field: 'solidComponent', equals: ['present', 'indeterminate'] } },
      select('wallEnhancement', 'Wall thickening or enhancement', assessment),
      select('septalEnhancement', 'Septal thickening or enhancement', assessment),
      select('intervalGrowth', 'Interval growth', assessment),
      { ...area('intervalGrowthDetails', 'Growth details', 'Prior/current dimensions and dates'), visibleWhen: { field: 'intervalGrowth', equals: ['present', 'indeterminate'] } },
      select('pancreatitis', 'Pancreatitis', assessment), select('biliaryObstruction', 'Biliary obstruction', assessment),
      select('parenchymalAtrophy', 'Pancreatic parenchymal atrophy', assessment),
      select('suspiciousNodes', 'Suspicious lymph nodes', assessment),
      { ...area('suspiciousNodeDetails', 'Lymph-node details'), visibleWhen: { field: 'suspiciousNodes', equals: ['present', 'indeterminate'] } },
    ] },
    { id: 'synthesis', title: 'Synthesis and overrides', defaultOpen: true, fields: [
      area('userRiskFeatureSynthesis', 'User-entered risk-feature synthesis', 'Descriptive only; no category is calculated'),
      text('userGuidelineCategory', 'User-entered guideline/category', 'Optional; include version if known', true),
      area('additionalFindings', 'Additional findings'), area('incidentalFindings', 'Incidental findings'),
      area('limitationsUncertainty', 'Additional uncertainty'),
      area('findingsOverride', 'Findings free-text override', 'When entered, this replaces generated findings'),
      area('impressionOverride', 'Impression free-text override', 'When entered, this replaces generated impression'),
    ] },
  ],
  keyNegatives: [], incidentalOptions: [],
  quickFills: [
    { id: 'no-cyst', label: 'No pancreatic cyst', description: 'Diagnostic examination without a pancreatic cystic lesion.', intent: 'normal', values: { examQuality: 'diagnostic', cysticLesion: 'absent', muralNodule: 'absent', solidComponent: 'absent', wallEnhancement: 'absent', septalEnhancement: 'absent', intervalGrowth: 'not assessed', pancreatitis: 'absent', biliaryObstruction: 'absent', parenchymalAtrophy: 'absent', suspiciousNodes: 'absent' } },
    { id: 'pancreatic-cyst', label: 'Pancreatic cystic lesion', description: 'Open detailed cyst and duct fields.', intent: 'positive', values: { examQuality: 'diagnostic', cysticLesion: 'present', muralNodule: 'absent', solidComponent: 'absent', wallEnhancement: 'absent', septalEnhancement: 'absent', intervalGrowth: 'not assessed', pancreatitis: 'absent', biliaryObstruction: 'absent', suspiciousNodes: 'absent' } },
    { id: 'limited-cyst-study', label: 'Limited examination', description: 'Document incomplete cyst characterization.', intent: 'complicated', values: { examQuality: 'limited', cysticLesion: 'indeterminate', muralNodule: 'not assessed', solidComponent: 'not assessed', wallEnhancement: 'not assessed', septalEnhancement: 'not assessed', intervalGrowth: 'not assessed', pancreatitis: 'not assessed', biliaryObstruction: 'not assessed', parenchymalAtrophy: 'not assessed', suspiciousNodes: 'not assessed' } },
  ],
};
